<?php

namespace App\Http\Controllers;

use App\Models\{Student, Lecturer, Department, AdmissionForm};
use Illuminate\Support\Facades\Cache;
use Inertia\{Inertia, Response};

class LandingController extends Controller
{
    public function index(): Response
    {
        $tenant = app()->has('currentTenant') ? app('currentTenant') : null;

        // Stats for social proof (cached per tenant, 10 min)
        $stats = ['students' => 0, 'lecturers' => 0, 'departments' => 0];

        if ($tenant) {
            $cacheKey = "landing:stats:{$tenant->id}";
            $stats = Cache::remember($cacheKey, 600, fn () => [
                'students' => Student::count(),
                'lecturers' => Lecturer::count(),
                'departments'  => Department::count(),
            ]);
        }

        return Inertia::render('Landing/Index', [
            'tenant' => $tenant ? [
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'primary_color' => $tenant->primary_color,
                'secondary_color' => $tenant->secondary_color,
                'logo_path' => $tenant->logo_path ? asset('storage/' . $tenant->logo_path) : null,
                'tagline' => $tenant->tagline,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'address' => $tenant->address,
            ] : null,
            'stats' => $stats,
            'admission_form' => $tenant ? AdmissionForm::where('is_active', true)->first() : null,
        ]);
    }
}
