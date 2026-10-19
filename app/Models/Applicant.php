<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;

class Applicant extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $guard = 'applicant';

    protected $fillable = [
        'admission_form_id',
        'jamb_number',
        'password',
        'full_name',
        'dob',
        'place_of_birth',
        'lga',
        'state_of_origin',
        'nationality',
        'email',
        'contact_address',
        'phone_number',
        'sex',
        'next_of_kin_name',
        'next_of_kin_address',
        'physical_disabilities',
        'highest_qualification',
        'jamb_score',
        
        // Schools Attended
        'primary_school_name',
        'primary_school_from',
        'primary_school_to',
        'secondary_school_name',
        'secondary_school_from',
        'secondary_school_to',
        'tertiary_school_name',
        'tertiary_school_from',
        'tertiary_school_to',

        // O'Levels
        'first_sitting_type',
        'first_sitting_year',
        'first_sitting_no',
        'first_sitting_grades',
        'second_sitting_type',
        'second_sitting_year',
        'second_sitting_no',
        'second_sitting_grades',

        // Parents/Sponsor
        'parent_name',
        'parent_address',
        'parent_phone',
        'sponsor_name_address',

        // System states
        'payment_status',
        'payment_reference',
        'amount_paid',
        'admission_status',
        'status',
        'admitted_program_id',
        'admitted_department_id',
        'admitted_section',
        'clearance_schedule',
        'rejection_reason',
        'clearance_rejection_reason',
        'data',
        'applied_program_id',
        'passport_photo',
        'exam_date',
        'exam_venue',
        'seat_number',
        'remarks',
        'acceptance_fee_paid',
        'acceptance_fee_amount',
        'acceptance_fee_reference',
        'acceptance_fee_paid_at',
        'registration_number',
    ];

    protected $appends = [
        'applicant_name',
        'applicant_email',
        'status',
        'data',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'dob' => 'date',
        'exam_date' => 'datetime',
        'first_sitting_grades' => 'array',
        'second_sitting_grades' => 'array',
        'amount_paid' => 'decimal:2',
        'acceptance_fee_paid' => 'boolean',
        'acceptance_fee_amount' => 'decimal:2',
        'acceptance_fee_paid_at' => 'datetime',
        'data' => 'array',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(AdmissionForm::class, 'admission_form_id');
    }

    public function admittedProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'admitted_program_id');
    }

    public function appliedProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'applied_program_id');
    }

    public function admittedDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'admitted_department_id');
    }

    public function getApplicantNameAttribute(): ?string
    {
        return $this->full_name;
    }

    public function getApplicantEmailAttribute(): ?string
    {
        return $this->email;
    }

    public function getStatusAttribute(): string
    {
        return $this->attributes['status'] ?? $this->attributes['admission_status'] ?? 'pending';
    }

    public function setStatusAttribute($value): void
    {
        $this->attributes['status'] = $value;
        $this->attributes['admission_status'] = $value;
    }

    public function setAdmissionStatusAttribute($value): void
    {
        $this->attributes['admission_status'] = $value;
        $this->attributes['status'] = $value;
    }

    public function getDataAttribute($value): array
    {
        if (!empty($value)) {
            $decoded = is_string($value) ? json_decode($value, true) : $value;
            if (is_array($decoded) && !empty($decoded)) {
                return $decoded;
            }
        }

        return [
            'jamb_number'           => $this->jamb_number,
            'phone_number'          => $this->phone_number,
            'phone'                 => $this->phone_number,
            'email'                 => $this->email,
            'full_name'             => $this->full_name,
            'jamb_score'            => $this->jamb_score,
            'state_of_origin'       => $this->state_of_origin,
            'lga'                   => $this->lga,
            'gender'                => $this->sex,
            'sex'                   => $this->sex,
            'date_of_birth'         => $this->dob ? ($this->dob instanceof \DateTimeInterface ? $this->dob->format('Y-m-d') : (string)$this->dob) : null,
            'dob'                   => $this->dob ? ($this->dob instanceof \DateTimeInterface ? $this->dob->format('Y-m-d') : (string)$this->dob) : null,
            'nationality'           => $this->nationality,
            'contact_address'       => $this->contact_address,
            'next_of_kin_name'      => $this->next_of_kin_name,
            'next_of_kin_address'   => $this->next_of_kin_address,
            'primary_school_name'   => $this->primary_school_name,
            'secondary_school_name' => $this->secondary_school_name,
            'first_sitting_type'    => $this->first_sitting_type,
            'first_sitting_year'    => $this->first_sitting_year,
            'first_sitting_no'      => $this->first_sitting_no,
            'first_sitting_grades'  => $this->first_sitting_grades,
            'second_sitting_type'   => $this->second_sitting_type,
            'second_sitting_year'   => $this->second_sitting_year,
            'second_sitting_no'     => $this->second_sitting_no,
            'second_sitting_grades' => $this->second_sitting_grades,
            'parent_name'           => $this->parent_name,
            'parent_phone'          => $this->parent_phone,
            'parent_address'        => $this->parent_address,
            'sponsor_name_address'  => $this->sponsor_name_address,
            'program'               => $this->appliedProgram?->name ?? ($this->admittedProgram?->name ?? 'ND/HND Nursing'),
            'passport_photo'        => $this->passport_photo,
        ];
    }

    /**
     * Generate sequential admission / registration number starting from 001 based on acceptance payment.
     * Format: ACONS/NUR/ND/26/001
     */
    public static function generateNextRegistrationNumber(self $applicant): string
    {
        $year = '26';
        $deptCode = 'NUR';
        if ($applicant->admittedDepartment && str_contains(strtolower($applicant->admittedDepartment->name), 'midwifer')) {
            $deptCode = 'MID';
        }
        $section = $applicant->admitted_section ?: 'ND';
        $prefix = "ACONS/{$deptCode}/{$section}/{$year}/";

        // Find the highest serial among applicants who have paid acceptance fee and have a registration number
        $lastReg = static::where('registration_number', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING_INDEX(registration_number, '/', -1) AS UNSIGNED) DESC")
            ->value('registration_number');

        if ($lastReg) {
            $parts = explode('/', $lastReg);
            $lastSerial = (int) end($parts);
            $nextSerial = str_pad($lastSerial + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $nextSerial = '001';
        }

        return $prefix . $nextSerial;
    }

    /**
     * Automatically provisions a student account and user upon acceptance fee clearance.
     * Uses applicant's phone number as both portal username and password.
     */
    public function provisionStudentAccount(): ?Student
    {
        $rawPhone = trim((string)$this->phone_number);
        $phoneDigits = preg_replace('/[^0-9]/', '', $rawPhone);
        $phone = !empty($phoneDigits) ? $phoneDigits : ($rawPhone ?: '08000000000');

        // Assign/ensure sequential admission number: ACONS/NUR/ND/26/001
        $matricNumber = $this->registration_number;
        if (empty($matricNumber)) {
            $matricNumber = static::generateNextRegistrationNumber($this);
            $this->update(['registration_number' => $matricNumber]);
            $this->registration_number = $matricNumber;
        }

        // Email address: use applicant email if present and valid, otherwise phone-based domain email
        $userEmail = (!empty($this->email) && filter_var($this->email, FILTER_VALIDATE_EMAIL))
            ? strtolower(trim($this->email))
            : ($phone . '@acons.edu.ng');

        // Find or create User record
        $user = User::where(function ($q) use ($phone, $userEmail) {
                $q->where('phone', $phone)
                  ->orWhere('email', $userEmail);
            })->first();

        if (!$user) {
            $user = User::create([
                'name'                  => $this->full_name,
                'email'                 => $userEmail,
                'phone'                 => $phone,
                'password'              => Hash::make($phone), // Phone number as password
                'gender'                => strtolower($this->sex ?: 'other'),
                'is_active'             => true,
                'force_password_change' => false,
            ]);
            $user->assignRole(User::ROLE_STUDENT);
        } else {
            // Keep user profile synced
            $user->update([
                'phone'     => $phone,
                'is_active' => true,
            ]);
            if (!$user->hasRole(User::ROLE_STUDENT)) {
                $user->assignRole(User::ROLE_STUDENT);
            }
        }

        // Determine Department and Program
        $deptId = $this->admitted_department_id ?: 1;
        $program = null;
        if ($this->admitted_program_id) {
            $program = Program::find($this->admitted_program_id);
        }
        if (!$program && $this->applied_program_id) {
            $program = Program::find($this->applied_program_id);
        }
        if (!$program) {
            $program = Program::where('department_id', $deptId)->first() ?: Program::first();
        }

        $programName = $program?->name ?? '';
        $initialLevel = 'ND1';
        if (stripos($programName, 'Basic') !== false || stripos($programName, 'General') !== false || stripos($programName, 'RN') !== false || stripos($programName, 'RM') !== false) {
            $initialLevel = 'Basic Nursing Level 1';
        }

        $gender = strtolower($this->sex ?: 'other');
        if (!in_array($gender, ['male', 'female', 'other'])) {
            $gender = 'other';
        }

        // Find or create Student profile
        $student = Student::where('user_id', $user->id)->first();
        if (!$student) {
            $student = Student::create([
                'user_id'                  => $user->id,
                'department_id'            => $deptId,
                'program_id'               => $program?->id,
                'matriculation_number'     => $matricNumber,
                'phone_number'             => $phone,
                'status'                   => 'active',
                'current_level'            => $initialLevel,
                'jamb_registration_number' => $this->jamb_number,
                'date_of_birth'            => $this->dob ? $this->dob->format('Y-m-d') : '2000-01-01',
                'gender'                   => $gender,
                'nationality'              => $this->nationality ?? 'Nigerian',
                'state_of_origin'          => $this->state_of_origin,
                'lga'                      => $this->lga,
                'academic_status'          => 'normal',
                'years_in_current_level'   => 1,
            ]);
        } else {
            if ($student->matriculation_number !== $matricNumber) {
                $student->update([
                    'matriculation_number' => $matricNumber,
                    'status'               => 'active',
                ]);
            }
        }

        // Update applicant status to cleared (physical clearance bypassed)
        if ($this->status !== 'cleared' || $this->admission_status !== 'cleared') {
            $this->update([
                'status'           => 'cleared',
                'admission_status' => 'cleared',
            ]);
            $this->status = 'cleared';
            $this->admission_status = 'cleared';
        }

        return $student;
    }
}
