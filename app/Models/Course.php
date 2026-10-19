<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
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

    public function getTitleAttribute(): ?string
    {
        return $this->name;
    }
}
