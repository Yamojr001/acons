<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Models\{Course, CourseRegistration, Grade, Semester};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ResultProcessingController extends Controller
{
    public function index(Request $request)
    {
        $lecturer = Auth::user()->lecturer;
        $courses = Course::where('lecturer_id', $lecturer->id)->get();
        $courseId = $request->input('course_id');
        $students = [];
        $selectedCourse = null;
        $rejectionReason = null;
        $sheetStatus = 'no_grades';

        if ($courseId) {
            $selectedCourse = Course::find($courseId);
            $currentSemester = Semester::where('is_current', true)->first();

            if ($currentSemester) {
                $firstGrade = Grade::whereHas('registration', function($q) use ($courseId, $currentSemester) {
                    $q->where('course_id', $courseId)->where('semester_id', $currentSemester->id);
                })->whereNotNull('rejection_reason')->first();
                $rejectionReason = $firstGrade?->rejection_reason;

                $registrations = CourseRegistration::where('course_id', $courseId)
                    ->where('semester_id', $currentSemester->id)
                    ->pluck('id');
                $grades = Grade::whereIn('course_registration_id', $registrations)->get();

                if ($grades->count() > 0) {
                    $hasDraft = $grades->contains(fn($g) => $g->approval_status === 'draft');
                    $hasSubmitted = $grades->contains(fn($g) => $g->approval_status === 'submitted');
                    $hasApproved = $grades->contains(fn($g) => $g->approval_status === 'hod_approved');

                    if ($hasSubmitted) {
                        $sheetStatus = 'submitted';
                    } elseif ($hasApproved) {
                        $sheetStatus = 'approved';
                    } else {
                        $sheetStatus = 'draft';
                    }
                }
            }

            $students = CourseRegistration::where('course_id', $courseId)
                ->where('semester_id', $currentSemester->id)
                ->with(['student.user', 'grade'])
                ->get()
                ->map(function ($reg) {
                    return [
                        'registration_id' => $reg->id,
                        'name' => $reg->student->user->name,
                        'matric_number' => $reg->student->matriculation_number,
                        'ca_score' => $reg->grade->ca_score ?? null,
                        'exam_score' => $reg->grade->exam_score ?? null,
                        'is_absent' => (bool) ($reg->grade->is_absent ?? false),
                        'total_score' => $reg->grade->total_score ?? null,
                        'grade' => $reg->grade->grade_letter ?? null,
                    ];
                });
        }

        return Inertia::render('Lecturer/ResultEntry', [
            'courses' => $courses,
            'students' => $students,
            'selectedCourseId' => (int) $courseId,
            'selectedCourse' => $selectedCourse,
            'rejectionReason' => $rejectionReason,
            'sheetStatus' => $sheetStatus
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'results' => 'required|array',
            'results.*.registration_id' => 'required|exists:course_registrations,id',
            'results.*.ca_score' => 'nullable|numeric|min:0|max:30',
            'results.*.exam_score' => 'nullable|numeric|min:0|max:70',
            'results.*.is_absent' => 'boolean',
        ]);

        foreach ($request->results as $res) {
            $total = null;
            $gradeLetter = null;
            $gradePoints = null;

            if (!$res['is_absent'] && ($res['ca_score'] !== null || $res['exam_score'] !== null)) {
                $total = ($res['ca_score'] ?? 0) + ($res['exam_score'] ?? 0);
                
                // Fetch student and check if Basic Nursing
                $reg = CourseRegistration::with(['student.program'])->find($res['registration_id']);
                $student = $reg?->student;
                $programName = $student?->program?->name ?? '';
                $currentLevel = $student?->current_level ?? '';

                $isBasicNursing = (
                    stripos($programName, 'Basic') !== false ||
                    stripos($programName, 'General') !== false ||
                    stripos($programName, 'RN') !== false ||
                    stripos($programName, 'RM') !== false ||
                    stripos($currentLevel, 'Basic') !== false
                );

                if ($isBasicNursing) {
                    $gradeLetter = $total >= 50 ? 'PASS' : 'FAIL';
                    $gradePoints = null; // No CGPA
                } else {
                    // ND/HND: A B C D E F and CGPA
                    if ($total >= 70) {
                        $gradeLetter = 'A';
                        $gradePoints = 4.00;
                    } elseif ($total >= 60) {
                        $gradeLetter = 'B';
                        $gradePoints = 3.00;
                    } elseif ($total >= 50) {
                        $gradeLetter = 'C';
                        $gradePoints = 2.00;
                    } elseif ($total >= 45) {
                        $gradeLetter = 'D';
                        $gradePoints = 1.00;
                    } elseif ($total >= 40) {
                        $gradeLetter = 'E';
                        $gradePoints = 0.50;
                    } else {
                        $gradeLetter = 'F';
                        $gradePoints = 0.00;
                    }
                }
            }

            Grade::updateOrCreate(
                [
                    'tenant_id' => app('currentTenant')->id,
                    'course_registration_id' => $res['registration_id']
                ],
                [
                    'ca_score' => $res['ca_score'],
                    'exam_score' => $res['exam_score'],
                    'total_score' => $total,
                    'is_absent' => $res['is_absent'],
                    'grade_letter' => $gradeLetter,
                    'grade_points' => $gradePoints,
                    'approval_status' => 'draft',
                    'rejection_reason' => null
                ]
            );
        }

        return back()->with('success', 'Scores saved successfully.');
    }

    public function submit(Request $request, Course $course)
    {
        $currentSemester = Semester::where('is_current', true)->first();
        if (!$currentSemester) {
            return back()->with('error', 'No active academic semester set.');
        }

        $registrations = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester->id)
            ->pluck('id');

        $gradesCount = Grade::whereIn('course_registration_id', $registrations)->count();
        if ($gradesCount === 0) {
            return back()->with('error', 'You must save at least one student mark before submitting to HOD.');
        }

        Grade::whereIn('course_registration_id', $registrations)
            ->update([
                'approval_status' => 'submitted',
                'rejection_reason' => null
            ]);

        return back()->with('success', 'Grades sheet submitted to HOD successfully.');
    }

    private function calculateGrade($score)
    {
        if ($score >= 70) return ['A', 5.0];
        if ($score >= 60) return ['B', 4.0];
        if ($score >= 50) return ['C', 3.0];
        if ($score >= 45) return ['D', 2.0];
        if ($score >= 40) return ['E', 1.0];
        return ['F', 0.0];
    }
}
