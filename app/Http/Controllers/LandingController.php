<?php

namespace App\Http\Controllers;

use App\Models\{Student, Lecturer, Department, AdmissionForm, InstitutionSetting, User};
use Illuminate\Support\Facades\Cache;
use Inertia\{Inertia, Response};

class LandingController extends Controller
{
    public function index(): Response
    {
        $institution = InstitutionSetting::current();
        $customStats = $institution?->settings['landing_stats'] ?? null;

        // If custom stats are configured in settings, use them;
        // otherwise calculate real database metrics without dummy hardcoded values.
        $stats = [
            'students'    => $customStats['students'] ?? (Student::where('status', 'active')->count() ?: Student::count()),
            'lecturers'   => $customStats['lecturers'] ?? (Lecturer::count() ?: User::role('lecturer')->count()),
            'departments' => $customStats['departments'] ?? Department::count(),
        ];

        return Inertia::render('Landing/Index', [
            'institution'    => $institution ? $institution->toInertiaArray() : null,
            'tenant'         => $institution ? $institution->toInertiaArray() : null, // Backward compatibility
            'stats'          => $stats,
            'admission_form' => AdmissionForm::where('is_active', true)->first(),
        ]);
    }
}
