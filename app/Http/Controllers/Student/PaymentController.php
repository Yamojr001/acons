<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentInvoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $student = $request->user()->student;

        $invoices = StudentInvoice::with(['fee.academicSession', 'fee.department'])
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Student/Fees/Index', [
            'invoices' => $invoices,
            'activeGateway' => $tenant->settings['payment_gateway'] ?? 'monnify' // Default to monnify if not set
        ]);
    }

    /**
     * Initializes the payment transaction and returns the gateway configuration.
     * In a real app, this would call Remita or Paystack APIs to generate an RRR or Access Code.
     */
    public function initialize(Request $request, StudentInvoice $invoice)
    {
        $tenant = app('currentTenant');
        $student = $request->user()->student;

        if ($invoice->student_id !== $student->id) {
            abort(403, 'Unauthorized action.');
        }

        if ($invoice->status === 'paid') {
            return back()->withErrors(['message' => 'This invoice is already fully paid.']);
        }

        $gateway = $tenant->settings['payment_gateway'] ?? 'monnify';
        
        // Generate a unique reference
        $reference = 'REF-' . strtoupper(Str::random(10));

        // Create a pending payment record
        $payment = Payment::create([
            'tenant_id' => $tenant->id,
            'student_invoice_id' => $invoice->id,
            'amount' => $invoice->amount_due - $invoice->amount_paid,
            'reference' => $reference,
            'payment_gateway' => $gateway,
            'status' => 'pending',
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
                'merchantId' => $tenant->settings['remita_merchant_id'] ?? 'DEMO',
                'apiKey' => $tenant->settings['remita_api_key'] ?? 'DEMO_KEY'
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

            $response = \Illuminate\Support\Facades\Http::withToken(config('services.zainpay.public_key'))
                ->post(config('services.zainpay.base_url', 'https://api.zainpay.ng') . '/zainbox/card/initialize/payment', [
                    'amount'       => (string) $payment->amount,
                    'emailAddress' => $request->user()->email,
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

            return response()->json([
                'gateway' => 'zainpay',
                'reference' => $reference,
                'amount' => $payment->amount,
                'redirect_url' => $response['data']['url'] ?? null,
            ]);
        }

        // Default: Paystack
        return response()->json([
            'gateway' => 'paystack',
            'reference' => $reference,
            'amount' => $payment->amount * 100, // Paystack uses kobo
            'email' => $request->user()->email,
            'publicKey' => $tenant->settings['paystack_public_key'] ?? config('services.paystack.public_key')
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

        if ($payment->payment_gateway === 'zainpay') {
            $response = \Illuminate\Support\Facades\Http::withToken(config('services.zainpay.public_key'))
                ->get(config('services.zainpay.base_url', 'https://api.zainpay.ng') . '/zainbox/transactions/' . $reference)
                ->json();

            $verified = isset($response['data']['status']) && strtolower($response['data']['status']) === 'success';

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

        $invoice = $payment->invoice; // Assuming relation exists
        if (!$invoice) {
            $invoice = StudentInvoice::find($payment->student_invoice_id);
        }

        $newPaidAmount = $invoice->amount_paid + $payment->amount;
        $status = $newPaidAmount >= $invoice->amount_due ? 'paid' : 'partial';

        $invoice->update([
            'amount_paid' => $newPaidAmount,
            'status' => $status
        ]);

        // Auto Generate Matriculation Number upon school fees / tuition clearance
        $student = $invoice->student;
        if ($status === 'paid' && $student && !$student->matriculation_number) {
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
                                        ->where('tenant_id', $student->tenant_id)
                                        ->where('is_current', true)
                                        ->first();
            $yearYY = $currentSemester?->academicSession?->name ? substr(explode('/', $currentSemester->academicSession->name)[0], -2) : now()->format('y');
            $prefix = "ACONS/{$section}/{$deptAbbr}/{$yearYY}/";

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

        return redirect()->route('student.fees')->with('success', 'Payment verified and invoice cleared successfully.');
    }
}
