<?php

namespace App\Http\Controllers\Bursar;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $tenant = app('currentTenant');
        $expenses = Transaction::with('user')
            ->where('tenant_id', $tenant->id)
            ->where('type', 'expense')
            ->latest()
            ->paginate(20);

        return Inertia::render('Bursar/Expenses/Index', [
            'expenses' => $expenses
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'required|string|unique:transactions,reference',
            'breakdown' => 'nullable|array',
            'breakdown.*.item' => 'required|string|max:255',
            'breakdown.*.cost' => 'required|numeric|min:0',
        ]);

        Transaction::create([
            'tenant_id' => $tenant->id,
            'user_id' => auth()->id(),
            'type' => 'expense',
            'amount' => $request->amount,
            'status' => 'successful',
            'payment_method' => 'cash_or_bank',
            'reference' => $request->reference,
            'metadata' => [
                'title' => $request->title,
                'category' => $request->category,
                'breakdown' => $request->breakdown ?? []
            ]
        ]);

        return back()->with('success', 'Expense recorded successfully!');
    }
}
