<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, User, Student, Teacher, Payment, Fee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalSchools  = Tenant::count();
        $activeSchools = Tenant::where('is_active', true)->count();
        $totalStudents = Student::withoutGlobalScopes()->count();
        $totalRevenue  = Payment::withoutGlobalScopes()->where('status','successful')->sum('amount');

        $monthlyRevenue = Payment::withoutGlobalScopes()
            ->where('status','successful')
            ->where('created_at','>=',now()->subMonths(6))
            ->select(DB::raw("TO_CHAR(created_at,'Mon') as month"), DB::raw('SUM(amount) as amount'))
            ->groupBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"), DB::raw("TO_CHAR(created_at,'Mon')"))
            ->orderBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"))
            ->get();

        $schoolGrowth = Tenant::select(
                DB::raw("TO_CHAR(created_at,'Mon') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at','>=',now()->subMonths(8))
            ->groupBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"), DB::raw("TO_CHAR(created_at,'Mon')"))
            ->orderBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"))
            ->get();

        $schools = Tenant::withCount([
                'students as students_count',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => array_merge($t->toArray(), [
                'revenue_this_month' => Payment::withoutGlobalScopes()
                    ->where('tenant_id', $t->id)
                    ->where('status','successful')
                    ->whereMonth('created_at', now()->month)
                    ->sum('amount'),
            ]));

        $expiringSoon = Tenant::where('is_active', true)
            ->whereNotNull('subscription_expires_at')
            ->where('subscription_expires_at','<=', now()->addDays(30))
            ->orderBy('subscription_expires_at')
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'total_schools'   => $totalSchools,
                'active_schools'  => $activeSchools,
                'total_students'  => $totalStudents,
                'total_revenue'   => $totalRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'school_growth'   => $schoolGrowth,
            ],
            'schools'        => $schools,
            'expiring_soon'  => $expiringSoon,
        ]);
    }
}
