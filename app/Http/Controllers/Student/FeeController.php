<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB};
use Inertia\{Inertia, Response};

class FeeController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(): Response
    {
        $student = Auth::user()->student;
        $tenant  = app('currentTenant');

        $fees = Fee::where('student_id', $student->id)
            ->orderBy('due_date')
            ->paginate(20);

        $summary = [
            'total_owed'    => Fee::where('student_id', $student->id)->whereIn('status', ['pending','partial','overdue'])->sum('amount'),
            'total_paid'    => Fee::where('student_id', $student->id)->where('status', 'paid')->sum('amount'),
            'total_overdue' => Fee::where('student_id', $student->id)->where('status', 'overdue')->sum('amount'),
        ];

        $gateways = array_values(array_filter([
            config('services.stripe.secret')       ? 'stripe'   : null,
            config('services.paystack.secret_key') ? 'paystack' : null,
            config('services.monnify.api_key')     ? 'monnify'  : null,
            config('services.zainpay.public_key')  ? 'zainpay'  : null,
            app()->environment('local')            ? 'sandbox'  : null,
        ]));

        return Inertia::render('Student/Fees', [
            'fees'               => $fees,
            'summary'            => $summary,
            'available_gateways' => $gateways,
        ]);
    }

    public function checkout(Fee $fee): Response
    {
        $student = Auth::user()->student;
        abort_if($fee->student_id !== $student->id, 403, 'Access denied.');
        abort_if($fee->status === 'paid', 422, 'This fee is already paid.');

        $gateways = array_values(array_filter([
            config('services.stripe.secret')       ? 'stripe'   : null,
            config('services.paystack.secret_key') ? 'paystack' : null,
            config('services.monnify.api_key')     ? 'monnify'  : null,
            config('services.zainpay.public_key')  ? 'zainpay'  : null,
            app()->environment('local')            ? 'sandbox'  : null,
        ]));

        return Inertia::render('Student/Checkout', [
            'fee'                => $fee->load('student.user'),
            'available_gateways' => $gateways,
        ]);
    }

    public function pay(Request $request, Fee $fee)
    {
        $request->validate(['gateway' => 'required|in:stripe,paystack,monnify,zainpay,sandbox']);

        $student = Auth::user()->student;
        abort_if($fee->student_id !== $student->id, 403, 'Access denied.');
        abort_if($fee->status === 'paid', 422, 'This fee is already paid.');

        $fee->load('student.user');
        $tenant      = app('currentTenant');
        $callbackUrl = route('student.fees.callback');

        try {
            $result = $this->paymentService->initiate($fee, $request->gateway, $callbackUrl);

            // Store pending payment record
            Payment::create([
                'tenant_id'      => $fee->tenant_id,
                'fee_id'         => $fee->id,
                'student_id'     => $fee->student_id,
                'amount'         => $fee->amount,
                'reference'      => $result['reference'],
                'payment_method' => $request->gateway,
                'status'         => 'pending',
                'metadata'       => ['redirect_url' => $result['redirect_url']],
            ]);

            return Inertia::location($result['redirect_url']);
        } catch (\Exception $e) {
            return back()->withErrors(['payment' => 'Payment could not be initiated: ' . $e->getMessage()]);
        }
    }

    public function callback(Request $request)
    {
        $gateway   = $request->input('gateway');
        $reference = $request->input('ref') ?? $request->input('reference');

        if (!$reference) {
            return redirect()->route('student.fees')->with('error', 'Invalid payment callback.');
        }

        $payment = Payment::where('reference', $reference)->first();
        if (!$payment) {
            return redirect()->route('student.fees')->with('error', 'Payment record not found.');
        }

        $verified = $this->paymentService->verify($gateway, $reference);

        if ($verified) {
            $payment->update(['status' => 'successful']);
            $payment->fee->update(['status' => 'paid']);
            return redirect()->route('student.fees')->with('success', 'Payment successful! Receipt sent to your email.');
        }

        $payment->update(['status' => 'failed']);
        return redirect()->route('student.fees')->with('error', 'Payment could not be verified. Please try again or contact support.');
    }
}
