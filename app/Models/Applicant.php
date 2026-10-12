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
        'admitted_program_id',
        'applied_program_id',
        'passport_photo',
        'exam_date',
        'exam_venue',
        'seat_number',
        'remarks'
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
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function admittedProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'admitted_program_id');
    }

    public function appliedProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'applied_program_id');
    }
}
