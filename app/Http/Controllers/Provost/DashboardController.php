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
    private function getTenantId(): int
    {
        if (app()->bound('currentTenant')) {
            return app('currentTenant')->id;
        }
        return \App\Models\Tenant::first()?->id ?? 1;
    }

    public function index()
    {
        $tenantId = $this->getTenantId();

        $stats = Cache::remember('provost:dashboard:stats:' . $tenantId, 300, function () {
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
                            COUNT(CASE WHEN approval_status = 'hod_approved' THEN 1 END) as pending,
                            ROUND(AVG(CASE WHEN total_score IS NOT NULL THEN total_score END), 1) as avg_score
                        ")
                        ->first();

                    return [
                        'id'             => $course->id,
                        'code'           => $course->code,
                        'title'          => $course->title,
                        'credit_units'   => $course->credit_units,
                        'department'     => $course->department?->name,
                        'lecturer'       => $course->lecturer?->user?->name ?? 'Unassigned',
                        'total_students' => $registrationIds->count(),
                        'pending_grades' => $gradeStats->pending ?? 0,
                        'avg_score'      => $gradeStats->avg_score ?? 0,
                    ];
                });
        }

        // Recently released results
        $recentReleases = Grade::where('approval_status', 'approved')
            ->with(['registration.course.department', 'registration.student.user'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(fn($g) => [
                'student'   => $g->registration?->student?->user?->name,
                'matric'    => $g->registration?->student?->matriculation_number,
                'course'    => $g->registration?->course?->code,
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

    public function results(Request $request)
    {
        $currentSemester = Semester::where('is_current', true)->with('academicSession')->first();
        $semesters       = Semester::with('academicSession')->orderByDesc('id')->get();
        $departments     = Department::orderBy('name')->get(['id', 'name', 'code']);

        // Determine selected semester: query param, or active semester, or first
        $selectedSemesterId = $request->query('semester_id');
        $selectedSemester = null;
        if ($selectedSemesterId) {
            $selectedSemester = Semester::with('academicSession')->find($selectedSemesterId);
        }
        if (!$selectedSemester) {
            $selectedSemester = $currentSemester ?? $semesters->first();
        }

        $selectedDepartmentId = $request->query('department_id');

        $coursesQuery = Course::with(['department', 'lecturer.user'])
            ->when($selectedDepartmentId, function ($q) use ($selectedDepartmentId) {
                $q->where('department_id', $selectedDepartmentId);
            });

        if ($selectedSemester) {
            $coursesQuery->whereHas('registrations', fn($r) => $r->where('semester_id', $selectedSemester->id));
        }

        $courses = $coursesQuery->get()->map(function ($course) use ($selectedSemester) {
            if (!$selectedSemester) {
                return null;
            }

            $registrationIds = $course->registrations()
                ->where('semester_id', $selectedSemester->id)
                ->pluck('id');

            $counts = Grade::whereIn('course_registration_id', $registrationIds)
                ->selectRaw("
                    COUNT(CASE WHEN approval_status = 'draft' THEN 1 END) as draft,
                    COUNT(CASE WHEN approval_status = 'submitted' THEN 1 END) as submitted,
                    COUNT(CASE WHEN approval_status = 'hod_approved' THEN 1 END) as hod_approved,
                    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
                    ROUND(AVG(CASE WHEN total_score IS NOT NULL THEN total_score END), 1) as avg_score
                ")
                ->first();

            return [
                'id'            => $course->id,
                'code'          => $course->code,
                'title'         => $course->name ?? $course->title,
                'name'          => $course->name ?? $course->title,
                'credit_units'  => $course->credit_units,
                'department_id' => $course->department_id,
                'department'    => $course->department?->name ?? 'General',
                'lecturer'      => $course->lecturer?->user?->name ?? 'Unassigned',
                'counts'        => [
                    'total'        => $registrationIds->count(),
                    'draft'        => $counts->draft ?? 0,
                    'submitted'    => $counts->submitted ?? 0,
                    'hod_approved' => $counts->hod_approved ?? 0,
                    'approved'     => $counts->approved ?? 0,
                    'avg_score'    => $counts->avg_score ?? 0,
                ],
            ];
        })
        ->filter()
        ->values();

        $totalPendingGrades  = $courses->sum(fn($c) => $c['counts']['hod_approved']);
        $totalReleasedGrades = $courses->sum(fn($c) => $c['counts']['approved']);
        $totalDraftGrades    = $courses->sum(fn($c) => $c['counts']['draft'] + $c['counts']['submitted']);

        $summary = [
            'total_courses'         => $courses->count(),
            'fully_released'        => $courses->filter(fn($c) => $c['counts']['hod_approved'] === 0 && $c['counts']['approved'] > 0)->count(),
            'awaiting_release'      => $courses->filter(fn($c) => $c['counts']['hod_approved'] > 0)->count(),
            'awaiting_hod'          => $courses->filter(fn($c) => $c['counts']['submitted'] > 0)->count(),
            'in_draft'              => $courses->filter(fn($c) => $c['counts']['draft'] > 0)->count(),
            'pending_grades_count'  => $totalPendingGrades,
            'released_grades_count' => $totalReleasedGrades,
            'draft_grades_count'    => $totalDraftGrades,
        ];

        return Inertia::render('Provost/Results', [
            'courses'                => $courses,
            'current_semester'       => $selectedSemester,
            'active_semester'        => $currentSemester,
            'semesters'              => $semesters,
            'departments'            => $departments,
            'selected_department_id' => $selectedDepartmentId ? (int)$selectedDepartmentId : null,
            'selected_semester_id'   => $selectedSemester?->id,
            'summary'                => $summary,
        ]);
    }

    public function releaseAll(Request $request)
    {
        $semester = $request->filled('semester_id')
            ? Semester::find($request->semester_id)
            : Semester::where('is_current', true)->first();

        if (!$semester) {
            return back()->with('error', 'No active semester found. Set an active semester first.');
        }

        $registrationsQuery = CourseRegistration::where('semester_id', $semester->id);

        if ($request->filled('department_id')) {
            $departmentId = $request->department_id;
            $registrationsQuery->where(function ($q) use ($departmentId) {
                $q->whereHas('course', fn($c) => $c->where('department_id', $departmentId))
                  ->orWhereHas('student', fn($s) => $s->where('department_id', $departmentId));
            });
        }

        $registrationIds = $registrationsQuery->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', 'No course registrations found for the selected scope.');
        }

        $count = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($count === 0) {
            return back()->with('error', 'No results are pending release for this selection. All HOD-approved results have already been released, or none have been approved yet.');
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->update(['approval_status' => 'approved', 'rejection_reason' => null]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            Cache::forget('student_results_' . $studentId);
            $student = Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . $this->getTenantId());

        return back()->with('success', "Successfully released {$count} student result records to portal for {$semester->name}.");
    }

    public function releaseDepartment(Request $request)
    {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'semester_id'   => 'nullable|exists:semesters,id',
        ]);

        $department = Department::findOrFail($request->department_id);

        $semester = null;
        if ($request->filled('semester_id')) {
            $semester = Semester::with('academicSession')->find($request->semester_id);
        }
        if (!$semester) {
            $semester = Semester::where('is_current', true)->with('academicSession')->first();
        }

        if (!$semester) {
            return back()->with('error', 'No active semester or valid session found.');
        }

        $registrationIds = CourseRegistration::where('semester_id', $semester->id)
            ->where(function ($q) use ($department) {
                $q->whereHas('course', fn($c) => $c->where('department_id', $department->id))
                  ->orWhereHas('student', fn($s) => $s->where('department_id', $department->id));
            })
            ->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', "No course registrations found for {$department->name} in {$semester->name}.");
        }

        $pendingCount = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($pendingCount === 0) {
            $alreadyReleased = Grade::whereIn('course_registration_id', $registrationIds)
                ->where('approval_status', 'approved')
                ->count();

            if ($alreadyReleased > 0) {
                return back()->with('info', "All {$alreadyReleased} results for {$department->name} ({$semester->name}) have already been released to students.");
            }

            return back()->with('error', "No HOD-approved results are awaiting release for {$department->name} in {$semester->name}.");
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->update([
                'approval_status'  => 'approved',
                'rejection_reason' => null,
            ]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            Cache::forget('student_results_' . $studentId);
            $student = Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . $this->getTenantId());

        $sessionLabel = $semester->academicSession?->name
            ? "{$semester->academicSession->name} - {$semester->name}"
            : $semester->name;

        return back()->with('success', "Official Provost Release: {$pendingCount} student results for {$department->name} ({$sessionLabel}) have been published and are now visible to students.");
    }

    public function blockDepartment(Request $request)
    {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'semester_id'   => 'nullable|exists:semesters,id',
            'reason'        => 'nullable|string|max:500',
        ]);

        $department = Department::findOrFail($request->department_id);
        $semester = $request->filled('semester_id')
            ? Semester::with('academicSession')->find($request->semester_id)
            : Semester::where('is_current', true)->with('academicSession')->first();

        if (!$semester) {
            return back()->with('error', 'No active semester or valid session found.');
        }

        $registrationIds = CourseRegistration::where('semester_id', $semester->id)
            ->where(function ($q) use ($department) {
                $q->whereHas('course', fn($c) => $c->where('department_id', $department->id))
                  ->orWhereHas('student', fn($s) => $s->where('department_id', $department->id));
            })
            ->pluck('id');

        $releasedCount = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'approved')
            ->count();

        if ($releasedCount === 0) {
            return back()->with('error', "No published results found to block for {$department->name} in {$semester->name}.");
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'approved')
            ->update([
                'approval_status'  => 'hod_approved',
                'rejection_reason' => $request->reason ? 'Blocked by Provost: ' . $request->reason : 'Withheld by Provost for review',
            ]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            Cache::forget('student_results_' . $studentId);
            $student = Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . $this->getTenantId());

        return back()->with('success', "Results Blocked: {$releasedCount} records for {$department->name} ({$semester->name}) have been withheld from student view.");
    }

    public function releaseCourse(Request $request, Course $course)
    {
        $semesterId = $request->input('semester_id');
        $semester   = $semesterId
            ? Semester::find($semesterId)
            : Semester::where('is_current', true)->first();

        if (!$semester) {
            return back()->with('error', 'No active semester found.');
        }

        $registrationIds = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $semester->id)
            ->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', "No registrations found for this course in {$semester->name}.");
        }

        $count = Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($count === 0) {
            $alreadyReleased = Grade::whereIn('course_registration_id', $registrationIds)
                ->where('approval_status', 'approved')
                ->count();
            if ($alreadyReleased > 0) {
                return back()->with('info', "Results for {$course->code} have already been released ({$alreadyReleased} records).");
            }
            return back()->with('error', 'No HOD-approved results pending release for this course.');
        }

        Grade::whereIn('course_registration_id', $registrationIds)
            ->where('approval_status', 'hod_approved')
            ->update(['approval_status' => 'approved', 'rejection_reason' => null]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            Cache::forget('student_results_' . $studentId);
            $student = Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        Cache::forget('provost:dashboard:stats:' . $this->getTenantId());

        $courseTitle = $course->name ?? $course->title;
        return back()->with('success', "Results for {$course->code} — {$courseTitle} ({$count} students) have been released to students.");
    }

    public function rejectCourse(Request $request, Course $course)
    {
        $request->validate([
            'reason'      => 'required|string|max:1000',
            'semester_id' => 'nullable|exists:semesters,id',
        ]);

        $semester = $request->filled('semester_id')
            ? Semester::find($request->semester_id)
            : Semester::where('is_current', true)->first();

        if (!$semester) {
            return back()->with('error', 'No active semester found.');
        }

        $registrationIds = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $semester->id)
            ->pluck('id');

        if ($registrationIds->isEmpty()) {
            return back()->with('error', 'No registrations found for this course in this semester.');
        }

        $updated = Grade::whereIn('course_registration_id', $registrationIds)
            ->whereIn('approval_status', ['hod_approved', 'submitted'])
            ->update([
                'approval_status'  => 'draft',
                'rejection_reason' => 'Provost Review Required: ' . $request->reason,
            ]);

        $studentIds = CourseRegistration::whereIn('id', $registrationIds)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            Cache::forget('student_results_' . $studentId);
        }

        Cache::forget('provost:dashboard:stats:' . $this->getTenantId());

        return back()->with('success', "Results for {$course->code} ({$updated} records) sent back to the department for revision.");
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
            'tenant_id'    => $this->getTenantId(),
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
