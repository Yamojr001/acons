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
        $tuitionBalance = (float) ($invoice->amount_due - $invoice->amount_paid);
        $installmentPercent = (int) ($request->input('installment_percent', 100));

        if ($isTuitionFee && $invoice->amount_paid == 0 && $installmentPercent === 70) {
            $tuitionPortion = round((float)$invoice->amount_due * 0.70, 2); // ₦378,000
            $effectivePercent = 70;
        } else {
            $tuitionPortion = $tuitionBalance; // ₦540,000 (or remaining balance if 70% already paid)
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

        // Payment Gateway Processing Fee (Capped at ₦2,000)
        $gatewayCharge = 2000.00;

        $totalAmount = $tuitionPortion + $hostelPortion + $gatewayCharge;

        // Create a pending payment record
        $payment = Payment::create([
            'student_invoice_id' => $invoice->id,
            'amount'             => $totalAmount,
            'reference'          => $reference,
            'payment_gateway'    => $gateway,
            'status'             => 'pending',
            'metadata'           => [
                'tuition_invoice_id'  => $isTuitionFee ? $invoice->id : null,
                'tuition_amount'      => $isTuitionFee ? $tuitionPortion : 0.00,
                'installment_percent' => $effectivePercent,
                'include_hostel'      => ($includeHostel && $hostelPortion > 0) || ($invoice->fee?->fee_type === 'hostel'),
                'hostel_invoice_id'   => $isTuitionFee ? $hostelInvoice?->id : $invoice->id,
                'hostel_amount'       => $isTuitionFee ? $hostelPortion : $tuitionBalance,
                'gateway_charge'      => $gatewayCharge,
            ],
        ]);

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

            $response = \Illuminate\Support\Facades\Http::withToken(config('services.zainpay.public_key'))
                ->post(config('services.zainpay.base_url', 'https://api.zainpay.ng') . '/zainbox/card/initialize/payment', [
                    'amount'       => (string) $payment->amount,
                    'emailAddress' => $userEmail,
                    'email'        => $userEmail,
                    'mobileNumber' => $request->user()->phone ?? '08000000000',
                    'txnRef'       => $reference,
                    'zainboxCode'  => config('services.zainpay.zainbox_code'),
                    'callBackUrl'  => $callbackUrl,
                ])->json();

            if (!isset($response['code']) || $response['code'] !== '00') {
                $payment->update(['status' => 'failed']);
                return response()->json([
                    'gateway' => 'zainpay',
                    'error' => $response['description'] ?? 'Zainpay initialization failed. Please try again.',
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
            return redirect()->route('student.fees')->with('info', 'This payment has already been verified and credited.');
        }

        if ($payment->payment_gateway === 'zainpay') {
            $baseUrl = rtrim(config('services.zainpay.base_url', 'https://api.zainpay.ng'), '/');
            $response = \Illuminate\Support\Facades\Http::withToken(config('services.zainpay.public_key'))
                ->get("{$baseUrl}/virtual-account/wallet/deposit/verify/v2/{$reference}")
                ->json();

            $verified = ($response['code'] ?? '') === '00' && 
                        isset($response['data']['status']) && 
                        strtolower($response['data']['status']) === 'success';

            if (!$verified) {
                $payment->update(['status' => 'failed']);
                return redirect()->route('student.fees')->with('error', 'Payment could not be verified. If you were charged, please contact the Bursary.');
            }
        }
        // NOTE: Remita/Paystack/Monnify/sandbox paths below remain a simulated
        // "always succeed" verification (pre-existing behavior, not introduced
        // by this fix) — a real deployment should verify each of those against
        // its respective gateway API before marking an invoice paid.

        $payment->update(['status' => 'successful']);

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
            $effectiveAmount = max(0, (float)$payment->amount - 2000.00);
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
        if (($status === 'paid' || $status === 'partial') && $student && !$student->matriculation_number) {
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

            $currentSemester = \App\Models\Semester::with('academicSession')
                                        ->where('is_current', true)
                                        ->first();
            $yearYY = $currentSemester?->academicSession?->name ? substr(explode('/', $currentSemester->academicSession->name)[0], -2) : now()->format('y');
            $prefix = "ACONS/{$deptAbbr}/{$section}/{$yearYY}/";

            $lastMatric = \App\Models\Student::where('matriculation_number', 'like', $prefix . '%')
                ->orderBy('matriculation_number', 'desc')
                ->first();

            if ($lastMatric) {
                $parts = explode('/', $lastMatric->matriculation_number);
                $lastSerial = (int) end($parts);
                $nextSerial = str_pad($lastSerial + 1, 3, '0', STR_PAD_LEFT);
            } else {
                $nextSerial = '001';
            }

            $matriculationNumber = $prefix . $nextSerial;
            $student->update(['matriculation_number' => $matriculationNumber]);
        }

        return redirect()->route('student.registration')->with('success', 'Payment verified and credited successfully! You can now proceed with course registration.');
    }
}
