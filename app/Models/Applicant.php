<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToTenant;

class Applicant extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, BelongsToTenant;

    protected $guard = 'applicant';

    protected $fillable = [
        'tenant_id',
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

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

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
     * Generate sequential registration number starting from 001 based on acceptance payment.
     */
    public static function generateNextRegistrationNumber(self $applicant): string
    {
        $year = '2026';
        $section = $applicant->admitted_section ?: 'ND';
        $prefix = "ACONS/{$section}/{$year}/";

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
}
