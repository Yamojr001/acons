<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement, Student, Guardian};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class FeeController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(): Response
    {
        $guardian = Auth::user()->guardian;
        $children = $guardian ? $guardian->students()->pluck('students.id') : collect();

        $fees = Fee::whereIn('student_id', $children)
            ->with(['student.user'])
            ->orderBy('due_date')
            ->paginate(25);

        $summary = [
            'total_owed'    => Fee::whereIn('student_id', $children)->whereIn('status', ['pending','partial','overdue'])->sum('amount'),
            'total_paid'    => Fee::whereIn('student_id', $children)->where('status', 'paid')->sum('amount'),
            'total_overdue' => Fee::whereIn('student_id', $children)->where('status', 'overdue')->sum('amount'),
        ];

        $gateways = array_values(array_filter([
            config('services.stripe.secret')       ? 'stripe'   : null,
            config('services.paystack.secret_key') ? 'paystack' : null,
            config('services.monnify.api_key')     ? 'monnify'  : null,
            config('services.zainpay.public_key')  ? 'zainpay'  : null,
            app()->environment('local')            ? 'sandbox'  : null,
        ]));

        return Inertia::render('Parent/Fees', [
            'fees'               => $fees,
            'summary'            => $summary,
            'available_gateways' => $gateways,
        ]);
    }

    public function checkout(Fee $fee): Response
    {
        $guardian = Auth::user()->guardian;
        $owns     = $guardian && $guardian->students()->where('students.id', $fee->student_id)->exists();
        abort_unless($owns, 403, 'Access denied.');
        abort_if($fee->status === 'paid', 422, 'Fee already paid.');

        $gateways = array_values(array_filter([
            config('services.stripe.secret')       ? 'stripe'   : null,
            config('services.paystack.secret_key') ? 'paystack' : null,
            config('services.monnify.api_key')     ? 'monnify'  : null,
            config('services.zainpay.public_key')  ? 'zainpay'  : null,
            app()->environment('local')            ? 'sandbox'  : null,
        ]));

        return Inertia::render('Parent/Checkout', [
            'fee'                => $fee->load('student.user'),
            'available_gateways' => $gateways,
        ]);
    }

    public function pay(Request $request, Fee $fee)
    {
        $request->validate(['gateway' => 'required|in:stripe,paystack,monnify,zainpay,sandbox']);

        $guardian = Auth::user()->guardian;
        $owns     = $guardian && $guardian->students()->where('students.id', $fee->student_id)->exists();
        abort_unless($owns, 403, 'Access denied.');
        abort_if($fee->status === 'paid', 422, 'Fee already paid.');

        $fee->load('student.user');
        $callbackUrl = route('parent.fees.callback');

        try {
            $result = $this->paymentService->initiate($fee, $request->gateway, $callbackUrl);

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
            return back()->withErrors(['payment' => $e->getMessage()]);
        }
    }

    public function callback(Request $request)
    {
        $gateway   = $request->input('gateway');
        $reference = $request->input('ref') ?? $request->input('reference');

        if ($reference) {
            $payment  = Payment::where('reference', $reference)->first();
            $verified = $payment && $this->paymentService->verify($gateway, $reference);

            if ($verified) {
                $payment->update(['status' => 'successful']);
                $payment->fee->update(['status' => 'paid']);
                return redirect()->route('parent.fees')->with('success', 'Payment successful!');
            }
            $payment?->update(['status' => 'failed']);
        }

        return redirect()->route('parent.fees')->with('error', 'Payment verification failed. Please contact support.');
    }
}
