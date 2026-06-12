<?php

namespace App\Http\Controllers\Provost;

use App\Http\Controllers\Controller;
use App\Models\{
    Student, Lecturer, Department, Course, Grade,
    Semester, CourseRegistration, Faculty, AcademicSession,
    Payment, Announcement
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Cache, Auth};
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tenant = app('currentTenant');

        $stats = Cache::remember('provost:dashboard:stats:' . $tenant->id, 300, function () {
            $currentSemester = Semester::where('is_current', true)->first();

            $pendingRelease = 0;
            $releasedThisSemester = 0;
            $rejectedResults = 0;

            if ($currentSemester) {
                $registrationIds = CourseRegistration::where('semester_id', $currentSemester->id)->pluck('id');
                $pendingRelease    = Grade::whereIn('course_registration_id', $registrationIds)
                    ->where('approval_status', 'hod_approved')->count();
                $releasedThisSemester = Grade::whereIn('course_registration_id', $registrationIds)
                    ->where('approval_status', 'approved')->count();
                $rejectedResults = Grade::whereIn('course_registration_id', $registrationIds)
                    ->where('approval_status', 'draft')
                    ->whereNotNull('rejection_reason')
                    ->where('rejection_reason', 'like', 'Provost Review Required:%')
                    ->count();
            }

            return [
                'total_students'         => Student::count(),
                'active_students'        => Student::where('status', 'active')->count(),
                'total_lecturers'        => Lecturer::count(),
                'total_departments'      => Department::count(),
                'total_courses'          => Course::count(),
                'pending_release'        => $pendingRelease,
                'released_this_semester' => $releasedThisSemester,
                'rejected_results'       => $rejectedResults,
                'revenue_this_month'     => Payment::where('status', 'successful')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('amount'),
                'total_income'           => Payment::where('status', 'successful')->sum('amount'),
            ];
        });

        $currentSemester = Semester::where('is_current', true)->with('academicSession')->first();

        // Courses awaiting provost release (HOD-approved, grouped by department)
        $pendingCourses = collect();
        if ($currentSemester) {
            $pendingCourses = Course::with(['department', 'lecturer.user'])
                ->whereHas('registrations', function ($q) use ($currentSemester) {
                    $q->where('semester_id', $currentSemester->id)
                      ->whereHas('grade', fn($g) => $g->where('approval_status', 'hod_approved'));
                })
                ->get()
                ->map(function ($course) use ($currentSemester) {
                    $registrationIds = $course->registrations()
                        ->where('semester_id', $currentSemester->id)
                        ->pluck('id');

                    $gradeStats = Grade::whereIn('course_registration_id', $registrationIds)
                        ->selectRaw("
                            COUNT(*) as total,
                            COUNT(CASE WHEN approval_status = 'hod_approved' THEN 1 END) as pending,
                            ROUND(AVG(CASE WHEN total_score IS NOT NULL THEN total_score END)::numeric, 1) as avg_score
                        ")
                        ->first();

                    return [
                        'id'             => $course->id,
                        'code'           => $course->code,
                        'title'          => $course->title,
                        'credit_units'   => $course->credit_units,
                        'department'     => $course->department?->name,
                        'lecturer'       => $course->lecturer?->user?->name ?? 'Unassigned',
                        'total_students' => $gradeStats->total ?? 0,
                        'pending_grades' => $gradeStats->pending ?? 0,
                        'avg_score'      => $gradeStats->avg_score ?? 0,
                    ];
                });
        }

        // Recently released results
        $recentReleases = Grade::where('approval_status', 'approved')
            ->with(['courseRegistration.course.department', 'courseRegistration.student.user'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(fn($g) => [
                'student'   => $g->courseRegistration?->student?->user?->name,
                'matric'    => $g->courseRegistration?->student?->matriculation_number,
                'course'    => $g->courseRegistration?->course?->code,
                'score'     => $g->total_score,
                'grade'     => $g->grade_letter,
                'released'  => $g->updated_at?->diffForHumans(),
            ]);

        // Announcements
        $announcements = Announcement::latest()->limit(5)->get();

        // Academic sessions
        $academicSessions = AcademicSession::latest()->get();
        $semesters        = Semester::with('academicSession')->latest()->get();

        return Inertia::render('Provost/Dashboard', [
            'stats'            => $stats,
            'current_semester' => $currentSemester,
            'pending_courses'  => $pendingCourses->values(),
            'recent_releases'  => $recentReleases,
            'announcements'    => $announcements,
            'academic_sessions'=> $academicSessions,
            'semesters'        => $semesters,
        ]);
    }

    public function results()
    {
        $currentSemester = Semester::where('is_current', true)->with('academicSession')->first();
        $semesters       = Semester::with('academicSession')->latest()->get();

        $courses = Course::with(['department', 'lecturer.user'])
            ->when($currentSemester, function ($q) use ($currentSemester) {
                $q->whereHas('registrations', fn($r) => $r->where('semester_id', $currentSemester->id));
            })
            ->get()
            ->map(function ($course) use ($currentSemester) {
                if (!$currentSemester) {
                    return null;
                }

                $registrationIds = $course->registrations()
                    ->where('semester_id', $currentSemester->id)
                    ->pluck('id');

                $counts = Grade::whereIn('course_registration_id', $registrationIds)
                    ->selectRaw("
                        COUNT(*) as total,
                        COUNT(CASE WHEN approval_status = 'draft' THEN 1 END) as draft,
                        COUNT(CASE WHEN approval_status = 'submitted' THEN 1 END) as submitted,
                        COUNT(CASE WHEN approval_status = 'hod_approved' THEN 1 END) as hod_approved,
                        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
                        ROUND(AVG(CASE WHEN total_score IS NOT NULL THEN total_score END)::numeric, 1) as avg_score
                    ")
                    ->first();

                return [
                    'id'           => $course->id,
                    'code'         => $course->code,
                    'title'        => $course->title,
                    'credit_units' => $course->credit_units,
                    'department'   => $course->department?->name,
                    'lecturer'     => $course->lecturer?->user?->name ?? 'Unassigned',
                    'counts'       => [
                        'total'       => $counts->total ?? 0,
                        'draft'       => $counts->draft ?? 0,
                        'submitted'   => $counts->submitted ?? 0,
                        'hod_approved'=> $counts->hod_approved ?? 0,
                        'approved'    => $counts->approved ?? 0,
                        'avg_score'   => $counts->avg_score ?? 0,
                    ],
                ];
            })
            ->filter()
            ->values();

        $summary = [
            'total_courses'        => $courses->count(),
            'fully_released'       => $courses->filter(fn($c) => $c['counts']['hod_approved'] === 0 && $c['counts']['approved'] > 0)->count(),
            'awaiting_release'     => $courses->filter(fn($c) => $c['counts']['hod_approved'] > 0)->count(),
            'awaiting_hod'         => $courses->filter(fn($c) => $c['counts']['submitted'] > 0)->count(),
            'in_draft'             => $courses->filter(fn($c) => $c['counts']['draft'] > 0)->count(),
        ];

        return Inertia::render('Provost/Results', [
            'courses'          => $courses,
            'current_semester' => $currentSemester,
            'semesters'        => $semesters,
            'summary'          => $summary,
        ]);
    }

    public function releaseAll(Request $request)
    {
        $currentSemester = Semester::where('is_current', true)->first();

        if (!$currentSemester) {
            return back()->with('error', 'No active semester found. Set an active semester first.');
        }

        $registrationIds = CourseRegistration::where('semester_id', $currentSemester->id)->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', 'No course registrations found for the active semester.');
        }

        $count = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($count === 0) {
            return back()->with('error', 'No results are pending release. All HOD-approved results have already been released, or none have been approved by HODs yet.');
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->update(['approval_status' => 'approved', 'rejection_reason' => null]);

        // Recalculate academic standing for all affected students
        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $studentId);
            $student = \App\Models\Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . app('currentTenant')->id);

        return back()->with('success', "Successfully released {$count} result records to students for the current semester.");
    }

    public function releaseCourse(Request $request, Course $course)
    {
        $currentSemester = Semester::where('is_current', true)->first();

        if (!$currentSemester) {
            return back()->with('error', 'No active semester found.');
        }

        $registrationIds = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester->id)
            ->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', 'No registrations found for this course in the active semester.');
        }

        $count = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($count === 0) {
            return back()->with('error', 'No HOD-approved results pending release for this course.');
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->update(['approval_status' => 'approved', 'rejection_reason' => null]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $studentId);
            $student = \App\Models\Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . app('currentTenant')->id);

        return back()->with('success', "Results for {$course->code} — {$course->title} have been released to students.");
    }

    public function rejectCourse(Request $request, Course $course)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $currentSemester = Semester::where('is_current', true)->first();

        if (!$currentSemester) {
            return back()->with('error', 'No active semester found.');
        }

        $registrationIds = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester->id)
            ->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', 'No registrations found for this course in the active semester.');
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->whereIn('approval_status', ['hod_approved', 'submitted'])
            ->update([
                'approval_status'  => 'draft',
                'rejection_reason' => 'Provost Review Required: ' . $request->reason,
            ]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $studentId);
        }

        Cache::forget('provost:dashboard:stats:' . app('currentTenant')->id);

        return back()->with('success', "Results for {$course->code} sent back to the department for revision.");
    }

    public function announcements()
    {
        $announcements = Announcement::with('author')->latest()->paginate(20);
        $roles         = \Spatie\Permission\Models\Role::pluck('name')->toArray();

        return Inertia::render('Provost/Announcements', [
            'announcements' => $announcements,
            'roles'         => $roles,
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'body'     => 'required|string',
            'audience' => 'required|string',
        ]);

        Announcement::create([
            'tenant_id'    => app('currentTenant')->id,
            'created_by'   => auth()->id(),
            'title'        => $validated['title'],
            'body'         => $validated['body'],
            'audience'     => $validated['audience'],
            'send_email'   => $request->boolean('send_email'),
            'send_sms'     => $request->boolean('send_sms'),
            'published_at' => now(),
        ]);

        return back()->with('success', 'Announcement published to all school portals.');
    }
}
