<?php

namespace App\Jobs;

use App\Models\Announcement;
use App\Models\BroadcastRecipient;
use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendBroadcastSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $announcementId;
    public ?array $recipientIds;
    public ?string $customMessage;

    /**
     * Create a new job instance.
     *
     * @param int $announcementId
     * @param array|null $recipientIds If null, processes all unsent/failed recipients for the announcement
     * @param string|null $customMessage
     */
    public function __construct(int $announcementId, ?array $recipientIds = null, ?string $customMessage = null)
    {
        $this->announcementId = $announcementId;
        $this->recipientIds = $recipientIds;
        $this->customMessage = $customMessage;
    }

    /**
     * Execute the job.
     */
    public function handle(SmsService $smsService): void
    {
        $announcement = Announcement::find($this->announcementId);
        if (!$announcement) {
            Log::warning("SendBroadcastSmsJob aborted: Announcement #{$this->announcementId} not found.");
            return;
        }

        $messageContent = $this->customMessage ?: $announcement->body;

        // Query recipients: strictly only those whose SMS has NOT been sent yet
        $query = BroadcastRecipient::where('announcement_id', $this->announcementId)
            ->where('sms_status', '!=', 'sent');

        if (!empty($this->recipientIds)) {
            $query->whereIn('id', $this->recipientIds);
        }

        $recipients = $query->get();

        if ($recipients->isEmpty()) {
            Log::info("SendBroadcastSmsJob: No pending/failed recipients to process for Announcement #{$this->announcementId}.");
            $announcement->refreshDeliveryCounts();
            return;
        }

        Log::info("SendBroadcastSmsJob starting for Announcement #{$this->announcementId} with {$recipients->count()} recipients.");

        // Chunk recipients in batches of 50 for optimal Sendar API throughput
        $chunks = $recipients->chunk(50);

        foreach ($chunks as $chunk) {
            $validContacts = [];
            $recipientMapByPhone = [];

            foreach ($chunk as $recipient) {
                // If recipient_id is linked to Applicant, refresh phone if needed
                $phone = $recipient->recipient_phone;
                if (empty($phone) && $recipient->recipient_type && $recipient->recipient_id) {
                    $app = $recipient->recipient;
                    if ($app) {
                        $phone = $app->phone_number ?? ($app->data['phone_number'] ?? $app->data['phone'] ?? null);
                        if ($phone) {
                            $recipient->recipient_phone = $phone;
                        }
                    }
                }

                $formatted = $smsService->formatPhoneNumber((string) $phone);

                if (empty($formatted) || strlen($formatted) < 10) {
                    // Mark invalid immediately as failed
                    $recipient->update([
                        'formatted_phone' => $formatted ?: null,
                        'sms_status'      => 'failed',
                        'sms_error'       => 'Missing or invalid phone number',
                        'retry_count'     => $recipient->retry_count + 1,
                        'last_attempt_at' => now(),
                    ]);
                    continue;
                }

                $recipient->formatted_phone = $formatted;
                $recipient->save();

                $recipientMapByPhone[$formatted][] = $recipient;

                $validContacts[] = [
                    'number'   => $formatted,
                    'body'     => $messageContent,
                    'sms_type' => 'plain',
                ];
            }

            if (empty($validContacts)) {
                continue;
            }

            // Dispatch bulk SMS to Sendar API
            $response = $smsService->sendBulk($validContacts);

            if ($response['success'] ?? false) {
                $batchId = $response['batch_id'] ?? null;
                $responseData = $response['data'] ?? [];

                // Index response items by phone number
                $returnedMap = [];
                foreach ($responseData as $item) {
                    if (isset($item['number'])) {
                        $returnedMap[(string) $item['number']] = $item;
                    }
                }

                foreach ($recipientMapByPhone as $phone => $recipientList) {
                    $item = $returnedMap[$phone] ?? null;

                    foreach ($recipientList as $rec) {
                        $msgId = $item['message_id'] ?? null;
                        $status = $item['status'] ?? 'queued';

                        if ($status === 'failed') {
                            $rec->update([
                                'sms_status'      => 'failed',
                                'sms_batch_id'    => $batchId,
                                'sms_error'       => 'Rejected by SMS gateway',
                                'retry_count'     => $rec->retry_count + 1,
                                'last_attempt_at' => now(),
                            ]);
                        } else {
                            $rec->update([
                                'sms_status'      => 'sent',
                                'sms_message_id'  => $msgId,
                                'sms_batch_id'    => $batchId,
                                'sms_error'       => null,
                                'sms_sent_at'     => now(),
                                'retry_count'     => $rec->retry_count + 1,
                                'last_attempt_at' => now(),
                            ]);
                        }
                    }
                }
            } else {
                // Batch failed - mark all recipients in this batch as failed with reason
                $errorMessage = $response['error'] ?? 'SMS provider gateway connection failed';

                foreach ($recipientMapByPhone as $phone => $recipientList) {
                    foreach ($recipientList as $rec) {
                        $rec->update([
                            'sms_status'      => 'failed',
                            'sms_error'       => $errorMessage,
                            'retry_count'     => $rec->retry_count + 1,
                            'last_attempt_at' => now(),
                        ]);
                    }
                }
            }
        }

        // Refresh cached summary stats on the announcement
        $announcement->refreshDeliveryCounts();
        Log::info("SendBroadcastSmsJob completed for Announcement #{$this->announcementId}. Sent: {$announcement->sms_sent_count}, Failed: {$announcement->sms_failed_count}.");
    }
}
