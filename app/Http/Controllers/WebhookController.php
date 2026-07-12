<?php
namespace App\Http\Controllers;
use App\Services\PaymentService;
use Illuminate\Http\{Request,Response,JsonResponse};
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller {
    public function __construct(private PaymentService $ps) {}

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
        $body = $request->json()->all();
        // Add signature verification here if Zainpay provides one
        // $sig = $request->header('x-zainpay-signature');

        if (($body['status'] ?? '') === 'success' || ($body['status'] ?? '') === 'completed') {
            $data = $body['data'] ?? $body;
            try { 
                $this->ps->markSuccessful($data['txnRef'] ?? $data['reference'] ?? '', ['zainpay_ref' => $data['zainpayReference'] ?? '']); 
            } catch (\Exception $e) { 
                Log::error('Zainpay webhook processing: '.$e->getMessage()); 
            }
        }
        return response()->json(['status' => 'ok']);
    }
}
