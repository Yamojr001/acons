<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\{Inertia, Response};

class TransactionController extends Controller
{
    public function index(): Response
    {
        $transactions = Transaction::with(['user', 'tenant'])
            ->orderByDesc('created_at')
            ->paginate(30);

        return Inertia::render('SuperAdmin/Transactions', [
            'transactions' => $transactions,
        ]);
    }

    public function show(Transaction $transaction): Response
    {
        return Inertia::render('SuperAdmin/TransactionDetail', [
            'transaction' => $transaction->load(['user', 'tenant', 'payable']),
        ]);
    }
}
