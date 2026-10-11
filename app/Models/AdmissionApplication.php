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
        'applicant_id',
        'applicant_name', 
        'applicant_email', 
        'data', 
        'status',
        'payment_status',
        'amount_paid',
        'payment_reference',
        'admitted_department_id',
        'admitted_section',
        'clearance_schedule',
        'rejection_reason',
        'clearance_rejection_reason',
    ];

    protected $casts = [
        'data' => 'json',
        'amount_paid' => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function form()
    {
        return $this->belongsTo(AdmissionForm::class, 'admission_form_id');
    }

    public function admittedDepartment()
    {
        return $this->belongsTo(Department::class, 'admitted_department_id');
    }
}
