<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdmissionForm extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'description', 'fields', 'is_active',
        'admission_year', 'academic_session_id', 'nursing_limit', 'midwifery_limit',
        'opening_date',
        'closing_date',
        'registration_start_date',
        'default_clearance_schedule',
    ];

    protected $casts = [
        'fields' => 'json',
        'is_active' => 'boolean',
        'opening_date' => 'date',
        'closing_date' => 'date',
        'registration_start_date' => 'date',
    ];

    public function applicants()
    {
        return $this->hasMany(Applicant::class, 'admission_form_id');
    }

    public function applications()
    {
        return $this->applicants();
    }
}
