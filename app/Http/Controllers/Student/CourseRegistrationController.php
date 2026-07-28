<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseRegistration;
use App\Models\Semester;
use App\Models\StudentInvoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CourseRegistrationController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('currentTenant');
        $student = $request->user()->student;
        
        $currentSemester = Semester::with('academicSession')
                                    ->where('tenant_id', $tenant->id)
                                    ->where('is_current', true)
                                    ->firstOrFail();
        $academicSession = $currentSemester->academicSession;

        // 1. Check if Tuition is paid before allowing registration
        $tuitionInvoice = StudentInvoice::where('student_id', $student->id)
            ->whereHas('fee', function($query) {
                $query->where('fee_type', 'tuition');
            })
            ->where('status', '!=', 'paid')
            ->first();

        if ($tuitionInvoice) {
            return Inertia::render('Student/CourseRegistration/Blocked', [
                'message' => 'You must pay your tuition fee before registering for courses.'
            ]);
        }

        // Calculate eligible levels for progression
        $eligibleLevels = [$student->current_level];
        if ($student->current_level === 'ND1') {
            $eligibleLevels[] = 'ND2';
        } elseif ($student->current_level === 'ND2') {
            $eligibleLevels[] = 'HND1';
        } elseif ($student->current_level === 'HND1') {
            $eligibleLevels[] = 'HND2';
        } elseif ($student->current_level === 'Basic Nursing Level 1') {
            $eligibleLevels[] = 'Basic Nursing Level 2';
        } elseif ($student->current_level === 'Basic Nursing Level 2') {
            $eligibleLevels[] = 'Basic Nursing Level 3';
        }

        $selectedLevel = $student->current_level;

        // Auto-register the student if they have no registrations in this current semester yet
        $alreadyRegistered = CourseRegistration::where('student_id', $student->id)
            ->where('semester_id', $currentSemester->id)
            ->exists();

        if (!$alreadyRegistered) {
            $coursesToRegister = Course::where('department_id', $student->department_id)
                ->where('level', $selectedLevel)
                ->get();

            foreach ($coursesToRegister as $course) {
                CourseRegistration::create([
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'semester_id' => $currentSemester->id,
                    'course_id' => $course->id,
                    'status' => 'approved' // Automatically approved
                ]);
            }
        }

        // 2. Fetch available courses for the student's department and level
        $availableCourses = Course::where('department_id', $student->department_id)
            ->where('level', $selectedLevel)
            ->get();

        // 3. Fetch already registered courses
        $registeredCourses = CourseRegistration::with('course')
            ->where('student_id', $student->id)
            ->where('semester_id', $currentSemester->id)
            ->get();

        // 4. Fetch units already registered in this ENTIRE academic session (year)
        $unitsRegisteredThisYear = CourseRegistration::where('student_id', $student->id)
            ->whereHas('semester', function($q) use ($academicSession) {
                $q->where('academic_session_id', $academicSession->id);
            })
            // exclude the current semester we are editing so we don't double count if they have pending ones here
            ->where('semester_id', '!=', $currentSemester->id)
            ->join('courses', 'course_registrations.course_id', '=', 'courses.id')
            ->sum('courses.credit_units');

        return Inertia::render('Student/CourseRegistration/Index', [
            'availableCourses' => $availableCourses,
            'registeredCourses' => $registeredCourses,
            'currentSemester' => $currentSemester,
            'maxCreditUnitsPerYear' => $tenant->settings['max_credit_units_per_year'] ?? 48,
            'minCreditUnitsPerYear' => $tenant->settings['min_credit_units_per_year'] ?? 30,
            'unitsRegisteredThisYear' => $unitsRegisteredThisYear,
            'eligibleLevels' => $eligibleLevels,
            'selectedLevel' => $selectedLevel,
            'studentDetails' => [
                'name' => $student->user->name,
                'matric_number' => $student->matriculation_number,
                'department' => $student->department->name ?? 'N/A',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        $student = $request->user()->student;
        
        $currentSemester = Semester::with('academicSession')
                                    ->where('tenant_id', $tenant->id)
                                    ->where('is_current', true)
                                    ->firstOrFail();
        $academicSession = $currentSemester->academicSession;

        $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'exists:courses,id'
        ]);

        $courses = Course::whereIn('id', $request->course_ids)->get();
        $selectedUnits = $courses->sum('credit_units');
        
        $maxUnitsPerYear = $tenant->settings['max_credit_units_per_year'] ?? 48;

        // Fetch units already registered in this ENTIRE academic session (year), excluding this semester
        $unitsRegisteredThisYear = CourseRegistration::where('student_id', $student->id)
            ->whereHas('semester', function($q) use ($academicSession) {
                $q->where('academic_session_id', $academicSession->id);
            })
            ->where('semester_id', '!=', $currentSemester->id)
            ->join('courses', 'course_registrations.course_id', '=', 'courses.id')
            ->sum('courses.credit_units');

        $projectedTotalForYear = $unitsRegisteredThisYear + $selectedUnits;

        if ($projectedTotalForYear > $maxUnitsPerYear) {
            return back()->withErrors(['course_ids' => "You cannot register more than {$maxUnitsPerYear} credit units per year. You currently have {$unitsRegisteredThisYear} units from other semesters, and are trying to add {$selectedUnits}."]);
        }

        // Calculate eligible levels for progression validation
        $eligibleLevels = [$student->current_level];
        if ($student->current_level === 'ND1') {
            $eligibleLevels[] = 'ND2';
        } elseif ($student->current_level === 'ND2') {
            $eligibleLevels[] = 'HND1';
        } elseif ($student->current_level === 'HND1') {
            $eligibleLevels[] = 'HND2';
        } elseif ($student->current_level === 'Basic Nursing Level 1') {
            $eligibleLevels[] = 'Basic Nursing Level 2';
        } elseif ($student->current_level === 'Basic Nursing Level 2') {
            $eligibleLevels[] = 'Basic Nursing Level 3';
        }

        DB::transaction(function () use ($courses, $student, $currentSemester, $tenant, $eligibleLevels) {
            // Delete pending registrations for this semester
            CourseRegistration::where('student_id', $student->id)
                ->where('semester_id', $currentSemester->id)
                ->where('status', 'pending')
                ->delete();

            foreach ($courses as $course) {
                CourseRegistration::create([
                    'tenant_id' => $tenant->id,
                    'student_id' => $student->id,
                    'semester_id' => $currentSemester->id,
                    'course_id' => $course->id,
                    'status' => 'pending', // Requires Course Adviser Approval
                ]);
            }

            // Automated progression / matric number regeneration when transitioning to HND1
            $hasHnd1Courses = $courses->contains(function ($c) {
                return $c->level === 'HND1';
            });

            if ($hasHnd1Courses && $student->current_level === 'ND2') {
                // 1. Promote student level to HND1
                $student->current_level = 'HND1';
                
                // 2. Generate a brand new HND matriculation number!
                $deptName = $student->department?->name ?? '';
                $deptCode = $student->department?->code ?? '';

                if (stripos($deptName, 'midwifery') !== false || stripos($deptCode, 'mid') !== false) {
                    $deptAbbr = 'MID';
                } elseif (stripos($deptName, 'nursing') !== false || stripos($deptCode, 'nur') !== false) {
                    $deptAbbr = 'NUR';
                } else {
                    $deptAbbr = strtoupper(substr($deptCode ?: $deptName ?: 'GEN', 0, 3));
                }

                // Get active session year YY
                $yearYY = $currentSemester->academicSession?->name ? substr(explode('/', $currentSemester->academicSession->name)[0], -2) : now()->format('y');

                $prefix = "ACONS/HND/{$deptAbbr}/{$yearYY}/";

                // Query existing students with this new HND prefix to find the next serial
                $lastMatric = \App\Models\Student::where('matriculation_number', 'like', $prefix . '%')
                    ->orderBy('matriculation_number', 'desc')
                    ->first();

                if ($lastMatric) {
                    $parts = explode('/', $lastMatric->matriculation_number);
                    $lastSerial = (int) end($parts);
                    $nextSerial = str_pad($lastSerial + 1, 3, '0', STR_PAD_LEFT);
                } else {
                    $nextSerial = '001';
                }

                $student->matriculation_number = $prefix . $nextSerial;
                $student->save();
            } else {
                // General level promotion for other levels
                $courseLevels = $courses->pluck('level')->unique();
                if ($courseLevels->count() === 1) {
                    $targetLvl = $courseLevels->first();
                    if (in_array($targetLvl, $eligibleLevels) && $targetLvl !== $student->current_level) {
                        $student->current_level = $targetLvl;
                        $student->save();
                    }
                }
            }
        });

        return back()->with('success', 'Courses submitted for Adviser approval.');
    }
}
