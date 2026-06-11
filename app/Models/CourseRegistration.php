<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CourseRegistration extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "student_id", "semester_id", "course_id", "status", "is_carryover"];
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
    public function grade(): HasOne { return $this->hasOne(Grade::class); }
}
