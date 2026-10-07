<?php
namespace App\Http\Controllers;
use App\Services\PaymentService;
use App\Services\ZainpayReconciliationService;
use Illuminate\Http\{Request,Response,JsonResponse};
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller {
    public function __construct(
        private PaymentService $ps,
        private ZainpayReconciliationService $zainpayReconciliation
    ) {}

    public function stripe(Request $request): Response {
        $sig = $request->header('Stripe-Signature');
        try { $event = $this->ps->verifyStripeWebhook($request->getContent(), $sig); }
        catch (\Exception $e) { Log::warning('Stripe webhook invalid: '.$e->getMessage()); return response('Invalid signature', 400); }
        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            try { $this->ps->markSuccessful('STR-'.$session->id, ['stripe_session' => $session->id, 'payment_status' => $session->payment_status]); }
            catch (\Exception $e) { Log::error('Stripe webhook processing: '.$e->getMessage()); }
        }
        return response('OK', 200);
    }

    public function paystack(Request $request): JsonResponse {
        $sig = $request->header('x-paystack-signature');
        if (!$this->ps->verifyPaystackWebhook($request->getContent(), $sig)) {
            Log::warning('Paystack webhook invalid signature');
            return response()->json(['error' => 'Invalid signature'], 400);
        }
        $event = $request->json()->all();
        if (($event['event'] ?? '') === 'charge.success') {
            $data = $event['data'];
            try { $this->ps->markSuccessful($data['reference'], ['paystack_ref' => $data['reference'], 'channel' => $data['channel'] ?? '']); }
            catch (\Exception $e) { Log::error('Paystack webhook processing: '.$e->getMessage()); }
        }
        return response()->json(['status' => 'ok']);
    }

    public function monnify(Request $request): JsonResponse {
        $body = $request->json()->all();
        if (($body['eventType'] ?? '') === 'SUCCESSFUL_TRANSACTION') {
            $data = $body['eventData'] ?? [];
            try { $this->ps->markSuccessful($data['paymentReference'] ?? '', ['monnify_ref' => $data['transactionReference'] ?? '']); }
            catch (\Exception $e) { Log::error('Monnify webhook processing: '.$e->getMessage()); }
        }
        return response()->json(['requestSuccessful' => true]);
    }

    public function zainpay(Request $request): JsonResponse {
        $body = $request->all();
        $event = $body['event'] ?? null;
        $status = strtolower($body['status'] ?? '');
        $data = $body['data'] ?? $body;

        try {
            Log::info('Zainpay webhook incoming payload', ['body' => $body]);
        } catch (\Throwable) {}

        // Check if manual or automated history reconcile requested via webhook
        if ($request->has('reconcile') || ($body['action'] ?? '') === 'reconcile') {
            $result = $this->zainpayReconciliation->reconcileHistory();
            return response()->json([
                'status' => 'ok',
                'message' => 'History reconciliation complete',
                'details' => $result
            ]);
        }

        $isSuccess = ($event === 'deposit.success') ||
                     ($status === 'success' || $status === 'completed' || $status === '200 ok');

        if ($isSuccess) {
            $txnRef = $data['txnRef'] ?? $data['reference'] ?? $body['txnRef'] ?? ($data['paymentRef'] ?? '');
            $email = $data['emailNotification'] ?? $data['emailAddress'] ?? $data['email'] ?? ($body['email'] ?? null);
            
            $rawAmount = (float) ($data['depositedAmount'] ?? $data['amount'] ?? 0);
            $amountNaira = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;
            $gatewayRef = $data['paymentRef'] ?? $data['zainpayReference'] ?? null;

            try {
                $matched = $this->zainpayReconciliation->handleSuccessfulPayment(
                    (string) $txnRef,
                    $email ? (string) $email : null,
                    $amountNaira,
                    $gatewayRef ? (string) $gatewayRef : null
                );

                if ($matched) {
                    return response()->json([
                        'status' => 'ok',
                        'message' => 'Payment matched and processed',
                        'matched' => $matched
                    ]);
                }

                // If immediate match failed, run a history scan to reconcile against latest settled deposits
                $historyScan = $this->zainpayReconciliation->reconcileHistory(25);
                return response()->json([
                    'status' => 'ok',
                    'message' => 'Processed with history scan',
                    'history_scan' => $historyScan
                ]);
            } catch (\Exception $e) {
                try {
                    Log::error('Zainpay webhook processing error: ' . $e->getMessage(), ['exception' => $e]);
                } catch (\Throwable) {}
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
            }
        }

        return response()->json(['status' => 'ignored', 'reason' => 'Non-success event']);
    }
}
