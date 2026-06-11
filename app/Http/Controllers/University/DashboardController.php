<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\{AdmissionApplication, AdmissionForm, Announcement, Department, Course, Fee, Grade, Payment, Student, Lecturer, Semester, CourseRegistration};
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    private function render(string $role, string $title, string $subtitle, array $actions, array $extraData = []): Response
    {
        return Inertia::render('University/Dashboard', array_merge([
            'role' => $role,
            'title' => $title,
            'subtitle' => $subtitle,
            'stats' => [
                'students_active' => Student::where('status', 'active')->count(),
                'students_graduated' => Student::where('status', 'graduated')->count(),
                'staff_active' => Lecturer::where('status', 'active')->count(),
                'staff_suspended' => Lecturer::where('status', 'suspended')->count(),
                'staff_on_leave' => Lecturer::where('status', 'on_leave')->count(),
                'departments' => Department::count(),
                'courses' => Course::count(),
                'results' => Grade::count(),
                'fees' => Fee::count(),
            ],
            'actions' => $actions,
        ], $extraData));
    }

    public function lecturer(): Response
    {
        $lecturer = Auth::user()->lecturer;
        $tenant = app('currentTenant');
        
        $currentSemester = Semester::where('tenant_id', $tenant->id)
            ->where('is_current', true)
            ->first();

        $courses = [];
        if ($lecturer && $currentSemester) {
            $courses = Course::where('lecturer_id', $lecturer->id)
                ->where('semester_type', $currentSemester->type)
                ->withCount(['registrations' => function($q) use ($currentSemester) {
                    $q->where('semester_id', $currentSemester->id);
                }])
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'code' => $c->code,
                    'name' => $c->name,
                    'units' => $c->credit_units,
                    'student_count' => $c->registrations_count,
                    'pending_grades' => CourseRegistration::where('course_id', $c->id)
                        ->where('semester_id', $currentSemester->id)
                        ->where('status', 'approved')
                        ->whereDoesntHave('grade')
                        ->count()
                ]);
        }

        // Notices for this lecturer's courses
        $courseNotices = Announcement::where('created_by', Auth::id())
            ->whereIn('audience', ['students', 'course_students'])
            ->latest()
            ->get();

        return $this->render(
            'lecturer',
            'Lecturer Academic Portal',
            'Teaching workload, student assessments, and result management for ' . ($currentSemester->name ?? 'the current semester'),
            [
                ['label' => 'My Courses', 'href' => '/lecturer/my-courses', 'description' => 'View teaching assignments and class groups.'],
                ['label' => 'Assessments', 'href' => '/lecturer/exams', 'description' => 'Review exams and pending score sheets.'],
                ['label' => 'Results', 'href' => '/lecturer/grades', 'description' => 'Enter and submit results for your courses.'],
            ],
            [
                'lecturerCourses' => $courses,
                'currentSemester' => $currentSemester,
                'lecturer_status' => $lecturer->status,
                'courseNotices' => $courseNotices
            ]
        );
    }

    public function registrar(): Response
    {
        return $this->render(
            'registrar',
            'Registrar Dashboard',
            'Oversee student records, session setup, admissions flow, and academic administration.',
            [
                ['label' => 'Student Registry', 'href' => '/admin/students', 'description' => 'Manage student records and profiles.'],
                ['label' => 'Admissions', 'href' => '/admin/admissions', 'description' => 'Monitor forms and application status.'],
                ['label' => 'Reports', 'href' => '/admin/reports/overview', 'description' => 'Review academic and operational reports.'],
            ]
        );
    }

    public function bursar(): Response
    {
        return $this->render(
            'bursar',
            'Bursary Dashboard',
            'Track fees, payments, revenue, and financial compliance across the institution.',
            [
                ['label' => 'Fees', 'href' => '/admin/fees', 'description' => 'Manage tuition and student charges.'],
                ['label' => 'Payments', 'href' => '/admin/payments', 'description' => 'Review confirmed and pending payments.'],
                ['label' => 'Financial Reports', 'href' => '/admin/reports/financial', 'description' => 'Monitor institution finance health.'],
            ]
        );
    }

    public function hod(): Response
    {
        return $this->render(
            'hod',
            'Head of Department Dashboard',
            'Manage departmental workload, course allocation, and academic oversight.',
            [
                ['label' => 'Course Allocation', 'href' => '/lecturer/my-courses', 'description' => 'Review lecturer teaching load.'],
                ['label' => 'Assessments', 'href' => '/lecturer/exams', 'description' => 'Track active assessments and grading.'],
                ['label' => 'Department Reports', 'href' => '/admin/reports/academic', 'description' => 'Review departmental performance.'],
            ]
        );
    }

    public function dean(): Response
    {
        return $this->render(
            'dean',
            'Dean Dashboard',
            'Monitor faculty performance, approvals, and high-level academic operations.',
            [
                ['label' => 'Faculty Summary', 'href' => '/admin/reports/overview', 'description' => 'Review academic performance at a glance.'],
                ['label' => 'Admissions Trend', 'href' => '#', 'description' => 'Monitor applicant growth and intake.'],
                ['label' => 'Finance Snapshot', 'href' => '/admin/reports/financial', 'description' => 'View revenue and collection performance.'],
            ]
        );
    }
}
