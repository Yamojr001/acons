<?php

namespace App\Http\Controllers;

use App\Models\{Student, Lecturer, Department, AdmissionForm, InstitutionSetting};
use Illuminate\Support\Facades\Cache;
use Inertia\{Inertia, Response};

class LandingController extends Controller
{
    public function index(): Response
    {
        $institution = InstitutionSetting::current();

        $stats = Cache::remember('landing:stats:acons', 600, fn () => [
            'students'    => Student::count(),
            'lecturers'   => Lecturer::count(),
            'departments' => Department::count(),
        ]);

        return Inertia::render('Landing/Index', [
            'institution' => $institution ? $institution->toInertiaArray() : null,
            'tenant'      => $institution ? $institution->toInertiaArray() : null, // Backward compatibility
            'stats'          => $stats,
            'admission_form' => AdmissionForm::where('is_active', true)->first(),
        ]);
    }
}
