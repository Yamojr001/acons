<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Lecturer extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'department_id',
        'employee_id',
        'hire_date',
        'qualification',
        'status',
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
    ];

    protected $casts = [
        'hire_date' => 'date',
    ];

    public function user(): BelongsTo        { return $this->belongsTo(User::class); }
    public function department(): BelongsTo  { return $this->belongsTo(Department::class); }
    public function courses(): HasMany       { return $this->hasMany(Course::class); }
}
