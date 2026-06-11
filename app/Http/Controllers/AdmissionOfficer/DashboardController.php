<?php

namespace App\Http\Controllers\AdmissionOfficer;

use App\Http\Controllers\Controller;
use App\Models\{AdmissionApplication, Student};
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('University/AdminDashboard', [
            'role' => 'admission_officer',
            'stats' => [
                'total_applications' => AdmissionApplication::count(),
                'pending_applications' => AdmissionApplication::where('status', 'pending')->count(),
                'admitted_students' => Student::where('status', 'active')->count(),
            ],
            'recent_applications' => AdmissionApplication::latest()->limit(5)->get(),
        ]);
    }
}
