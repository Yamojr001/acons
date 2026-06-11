<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\{Student, Lecturer, Department, AcademicSession, Semester, AdmissionForm, AdmissionApplication, Course, CourseRegistration, Grade};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\{AdmissionOfferedMail, AdmissionRejectedMail};

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('University/AdminDashboard', [
            'role' => 'registrar',
            'stats' => [
                'total_students' => Student::count(),
                'total_lecturers' => Lecturer::count(),
                'total_departments' => Department::count(),
                'total_courses' => \App\Models\Course::count(),
                'revenue_this_month' => \App\Models\Payment::where('status', 'successful')->whereMonth('created_at', now()->month)->sum('amount'),
                'departmental_fees' => []
            ],
            'recent_payments' => \App\Models\Payment::with('student.user')->latest()->limit(5)->get(),
            'departmental_breakdown' => []
        ]);
    }

    public function students()
    {
        $students = Student::with(['user', 'department'])->latest()->paginate(20);
        return Inertia::render('Registrar/Students/Index', ['students' => $students]);
    }

    public function lecturers(Request $request)
    {
        $tenant = app('currentTenant');
        $lecturers = Lecturer::with(['user.roles', 'department'])
            ->where('tenant_id', $tenant->id)
            ->when($request->search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->whereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                    })->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $departments = Department::where('tenant_id', $tenant->id)->get(['id', 'name']);

        return Inertia::render('Registrar/Lecturers/Index', [
            'lecturers' => $lecturers,
            'departments' => $departments,
            'filters' => $request->only(['search'])
        ]);
    }

    public function calendar()
    {
        $sessions = AcademicSession::with('semesters')->latest()->get();
        return Inertia::render('Registrar/Calendar', ['sessions' => $sessions]);
    }

    public function faculties()
    {
        $tenant = app('currentTenant');

        // Ensure at least one Faculty exists for this tenant
        $facultiesCount = \App\Models\Faculty::where('tenant_id', $tenant->id)->count();
        if ($facultiesCount === 0) {
            \App\Models\Faculty::create([
                'tenant_id' => $tenant->id,
                'name' => 'Faculty of Nursing Sciences',
                'code' => 'FNS',
            ]);
        }

        $faculties = \App\Models\Faculty::where('tenant_id', $tenant->id)
            ->with(['departments' => function ($q) {
                $q->withCount(['students', 'lecturers']);
            }])->get();

        $faculties->each(function($faculty) {
            $faculty->departments->each(function($dept) {
                $dept->graduated_count = \App\Models\Student::where('department_id', $dept->id)
                    ->where('status', 'graduated')
                    ->count();

                $dept->level_breakdown = \App\Models\Student::where('department_id', $dept->id)
                    ->where('status', 'active')
                    ->select('current_level', \DB::raw('count(*) as count'))
                    ->groupBy('current_level')
                    ->pluck('count', 'current_level')
                    ->all();
            });
        });

        return Inertia::render('Registrar/Faculties/Index', [
            'faculties' => $faculties
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,NULL,id,tenant_id,' . $tenant->id,
            'code' => 'required|string|max:50|unique:departments,code,NULL,id,tenant_id,' . $tenant->id,
            'faculty_id' => 'required|exists:faculties,id,tenant_id,' . $tenant->id,
        ]);

        \App\Models\Department::create([
            'tenant_id' => $tenant->id,
            'faculty_id' => $request->faculty_id,
            'name' => $request->name,
            'code' => strtoupper($request->code),
        ]);

        return redirect()->back()->with('success', 'Department created successfully!');
    }

    public function admissions(\Illuminate\Http\Request $request)
    {
        $tenantId = app('currentTenant')->id;
        $year = $request->input('year');
        
        $query = \App\Models\AdmissionApplication::where('tenant_id', $tenantId);
        
        if ($year) {
            $query->whereYear('created_at', $year);
        }
        
        $search = $request->input('search');
        if ($search) {
            $query->where(function($q) use ($search) {
                // If search is numeric or ADM-xxx, extract number to search ID
                $searchId = preg_replace('/[^0-9]/', '', $search);
                if (!empty($searchId)) {
                    $q->where('id', $searchId);
                }
                
                $q->orWhere('applicant_name', 'like', "%{$search}%")
                  ->orWhere('applicant_email', 'like', "%{$search}%");
            });
        }
        
        $stats = [
            'total' => (clone $query)->count(),
            'admitted' => (clone $query)->whereIn('status', ['admitted', 'cleared'])->count(),
            'rejected' => (clone $query)->whereIn('status', ['rejected', 'clearance_rejected'])->count(),
            'pending' => (clone $query)->whereIn('status', ['pending', 'under_review'])->count(),
        ];

        $allApps = (clone $query)->with('form')->get();
        $deptYearStats = $allApps->groupBy(function($app) {
            $y = $app->created_at ? $app->created_at->format('Y') : date('Y');
            $dept = $app->data['department'] ?? $app->data['program'] ?? ($app->form ? $app->form->title : 'General');
            return $dept . ' (' . $y . ')';
        })->map->count();

        $applications = (clone $query)->with(['form'])->latest()->paginate(20)->withQueryString();
        
        $availableYears = \App\Models\AdmissionApplication::where('tenant_id', $tenantId)
            ->pluck('created_at')
            ->map(fn($date) => $date ? $date->format('Y') : date('Y'))
            ->unique()
            ->sortDesc()
            ->values();
            
        if ($availableYears->isEmpty()) {
            $availableYears = collect([date('Y')]);
        }
        
        $activeForm = \App\Models\AdmissionForm::where('tenant_id', $tenantId)->where('is_active', true)->first();
        $defaultClearanceSchedule = $activeForm ? $activeForm->default_clearance_schedule : 'Mondays and Tuesdays between 10am and 2pm at the HOD\'s Office (starting May 25th).';
        
        return Inertia::render('Registrar/Admissions/Index', [
            'applications' => $applications,
            'stats' => $stats,
            'deptYearStats' => $deptYearStats,
            'filters' => request()->only(['year']),
            'availableYears' => $availableYears,
            'departments' => Department::get(['id', 'name', 'code']),
            'defaultClearanceSchedule' => $defaultClearanceSchedule
        ]);
    }

    public function announcements()
    {
        $announcements = \App\Models\Announcement::with('author')->latest()->paginate(20);
        $roles = \Spatie\Permission\Models\Role::pluck('name')->toArray();
        return Inertia::render('Registrar/Announcements/Index', [
            'announcements' => $announcements,
            'roles' => $roles
        ]);
    }

    public function storeAnnouncement(\Illuminate\Http\Request $request)
    {
        $tenantId = app('currentTenant')->id;

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'audience' => 'required|string',
        ]);

        \App\Models\Announcement::create([
            'tenant_id' => $tenantId,
            'created_by' => auth()->id(),
            'title' => $validated['title'],
            'body' => $validated['body'],
            'audience' => $validated['audience'],
            'send_email' => $request->boolean('send_email'),
            'send_sms' => $request->boolean('send_sms'),
            'published_at' => now(),
        ]);

        return back()->with('success', 'Announcement broadcasted successfully.');
    }

    public function storeSession(\Illuminate\Http\Request $request)
    {
        $tenantId = app('currentTenant')->id;

        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'is_current' => 'boolean',
            'schedules' => 'nullable|array',
            'custom_schedules' => 'nullable|array',
            'semesters' => 'nullable|array',
        ]);

        if ($request->is_current) {
            AcademicSession::where('tenant_id', $tenantId)->update(['is_current' => false]);
        }

        $session = AcademicSession::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_current' => $request->is_current ?? false,
            'schedules' => [
                'vital' => $validated['schedules'] ?? [],
                'custom' => $validated['custom_schedules'] ?? []
            ]
        ]);

        if (!empty($validated['semesters'])) {
            foreach ($validated['semesters'] as $semData) {
                if ($semData['is_current'] ?? false) {
                    Semester::where('tenant_id', $tenantId)->update(['is_current' => false]);
                }
                
                Semester::create([
                    'tenant_id' => $tenantId,
                    'academic_session_id' => $session->id,
                    'name' => $semData['name'],
                    'type' => $semData['type'] ?? ($semData['name'] === 'First Semester' ? 'first' : 'second'),
                    'start_date' => $semData['start_date'] ?? null,
                    'end_date' => $semData['end_date'] ?? null,
                    'is_current' => $semData['is_current'] ?? false,
                    'schedules' => [
                        'vital' => $semData['schedules'] ?? [],
                        'custom' => $semData['custom_schedules'] ?? []
                    ]
                ]);
            }
        } else {
            Semester::create([
                'tenant_id' => $tenantId,
                'academic_session_id' => $session->id,
                'name' => 'First Semester',
                'type' => 'first',
                'start_date' => $session->start_date,
                'end_date' => null,
                'is_current' => true,
            ]);
            Semester::create([
                'tenant_id' => $tenantId,
                'academic_session_id' => $session->id,
                'name' => 'Second Semester',
                'type' => 'second',
                'start_date' => null,
                'end_date' => $session->end_date,
                'is_current' => false,
            ]);
        }

        return redirect()->back()->with('success', 'Academic session created successfully.');
    }

    public function updateSession(\Illuminate\Http\Request $request, AcademicSession $session)
    {
        $tenantId = app('currentTenant')->id;
        if ($session->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'is_current' => 'boolean',
            'schedules' => 'nullable|array',
            'custom_schedules' => 'nullable|array',
            'semesters' => 'nullable|array',
        ]);

        if ($request->is_current && !$session->is_current) {
            AcademicSession::where('tenant_id', $tenantId)->update(['is_current' => false]);
        }

        $session->update([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_current' => $request->is_current ?? $session->is_current,
            'schedules' => [
                'vital' => $validated['schedules'] ?? [],
                'custom' => $validated['custom_schedules'] ?? []
            ]
        ]);

        if (!empty($validated['semesters'])) {
            foreach ($validated['semesters'] as $semData) {
                $semester = Semester::where('academic_session_id', $session->id)
                    ->where('type', $semData['type'])
                    ->first();

                if ($semData['is_current'] ?? false) {
                    Semester::where('tenant_id', $tenantId)->update(['is_current' => false]);
                }

                if ($semester) {
                    $semester->update([
                        'name' => $semData['name'],
                        'start_date' => $semData['start_date'] ?? null,
                        'end_date' => $semData['end_date'] ?? null,
                        'is_current' => $semData['is_current'] ?? false,
                        'schedules' => [
                            'vital' => $semData['schedules'] ?? [],
                            'custom' => $semData['custom_schedules'] ?? []
                        ]
                    ]);
                } else {
                    Semester::create([
                        'tenant_id' => $tenantId,
                        'academic_session_id' => $session->id,
                        'name' => $semData['name'],
                        'type' => $semData['type'],
                        'start_date' => $semData['start_date'] ?? null,
                        'end_date' => $semData['end_date'] ?? null,
                        'is_current' => $semData['is_current'] ?? false,
                        'schedules' => [
                            'vital' => $semData['schedules'] ?? [],
                            'custom' => $semData['custom_schedules'] ?? []
                        ]
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Academic session updated successfully.');
    }

    public function postAdmit(Request $request, AdmissionApplication $application)
    {
        if (auth()->user()->hasRole('registrar')) {
            abort(403, 'Unauthorized action. Registrars cannot offer admission or reject applications.');
        }

        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'section' => 'required|in:ND,HND',
            'clearance_schedule' => 'required|string',
        ]);

        $application->update([
            'status' => 'admitted',
            'admitted_department_id' => $request->department_id,
            'admitted_section' => $request->section,
            'clearance_schedule' => $request->clearance_schedule,
        ]);

        // Sync the public applicant profile state
        $jambNumber = $application->data['jamb_number'] ?? $application->data['jamb_registration_number'] ?? null;
        $applicant = \App\Models\Applicant::where('email', $application->applicant_email)
            ->when($jambNumber, function ($q) use ($jambNumber) {
                return $q->orWhere('jamb_number', $jambNumber);
            })
            ->first();

        if ($applicant) {
            $program = \App\Models\Program::where('department_id', $request->department_id)->first();
            $applicant->update([
                'admission_status' => 'admitted',
                'admitted_program_id' => $program?->id,
            ]);
        }

        $dept = Department::find($request->department_id);

        try {
            Mail::to($application->applicant_email)->send(
                new AdmissionOfferedMail(
                    $application->applicant_name,
                    $dept->name,
                    $request->section,
                    $request->clearance_schedule
                )
            );
        } catch (\Exception $e) {
            // Log or ignore mail sending error to ensure flow completes
        }

        return redirect()->back()->with('success', 'Admission offered successfully and clearance details emailed.');
    }

    public function postReject(Request $request, AdmissionApplication $application)
    {
        if (auth()->user()->hasRole('registrar')) {
            abort(403, 'Unauthorized action. Registrars cannot offer admission or reject applications.');
        }

        $request->validate([
            'reason' => 'required|string',
        ]);

        $application->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        // Sync the public applicant profile state
        $jambNumber = $application->data['jamb_number'] ?? $application->data['jamb_registration_number'] ?? null;
        $applicant = \App\Models\Applicant::where('email', $application->applicant_email)
            ->when($jambNumber, function ($q) use ($jambNumber) {
                return $q->orWhere('jamb_number', $jambNumber);
            })
            ->first();

        if ($applicant) {
            $applicant->update([
                'admission_status' => 'rejected',
                'remarks' => $request->reason,
            ]);
        }

        try {
            Mail::to($application->applicant_email)->send(
                new AdmissionRejectedMail(
                    $application->applicant_name,
                    $request->reason
                )
            );
        } catch (\Exception $e) {
            // Log or ignore mail sending error to ensure flow completes
        }

        return redirect()->back()->with('success', 'Admission application rejected successfully.');
    }

    public function results()
    {
        $tenant = app('currentTenant');
        $currentSemester = Semester::where('is_current', true)->first();

        // Get all courses inside this tenant
        $courses = Course::where('tenant_id', $tenant->id)
            ->with(['lecturer.user', 'department'])
            ->get()
            ->map(function ($course) use ($currentSemester) {
                // Get registrations with grades
                $registrations = CourseRegistration::where('course_id', $course->id)
                    ->where('semester_id', $currentSemester?->id)
                    ->with(['student.user', 'grade'])
                    ->get();

                $grades = $registrations->map(fn($r) => $r->grade)->filter();
                $totalGraded = $grades->count();

                $passed = $grades->filter(fn($g) => $g->grade_letter !== 'F' && $g->grade_letter !== 'ABS' && $g->grade_letter !== null)->count();
                $failed = $grades->filter(fn($g) => $g->grade_letter === 'F')->count();
                $absent = $grades->filter(fn($g) => $g->is_absent == true || $g->grade_letter === 'ABS')->count();
                $averageScore = $grades->filter(fn($g) => !$g->is_absent)->avg('total_score') ?? 0;

                // Overall status:
                // Released: if there are grades and all are 'approved'
                // Pending Registrar Release: if grades contain 'hod_approved' and none are 'draft'/'submitted'
                // Pending HOD/Lecturer: otherwise
                $status = 'no_grades';
                if ($totalGraded > 0) {
                    $hasReleased = $grades->contains(fn($g) => $g->approval_status === 'approved');
                    $hasHODApproved = $grades->contains(fn($g) => $g->approval_status === 'hod_approved');
                    $hasSubmitted = $grades->contains(fn($g) => $g->approval_status === 'submitted');

                    if ($hasReleased) {
                        $status = 'released';
                    } elseif ($hasHODApproved) {
                        $status = 'pending_release';
                    } elseif ($hasSubmitted) {
                        $status = 'pending_hod';
                    } else {
                        $status = 'draft';
                    }
                }

                $rejectionReason = $grades->first()?->rejection_reason ?? null;

                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'credit_units' => $course->credit_units,
                    'level' => $course->level,
                    'department_name' => $course->department?->name ?? 'Unassigned',
                    'lecturer_name' => $course->lecturer?->user?->name ?? 'Unassigned',
                    'total_graded' => $totalGraded,
                    'passed' => $passed,
                    'failed' => $failed,
                    'absent' => $absent,
                    'pass_rate' => $totalGraded > 0 ? round(($passed / $totalGraded) * 100, 1) : 0,
                    'failure_rate' => $totalGraded > 0 ? round(($failed / $totalGraded) * 100, 1) : 0,
                    'mean_score' => round($averageScore, 1),
                    'status' => $status,
                    'rejection_reason' => $rejectionReason,
                    'students' => $registrations->map(function($reg) {
                        return [
                            'student_name' => $reg->student->user->name,
                            'matric_number' => $reg->student->matriculation_number,
                            'ca_score' => $reg->grade->ca_score ?? null,
                            'exam_score' => $reg->grade->exam_score ?? null,
                            'total_score' => $reg->grade->total_score ?? null,
                            'grade_letter' => $reg->grade->grade_letter ?? null,
                            'approval_status' => $reg->grade->approval_status ?? 'draft'
                        ];
                    })
                ];
            });

        return Inertia::render('Registrar/Results/Index', [
            'courses' => $courses,
            'semester_name' => $currentSemester?->name ?? 'N/A',
            'is_provost' => auth()->user()->hasRole('provost')
        ]);
    }

    public function releaseAllResults(Request $request)
    {
        if (!auth()->user()->hasRole('provost')) {
            return redirect()->back()->with('error', 'Unauthorized action. Only the Provost can release results.');
        }

        $currentSemester = Semester::where('is_current', true)->first();
        if (!$currentSemester) {
            return redirect()->back()->with('error', 'No active academic semester set in the system.');
        }

        // Get all grades linked to registrations in this active semester
        $registrations = CourseRegistration::where('semester_id', $currentSemester->id)->pluck('id');

        if ($registrations->isEmpty()) {
            return redirect()->back()->with('error', 'No course registrations found for the active semester.');
        }

        $affectedGradesCount = Grade::whereIn('course_registration_id', $registrations)
            ->where('approval_status', 'hod_approved')
            ->count();

        if ($affectedGradesCount === 0) {
            return redirect()->back()->with('error', 'No results are currently pending Provost release (must be HOD-approved first).');
        }

        // Bulk update from hod_approved to approved (released to students)
        Grade::whereIn('course_registration_id', $registrations)
            ->where('approval_status', 'hod_approved')
            ->update([
                'approval_status' => 'approved',
                'rejection_reason' => null
            ]);

        // Evict cache for all students and trigger progression calculations
        $studentIds = CourseRegistration::whereIn('id', $registrations)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $studentId);
            
            $student = \App\Models\Student::find($studentId);
            if ($student) {
                $student->recalculateAcademicStatus();
            }
        }

        return redirect()->back()->with('success', "Successfully released results for all HOD-approved courses to students in this semester!");
    }

    public function rejectResult(Request $request, Course $course)
    {
        if (!auth()->user()->hasRole('provost')) {
            return redirect()->back()->with('error', 'Unauthorized action. Only the Provost can reject results.');
        }

        $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        $currentSemester = Semester::where('is_current', true)->first();

        $registrations = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester?->id)
            ->pluck('id');

        if ($registrations->isEmpty()) {
            return redirect()->back()->with('error', 'No registered students for this course in the current semester.');
        }

        Grade::whereIn('course_registration_id', $registrations)
            ->update([
                'approval_status' => 'draft',
                'rejection_reason' => 'Provost Review Required: ' . $request->reason
            ]);

        // Explicitly clear cache for all students in these registrations
        $studentIds = CourseRegistration::whereIn('id', $registrations)->pluck('student_id')->unique();
        foreach ($studentIds as $studentId) {
            \Illuminate\Support\Facades\Cache::forget('student_results_' . $studentId);
        }

        return redirect()->back()->with('success', 'Course results sent back to the department for review.');
    }

    public function exportAdmissions(Request $request)
    {
        $tenantId = app('currentTenant')->id;
        $year = $request->input('year');
        
        $query = \App\Models\AdmissionApplication::where('tenant_id', $tenantId);
        
        if ($year) {
            $query->whereYear('created_at', $year);
        }
        
        $applications = $query->with('form')->get();
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="admissions_export_' . ($year ?: date('Y')) . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];
        
        $callback = function() use ($applications) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'Application ID', 
                'Applicant Name', 
                'Email', 
                'Status', 
                'Sex',
                'JAMB Number',
                'JAMB Score',
                'Phone', 
                'State of Origin',
                'LGA',
                'Admitted Program',
                'Clearance Schedule',
                'Created At'
            ]);
            
            foreach ($applications as $app) {
                $data = $app->data ?: [];
                $programName = $app->admittedDepartment ? $app->admittedDepartment->name : 'N/A';
                
                fputcsv($file, [
                    $app->id,
                    $app->applicant_name,
                    $app->applicant_email,
                    strtoupper($app->status),
                    $data['sex'] ?? 'N/A',
                    $data['jamb_number'] ?? 'N/A',
                    $data['jamb_score'] ?? 'N/A',
                    $data['phone'] ?? $data['phone_number'] ?? 'N/A',
                    $data['state_of_origin'] ?? 'N/A',
                    $data['lga'] ?? 'N/A',
                    $programName,
                    $app->clearance_schedule ?: 'N/A',
                    $app->created_at ? $app->created_at->format('Y-m-d H:i:s') : 'N/A'
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    public function storeDirectAdmission(Request $request)
    {
        $tenant = app('currentTenant');

        $request->validate([
            // Personal Info
            'full_name' => 'required|string|max:255',
            'dob' => 'required|date',
            'place_of_birth' => 'required|string|max:255',
            'lga' => 'required|string|max:255',
            'state_of_origin' => 'required|string|max:255',
            'nationality' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact_address' => 'required|string',
            'phone_number' => 'required|string|max:30',
            'sex' => 'required|string|max:20',
            'next_of_kin_name' => 'required|string|max:255',
            'next_of_kin_address' => 'required|string',
            'jamb_score' => 'required|integer|min:150',
            'jamb_number' => 'required|string|max:40|unique:applicants,jamb_number',
            'physical_disabilities' => 'nullable|string|max:255',
            'highest_qualification' => 'nullable|string|max:255',

            // Parents
            'parent_name' => 'required|string|max:255',
            'parent_address' => 'required|string',
            'parent_phone' => 'required|string|max:30',
            'sponsor_name_address' => 'required|string',

            // Schools
            'primary_school_name' => 'required|string|max:255',
            'primary_school_from' => 'required|string|max:20',
            'primary_school_to' => 'required|string|max:20',
            'secondary_school_name' => 'required|string|max:255',
            'secondary_school_from' => 'required|string|max:20',
            'secondary_school_to' => 'required|string|max:20',

            // O'Levels Sitting 1
            'first_sitting_type' => 'required|string|max:40',
            'first_sitting_year' => 'required|string|max:10',
            'first_sitting_no' => 'required|string|max:40',
            'first_sitting_grades' => 'required|array',

            // O'Levels Sitting 2 (Optional)
            'second_sitting_type' => 'nullable|string|max:40',
            'second_sitting_year' => 'nullable|string|max:10',
            'second_sitting_no' => 'nullable|string|max:40',
            'second_sitting_grades' => 'nullable|array',
        ]);

        // Create applicant record. Initial password is their phone number
        $applicant = \App\Models\Applicant::create([
            'tenant_id' => $tenant->id,
            'jamb_number' => strtoupper($request->jamb_number),
            'password' => \Illuminate\Support\Facades\Hash::make($request->phone_number),
            
            // Personal
            'full_name' => $request->full_name,
            'dob' => $request->dob,
            'place_of_birth' => $request->place_of_birth,
            'lga' => $request->lga,
            'state_of_origin' => $request->state_of_origin,
            'nationality' => $request->nationality,
            'email' => $request->email,
            'contact_address' => $request->contact_address,
            'phone_number' => $request->phone_number,
            'sex' => $request->sex,
            'next_of_kin_name' => $request->next_of_kin_name,
            'next_of_kin_address' => $request->next_of_kin_address,
            'physical_disabilities' => $request->physical_disabilities ?? 'None',
            'highest_qualification' => $request->highest_qualification ?? 'None',
            'jamb_score' => $request->jamb_score,

            // Schools Attended
            'primary_school_name' => $request->primary_school_name,
            'primary_school_from' => $request->primary_school_from,
            'primary_school_to' => $request->primary_school_to,
            'secondary_school_name' => $request->secondary_school_name,
            'secondary_school_from' => $request->secondary_school_from,
            'secondary_school_to' => $request->secondary_school_to,
            'tertiary_school_name' => $request->tertiary_school_name,
            'tertiary_school_from' => $request->tertiary_school_from,
            'tertiary_school_to' => $request->tertiary_school_to,

            // O'Levels Sitting 1
            'first_sitting_type' => $request->first_sitting_type,
            'first_sitting_year' => $request->first_sitting_year,
            'first_sitting_no' => $request->first_sitting_no,
            'first_sitting_grades' => $request->first_sitting_grades,

            // O'Levels Sitting 2
            'second_sitting_type' => $request->second_sitting_type,
            'second_sitting_year' => $request->second_sitting_year,
            'second_sitting_no' => $request->second_sitting_no,
            'second_sitting_grades' => $request->second_sitting_grades,

            // Contacts
            'parent_name' => $request->parent_name,
            'parent_address' => $request->parent_address,
            'parent_phone' => $request->parent_phone,
            'sponsor_name_address' => $request->sponsor_name_address,

            // States
            'payment_status' => 'paid',
            'payment_reference' => 'DIRECT_ADM_' . strtoupper(\Illuminate\Support\Str::random(12)),
            'amount_paid' => 14700.00,
            'admission_status' => 'pending'
        ]);

        $admissionForm = \App\Models\AdmissionForm::where('tenant_id', $tenant->id)->where('is_active', true)->first();

        \App\Models\AdmissionApplication::create([
            'tenant_id' => $tenant->id,
            'admission_form_id' => $admissionForm ? $admissionForm->id : 1,
            'applicant_name' => $applicant->full_name,
            'applicant_email' => $applicant->email,
            'status' => 'pending',
            'data' => [
                'jamb_number' => $applicant->jamb_number,
                'phone_number' => $applicant->phone_number,
                'jamb_score' => $applicant->jamb_score,
                'state_of_origin' => $applicant->state_of_origin,
                'lga' => $applicant->lga,
                'gender' => $applicant->sex,
                'date_of_birth' => $applicant->dob ? $applicant->dob->format('Y-m-d') : null,
                'first_sitting_type' => $applicant->first_sitting_type,
                'first_sitting_no' => $applicant->first_sitting_no,
                'first_sitting_grades' => $applicant->first_sitting_grades,
                'second_sitting_type' => $applicant->second_sitting_type,
                'second_sitting_no' => $applicant->second_sitting_no,
                'second_sitting_grades' => $applicant->second_sitting_grades,
            ]
        ]);

        return redirect()->back()->with('success', 'Direct admission candidate registered successfully as a pending applicant!');
    }
}
