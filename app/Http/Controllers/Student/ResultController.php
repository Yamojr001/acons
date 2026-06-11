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
        $student = Auth::user()->student;
        $cacheKey = 'student_results_' . $student->id;

        $groupedResults = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addDays(1), function() use ($student) {
            // Fetch all approved grades for the student
            $results = Grade::whereHas('registration', function($q) use ($student) {
                    $q->where('student_id', $student->id);
                })
                ->where('approval_status', 'approved')
                ->with(['registration.course', 'registration.semester.academicSession'])
                ->latest()
                ->get();

            // Group results by Session and Semester
            return $results->groupBy(function($g) {
                return $g->registration->semester->academicSession->name . ' - ' . $g->registration->semester->name;
            })->map(function($grades, $sessionName) {
                return [
                    'session_name' => $sessionName,
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
        ]);
    }

    private function calculateGPA($grades)
    {
        $totalPoints = $grades->sum(fn($g) => $g->grade_points * $g->registration->course->credit_units);
        $totalUnits = $grades->sum(fn($g) => $g->registration->course->credit_units);
        
        return $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;
    }
}
