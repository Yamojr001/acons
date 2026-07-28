<?php

namespace App\Http\Controllers\ExamOfficer;

use App\Http\Controllers\Controller;
use App\Models\{Grade, Course, CourseRegistration, AcademicSession};
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $currentSession = AcademicSession::where('is_current', true)->first();

        $stats = [
            'total_courses' => Course::count(),
            'pending_submission' => Grade::whereIn('approval_status', ['draft', 'submitted'])->count(),
            'awaiting_final_approval' => Grade::where('approval_status', 'hod_approved')->count(),
            'published_results' => Grade::where('approval_status', 'approved')->count(),
            'current_session' => $currentSession?->name ?? 'No active session',
        ];

        $recentSubmissions = Grade::with(['registration.student.user', 'registration.course'])
            ->whereIn('approval_status', ['submitted', 'hod_approved', 'approved'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($grade) => [
                'id' => $grade->id,
                'applicant_name' => $grade->registration?->student?->user?->name,
                'course' => $grade->registration?->course?->name ?? $grade->registration?->course?->code,
                'status' => $grade->approval_status,
                'created_at' => $grade->created_at,
            ]);

        return Inertia::render('University/AdminDashboard', [
            'role' => 'exam_officer',
            'stats' => $stats,
            'recent_applications' => $recentSubmissions,
        ]);
    }
}
