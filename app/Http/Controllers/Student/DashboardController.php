<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{StudentInvoice, Grade, CourseRegistration, Announcement, Semester};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user    = Auth::user();
        $student = $user->student->load(['user', 'department', 'program']);
        $tenant  = app('currentTenant');

        $currentSemester = Semester::where('tenant_id', $tenant->id)
            ->where('is_current', true)
            ->first();

        // 1. Calculate CGPA (Mocking if no records exist, or calculate if they do)
        $records = $student->academicRecords;

        $programName = $student->program?->name ?? '';
        $isBasicNursing = (
            stripos($programName, 'Basic') !== false ||
            stripos($programName, 'General') !== false ||
            stripos($programName, 'RN') !== false ||
            stripos($programName, 'RM') !== false ||
            stripos($student->current_level, 'Basic') !== false
        );

        $cgpa = $isBasicNursing ? 'N/A' : ($records->count() > 0 ? round($records->avg('cgpa'), 2) : 0.00);
        $creditsEarned = $records->sum('total_credit_units_earned');

        // 2. Recent Results (from approved grades)
        $recentResults = Grade::whereHas('registration', function($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->where('approval_status', 'approved')
            ->with('registration.course')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($g) => [
                'course'       => $g->registration->course->course_code . ' - ' . $g->registration->course->name,
                'score'        => (float) $g->total_score,
                'grade_letter' => $g->grade_letter,
                'date'         => $g->updated_at->toDateString(),
            ]);

        // 3. Current Semester Registrations (Status Check)
        $registrations = CourseRegistration::where('student_id', $student->id)
            ->where('semester_id', $currentSemester?->id)
            ->with('course')
            ->get();
        
        $creditsRegistered = $registrations->sum(fn($r) => $r->course->credit_units);
        $registrationStatus = $registrations->count() > 0 
            ? ($registrations->every(fn($r) => $r->status === 'approved') ? 'Approved' : 'Pending')
            : 'Not Registered';

        // 4. Financial Status
        $outstandingFees = StudentInvoice::where('student_id', $student->id)
            ->where('status', '!=', 'paid')
            ->with('fee')
            ->get()
            ->map(fn ($inv) => [
                'name' => $inv->fee->name,
                'amount' => (float) ($inv->amount_due - $inv->amount_paid),
                'status' => $inv->status
            ]);

        // 5. Latest announcements
        $announcements = Announcement::whereIn('audience', ['all', 'students'])
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'published_at']);

        return Inertia::render('Student/Dashboard', [
            'student'          => $student,
            'cgpa'             => $cgpa,
            'creditsEarned'    => $creditsEarned,
            'creditsRegistered'=> $creditsRegistered,
            'registrationStatus'=> $registrationStatus,
            'recentResults'    => $recentResults,
            'outstandingFees'  => $outstandingFees,
            'announcements'    => $announcements,
            'academicStatus'   => $student->academic_status,
            'reseatCourseIds'  => $student->reseat_course_ids,
        ]);
    }
}
