<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Course extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'department_id',
        'lecturer_id',
        'name',
        'code',
        'credit_units',
        'level',
        'semester_type',
        'type', // core, elective, etc
    ];

    public function department(): BelongsTo   { return $this->belongsTo(Department::class); }
    public function lecturer(): BelongsTo     { return $this->belongsTo(Lecturer::class); }
    public function registrations(): HasMany { return $this->hasMany(CourseRegistration::class); }
}
