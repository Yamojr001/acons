<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\AdmissionApplication;
use App\Models\AdmissionForm;
use App\Models\Payment;
use App\Models\StudentInvoice;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Fee;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZainpayReconciliationService
{
    protected string $baseUrl;
    protected ?string $publicKey;
    protected ?string $zainboxCode;

    public function __construct()
    {
        $mode = config('services.zainpay.mode', 'sandbox');
        $this->baseUrl = $mode === 'production' 
            ? 'https://api.zainpay.ng' 
            : rtrim(config('services.zainpay.base_url', 'https://sandbox.zainpay.ng'), '/');
        $this->publicKey = config('services.zainpay.public_key');
        $this->zainboxCode = config('services.zainpay.zainbox_code');
    }

    /**
     * Process a verified successful transaction: match applicant or student in DB and update status.
     */
    public function handleSuccessfulPayment(
        string $txnRef,
        ?string $email = null,
        float $amount = 0,
        ?string $gatewayRef = null
    ): ?array {
        // ─── 1. Attempt to match an APPLICANT (Admission application) ───────────────────
        $applicant = null;

        // A. Match by ACON_ADM_{id}_{timestamp} convention
        if (preg_match('/ACON_ADM_(\d+)/', $txnRef, $matches)) {
            $applicant = Applicant::find($matches[1]);
        }

        // B. Match by stored payment_reference
        if (!$applicant && !empty($txnRef)) {
            $applicant = Applicant::where('payment_reference', $txnRef)->first();
        }

        // C. Match by email or jamb number if email provided
        if (!$applicant && !empty($email)) {
            $cleanEmail = trim(strtolower($email));
            $applicant = Applicant::whereRaw('LOWER(email) = ?', [$cleanEmail])
                ->orWhereRaw('LOWER(jamb_number) = ?', [explode('@', $cleanEmail)[0]])
                ->first();
        }

        if ($applicant) {
            $finalAmount = $amount > 0 ? $amount : 14700.00;
            $applicant->update([
                'payment_status'    => 'paid',
                'amount_paid'       => $finalAmount,
                'payment_reference' => $txnRef ?: ($gatewayRef ?: $applicant->payment_reference),
            ]);

            $this->ensureAdmissionApplicationExists($applicant);

            try {
                Log::info("Zainpay: Successfully reconciled Applicant ID {$applicant->id} ({$applicant->full_name}) as paid.", [
                    'txnRef' => $txnRef,
                    'amount' => $finalAmount
                ]);
            } catch (\Throwable) {}

            return [
                'type' => 'applicant',
                'id' => $applicant->id,
                'name' => $applicant->full_name,
                'email' => $applicant->email,
                'status' => 'paid',
                'reference' => $txnRef,
            ];
        }

        // ─── 2. Attempt to match a STUDENT PAYMENT (Tuition, fees, etc.) ───────────────
        $payment = null;

        if (!empty($txnRef)) {
            $payment = Payment::where('reference', $txnRef)->first();
        }

        if (!$payment && !empty($email)) {
            $user = User::whereRaw('LOWER(email) = ?', [trim(strtolower($email))])->first();
            if ($user && $user->student) {
                $payment = Payment::where('student_id', $user->student->id)
                    ->where('status', '!=', 'successful')
                    ->latest()
                    ->first();
            }
        }

        if ($payment) {
            $payment->update([
                'status' => 'successful',
                'metadata' => array_merge($payment->metadata ?? [], [
                    'zainpay_txn_ref' => $txnRef,
                    'zainpay_gateway_ref' => $gatewayRef,
                    'reconciled_at' => now()->toIso8601String(),
                ]),
            ]);

            // Update student invoice if attached
            if ($payment->student_invoice_id) {
                $invoice = StudentInvoice::find($payment->student_invoice_id);
                if ($invoice) {
                    $newPaid = $invoice->amount_paid + $payment->amount;
                    $invoice->update([
                        'amount_paid' => $newPaid,
                        'status' => $newPaid >= $invoice->amount_due ? 'paid' : 'partial',
                    ]);
                }
            }

            // Update fee if attached
            if (isset($payment->fee_id) && $payment->fee_id) {
                $fee = Fee::find($payment->fee_id);
                if ($fee) {
                    $fee->update(['status' => 'paid']);
                }
            }

            try {
                Log::info("Zainpay: Successfully reconciled Student Payment ID {$payment->id} as successful.", [
                    'txnRef' => $txnRef
                ]);
            } catch (\Throwable) {}

            return [
                'type' => 'payment',
                'id' => $payment->id,
                'reference' => $payment->reference,
                'status' => 'successful',
            ];
        }

        return null;
    }

    /**
     * Reconcile recent transactions directly from Zainpay's history API.
     */
    public function reconcileHistory(int $count = 50): array
    {
        if (empty($this->zainboxCode) || empty($this->publicKey)) {
            return ['success' => false, 'error' => 'Zainpay credentials not configured.'];
        }

        try {
            $response = Http::timeout(45)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/zainbox/transactions/{$this->zainboxCode}?count={$count}")
                ->json();
        } catch (\Exception $e) {
            return ['success' => false, 'error' => 'Failed to reach Zainpay: ' . $e->getMessage()];
        }

        if (($response['code'] ?? '') !== '00' || !isset($response['data']) || !is_array($response['data'])) {
            return ['success' => false, 'error' => $response['description'] ?? 'No transactions returned.'];
        }

        $reconciled = [];

        foreach ($response['data'] as $item) {
            $txnRef = $item['transactionRef'] ?? '';
            if (empty($txnRef)) {
                continue;
            }

            // Parse amount (Zainbox history is often reported in kobo, e.g. 1442950.00 = ₦14,429.50)
            $rawAmount = (float) ($item['amount'] ?? 0);
            $amountNaira = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;

            // Check if already paid in DB
            if (preg_match('/ACON_ADM_(\d+)/', $txnRef, $m)) {
                $checkApplicant = Applicant::find($m[1]);
                if ($checkApplicant && $checkApplicant->payment_status === 'paid') {
                    continue; // Already reconciled
                }
            }

            // Attempt matching with available reference
            $match = $this->handleSuccessfulPayment($txnRef, null, $amountNaira, $item['accountNumber'] ?? null);

            // If not matched immediately by reference, verify transaction details to fetch customer email
            if (!$match) {
                try {
                    $verify = Http::timeout(20)
                        ->withToken($this->publicKey)
                        ->get("{$this->baseUrl}/virtual-account/wallet/deposit/verify/v2/{$txnRef}")
                        ->json();

                    if (($verify['code'] ?? '') === '00' && isset($verify['data'])) {
                        $customerEmail = $verify['data']['customer']['email'] 
                            ?? $verify['data']['emailNotification'] 
                            ?? $verify['data']['emailAddress'] 
                            ?? null;

                        if ($customerEmail) {
                            $match = $this->handleSuccessfulPayment(
                                $txnRef,
                                $customerEmail,
                                $amountNaira,
                                $verify['data']['paymentRef'] ?? null
                            );
                        }
                    }
                } catch (\Exception) {
                    // Continue to next transaction
                }
            }

            if ($match) {
                $reconciled[] = $match;
            }
        }

        return [
            'success' => true,
            'total_checked' => count($response['data']),
            'reconciled_count' => count($reconciled),
            'reconciled_records' => $reconciled,
        ];
    }

    /**
     * Ensure an AdmissionApplication record is linked to an approved applicant.
     */
    protected function ensureAdmissionApplicationExists(Applicant $applicant): void
    {
        $tenantId = $applicant->tenant_id ?: 1;

        $exists = AdmissionApplication::where('tenant_id', $tenantId)
            ->where(function ($q) use ($applicant) {
                $q->where('applicant_email', $applicant->email)
                  ->orWhere('data->jamb_number', $applicant->jamb_number);
            })->exists();

        if (!$exists) {
            $admissionForm = AdmissionForm::where('tenant_id', $tenantId)->where('is_active', true)->first();

            AdmissionApplication::create([
                'tenant_id'         => $tenantId,
                'admission_form_id' => $admissionForm ? $admissionForm->id : 1,
                'applicant_name'    => $applicant->full_name,
                'applicant_email'   => $applicant->email ?: ($applicant->jamb_number . '@acons.edu.ng'),
                'status'            => 'pending',
                'data'              => [
                    'jamb_number'          => $applicant->jamb_number,
                    'phone_number'         => $applicant->phone_number,
                    'jamb_score'           => $applicant->jamb_score,
                    'state_of_origin'      => $applicant->state_of_origin,
                    'lga'                  => $applicant->lga,
                    'gender'               => $applicant->sex,
                    'date_of_birth'        => $applicant->dob ? $applicant->dob->format('Y-m-d') : null,
                    'first_sitting_type'   => $applicant->first_sitting_type,
                    'first_sitting_no'     => $applicant->first_sitting_no,
                    'first_sitting_grades' => $applicant->first_sitting_grades,
                    'second_sitting_type'  => $applicant->second_sitting_type,
                    'second_sitting_no'    => $applicant->second_sitting_no,
                    'second_sitting_grades'=> $applicant->second_sitting_grades,
                ],
            ]);
        }
    }
}
