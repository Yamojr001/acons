<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademicRecord extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "student_id", "semester_id", "gpa", "cgpa", "total_credit_units_registered", "total_credit_units_earned"];
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function semester(): BelongsTo { return $this->belongsTo(Semester::class); }
}
