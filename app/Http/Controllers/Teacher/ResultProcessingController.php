<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Grade;
use App\Models\CourseRegistration;
use App\Models\AcademicRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ResultProcessingController extends Controller
{
    /**
     * Helper to calculate Grade Points based on dynamic tenant settings
     */
    private function calculateGrade(float $totalScore, $settings)
    {
        $scale = $settings['grading_scale'] ?? '5.0';
        
        if ($scale === '5.0') {
            if ($totalScore >= 70) return ['letter' => 'A', 'points' => 5.0];
            if ($totalScore >= 60) return ['letter' => 'B', 'points' => 4.0];
            if ($totalScore >= 50) return ['letter' => 'C', 'points' => 3.0];
            if ($totalScore >= 45) return ['letter' => 'D', 'points' => 2.0];
            if ($totalScore >= 40) return ['letter' => 'E', 'points' => 1.0];
            return ['letter' => 'F', 'points' => 0.0];
        }

        // Polytechnic / 4.0 Scale fallback
        if ($totalScore >= 75) return ['letter' => 'A', 'points' => 4.0];
        if ($totalScore >= 65) return ['letter' => 'AB', 'points' => 3.5];
        if ($totalScore >= 60) return ['letter' => 'B', 'points' => 3.0];
        if ($totalScore >= 55) return ['letter' => 'BC', 'points' => 2.5];
        if ($totalScore >= 50) return ['letter' => 'C', 'points' => 2.0];
        return ['letter' => 'F', 'points' => 0.0];
    }

    public function store(Request $request, Course $course)
    {
        $tenant = app('currentTenant');
        
        $request->validate([
            'grades' => 'required|array',
            'grades.*.registration_id' => 'required|exists:course_registrations,id',
            'grades.*.ca_score' => 'nullable|numeric|min:0|max:40',
            'grades.*.exam_score' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($request, $tenant) {
            foreach ($request->grades as $gradeData) {
                $ca = $gradeData['ca_score'] ?? 0;
                $exam = $gradeData['exam_score'] ?? 0;
                $total = $ca + $exam;

                $calculated = $this->calculateGrade($total, $tenant->settings);

                Grade::updateOrCreate(
                    ['course_registration_id' => $gradeData['registration_id']],
                    [
                        'tenant_id' => $tenant->id,
                        'ca_score' => $ca,
                        'exam_score' => $exam,
                        'total_score' => $total,
                        'grade_letter' => $calculated['letter'],
                        'grade_points' => $calculated['points'],
                        'approval_status' => 'draft', // Requires HOD approval
                    ]
                );
            }
        });

        return back()->with('success', 'Grades uploaded successfully and saved as Draft.');
    }
}
