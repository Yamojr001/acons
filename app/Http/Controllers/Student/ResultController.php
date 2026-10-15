<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Grade, Semester, Course};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, Hash, Storage, Cache};
use Inertia\{Inertia, Response};

class ResultController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $student = $user->student ? $user->student->load(['user', 'department']) : null;

        if (!$student) {
            abort(403, 'Unauthorized student profile.');
        }

        // 1. Mandatory Password Change Enforcement
        // Student cannot check results using their initial default registration number password
        if ($user->force_password_change || Hash::check($student->matriculation_number, $user->password)) {
            if (!$user->force_password_change) {
                $user->update(['force_password_change' => true]);
            }
            return redirect()->route('student.password.force')
                ->with('warning', 'Security Policy: You must change your default registration number password before viewing examination results.');
        }

        // 2. Mandatory Student Passport Enforcement
        // Student cannot view their academic transcript or results without an official passport photo uploaded
        $hasPassport = !empty($user->avatar);

        $studentDetails = [
            'name'            => $student->user->name,
            'matric_number'   => $student->matriculation_number,
            'level'           => $student->current_level,
            'department'      => $student->department->name ?? 'N/A',
            'avatar_url'      => $student->user->avatar_url,
            'gender'          => $student->gender ?? 'N/A',
            'cgpa'            => 0.00,
            'total_load'      => 0,
            'academic_status' => $student->academic_status ?? 'normal',
            'reseat_courses'  => [],
        ];

        // If passport is not yet uploaded, lock the results and request passport photograph upload
        if (!$hasPassport) {
            return Inertia::render('Student/Results', [
                'groupedResults'      => [],
                'studentDetails'      => $studentDetails,
                'pendingReleaseCount' => 0,
                'needs_passport'      => true,
                'has_passport'        => false,
            ]);
        }

        $cacheKey = 'student_results_' . $student->id;

        $allApprovedGrades = Grade::whereHas('registration', function($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->where('approval_status', 'approved')
            ->with(['registration.course', 'registration.semester.academicSession'])
            ->latest()
            ->get();

        $totalPoints = $allApprovedGrades->sum(fn($g) => $g->grade_points * ($g->registration->course->credit_units ?? 2));
        $totalUnits  = $allApprovedGrades->sum(fn($g) => ($g->registration->course->credit_units ?? 2));
        $cgpa        = $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;

        $reseatCourseCodes = [];
        if (!empty($student->reseat_course_ids)) {
            $reseatCourseCodes = Course::whereIn('id', $student->reseat_course_ids)->pluck('code')->toArray();
        }

        $studentDetails['cgpa'] = $cgpa;
        $studentDetails['total_load'] = $totalUnits;
        $studentDetails['reseat_courses'] = $reseatCourseCodes;

        $groupedResults = Cache::remember($cacheKey, now()->addDays(1), function() use ($allApprovedGrades) {
            return $allApprovedGrades->groupBy(function($g) {
                $session = $g->registration->semester->academicSession?->name ?? 'Academic Session';
                $sem = $g->registration->semester->name ?? 'Semester';
                return $session . ' - ' . $sem;
            })->map(function($grades, $sessionName) {
                $semesterLoad = $grades->sum(fn($g) => $g->registration->course->credit_units ?? 2);
                $first = $grades->first();
                return [
                    'session_name'          => $sessionName,
                    'academic_session_name' => $first->registration->semester->academicSession?->name ?? 'Academic Session',
                    'semester_name'         => $first->registration->semester->name ?? 'Semester',
                    'semester_load'         => $semesterLoad,
                    'grades'                => $grades->map(fn($g) => [
                        'course_code' => $g->registration->course->code,
                        'course_name' => $g->registration->course->name ?? $g->registration->course->title,
                        'units'       => (float)($g->registration->course->credit_units ?? 2),
                        'ca_score'    => $g->ca_score !== null ? (float)$g->ca_score : null,
                        'exam_score'  => $g->exam_score !== null ? (float)$g->exam_score : null,
                        'score'       => (float) $g->total_score,
                        'grade'       => $g->grade_letter,
                        'points'      => (float) $g->grade_points,
                    ]),
                    'semester_gpa'          => $this->calculateGPA($grades)
                ];
            });
        });

        $pendingReleaseCount = Grade::whereHas('registration', function($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->where('approval_status', 'hod_approved')
            ->count();

        return Inertia::render('Student/Results', [
            'groupedResults'      => $groupedResults,
            'studentDetails'      => $studentDetails,
            'pendingReleaseCount' => $pendingReleaseCount,
            'needs_passport'      => false,
            'has_passport'        => true,
        ]);
    }

    /**
     * Direct passport upload from result portal to unlock student results.
     */
    public function uploadPassport(Request $request)
    {
        $request->validate([
            'passport' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = Auth::user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('passport')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        if ($user->student) {
            Cache::forget('student_results_' . $user->student->id);
        }

        return redirect()->route('student.results')
            ->with('success', 'Official passport photograph uploaded successfully! Your examination results are now unlocked.');
    }

    private function calculateGPA($grades)
    {
        $totalPoints = $grades->sum(fn($g) => $g->grade_points * ($g->registration->course->credit_units ?? 2));
        $totalUnits  = $grades->sum(fn($g) => ($g->registration->course->credit_units ?? 2));
        
        return $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;
    }
}
