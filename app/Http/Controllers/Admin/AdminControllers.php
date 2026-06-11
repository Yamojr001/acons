<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, Student, Teacher, Payment, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $schools = Tenant::withCount('students')->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'total_schools'  => Tenant::count(),
                'active_schools' => Tenant::where('is_active', true)->count(),
                'total_students' => Student::withoutTenantScope()->count(),
                'total_revenue'  => Payment::withoutTenantScope()->where('status','successful')->sum('amount'),
                'monthly_revenue' => Payment::withoutTenantScope()
                    ->where('status','successful')
                    ->where('created_at','>=', now()->subMonths(6))
                    ->selectRaw("DATE_FORMAT(created_at,'%b') as month, sum(amount) as amount")
                    ->groupBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"), DB::raw("DATE_FORMAT(created_at,'%b')"))
                    ->orderBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"))
                    ->get(),
                'school_growth' => Tenant::where('created_at','>=', now()->subMonths(6))
                    ->selectRaw("DATE_FORMAT(created_at,'%b') as month, count(*) as count")
                    ->groupBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"), DB::raw("DATE_FORMAT(created_at,'%b')"))
                    ->orderBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"))
                    ->get(),
            ],
            'schools'       => $schools->map(fn ($t) => array_merge($t->toArray(), [
                'revenue_this_month' => Payment::withoutTenantScope()->where('tenant_id',$t->id)->where('status','successful')
                    ->whereMonth('created_at', now()->month)->sum('amount'),
            ])),
            'expiring_soon' => Tenant::where('subscription_expires_at','<=', now()->addDays(30))
                ->where('subscription_expires_at','>=', now())->get(),
        ]);
    }
}

class SchoolController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Schools', [
            'schools' => Tenant::withCount('students','teachers')->latest()->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SuperAdmin/SchoolForm');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:150',
            'subdomain'        => 'required|string|max:50|unique:tenants|regex:/^[a-z0-9-]+$/',
            'admin_name'       => 'required|string|max:100',
            'admin_email'      => 'required|email|max:150',
            'primary_color'    => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
            'subscription_plan'=> 'required|in:starter,professional,enterprise',
            'charge_portal_fee'=> 'boolean',
            'portal_maintenance_fee' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            $tenant = Tenant::create([
                'name'                   => $request->name,
                'subdomain'              => strtolower($request->subdomain),
                'primary_color'          => $request->primary_color ?? '#6366f1',
                'secondary_color'        => '#10b981',
                'subscription_plan'      => $request->subscription_plan,
                'subscription_expires_at'=> now()->addYear(),
                'is_active'              => true,
                'charge_portal_fee'      => $request->boolean('charge_portal_fee'),
                'portal_maintenance_fee' => $request->portal_maintenance_fee,
            ]);

            app()->instance('currentTenant', $tenant);

            User::create([
                'tenant_id'  => $tenant->id,
                'name'       => $request->admin_name,
                'email'      => $request->admin_email,
                'password'   => Hash::make(Str::random(12)),
                'role'       => 'school_admin',
                'is_active'  => true,
            ]);
        });

        return redirect()->route('superadmin.schools.index')->with('success', 'School created successfully!');
    }

    public function edit(Tenant $school): Response
    {
        return Inertia::render('SuperAdmin/SchoolForm', ['school' => $school]);
    }

    public function update(Request $request, Tenant $school)
    {
        $request->validate([
            'name'              => 'required|string|max:150',
            'subscription_plan' => 'required|in:starter,professional,enterprise',
            'is_active'         => 'boolean',
        ]);
        $school->update($request->only('name','subscription_plan','is_active','subscription_expires_at','primary_color'));
        return redirect()->route('superadmin.schools.index')->with('success', 'School updated.');
    }

    public function destroy(Tenant $school)
    {
        $school->update(['is_active' => false]);
        return back()->with('success', 'School suspended.');
    }
}

class SubscriptionPlanController extends Controller
{
    public function index(): Response
    {
        $plans = [
            ['name' => 'Starter',      'slug' => 'starter',      'price' => 25000,  'schools' => Tenant::where('subscription_plan','starter')->count()],
            ['name' => 'Professional', 'slug' => 'professional', 'price' => 50000,  'schools' => Tenant::where('subscription_plan','professional')->count()],
            ['name' => 'Enterprise',   'slug' => 'enterprise',   'price' => 100000, 'schools' => Tenant::where('subscription_plan','enterprise')->count()],
        ];
        return Inertia::render('SuperAdmin/Plans', ['plans' => $plans]);
    }
}

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Analytics', [
            'revenue_by_plan' => Tenant::selectRaw('subscription_plan, count(*) as schools')
                ->groupBy('subscription_plan')->get(),
            'top_schools' => Tenant::withCount('students')
                ->orderByDesc('students_count')->limit(10)->get(),
            'monthly_signups' => Tenant::where('created_at','>=', now()->subYear())
                ->selectRaw("DATE_FORMAT(created_at,'%b %Y') as month, count(*) as count")
                ->groupBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"), DB::raw("DATE_FORMAT(created_at,'%b %Y')"))
                ->orderBy(DB::raw("DATE_FORMAT(created_at,'%Y-%m')"))
                ->get(),
        ]);
    }
}

class SystemController extends Controller
{
    public function health(): Response
    {
        return Inertia::render('SuperAdmin/SystemHealth', [
            'php_version'  => PHP_VERSION,
            'laravel'      => app()->version(),
            'db_status'    => $this->checkDb(),
            'queue_size'   => DB::table('jobs')->count(),
            'failed_jobs'  => DB::table('failed_jobs')->count(),
            'disk_usage'   => $this->diskUsage(),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
        ]);
    }

    private function checkDb(): string
    {
        try { DB::select('SELECT 1'); return 'ok'; } catch (\Exception) { return 'error'; }
    }

    private function diskUsage(): array
    {
        $total = disk_total_space('/');
        $free  = disk_free_space('/');
        return ['total' => $total, 'used' => $total - $free, 'percent' => round((($total - $free) / $total) * 100, 1)];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING CONTROLLER (in root namespace)
// ─────────────────────────────────────────────────────────────────────────────
namespace App\Http\Controllers;

use App\Models\{Student, Teacher, ClassRoom};
use Inertia\{Inertia, Response};

class LandingController extends Controller
{
    public function index(): Response
    {
        $tenant = app()->has('currentTenant') ? app('currentTenant') : null;
        if (! $tenant) return Inertia::render('Landing/Platform');

        return Inertia::render('Landing/Index', [
            'stats' => [
                'students' => Student::count(),
                'teachers' => Lecturer::count(),
                'classes'  => ClassRoom::count(),
            ],
        ]);
    }
}
