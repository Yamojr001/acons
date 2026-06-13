<?php

namespace App\Services;

use App\Models\{Fee, Payment, Transaction, User};
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Stripe\{Stripe, Checkout\Session as StripeSession};

class PaymentService
{
    // ─── Initiate payment ────────────────────────────────────────────────────

    public function initiate(Fee $fee, string $gateway, string $callbackUrl): array
    {
        return match ($gateway) {
            'stripe'   => $this->initiateStripe($fee, $callbackUrl),
            'paystack' => $this->initiatePaystack($fee, $callbackUrl),
            'monnify'  => $this->initiateMonnify($fee, $callbackUrl),
            'zainpay'  => $this->initiateZainPay($fee, $callbackUrl),
            'sandbox'  => $this->initiateSandbox($fee, $callbackUrl),
            default    => throw new \InvalidArgumentException("Unknown gateway: {$gateway}"),
        };
    }

    // ─── Verify payment ──────────────────────────────────────────────────────

    public function verify(string $gateway, string $reference): bool
    {
        return match ($gateway) {
            'stripe'   => $this->verifyStripe($reference),
            'paystack' => $this->verifyPaystack($reference),
            'monnify'  => $this->verifyMonnify($reference),
            'zainpay'  => $this->verifyZainPay($reference),
            'sandbox'  => $this->verifySandbox($reference),
            default    => false,
        };
    }

    // ─── Stripe Checkout ─────────────────────────────────────────────────────

    private function initiateStripe(Fee $fee, string $callbackUrl): array
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items'           => [[
                'price_data' => [
                    'currency'     => strtolower(config('services.stripe.currency', 'ngn')),
                    'product_data' => ['name' => $fee->title],
                    'unit_amount'  => (int) ($fee->amount * 100),
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => $callbackUrl . '?gateway=stripe&status=success&ref={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $callbackUrl . '?gateway=stripe&status=cancelled',
            'metadata'    => ['fee_id' => $fee->id, 'tenant_id' => $fee->tenant_id],
        ]);

        return [
            'redirect_url' => $session->url,
            'reference'    => 'STR-' . $session->id,
        ];
    }

    private function verifyStripe(string $reference): bool
    {
        // Reference format: STR-cs_xxxxx
        $sessionId = str_starts_with($reference, 'STR-') ? substr($reference, 4) : $reference;

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $session = StripeSession::retrieve($sessionId);
            return $session->payment_status === 'paid';
        } catch (\Exception) {
            return false;
        }
    }

    // ─── Paystack ─────────────────────────────────────────────────────────────

    private function initiatePaystack(Fee $fee, string $callbackUrl): array
    {
        $reference = 'PSK_' . Str::uuid();

        $response = Http::withToken(config('services.paystack.secret_key'))
            ->post(config('services.paystack.base_url', 'https://api.paystack.co') . '/transaction/initialize', [
                'reference'    => $reference,
                'amount'       => (int) ($fee->amount * 100),
                'email'        => $fee->student->user->email,
                'currency'     => 'NGN',
                'callback_url' => $callbackUrl . '?gateway=paystack&ref=' . $reference,
                'metadata'     => ['fee_id' => $fee->id, 'tenant_id' => $fee->tenant_id],
            ])->json();

        if (! ($response['status'] ?? false)) {
            throw new \RuntimeException('Paystack: ' . ($response['message'] ?? 'Initialization failed'));
        }

        return [
            'redirect_url' => $response['data']['authorization_url'],
            'reference'    => $reference,
        ];
    }

    private function verifyPaystack(string $reference): bool
    {
        $response = Http::withToken(config('services.paystack.secret_key'))
            ->get(config('services.paystack.base_url', 'https://api.paystack.co') . '/transaction/verify/' . $reference)
            ->json();

        return ($response['data']['status'] ?? '') === 'success';
    }

    // ─── Monnify ──────────────────────────────────────────────────────────────

    private function initiateMonnify(Fee $fee, string $callbackUrl): array
    {
        $reference = 'MNF_' . Str::uuid();
        $token     = $this->getMonnifyToken();

        $response = Http::withToken($token)
            ->post(config('services.monnify.base_url', 'https://sandbox.monnify.com') . '/api/v1/merchant/transactions/init-transaction', [
                'amount'             => $fee->amount,
                'customerName'       => $fee->student->user->name,
                'customerEmail'      => $fee->student->user->email,
                'paymentReference'   => $reference,
                'paymentDescription' => $fee->title,
                'currencyCode'       => 'NGN',
                'contractCode'       => config('services.monnify.contract_code'),
                'redirectUrl'        => $callbackUrl . '?gateway=monnify&ref=' . $reference,
                'paymentMethods'     => ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
            ])->json();

        if (! ($response['requestSuccessful'] ?? false)) {
            throw new \RuntimeException('Monnify: ' . ($response['responseMessage'] ?? 'Initialization failed'));
        }

        return [
            'redirect_url' => $response['responseBody']['checkoutUrl'],
            'reference'    => $reference,
        ];
    }

    private function verifyMonnify(string $reference): bool
    {
        try {
            $token    = $this->getMonnifyToken();
            $response = Http::withToken($token)
                ->get(config('services.monnify.base_url', 'https://sandbox.monnify.com') . '/api/v2/transactions/' . urlencode($reference))
                ->json();

            return ($response['responseBody']['paymentStatus'] ?? '') === 'PAID';
        } catch (\Exception) {
            return false;
        }
    }

    private function getMonnifyToken(): string
    {
        $credentials = base64_encode(config('services.monnify.api_key') . ':' . config('services.monnify.secret_key'));
        $response    = Http::withHeaders(['Authorization' => "Basic {$credentials}"])
            ->post(config('services.monnify.base_url', 'https://sandbox.monnify.com') . '/api/v1/auth/login')
            ->json();

        return $response['responseBody']['accessToken']
            ?? throw new \RuntimeException('Monnify authentication failed');
    }

    // ─── ZainPay ──────────────────────────────────────────────────────────────

    private function zainPayBaseUrl(): string
    {
        return config('services.zainpay.mode', 'dev') === 'production'
            ? 'https://api.zainpay.ng'
            : 'https://dev.zainpay.ng';
    }

    private function initiateZainPay(Fee $fee, string $callbackUrl): array
    {
        $txnRef   = 'ZAP_' . Str::uuid();
        $response = Http::withToken(config('services.zainpay.public_key'))
            ->post($this->zainPayBaseUrl() . '/zainbox/payment/initialize', [
                'amount'        => (string) intval($fee->amount),
                'txnRef'        => $txnRef,
                'payerEmail'    => $fee->student->user->email,
                'payerMobileNo' => $fee->student->phone ?? '08000000000',
                'zainboxCode'   => config('services.zainpay.zainbox_code'),
                'callbackUrl'   => $callbackUrl . '?gateway=zainpay&ref=' . $txnRef,
            ])->json();

        if (($response['code'] ?? '') !== '00') {
            throw new \RuntimeException('ZainPay: ' . ($response['description'] ?? 'Initialization failed'));
        }

        return [
            'redirect_url' => $response['data'],
            'reference'    => $txnRef,
        ];
    }

    private function verifyZainPay(string $reference): bool
    {
        try {
            $response = Http::withToken(config('services.zainpay.public_key'))
                ->get($this->zainPayBaseUrl() . '/zainbox/payment/verify/' . $reference)
                ->json();

            return ($response['code'] ?? '') === '00'
                && ($response['data']['status'] ?? '') === 'success';
        } catch (\Exception) {
            return false;
        }
    }

    // ─── Sandbox (Local Dev Only) ─────────────────────────────────────────────

    private function initiateSandbox(Fee $fee, string $callbackUrl): array
    {
        $reference = 'SND_' . Str::uuid();
        return [
            'redirect_url' => $callbackUrl . '?gateway=sandbox&ref=' . $reference . '&status=success',
            'reference'    => $reference,
        ];
    }

    private function verifySandbox(string $reference): bool
    {
        return str_starts_with($reference, 'SND_');
    }

    // ─── Webhook verification ─────────────────────────────────────────────────

    public function verifyStripeWebhook(string $payload, string $signature): \Stripe\Event
    {
        Stripe::setApiKey(config('services.stripe.secret'));
        return \Stripe\Webhook::constructEvent($payload, $signature, config('services.stripe.webhook'));
    }

    public function verifyPaystackWebhook(string $payload, string $signature): bool
    {
        return hash_equals(
            hash_hmac('sha512', $payload, config('services.paystack.secret_key')),
            $signature
        );
    }

    // ─── Mark payment successful ──────────────────────────────────────────────

    public function markSuccessful(string $reference, array $metadata = []): Payment
    {
        $payment = Payment::where('reference', $reference)->firstOrFail();

        $payment->update([
            'status'   => 'successful',
            'metadata' => array_merge($payment->metadata ?? [], $metadata),
        ]);

        $totalPaid = $payment->fee->payments()
            ->where('status', 'successful')
            ->sum('amount');

        $payment->fee->update([
            'status' => $totalPaid >= $payment->fee->amount ? 'paid' : 'partial',
        ]);

        // Log to global Transaction ledger
        Transaction::create([
            'tenant_id'      => $payment->tenant_id,
            'user_id'        => $payment->student->user_id,
            'payable_type'   => Fee::class,
            'payable_id'     => $payment->fee_id,
            'type'           => 'fee_payment',
            'amount'         => $payment->amount,
            'currency'       => 'NGN',
            'status'         => 'successful',
            'payment_method' => $payment->payment_method,
            'reference'      => $payment->reference,
            'metadata'       => array_merge($metadata, ['payment_id' => $payment->id]),
        ]);

        return $payment;
    }
}
