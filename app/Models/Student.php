<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'department_id',
        'program_id',
        'matriculation_number',
        'jamb_registration_number',
        'current_level',
        'date_of_birth',
        'gender',
        'phone_number',
        'address',
        'nationality',
        'state_of_origin',
        'lga',
        'blood_group',
        'genotype',
        'allergies',
        'next_of_kin_name',
        'next_of_kin_relationship',
        'next_of_kin_phone',
        'next_of_kin_email',
        'next_of_kin_address',
        'status',
        'academic_status',
        'years_in_current_level',
        'reseat_course_ids',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'reseat_course_ids' => 'array',
    ];

    public function user(): BelongsTo        { return $this->belongsTo(User::class); }
    public function department(): BelongsTo  { return $this->belongsTo(Department::class); }
    public function program(): BelongsTo     { return $this->belongsTo(Program::class); }
    public function invoices(): HasMany      { return $this->hasMany(StudentInvoice::class); }
    public function payments()               { return $this->hasManyThrough(Payment::class, StudentInvoice::class); }
    public function registrations(): HasMany { return $this->hasMany(CourseRegistration::class); }
    public function courseRegistrations(): HasMany { return $this->hasMany(CourseRegistration::class); }
    public function academicRecords(): HasMany { return $this->hasMany(AcademicRecord::class); }

    public function recalculateAcademicStatus(): void
    {
        $registrations = CourseRegistration::where('student_id', $this->id)
            ->whereHas('course', function ($query) {
                $query->where('level', $this->current_level);
            })
            ->with(['course', 'grade'])
            ->get();

        $totalRegistered = $registrations->count();
        if ($totalRegistered === 0) {
            return;
        }

        // Fetch graded and approved registrations
        $gradedRegistrations = $registrations->filter(fn($reg) => $reg->grade && $reg->grade->approval_status === 'approved');

        // If not all registered courses for the level are approved, do not compute yet
        if ($gradedRegistrations->count() < $totalRegistered) {
            return;
        }

        $failedRegistrations = $gradedRegistrations->filter(function ($reg) {
            $grade = $reg->grade;
            if (!$grade) return false;
            if ($grade->is_absent) {
                return true;
            }
            return $grade->grade_letter === 'FAIL' || $grade->grade_letter === 'F' || (float)$grade->total_score < 45;
        });

        $failedCount = $failedRegistrations->count();

        // Count distinct academic sessions student has registered for at this level
        $sessionsCount = CourseRegistration::where('student_id', $this->id)
            ->whereHas('course', fn($q) => $q->where('level', $this->current_level))
            ->join('semesters', 'course_registrations.semester_id', '=', 'semesters.id')
            ->distinct('semesters.academic_session_id')
            ->count('semesters.academic_session_id');

        $effectiveYearsInLevel = max(1, $sessionsCount);

        // 1. Success case: passed all courses!
        if ($failedCount === 0) {
            $this->academic_status = 'normal';
            $this->years_in_current_level = 1;
            $this->reseat_course_ids = null;
            if ($this->status === 'withdrawn') {
                $this->status = 'active';
            }

            // Session level promotion rules
            $progressionMap = [
                'Basic Nursing Level 1' => 'Basic Nursing Level 2',
                'Basic Nursing Level 2' => 'Basic Nursing Level 3',
                'Basic Nursing Level 3' => 'Graduated',
                'ND1' => 'ND2',
                'ND2' => 'HND1',
                'HND1' => 'HND2',
                'HND2' => 'Graduated',
            ];

            if (isset($progressionMap[$this->current_level])) {
                $this->current_level = $progressionMap[$this->current_level];
                if ($this->current_level === 'Graduated') {
                    $this->status = 'graduated';
                }
            }
            $this->save();
            return;
        }

        // 2. Failure Case: Student failed some courses
        $failedMoreThanHalf = $failedCount > ($totalRegistered / 2);

        // If the student has spent 2 or more academic sessions in this level and still fails > 50%:
        // Cannot spend more than 2 years in the same level ➔ WITHDRAWN
        if ($effectiveYearsInLevel >= 2 && $failedMoreThanHalf) {
            $this->academic_status = 'withdrawn';
            $this->status = 'withdrawn';
            $this->years_in_current_level = $effectiveYearsInLevel;
            $this->reseat_course_ids = null;
            $this->save();
            return;
        }

        // Failed more than 50% of registered courses ➔ REPEAT the level
        if ($failedMoreThanHalf) {
            $this->academic_status = 'repeat';
            $this->status = 'active';
            $this->years_in_current_level = 1;
            $this->reseat_course_ids = null;
            $this->save();
            return;
        }

        // Failed 50% or fewer of registered courses (e.g. 1-5 out of 11) ➔ Eligible for RESIT
        $this->academic_status = 'reseat';
        $this->status = 'active';
        $this->years_in_current_level = $effectiveYearsInLevel;
        $this->reseat_course_ids = $failedRegistrations->pluck('course_id')->values()->toArray();
        $this->save();
    }
}
