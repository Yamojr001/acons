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
use Carbon\Carbon;
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
            if ($applicant->payment_status === 'paid') {
                // Ensure AdmissionApplication exists even if applicant was already marked paid
                $this->ensureAdmissionApplicationExists($applicant);
                return null;
            }

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
            if ($payment->status === 'successful') {
                return null;
            }

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
     * Reconcile card payment transactions for this Zainbox (/zainbox/card/transactions/{zainboxCode}).
     */
    public function reconcileCardTransactions(int $count = 50, ?string $email = null, ?string $txnRef = null): array
    {
        if (empty($this->zainboxCode) || empty($this->publicKey)) {
            return [];
        }

        $params = ['count' => $count];
        if (!empty($email)) {
            $params['email'] = trim($email);
        }
        if (!empty($txnRef)) {
            $params['txnRef'] = trim($txnRef);
        }

        try {
            $response = Http::timeout(30)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/zainbox/card/transactions/{$this->zainboxCode}", $params)
                ->json();
        } catch (\Exception $e) {
            return [];
        }

        if (($response['code'] ?? '') !== '00' || !isset($response['data']) || !is_array($response['data'])) {
            return [];
        }

        $reconciled = [];
        foreach ($response['data'] as $item) {
            $status = strtolower($item['txnStatus'] ?? $item['status'] ?? '');
            if (!in_array($status, ['success', 'successful', 'completed'])) {
                continue;
            }

            $itemTxnRef  = $item['txnRef'] ?? $item['paymentRef'] ?? '';
            $itemEmail   = $item['emailAddress'] ?? $item['email'] ?? null;
            $rawAmount   = (float) ($item['amount'] ?? 0);
            $amountNaira = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;
            $gatewayRef  = $item['paymentRef'] ?? null;

            $matched = $this->handleSuccessfulPayment($itemTxnRef, $itemEmail, $amountNaira, $gatewayRef);
            if ($matched) {
                $reconciled[] = $matched;
            }
        }

        return $reconciled;
    }

    /**
     * Verify and reconcile a specific transaction reference against Zainpay.
     */
    public function verifyAndReconcileTxnRef(string $txnRef): ?array
    {
        if (empty($txnRef) || empty($this->publicKey)) {
            return null;
        }

        // 1. Try verify v2
        try {
            $verify = Http::timeout(25)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/virtual-account/wallet/deposit/verify/v2/{$txnRef}")
                ->json();

            if (($verify['code'] ?? '') === '00' && strtolower($verify['data']['status'] ?? '') === 'success') {
                $data = $verify['data'];
                $rawAmount = (float) ($data['amount'] ?? $data['depositedAmount'] ?? 14700);
                $amountNaira = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;
                $email = $data['customer']['email'] ?? $data['emailNotification'] ?? $data['emailAddress'] ?? null;

                return $this->handleSuccessfulPayment($txnRef, $email, $amountNaira, $data['paymentRef'] ?? null);
            }
        } catch (\Exception) {}

        // 2. Try hanging card-payment reconcile endpoint
        try {
            $reconcile = Http::timeout(25)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/virtual-account/wallet/transaction/reconcile/card-payment", [
                    'txnRef' => $txnRef,
                ])->json();

            if (($reconcile['code'] ?? '') === '00' && in_array(strtolower($reconcile['data']['txnStatus'] ?? ''), ['success', 'successful'])) {
                $data = $reconcile['data'];
                return $this->handleSuccessfulPayment($txnRef, null, 14700.00, $data['paymentRef'] ?? null);
            }
        } catch (\Exception) {}

        return null;
    }

    /**
     * Determine if a transaction amount matches the expected amount (allowing for kobo conversion and processing fee charges).
     */
    public function isAmountMatch(float $txnAmount, float $expectedAmount = 14700.00): bool
    {
        if ($txnAmount <= 0) {
            return false;
        }

        // Convert kobo to naira if > 100000 (e.g. 1470000 kobo = 14700 naira)
        if ($txnAmount > 100000) {
            $txnAmount = round($txnAmount / 100, 2);
        }

        // Exact match
        if (abs($txnAmount - $expectedAmount) < 1.0) {
            return true;
        }

        // Net-of-fees/charges match (e.g. 14,429.50 after Zainpay processing fees)
        if ($txnAmount >= ($expectedAmount * 0.90) && $txnAmount <= ($expectedAmount * 1.05)) {
            return true;
        }

        return false;
    }

    /**
     * Parse date string or transaction reference into Carbon instance.
     */
    public function parseTransactionCarbon(?string $dateStr, ?string $refStr = null): ?Carbon
    {
        // 1. Try extracting Unix timestamp from ref (e.g. ACON_ADM_1_1791355864)
        if ($refStr && preg_match('/_(\d{9,11})/', $refStr, $m)) {
            try {
                return Carbon::createFromTimestamp((int) $m[1]);
            } catch (\Throwable) {}
        }

        if (empty($dateStr)) {
            return null;
        }

        try {
            return Carbon::parse($dateStr, config('app.timezone', 'Africa/Lagos'));
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Search Zainpay Card & Bank transaction history for a transaction matching 
     * the expected amount within a specified time window (default: 40 minutes).
     */
    public function findMatchingTransactionByAmountAndTimestamp(
        float $expectedAmount,
        Carbon $referenceTime,
        int $windowMinutes = 40
    ): ?array {
        if (empty($this->zainboxCode) || empty($this->publicKey)) {
            return null;
        }

        $candidates = [];

        // ─── 1. Inspect Card Transactions ────────────────────────────────────
        try {
            $cardRes = Http::timeout(30)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/zainbox/card/transactions/{$this->zainboxCode}?count=50")
                ->json();

            if (($cardRes['code'] ?? '') === '00' && !empty($cardRes['data']) && is_array($cardRes['data'])) {
                foreach ($cardRes['data'] as $tx) {
                    $status = strtolower($tx['txnStatus'] ?? $tx['status'] ?? '');
                    if (!in_array($status, ['success', 'successful', 'completed'])) {
                        continue;
                    }

                    $rawAmount = (float) ($tx['amount'] ?? 0);
                    if (!$this->isAmountMatch($rawAmount, $expectedAmount)) {
                        continue;
                    }

                    $dateStr = $tx['createdOn'] ?? $tx['txnDate'] ?? $tx['paymentDate'] ?? $tx['date'] ?? null;
                    $refStr  = $tx['txnRef'] ?? $tx['paymentRef'] ?? '';
                    $txCarbon = $this->parseTransactionCarbon($dateStr, $refStr);

                    if (!$txCarbon) {
                        continue;
                    }

                    $diffSeconds = abs($txCarbon->getTimestamp() - $referenceTime->getTimestamp());
                    $diffMinutes = round($diffSeconds / 60, 1);

                    // Allow window (and handle potential 1hr UTC/WAT difference)
                    $isWithinWindow = ($diffMinutes <= $windowMinutes) || (abs($diffMinutes - 60) <= $windowMinutes);

                    if ($isWithinWindow) {
                        $actualDiff = ($diffMinutes <= $windowMinutes) ? $diffMinutes : round(abs($diffMinutes - 60), 1);
                        $candidates[] = [
                            'txnRef'      => $tx['txnRef'] ?? $tx['paymentRef'] ?? '',
                            'paymentRef'  => $tx['paymentRef'] ?? null,
                            'email'       => $tx['emailAddress'] ?? $tx['email'] ?? null,
                            'amount'      => $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount,
                            'diffMinutes' => $actualDiff,
                            'txDate'      => $txCarbon->toDateTimeString(),
                            'source'      => 'card',
                        ];
                    }
                }
            }
        } catch (\Throwable) {}

        // ─── 2. Inspect Bank / Deposit Transactions ──────────────────────────
        try {
            $bankRes = Http::timeout(30)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/zainbox/transactions/{$this->zainboxCode}?count=50")
                ->json();

            if (($bankRes['code'] ?? '') === '00' && !empty($bankRes['data']) && is_array($bankRes['data'])) {
                foreach ($bankRes['data'] as $tx) {
                    $rawAmount = (float) ($tx['amount'] ?? 0);
                    if (!$this->isAmountMatch($rawAmount, $expectedAmount)) {
                        continue;
                    }

                    $dateStr = $tx['transactionDate'] ?? $tx['paymentDate'] ?? $tx['date'] ?? null;
                    $refStr  = $tx['transactionRef'] ?? '';
                    $txCarbon = $this->parseTransactionCarbon($dateStr, $refStr);

                    if (!$txCarbon) {
                        continue;
                    }

                    $diffSeconds = abs($txCarbon->getTimestamp() - $referenceTime->getTimestamp());
                    $diffMinutes = round($diffSeconds / 60, 1);

                    $isWithinWindow = ($diffMinutes <= $windowMinutes) || (abs($diffMinutes - 60) <= $windowMinutes);

                    if ($isWithinWindow) {
                        $actualDiff = ($diffMinutes <= $windowMinutes) ? $diffMinutes : round(abs($diffMinutes - 60), 1);
                        $candidates[] = [
                            'txnRef'      => $tx['transactionRef'] ?? '',
                            'paymentRef'  => $tx['accountNumber'] ?? null,
                            'email'       => null,
                            'amount'      => $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount,
                            'diffMinutes' => $actualDiff,
                            'txDate'      => $txCarbon->toDateTimeString(),
                            'source'      => 'bank',
                        ];
                    }
                }
            }
        } catch (\Throwable) {}

        if (empty($candidates)) {
            return null;
        }

        // Pick candidate closest in time
        usort($candidates, fn($a, $b) => $a['diffMinutes'] <=> $b['diffMinutes']);

        return $candidates[0];
    }

    /**
     * Reconcile a specific applicant by ID or JAMB number.
     */
    public function reconcileApplicantById(int|string $identifier, bool $force = false, int $windowMinutes = 40): array
    {
        $applicant = Applicant::where('id', $identifier)
            ->orWhere('jamb_number', $identifier)
            ->first();

        if (!$applicant) {
            return [
                'success' => false,
                'error'   => "Applicant with ID or JAMB Number '{$identifier}' not found in database.",
            ];
        }

        if ($applicant->payment_status === 'paid' && !$force) {
            $this->ensureAdmissionApplicationExists($applicant);
            return [
                'success' => true,
                'message' => "Applicant #{$applicant->id} ({$applicant->full_name}) is already marked as PAID.",
                'applicant' => $applicant,
            ];
        }

        if ($force) {
            $ref = $applicant->payment_reference ?: ('ACON_ADM_' . $applicant->id . '_' . time());
            $applicant->update([
                'payment_status'    => 'paid',
                'amount_paid'       => 14700.00,
                'payment_reference' => $ref,
            ]);
            $this->ensureAdmissionApplicationExists($applicant);

            return [
                'success' => true,
                'forced'  => true,
                'message' => "Applicant #{$applicant->id} ({$applicant->full_name}) successfully force-marked as PAID.",
                'applicant' => $applicant,
            ];
        }

        // 1. Check card transactions for this applicant's email
        if (!empty($applicant->email)) {
            $this->reconcileCardTransactions(30, $applicant->email);
            $applicant->refresh();
            if ($applicant->payment_status === 'paid') {
                return [
                    'success' => true,
                    'message' => "Matched payment on Zainpay via email '{$applicant->email}'! Applicant is now PAID.",
                    'applicant' => $applicant,
                ];
            }
        }

        // 2. If applicant has a payment_reference, verify directly
        if (!empty($applicant->payment_reference)) {
            $this->verifyAndReconcileTxnRef($applicant->payment_reference);
            $applicant->refresh();
            if ($applicant->payment_status === 'paid') {
                return [
                    'success' => true,
                    'message' => "Verified reference '{$applicant->payment_reference}' on Zainpay! Applicant is now PAID.",
                    'applicant' => $applicant,
                ];
            }
        }

        // 3. Match using Amount (₦14,700) and Timestamp within 40-minute window
        $refTime = $applicant->created_at ?: now();
        $matchedTx = $this->findMatchingTransactionByAmountAndTimestamp(14700.00, $refTime, $windowMinutes);

        if ($matchedTx) {
            $txnRef = $matchedTx['txnRef'] ?: ('ACON_ADM_' . $applicant->id . '_' . time());
            $applicant->update([
                'payment_status'    => 'paid',
                'amount_paid'       => 14700.00,
                'payment_reference' => $txnRef,
            ]);
            $this->ensureAdmissionApplicationExists($applicant);

            return [
                'success' => true,
                'message' => "Verified on Zainpay using Amount (₦14,700.00) and Timestamp within {$windowMinutes} mins (diff: {$matchedTx['diffMinutes']} mins, time: {$matchedTx['txDate']})! Applicant is now PAID.",
                'applicant' => $applicant,
                'transaction' => $matchedTx,
            ];
        }

        // 4. Scan recent 50 card transactions generally
        $this->reconcileCardTransactions(50);
        $applicant->refresh();
        if ($applicant->payment_status === 'paid') {
            return [
                'success' => true,
                'message' => "Matched in Zainpay card transactions! Applicant is now PAID.",
                'applicant' => $applicant,
            ];
        }

        return [
            'success' => false,
            'error'   => "Payment for Applicant #{$applicant->id} ({$applicant->full_name}) could not be confirmed on Zainpay within the {$windowMinutes}-minute window.\nRun with --force to clear them immediately if you confirmed the payment: php artisan zainpay:reconcile --applicant={$applicant->id} --force",
            'applicant' => $applicant,
        ];
    }

    /**
     * Reconcile recent transactions across Card and Bank Deposit APIs.
     */
    public function reconcileHistory(int $count = 50, int $windowMinutes = 40): array
    {
        if (empty($this->zainboxCode) || empty($this->publicKey)) {
            return ['success' => false, 'error' => 'Zainpay credentials not configured.'];
        }

        $reconciled = [];

        // ─── A. Reconcile Card Transactions (Most common for web admissions) ───
        $cardReconciled = $this->reconcileCardTransactions($count);
        $reconciled = array_merge($reconciled, $cardReconciled);

        // ─── B. Reconcile Bank Transfer / Virtual Account Transactions ────────
        try {
            $response = Http::timeout(30)
                ->withToken($this->publicKey)
                ->get("{$this->baseUrl}/zainbox/transactions/{$this->zainboxCode}?count={$count}")
                ->json();

            if (($response['code'] ?? '') === '00' && isset($response['data']) && is_array($response['data'])) {
                foreach ($response['data'] as $item) {
                    $txnRef = $item['transactionRef'] ?? '';
                    if (empty($txnRef)) {
                        continue;
                    }

                    $rawAmount = (float) ($item['amount'] ?? 0);
                    $amountNaira = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;

                    $match = $this->handleSuccessfulPayment($txnRef, null, $amountNaira, $item['accountNumber'] ?? null);

                    if (!$match) {
                        $match = $this->verifyAndReconcileTxnRef($txnRef);
                    }

                    if ($match) {
                        $reconciled[] = $match;
                    }
                }
            }
        } catch (\Exception) {}

        // ─── C. Proactively check pending applicants in DB ───────────────────
        $pendingApplicants = Applicant::where('payment_status', 'pending')
            ->latest()
            ->take(30)
            ->get();

        foreach ($pendingApplicants as $pending) {
            // 1. By email
            if (!empty($pending->email)) {
                $matched = $this->reconcileCardTransactions(10, $pending->email);
                if (!empty($matched)) {
                    $reconciled = array_merge($reconciled, $matched);
                    continue;
                }
            }

            // 2. By reference
            if (!empty($pending->payment_reference)) {
                $matched = $this->verifyAndReconcileTxnRef($pending->payment_reference);
                if ($matched) {
                    $reconciled[] = $matched;
                    continue;
                }
            }

            // 3. By Amount (₦14,700) and 40-minute timestamp window
            $refTime = $pending->created_at ?: now();
            $matchedTx = $this->findMatchingTransactionByAmountAndTimestamp(14700.00, $refTime, $windowMinutes);
            if ($matchedTx) {
                $matched = $this->handleSuccessfulPayment(
                    $matchedTx['txnRef'] ?: ('ACON_ADM_' . $pending->id . '_' . time()),
                    $matchedTx['email'] ?: $pending->email,
                    14700.00,
                    $matchedTx['paymentRef'] ?? null
                );
                if ($matched) {
                    $reconciled[] = $matched;
                }
            }
        }

        // Deduplicate reconciled records by (type, id)
        $unique = [];
        foreach ($reconciled as $rec) {
            $key = ($rec['type'] ?? '') . '_' . ($rec['id'] ?? '');
            if (!isset($unique[$key])) {
                $unique[$key] = $rec;
            }
        }
        $finalReconciled = array_values($unique);

        return [
            'success' => true,
            'total_checked' => $count,
            'reconciled_count' => count($finalReconciled),
            'reconciled_records' => $finalReconciled,
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
