<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\{Inertia, Response};

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = Payment::with(['student.user','fee'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->from, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->to,   fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()->paginate(30)->withQueryString();

        $totals = [
            'successful' => Payment::where('status','successful')->sum('amount'),
            'pending'    => Payment::where('status','pending')->sum('amount'),
            'failed'     => Payment::where('status','failed')->count(),
        ];

        return Inertia::render('SchoolAdmin/Payments', [
            'payments' => $payments,
            'totals'   => $totals,
            'filters'  => $request->only('status','from','to'),
        ]);
    }

    public function show(Payment $payment): Response
    {
        $payment->load(['student.user','fee']);
        return Inertia::render('SchoolAdmin/PaymentDetail', ['payment' => $payment]);
    }
}
