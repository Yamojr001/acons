<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, User, Student, Teacher, Payment, Fee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $schools = Tenant::withCount('students')
            ->when($request->search, fn ($q, $s) => $q->where('name','like',"%{$s}%"))
            ->when($request->plan,   fn ($q, $p) => $q->where('billing_type', $p))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Schools', [
            'schools' => $schools,
            'filters' => $request->only(['search','plan']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SuperAdmin/SchoolCreate');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:100',
            'subdomain'             => 'required|string|max:50|unique:tenants,subdomain|regex:/^[a-z0-9-]+$/',
            'admin_email'           => 'required|email',
            'admin_name'            => 'required|string|max:100',
            'billing_type'          => 'required|in:per_school,per_group,per_student',
            'billing_amount'        => 'required|numeric|min:0',
            'max_students'          => 'nullable|integer|min:1',
            'billing_payer'         => 'required|in:school,student',
            'primary_color'         => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        DB::transaction(function () use ($request) {
            $tenant = Tenant::create([
                'name'                   => $request->name,
                'subdomain'              => strtolower($request->subdomain),
                'primary_color'          => $request->primary_color ?? '#6366f1',
                'secondary_color'        => '#10b981',
                'billing_type'           => $request->billing_type,
                'billing_amount'         => $request->billing_amount,
                'max_students'           => $request->max_students,
                'billing_payer'          => $request->billing_payer,
                'subscription_expires_at'=> now()->addYear(),
                'is_active'              => true,
            ]);

            $faculty = \App\Models\Faculty::create([
                'tenant_id' => $tenant->id,
                'name'      => 'School of Nursing',
                'code'      => 'SON'
            ]);

            User::create([
                'tenant_id'  => $tenant->id,
                'name'       => $request->admin_name,
                'email'      => $request->admin_email,
                'password'   => Hash::make(Str::random(16)),
                'role'       => 'school_admin',
                'is_active'  => true,
            ]);
        });

        return redirect()->route('superadmin.schools.index')
            ->with('success', "School '{$request->name}' created.");
    }

    public function update(Request $request, Tenant $school)
    {
        $request->validate([
            'is_active'           => 'required|boolean',
            'billing_type'        => 'required|in:per_school,per_group,per_student',
            'billing_amount'      => 'required|numeric|min:0',
            'max_students'        => 'nullable|integer|min:1',
            'billing_payer'       => 'required|in:school,student',
            'subscription_expires_at' => 'nullable|date',
        ]);

        $school->update($request->only('is_active','billing_type','billing_amount','max_students','billing_payer','subscription_expires_at'));
        return back()->with('success', 'School updated.');
    }

    public function destroy(Tenant $school)
    {
        // Soft-delete by deactivating (prevent data loss)
        $school->update(['is_active' => false]);
        return redirect()->route('superadmin.schools.index')->with('success', 'School suspended.');
    }

    public function recordPortalPayment(Request $request, Tenant $school)
    {
        $request->validate([
            'session' => 'required|string|max:20',
            'term'    => 'required|in:1st Term,2nd Term,3rd Term',
            'amount'  => 'required|numeric|min:0',
        ]);

        $settings = $school->settings ?? [];
        $settings['last_portal_fee_paid_session'] = $request->session;
        $settings['last_portal_fee_paid_term']    = $request->term;
        
        $school->update(['settings' => $settings]);

        // Also record it as a system payment if we have a table for platform-level revenue (optional)
        
        return back()->with('success', "Portal fee for {$request->term} ({$request->session}) recorded for {$school->name}.");
    }
}
