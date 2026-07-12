<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Student extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
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

    public function tenant(): BelongsTo      { return $this->belongsTo(Tenant::class); }
    public function user(): BelongsTo        { return $this->belongsTo(User::class); }
    public function department(): BelongsTo  { return $this->belongsTo(Department::class); }
    public function program(): BelongsTo     { return $this->belongsTo(Program::class); }
    public function invoices(): HasMany      { return $this->hasMany(StudentInvoice::class); }
    public function payments()               { return $this->hasManyThrough(Payment::class, StudentInvoice::class); }
    public function registrations(): HasMany { return $this->hasMany(CourseRegistration::class); }
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

        $programName = $this->program?->name ?? '';
        $isBasicNursing = (
            stripos($programName, 'Basic') !== false ||
            stripos($programName, 'General') !== false ||
            stripos($programName, 'RN') !== false ||
            stripos($programName, 'RM') !== false ||
            stripos($this->current_level, 'Basic') !== false
        );

        $failedRegistrations = $gradedRegistrations->filter(function ($reg) use ($isBasicNursing) {
            $grade = $reg->grade;
            if ($grade->is_absent) {
                return true;
            }
            if ($isBasicNursing) {
                return $grade->grade_letter === 'FAIL' || $grade->total_score < 50;
            } else {
                return $grade->grade_letter === 'F' || $grade->total_score < 40;
            }
        });

        $failedCount = $failedRegistrations->count();

        // 1. Success case: passed all courses!
        if ($failedCount === 0) {
            $this->academic_status = 'normal';
            $this->years_in_current_level = 1;
            $this->reseat_course_ids = null;

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
        // A. If they were already in repeating status:
        if ($this->academic_status === 'repeat') {
            $failedMoreThanHalf = $failedCount > ($totalRegistered / 2);
            
            // Check if they failed any of their prior reseats
            $priorReseats = $this->reseat_course_ids ?: [];
            $failedPriorReseat = false;
            foreach ($failedRegistrations as $reg) {
                if (in_array($reg->course_id, $priorReseats)) {
                    $failedPriorReseat = true;
                    break;
                }
            }

            if ($failedMoreThanHalf || $failedPriorReseat) {
                // Cannot repeat twice ➔ Withdraw!
                $this->academic_status = 'withdrawn';
                $this->status = 'withdrawn';
            } else {
                // Failed <= 50% during repeat ➔ Can reseat!
                $this->academic_status = 'reseat';
                $this->reseat_course_ids = $failedRegistrations->pluck('course_id')->toArray();
            }
            $this->save();
            return;
        }

        // B. If they were in reseat status:
        if ($this->academic_status === 'reseat') {
            $priorReseats = $this->reseat_course_ids ?: [];
            $failedPriorReseat = false;
            foreach ($failedRegistrations as $reg) {
                if (in_array($reg->course_id, $priorReseats)) {
                    $failedPriorReseat = true;
                    break;
                }
            }

            if ($failedPriorReseat) {
                // Failed a single reseat course ➔ repeat the level
                $this->academic_status = 'repeat';
                $this->years_in_current_level += 1;
                if ($this->years_in_current_level > 2) {
                    $this->academic_status = 'withdrawn';
                    $this->status = 'withdrawn';
                }
            } else {
                // Failed new/other courses
                $failedMoreThanHalf = $failedCount > ($totalRegistered / 2);
                if ($failedMoreThanHalf) {
                    $this->academic_status = 'repeat';
                    $this->years_in_current_level += 1;
                    if ($this->years_in_current_level > 2) {
                        $this->academic_status = 'withdrawn';
                        $this->status = 'withdrawn';
                    }
                } else {
                    $this->academic_status = 'reseat';
                    $this->reseat_course_ids = $failedRegistrations->pluck('course_id')->toArray();
                }
            }
            $this->save();
            return;
        }

        // C. If they were in normal status:
        if ($this->academic_status === 'normal') {
            $failedMoreThanHalf = $failedCount > ($totalRegistered / 2);

            if ($failedMoreThanHalf) {
                $this->academic_status = 'repeat';
                $this->years_in_current_level += 1;
                if ($this->years_in_current_level > 2) {
                    $this->academic_status = 'withdrawn';
                    $this->status = 'withdrawn';
                }
            } else {
                $this->academic_status = 'reseat';
                $this->reseat_course_ids = $failedRegistrations->pluck('course_id')->toArray();
            }
            $this->save();
            return;
        }
    }
}
