<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdmissionApplication extends Model
{
    use SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 
        'admission_form_id', 
        'applicant_name', 
        'applicant_email', 
        'data', 
        'status',
        'admitted_department_id',
        'admitted_section',
        'clearance_schedule',
        'rejection_reason',
        'clearance_rejection_reason',
    ];

    protected $casts = [
        'data' => 'json',
    ];

    public function form()
    {
        return $this->belongsTo(AdmissionForm::class, 'admission_form_id');
    }

    public function admittedDepartment()
    {
        return $this->belongsTo(Department::class, 'admitted_department_id');
    }
}
