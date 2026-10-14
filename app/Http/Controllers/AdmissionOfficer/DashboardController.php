<?php

namespace App\Http\Controllers\AdmissionOfficer;

use App\Http\Controllers\Controller;
use App\Models\{Applicant, Student};
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('University/AdminDashboard', [
            'role' => 'admission_officer',
            'stats' => [
                'total_applications' => Applicant::count(),
                'pending_applications' => Applicant::whereIn('status', ['pending', 'under_review'])->count(),
                'admitted_students' => Student::where('status', 'active')->count(),
            ],
            'recent_applications' => Applicant::latest()->limit(5)->get(),
        ]);
    }
}
