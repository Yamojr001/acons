<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $apiKey;
    protected string $senderId;
    protected string $baseUrl;
    protected string $walletType;

    public function __construct()
    {
        $this->apiKey     = (string) config('services.sendar.api_key', env('SENDAR_API_KEY', ''));
        $this->senderId   = (string) config('services.sendar.sender_id', env('SENDAR_SENDER_ID', 'ACONSDUTSE'));
        $this->baseUrl    = rtrim(config('services.sendar.base_url', env('SENDAR_BASE_URL', 'https://api.sendar.io')), '/');
        $this->walletType = (string) config('services.sendar.wallet_type', env('SENDAR_WALLET_TYPE', 'transactional'));
    }

    /**
     * Send a single transactional SMS message.
     *
     * @param string $phone The recipient's phone number (e.g. 09160889994 or 2349160889994)
     * @param string $message The message body content
     * @param string $smsType 'plain' or 'unicode'
     * @return array
     */
    public function send(string $phone, string $message, string $smsType = 'plain'): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Sendar SMS skipped: SENDAR_API_KEY is not configured in .env.');
            return ['success' => false, 'error' => 'Sendar API key not configured'];
        }

        $formatted = $this->formatPhoneNumber($phone, true); // E.164 format with +
        if (empty($formatted)) {
            Log::warning("Sendar SMS skipped: invalid phone number '{$phone}'.");
            return ['success' => false, 'error' => 'Invalid phone number'];
        }

        // Try standard Sendar v1 API: POST /v1/sms
        try {
            $url = "{$this->baseUrl}/v1/sms";
            $payload = [
                'to'        => $formatted,
                'sender_id' => $this->senderId,
                'message'   => $message,
            ];

            $response = Http::withoutVerifying()
                ->withHeaders($this->getHeaders())
                ->timeout(15)
                ->post($url, $payload);

            $data = $response->json() ?? [];

            if ($response->successful() || $response->status() === 202) {
                return [
                    'success'    => true,
                    'message_id' => $data['message_id'] ?? null,
                    'status'     => $data['status'] ?? 'queued',
                    'raw'        => $data,
                ];
            }

            // Extract human error detail from response
            $errorDetail = $this->extractErrorMessage($data, $response);

            // If 404 or endpoint difference, fallback to bulk endpoint or submit endpoint
            if ($response->status() === 404) {
                return $this->sendBulk([
                    [
                        'number'   => $this->formatPhoneNumber($phone, false),
                        'body'     => $message,
                        'sms_type' => $smsType,
                    ]
                ]);
            }

            Log::error('Sendar SMS single send error', [
                'status'   => $response->status(),
                'response' => $response->body(),
                'payload'  => $payload,
            ]);

            return [
                'success' => false,
                'status'  => $response->status(),
                'error'   => $errorDetail,
                'raw'     => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('Sendar SMS single send exception: ' . $e->getMessage());

            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    /**
     * Send bulk SMS messages using Sendar's API.
     * Supports both /v1/sms/bulk (standard) and /api/sms/send (legacy).
     *
     * @param array $contacts Array of ['number' => '...', 'body' => '...', 'sms_type' => 'plain']
     * @return array
     */
    public function sendBulk(array $contacts): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Sendar SMS skipped: SENDAR_API_KEY is not configured in .env.');
            return ['success' => false, 'error' => 'Sendar API key not configured'];
        }

        $preparedRecipients = [];
        $preparedLegacyContacts = [];

        foreach ($contacts as $contact) {
            $rawPhone = $contact['number'] ?? $contact['to'] ?? $contact['phone'] ?? '';
            $body = (string) ($contact['body'] ?? $contact['message'] ?? '');
            
            $e164 = $this->formatPhoneNumber($rawPhone, true);
            $digits = $this->formatPhoneNumber($rawPhone, false);

            if (!empty($e164) && !empty($body)) {
                $preparedRecipients[] = [
                    'to'      => $e164,
                    'message' => $body,
                ];
                $preparedLegacyContacts[] = [
                    'number'   => $digits,
                    'body'     => $body,
                    'sms_type' => $contact['sms_type'] ?? 'plain',
                ];
            }
        }

        if (empty($preparedRecipients)) {
            return ['success' => false, 'error' => 'No valid contacts provided'];
        }

        // 1. Try modern /v1/sms/bulk endpoint first
        try {
            $defaultMsg = $preparedRecipients[0]['message'] ?? '';
            $bulkUrl = "{$this->baseUrl}/v1/sms/bulk";
            $bulkPayload = [
                'recipients' => $preparedRecipients,
                'sender_id'  => $this->senderId,
                'message'    => $defaultMsg,
            ];

            $response = Http::withoutVerifying()
                ->withHeaders($this->getHeaders())
                ->timeout(20)
                ->post($bulkUrl, $bulkPayload);

            $data = $response->json() ?? [];

            if ($response->successful() || $response->status() === 202) {
                $messages = $data['messages'] ?? [];
                $formattedData = [];
                foreach ($messages as $m) {
                    $formattedData[] = [
                        'number'     => $m['to'] ?? '',
                        'message_id' => $m['message_id'] ?? null,
                        'status'     => $m['status'] ?? 'queued',
                    ];
                }

                return [
                    'success'  => true,
                    'batch_id' => $data['batch_id'] ?? null,
                    'total'    => $data['total'] ?? count($preparedRecipients),
                    'queued'   => $data['queued'] ?? count($preparedRecipients),
                    'data'     => $formattedData,
                    'raw'      => $data,
                ];
            }

            // If 404, fallback to /api/sms/send
            if ($response->status() !== 404) {
                $errorDetail = $this->extractErrorMessage($data, $response);
                return [
                    'success' => false,
                    'status'  => $response->status(),
                    'error'   => $errorDetail,
                    'raw'     => $data,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Sendar v1/sms/bulk failed, attempting fallback endpoint: ' . $e->getMessage());
        }

        // 2. Fallback to /api/sms/send
        try {
            $legacyUrl = "https://sms-submit.sendar.io/api/sms/send";
            $legacyPayload = [
                'contact'     => $preparedLegacyContacts,
                'wallet_type' => $this->walletType,
                'sender_id'   => $this->senderId,
            ];

            $response = Http::withoutVerifying()
                ->withHeaders($this->getHeaders())
                ->timeout(20)
                ->post($legacyUrl, $legacyPayload);

            $data = $response->json() ?? [];

            if ($response->successful() && ($data['status'] ?? false)) {
                return [
                    'success'  => true,
                    'batch_id' => $data['batch_id'] ?? null,
                    'total'    => $data['total'] ?? count($preparedLegacyContacts),
                    'queued'   => $data['queued'] ?? count($preparedLegacyContacts),
                    'data'     => $data['data'] ?? [],
                    'raw'      => $data,
                ];
            }

            return [
                'success' => false,
                'status'  => $response->status(),
                'error'   => $this->extractErrorMessage($data, $response),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    /**
     * Check real-time status of a message using message_id.
     *
     * @param string $messageId
     * @return array
     */
    public function getStatus(string $messageId): array
    {
        if (empty($this->apiKey)) {
            return ['success' => false, 'error' => 'Sendar API key not configured'];
        }

        try {
            $url = "{$this->baseUrl}/v1/sms/{$messageId}";
            $response = Http::withoutVerifying()
                ->withHeaders($this->getHeaders())
                ->timeout(10)
                ->get($url);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data'    => $response->json(),
                ];
            }

            return [
                'success' => false,
                'status'  => $response->status(),
                'error'   => $this->extractErrorMessage($response->json() ?? [], $response),
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Common HTTP headers for Sendar API requests.
     */
    protected function getHeaders(): array
    {
        return [
            'X-API-Key'    => $this->apiKey,
            'API-KEY'      => $this->apiKey,
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Extract human-readable error messages from Sendar API response.
     */
    protected function extractErrorMessage(array $data, $response): string
    {
        if (!empty($data['detail'])) {
            if (is_array($data['detail'])) {
                $messages = [];
                foreach ($data['detail'] as $item) {
                    $messages[] = is_array($item) ? ($item['msg'] ?? json_encode($item)) : (string) $item;
                }
                return implode(', ', $messages);
            }
            return (string) $data['detail'];
        }

        if (!empty($data['message'])) {
            return (string) $data['message'];
        }

        if (!empty($data['error'])) {
            return (string) $data['error'];
        }

        return $response->body() ?: "Gateway returned HTTP status {$response->status()}";
    }

    /**
     * Format a phone number.
     *
     * @param string $phone
     * @param bool $withPlus If true returns E.164 (+2348012345678), otherwise clean digits (2348012345678).
     * @return string
     */
    public function formatPhoneNumber(string $phone, bool $withPlus = false): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);

        // Nigerian local format (e.g. 08031234567 -> 2348031234567)
        if (str_starts_with($clean, '0') && strlen($clean) === 11) {
            $clean = '234' . substr($clean, 1);
        }

        // 10 digits without leading 0 (e.g. 8031234567 -> 2348031234567)
        if (strlen($clean) === 10) {
            $clean = '234' . $clean;
        }

        if (empty($clean)) {
            return '';
        }

        return $withPlus ? ('+' . $clean) : $clean;
    }
}
