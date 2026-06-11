<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Student, Lecturer, Department, Payment, Fee, Course};
use Illuminate\Support\Facades\{DB, Cache, Auth};
use Inertia\{Inertia, Response};

class DashboardController extends Controller {
    public function index(): Response {
        $tenant = app('currentTenant');
        $role = Auth::user()->getRoleNames()->first();

        $stats = Cache::remember('admin:dashboard:stats:'.$tenant->id, 300, function () use ($tenant) {
            return [
                'total_students' => Student::count(),
                'active_students' => Student::where('status', 'active')->count(),
                'graduated_students' => Student::where('status', 'graduated')->count(),
                'total_lecturers' => Lecturer::count(),
                'total_departments' => Department::count(),
                'total_courses' => Course::count(),
                'revenue_this_month' => Payment::where('status', 'successful')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('amount'),
                'total_income' => Payment::where('status', 'successful')->sum('amount'),
                'total_expenses' => \App\Models\Transaction::where('type', 'expense')
                    ->where('status', 'successful')
                    ->sum('amount'),
                'departmental_fees' => Department::with(['fees' => function($q) {
                        $q->where('academic_session_id', function($sub) {
                            $sub->select('id')->from('academic_sessions')->where('is_current', true)->limit(1);
                        });
                    }])
                    ->get()
                    ->map(fn($d) => [
                        'name' => $d->name,
                        'code' => $d->code,
                        'total_fees' => $d->fees->sum('amount')
                    ])
            ];
        });

        $recentPayments = Payment::with('student.user')->latest()->limit(8)->get();
        
        $departmentalBreakdown = Department::select('departments.name', 'departments.code')
            ->leftJoin('fees', 'fees.department_id', '=', 'departments.id')
            ->leftJoin('student_invoices', 'student_invoices.fee_id', '=', 'fees.id')
            ->leftJoin('payments', 'payments.student_invoice_id', '=', 'student_invoices.id')
            ->where('payments.status', 'successful')
            ->selectRaw('SUM(payments.amount) as total_revenue')
            ->groupBy('departments.id', 'departments.name', 'departments.code')
            ->get();

        return Inertia::render('University/AdminDashboard', [
            'role' => $role,
            'stats' => $stats,
            'recent_payments' => $recentPayments,
            'departmental_breakdown' => $departmentalBreakdown
        ]);
    }
}
