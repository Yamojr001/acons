<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Grade, Semester};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ResultController extends Controller
{
    public function index(): Response
    {
        $student = Auth::user()->student->load(['user', 'department']);
        $cacheKey = 'student_results_' . $student->id;

        $allApprovedGrades = Grade::whereHas('registration', function($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->where('approval_status', 'approved')
            ->with(['registration.course', 'registration.semester.academicSession'])
            ->latest()
            ->get();

        $totalPoints = $allApprovedGrades->sum(fn($g) => $g->grade_points * $g->registration->course->credit_units);
        $totalUnits = $allApprovedGrades->sum(fn($g) => $g->registration->course->credit_units);
        $cgpa = $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;

        $reseatCourseCodes = [];
        if (!empty($student->reseat_course_ids)) {
            $reseatCourseCodes = \App\Models\Course::whereIn('id', $student->reseat_course_ids)->pluck('code')->toArray();
        }

        $studentDetails = [
            'name' => $student->user->name,
            'matric_number' => $student->matriculation_number,
            'level' => $student->current_level,
            'department' => $student->department->name ?? 'N/A',
            'avatar_url' => $student->user->avatar_url,
            'cgpa' => $cgpa,
            'total_load' => $totalUnits,
            'academic_status' => $student->academic_status ?? 'normal',
            'reseat_courses' => $reseatCourseCodes,
        ];

        $groupedResults = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addDays(1), function() use ($allApprovedGrades) {
            // Group results by Session and Semester
            return $allApprovedGrades->groupBy(function($g) {
                return $g->registration->semester->academicSession->name . ' - ' . $g->registration->semester->name;
            })->map(function($grades, $sessionName) {
                $semesterLoad = $grades->sum(fn($g) => $g->registration->course->credit_units);
                return [
                    'session_name' => $sessionName,
                    'semester_load' => $semesterLoad,
                    'grades' => $grades->map(fn($g) => [
                        'course_code' => $g->registration->course->code,
                        'course_name' => $g->registration->course->name,
                        'units' => $g->registration->course->credit_units,
                        'score' => (float) $g->total_score,
                        'grade' => $g->grade_letter,
                        'points' => (float) $g->grade_points,
                    ]),
                    'semester_gpa' => $this->calculateGPA($grades)
                ];
            });
        });

        return Inertia::render('Student/Results', [
            'groupedResults' => $groupedResults,
            'studentDetails' => $studentDetails,
        ]);
    }

    private function calculateGPA($grades)
    {
        $totalPoints = $grades->sum(fn($g) => $g->grade_points * $g->registration->course->credit_units);
        $totalUnits = $grades->sum(fn($g) => $g->registration->course->credit_units);
        
        return $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;
    }
}
