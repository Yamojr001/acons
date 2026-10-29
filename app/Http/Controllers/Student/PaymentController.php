<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{StudentInvoice, Payment, Fee, InstitutionSetting};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $institution = InstitutionSetting::current();
        $student = $request->user()->student;

        $invoices = StudentInvoice::with(['fee.academicSession', 'fee.department'])
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Student/Fees/Index', [
            'invoices' => $invoices,
            'activeGateway' => $institution->payment_gateway ?? 'zainpay'
        ]);
    }

    /**
     * Initializes the payment transaction and returns the gateway configuration.
     * In a real app, this would call Remita or Paystack APIs to generate an RRR or Access Code.
     */
    public function initialize(Request $request, StudentInvoice $invoice)
    {
        $institution = InstitutionSetting::current();
        $student = $request->user()->student;

        if ($invoice->student_id !== $student->id) {
            abort(403, 'Unauthorized action.');
        }

        if ($invoice->status === 'paid') {
            return back()->withErrors(['message' => 'This invoice is already fully paid.']);
        }

        $gateway = $institution->payment_gateway ?? 'zainpay';
        
        // Generate a unique reference
        $reference = 'ACON_FEE_' . strtoupper(Str::random(10));

        $isTuitionFee = in_array($invoice->fee?->fee_type, ['tuition', 'registration']);
        $isFacilitationFee = ($invoice->fee?->fee_type === 'facilitation');
        $zainboxCode = ($isFacilitationFee && config('services.zainpay.facilitation_zainbox_code'))
            ? config('services.zainpay.facilitation_zainbox_code')
            : config('services.zainpay.zainbox_code');

        // Prerequisite check: Academic Facilitation Fee must be paid before School Fees
        if ($isTuitionFee) {
            $facilitationInvoice = StudentInvoice::where('student_id', $student->id)
                ->whereHas('fee', fn($q) => $q->where('fee_type', 'facilitation'))
                ->first();

            if (!$facilitationInvoice || $facilitationInvoice->status !== 'paid') {
                return response()->json([
                    'gateway' => $gateway,
                    'error'   => 'You must pay the Academic Facilitation Fee (₦3,850.00) before paying your Semester Registration & School Fees.',
                ], 422);
            }
        }

        $tuitionBalance = (float) ($invoice->amount_due - $invoice->amount_paid);
        $installmentPercent = (int) ($request->input('installment_percent', 100));

        if ($isTuitionFee && $invoice->amount_paid == 0 && $installmentPercent === 70) {
            $tuitionPortion = round((float)$invoice->amount_due * 0.70, 2); // ₦374,500
            $effectivePercent = 70;
        } else {
            $tuitionPortion = $tuitionBalance; // ₦535,000 (or remaining balance if 70% already paid)
            $effectivePercent = ($invoice->amount_paid > 0) ? 30 : 100;
        }

        // Optional Hostel Accommodation Fee (₦105,000)
        $includeHostel = $request->boolean('include_hostel');
        $hostelPortion = 0.00;
        $hostelInvoice = null;

        if ($includeHostel && $isTuitionFee) {
            $hostelFee = Fee::where('fee_type', 'hostel')
                ->where(function($q) use ($invoice) {
                    $q->where('academic_session_id', $invoice->fee?->academic_session_id)
                      ->orWhereNull('academic_session_id');
                })
                ->first();

            if ($hostelFee) {
                $hostelInvoice = StudentInvoice::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_id'     => $hostelFee->id,
                    ],
                    [
                        'amount_due'  => $hostelFee->amount ?: 105000.00,
                        'amount_paid' => 0,
                        'status'      => 'pending',
                    ]
                );

                if ($hostelInvoice->status !== 'paid') {
                    $hostelPortion = (float) ($hostelInvoice->amount_due - $hostelInvoice->amount_paid);
                }
            } else {
                $hostelPortion = 105000.00;
            }
        }

        // Payment Gateway Processing Fee (Waived / 0.00)
        $gatewayCharge = 0.00;

        $totalAmount = $tuitionPortion + $hostelPortion + $gatewayCharge;

        $payerEmail = $request->user()->email ?: ($student->user?->email ?? null);
        $payerName  = $request->user()->name ?: ($student->user?->name ?? null);

        // Create a pending payment record
        $payment = Payment::create([
            'student_invoice_id' => $invoice->id,
            'amount'             => $totalAmount,
            'reference'          => $reference,
            'payment_gateway'    => $gateway,
            'status'             => 'pending',
            'email'              => $payerEmail,
            'payer_name'         => $payerName,
            'metadata'           => [
                'tuition_invoice_id'  => $isTuitionFee ? $invoice->id : null,
                'tuition_amount'      => $isTuitionFee ? $tuitionPortion : 0.00,
                'installment_percent' => $effectivePercent,
                'include_hostel'      => ($includeHostel && $hostelPortion > 0) || ($invoice->fee?->fee_type === 'hostel'),
                'hostel_invoice_id'   => $isTuitionFee ? $hostelInvoice?->id : $invoice->id,
                'hostel_amount'       => $isTuitionFee ? $hostelPortion : $tuitionBalance,
                'gateway_charge'      => $gatewayCharge,
                'is_facilitation'     => $isFacilitationFee,
                'zainbox_code'        => $zainboxCode,
            ],
        ]);

        // Mirror in unified Transactions table
        \App\Models\Transaction::updateOrCreate(
            ['reference' => $reference],
            [
                'user_id'        => $request->user()->id,
                'email'          => $payerEmail,
                'payer_name'     => $payerName,
                'payable_type'   => \App\Models\StudentInvoice::class,
                'payable_id'     => $invoice->id,
                'type'           => $invoice->fee?->fee_type ?? 'school_fees',
                'amount'         => $totalAmount,
                'currency'       => 'NGN',
                'status'         => 'pending',
                'payment_method' => $gateway,
                'metadata'       => $payment->metadata,
            ]
        );

        if ($gateway === 'remita') {
            // Mock Remita RRR Generation
            // In reality: Http::post('remita-url/echannels/merchant/api/paymentinit', [...])
            $rrr = 'RRR' . rand(1000000000, 9999999999);
            
            $payment->update(['metadata' => json_encode(['rrr' => $rrr])]);

            return response()->json([
                'gateway' => 'remita',
                'reference' => $reference,
                'rrr' => $rrr,
                'amount' => $payment->amount,
                'merchantId' => $institution->settings['remita_merchant_id'] ?? 'DEMO',
                'apiKey' => $institution->settings['remita_api_key'] ?? 'DEMO_KEY'
            ]);
        }

        if ($gateway === 'monnify') {
            return response()->json([
                'gateway' => 'monnify',
                'reference' => $reference,
                'amount' => $payment->amount,
                'email' => $request->user()->email,
                'apiKey' => config('services.monnify.api_key'),
                'contractCode' => config('services.monnify.contract_code'),
                'baseUrl' => config('services.monnify.base_url'),
                'currency' => config('services.monnify.currency', 'NGN'),
            ]);
        }

        if ($gateway === 'zainpay') {
            $callbackUrl = route('student.payments.verify', $reference);
            $userEmail = trim($request->user()->email ?? '');
            if (empty($userEmail) || !filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
                $userEmail = strtolower($student->matriculation_number) . '@acons.edu.ng';
            }

            $baseUrl = rtrim(config('services.zainpay.base_url', 'https://api.zainpay.ng'), '/');
            if (str_contains($baseUrl, 'sandbox.zainpay.ng')) {
                $baseUrl = 'https://api.zainpay.ng';
            }
            $targetZainboxCode = $zainboxCode ?: config('services.zainpay.zainbox_code');
            if (empty($targetZainboxCode) || $targetZainboxCode === 'ACONS_p1XhqAZqOT4n96geDYJI') {
                $targetZainboxCode = 'ACONS_ijEt7i4diabtRVTqFdSh';
            }

            $httpResponse = \Illuminate\Support\Facades\Http::timeout(60)
                ->withToken(config('services.zainpay.public_key'))
                ->post($baseUrl . '/zainbox/card/initialize/payment', [
                    'amount'       => (string) round((float) $payment->amount),
                    'emailAddress' => $userEmail,
                    'email'        => $userEmail,
                    'mobileNumber' => $request->user()->phone ?: ($student->phone_number ?: '08000000000'),
                    'txnRef'       => $reference,
                    'zainboxCode'  => $targetZainboxCode,
                    'callBackUrl'  => $callbackUrl,
                ]);

            $response = $httpResponse->json();

            if (!$httpResponse->successful() || !isset($response['code']) || $response['code'] !== '00') {
                $payment->update(['status' => 'failed']);
                \Illuminate\Support\Facades\Log::error('Zainpay payment initialization failed in PaymentController', [
                    'payment_id' => $payment->id,
                    'amount'     => $payment->amount,
                    'status'     => $httpResponse->status(),
                    'response'   => $response,
                    'body'       => $httpResponse->body(),
                ]);

                $errorMessage = $response['description'] ?? ($response['message'] ?? null);
                if (!$errorMessage && isset($response['amount'][0]['code'])) {
                    $errorMessage = 'Invalid amount format: ' . $response['amount'][0]['code'];
                }

                return response()->json([
                    'gateway' => 'zainpay',
                    'error'   => $errorMessage ?? ('Zainpay initialization failed (HTTP ' . $httpResponse->status() . '). Please try again.'),
                ], 422);
            }

            $redirectUrl = is_array($response['data'] ?? null)
                ? ($response['data']['url'] ?? $response['data']['paymentUrl'] ?? null)
                : ($response['data'] ?? null);

            return response()->json([
                'gateway' => 'zainpay',
                'reference' => $reference,
                'amount' => $payment->amount,
                'redirect_url' => $redirectUrl,
            ]);
        }

        // Default: Paystack
        return response()->json([
            'gateway' => 'paystack',
            'reference' => $reference,
            'amount' => $payment->amount * 100, // Paystack uses kobo
            'email' => $request->user()->email,
            'publicKey' => $institution->settings['paystack_public_key'] ?? config('services.paystack.public_key')
        ]);
    }

    /**
     * Verifies the payment and clears the invoice. For Zainpay, this genuinely
     * checks the transaction status via the Zainpay API rather than trusting
     * the client. Other gateways here remain simulated (see comment below) —
     * that's a pre-existing limitation, not something specific to this fix.
     */
    public function verify(Request $request, $reference)
    {
        $payment = Payment::where('reference', $reference)->firstOrFail();

        if ($payment->status === 'successful') {
            return redirect()->route('student.registration')->with('info', 'This payment has already been verified and credited.');
        }

        if ($payment->payment_gateway === 'zainpay') {
            $baseUrl = rtrim(config('services.zainpay.base_url', 'https://api.zainpay.ng'), '/');
            if (str_contains($baseUrl, 'sandbox.zainpay.ng')) {
                $baseUrl = 'https://api.zainpay.ng';
            }
            $httpResponse = \Illuminate\Support\Facades\Http::timeout(30)
                ->withToken(config('services.zainpay.public_key'))
                ->get("{$baseUrl}/virtual-account/wallet/deposit/verify/v2/{$reference}");

            $response = $httpResponse->json();

            $verified = ($response['code'] ?? '') === '00' && (
                strtolower($response['data']['status'] ?? '') === 'success' || 
                strtolower($response['status'] ?? '') === '200 ok' || 
                strtolower($response['description'] ?? '') === 'successful' || 
                isset($response['data']['paymentRef']) || 
                isset($response['data']['depositedAmount'])
            );

            if (!$verified) {
                $payment->update(['status' => 'failed']);
                \Illuminate\Support\Facades\Log::warning('Zainpay payment verification failed', [
                    'reference' => $reference,
                    'status'    => $httpResponse->status(),
                    'response'  => $response,
                ]);
                return redirect()->route('student.registration')->with('error', 'Payment could not be verified (' . ($response['description'] ?? 'Transaction not confirmed') . '). If you were charged, please contact the Bursary.');
            }
        }
        // NOTE: Remita/Paystack/Monnify/sandbox paths below remain a simulated
        // "always succeed" verification (pre-existing behavior, not introduced
        // by this fix) — a real deployment should verify each of those against
        // its respective gateway API before marking an invoice paid.

        $verifiedEmail = $payment->email ?: ($payment->student?->user?->email ?? $request->user()?->email);
        $verifiedName  = $payment->payer_name ?: ($payment->student?->user?->name ?? $request->user()?->name);

        $payment->update([
            'status'     => 'successful',
            'email'      => $verifiedEmail,
            'payer_name' => $verifiedName,
        ]);

        \App\Models\Transaction::where('reference', $reference)->update([
            'status'     => 'successful',
            'email'      => $verifiedEmail,
            'payer_name' => $verifiedName,
        ]);

        $meta = $payment->metadata ?? [];
        if (is_string($meta)) {
            $meta = json_decode($meta, true) ?: [];
        }

        $tuitionAmount = isset($meta['tuition_amount']) ? (float)$meta['tuition_amount'] : (float)$payment->amount;
        $hostelAmount = isset($meta['hostel_amount']) ? (float)$meta['hostel_amount'] : 0.00;
        $hostelInvoiceId = $meta['hostel_invoice_id'] ?? null;

        $invoice = $payment->studentInvoice ?: StudentInvoice::find($payment->student_invoice_id);
        $isTuition = $invoice && in_array($invoice->fee?->fee_type, ['tuition', 'registration']);
        $status = $invoice?->status ?? 'pending';

        if ($invoice && $isTuition && $tuitionAmount > 0) {
            $newPaidAmount = (float)$invoice->amount_paid + $tuitionAmount;
            $status = $newPaidAmount >= (float)$invoice->amount_due ? 'paid' : 'partial';

            $invoice->update([
                'amount_paid' => $newPaidAmount,
                'status'      => $status,
            ]);
        } elseif ($invoice && !$isTuition && empty($meta['include_hostel'])) {
            $gatewayFee = (float)($meta['gateway_charge'] ?? 0.00);
            $effectiveAmount = max(0, (float)$payment->amount - $gatewayFee);
            $newPaidAmount = (float)$invoice->amount_paid + $effectiveAmount;
            $status = $newPaidAmount >= (float)$invoice->amount_due ? 'paid' : 'partial';

            $invoice->update([
                'amount_paid' => $newPaidAmount,
                'status'      => $status,
            ]);
        }

        // Credit Hostel Invoice if selected
        if (!empty($meta['include_hostel']) && $hostelAmount > 0) {
            $hostelInvoice = $hostelInvoiceId ? StudentInvoice::find($hostelInvoiceId) : null;
            if ($hostelInvoice) {
                $newHostelPaid = (float)$hostelInvoice->amount_paid + $hostelAmount;
                $hostelStatus = $newHostelPaid >= (float)$hostelInvoice->amount_due ? 'paid' : 'partial';
                $hostelInvoice->update([
                    'amount_paid' => $newHostelPaid,
                    'status'      => $hostelStatus,
                ]);
            }
        }

        // Auto Generate Matriculation Number upon school fees / tuition payment
        $student = $invoice->student;
        if ($isTuition && ($status === 'paid' || $status === 'partial') && $student && !$student->matriculation_number) {
            $program = $student->program;
            $programName = $program?->name ?? '';

            $section = 'ND';
            if (stripos($programName, 'Basic') !== false || stripos($programName, 'General') !== false || stripos($programName, 'RN') !== false || stripos($programName, 'RM') !== false) {
                $section = 'RN';
            }

            $deptName = $student->department?->name ?? '';
            $deptCode = $student->department?->code ?? '';

            if (stripos($deptName, 'midwifery') !== false || stripos($deptCode, 'mid') !== false) {
                $deptAbbr = 'MID';
            } elseif (stripos($deptName, 'nursing') !== false || stripos($deptCode, 'nur') !== false) {
                $deptAbbr = 'NUR';
            } else {
                $deptAbbr = strtoupper(substr($deptCode ?: $deptName ?: 'GEN', 0, 3));
            }

            $matchingApplicant = \App\Models\Applicant::where(function ($q) use ($student) {
                if (!empty($student->jamb_registration_number)) {
                    $q->where('jamb_number', $student->jamb_registration_number);
                }
                if (!empty($student->phone_number)) {
                    $q->orWhere('phone_number', $student->phone_number);
                }
            })->first();

            if ($matchingApplicant && !empty($matchingApplicant->registration_number)) {
                $matriculationNumber = str_replace('/25/', '/26/', $matchingApplicant->registration_number);
            } else {
                $yearYY = '26'; // New admissions year is 26
                $prefix = "ACONS/{$deptAbbr}/{$section}/{$yearYY}/";

                $maxSerial = (int) (\App\Models\Student::where('matriculation_number', 'like', $prefix . '%')
                    ->selectRaw("MAX(CAST(SUBSTRING_INDEX(matriculation_number, '/', -1) AS UNSIGNED)) as max_serial")
                    ->value('max_serial') ?? 0);

                $nextSerial = str_pad($maxSerial + 1, 3, '0', STR_PAD_LEFT);
                $matriculationNumber = $prefix . $nextSerial;
            }

            $student->update(['matriculation_number' => $matriculationNumber]);
        }

        if ($invoice->fee?->fee_type === 'facilitation') {
            return redirect()->route('student.registration')->with('success', 'Academic Facilitation Fee (₦3,850.00) paid successfully! You may now proceed to pay your Semester Registration & School Fees.');
        }

        return redirect()->route('student.registration')->with('success', 'Payment verified and credited successfully! You can now proceed with course registration.');
    }

    /**
     * Download authentic PDF receipt for a paid student invoice.
     */
    public function downloadReceipt(Request $request, StudentInvoice $invoice)
    {
        $student = $invoice->student;
        $user = $request->user();

        if ($user->hasRole('student')) {
            abort_if(!$user->student || $user->student->id !== $student?->id, 403, 'Unauthorized access to this receipt.');
        } elseif (!$user->hasAnyRole(['admin', 'super_admin', 'bursar', 'school_admin', 'provost'])) {
            abort(403, 'Unauthorized access.');
        }

        if ($invoice->status !== 'paid' && (float)$invoice->amount_paid <= 0) {
            return back()->with('error', 'Receipt not available. Invoice is unpaid.');
        }

        $payment = Payment::where('student_invoice_id', $invoice->id)
            ->where('status', 'successful')
            ->latest()
            ->first();

        $paymentRef = $payment?->reference ?: ('ACON_INV_' . $invoice->id);
        $paidAt = $payment?->created_at ? $payment->created_at->format('d/m/Y h:i A') : $invoice->updated_at->format('d/m/Y h:i A');
        $paymentGateway = $payment?->payment_gateway ?: 'zainpay';

        $logoPath = public_path('assets/images/acons_logo.png');
        if (!file_exists($logoPath)) {
            $logoPath = public_path('logo.png');
        }
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : null;

        $amountPaid = (float) $invoice->amount_paid;
        $amountInWords = $this->numberToWords($amountPaid);

        $academicSessionName = $invoice->fee?->academicSession?->name
            ?? \App\Models\AcademicSession::where('is_current', true)->value('name')
            ?? '2026/2027';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.student_receipt_pdf', [
            'paymentRef'          => $paymentRef,
            'paidAt'              => $paidAt,
            'paymentGateway'      => $paymentGateway,
            'studentName'         => $student?->user?->name ?? 'Student',
            'matricNumber'        => $student?->matriculation_number ?: 'Pending',
            'jambNumber'          => $student?->jamb_registration_number,
            'currentLevel'        => $student?->current_level ?? 'ND1',
            'departmentName'      => $student?->department?->name ?? 'Nursing Sciences',
            'programName'         => $student?->program?->name ?? 'General Nursing',
            'phoneNumber'         => $student?->phone_number ?: ($student?->user?->phone ?? 'N/A'),
            'email'               => $student?->user?->email ?? 'N/A',
            'feeName'             => $invoice->fee?->name ?? 'School Fees',
            'feeType'             => $invoice->fee?->fee_type ?? 'tuition',
            'amountDue'           => (float) $invoice->amount_due,
            'amountPaid'          => $amountPaid,
            'amountInWords'       => $amountInWords,
            'academicSessionName' => $academicSessionName,
            'logoBase64'          => $logoBase64,
        ])->setPaper('a4', 'portrait');

        $safeMatric = preg_replace('/[^A-Za-z0-9_-]/', '_', $student?->matriculation_number ?: 'STUDENT_' . $student?->id);
        $filename = "ACONS_Official_Receipt_{$safeMatric}_{$invoice->id}.pdf";

        return $pdf->download($filename);
    }

    private function numberToWords(float $amount): string
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        $num = (int)$amount;
        if ($num === 0) return 'Zero Naira Only';
        
        $helper = function($n) use (&$helper, $ones, $tens) {
            if ($n < 20) return $ones[$n];
            if ($n < 100) return $tens[(int)($n / 10)] . ($n % 10 ? '-' . $ones[$n % 10] : '');
            if ($n < 1000) return $ones[(int)($n / 100)] . ' Hundred' . ($n % 100 ? ' and ' . $helper($n % 100) : '');
            if ($n < 1000000) return $helper((int)($n / 1000)) . ' Thousand' . ($n % 1000 ? ' ' . $helper($n % 1000) : '');
            if ($n < 1000000000) return $helper((int)($n / 1000000)) . ' Million' . ($n % 1000000 ? ' ' . $helper($n % 1000000) : '');
            return (string)$n;
        };
        
        return trim($helper($num)) . ' Naira Only';
    }
}
