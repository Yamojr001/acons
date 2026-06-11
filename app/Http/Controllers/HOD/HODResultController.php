<?php

namespace App\Http\Controllers\HOD;

use App\Http\Controllers\Controller;
use App\Models\{Course, CourseRegistration, Grade, Semester, Department};
use Illuminate\Http\Request;
use Inertia\Inertia;

class HODResultController extends Controller
{
    private function getHodDepartmentId()
    {
        $lecturer = auth()->user()->lecturer;
        if (!$lecturer) {
            abort(403, 'Your HOD account is not linked to a Lecturer profile. Please contact the administrator.');
        }
        return $lecturer->department_id;
    }

    public function index()
    {
        $deptId = $this->getHodDepartmentId();
        $dept = Department::find($deptId);
        $currentSemester = Semester::where('is_current', true)->first();

        $courses = Course::where('department_id', $deptId)
            ->with(['lecturer.user'])
            ->get()
            ->map(function ($course) use ($currentSemester) {
                // Get all registrations with grades for this course and semester
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
                
                // Determine overall status
                $status = 'no_grades';
                if ($totalGraded > 0) {
                    $hasReleased = $grades->contains(fn($g) => $g->approval_status === 'approved');
                    $hasApproved = $grades->contains(fn($g) => $g->approval_status === 'hod_approved');
                    $hasSubmitted = $grades->contains(fn($g) => $g->approval_status === 'submitted');
                    
                    if ($hasReleased || $hasApproved) {
                        $status = 'approved';
                    } elseif ($hasSubmitted) {
                        $status = 'pending_approval';
                    } else {
                        $status = 'no_grades';
                    }
                }
                
                $rejectionReason = $grades->first()?->rejection_reason ?? null;

                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'credit_units' => $course->credit_units,
                    'level' => $course->level,
                    'lecturer_name' => $course->lecturer?->user?->name ?? 'Unassigned',
                    'total_graded' => $totalGraded,
                    'passed' => $passed,
                    'failed' => $failed,
                    'absent' => $absent,
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

        return Inertia::render('HOD/Results/Index', [
            'courses' => $courses,
            'department_name' => $dept?->name ?? 'N/A',
            'semester_name' => $currentSemester?->name ?? 'N/A'
        ]);
    }

    public function approve(Request $request)
    {
        $deptId = $this->getHodDepartmentId();
        
        $request->validate([
            'course_id' => 'required|exists:courses,id'
        ]);

        $course = Course::find($request->course_id);
        if ($course->department_id !== $deptId) {
            abort(403, 'Unauthorized departmental course results approval.');
        }

        $currentSemester = Semester::where('is_current', true)->first();

        // Get grades linked to registrations in this semester
        $registrations = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester?->id)
            ->pluck('id');

        Grade::whereIn('course_registration_id', $registrations)
            ->update([
                'approval_status' => 'hod_approved',
                'rejection_reason' => null // Clear any prior rejection comments
            ]);

        return redirect()->back()->with('success', 'Grades sheet approved and finalized successfully!');
    }

    public function reject(Request $request)
    {
        $deptId = $this->getHodDepartmentId();

        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'reason' => 'required|string|max:1000'
        ]);

        $course = Course::find($request->course_id);
        if ($course->department_id !== $deptId) {
            abort(403, 'Unauthorized departmental course results action.');
        }

        $currentSemester = Semester::where('is_current', true)->first();

        $registrations = CourseRegistration::where('course_id', $course->id)
            ->where('semester_id', $currentSemester?->id)
            ->pluck('id');

        Grade::whereIn('course_registration_id', $registrations)
            ->update([
                'approval_status' => 'draft',
                'rejection_reason' => $request->reason
            ]);

        return redirect()->back()->with('success', 'Grades sheet sent back to the lecturer for preview revisions.');
    }
}
