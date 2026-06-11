<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model {
    use SoftDeletes;
    protected $fillable = [
        'tenant_id', 
        'course_registration_id',
        'ca_score',
        'exam_score',
        'total_score',
        'is_absent',
        'grade_letter',
        'grade_points',
        'approval_status',
        'rejection_reason',
    ];
    
    public function registration(): BelongsTo { 
        return $this->belongsTo(CourseRegistration::class, 'course_registration_id'); 
    }

    protected static function boot()
    {
        parent::boot();

        static::saved(function ($grade) {
            $grade->loadMissing('registration');
            if ($grade->registration) {
                \Illuminate\Support\Facades\Cache::forget('student_results_' . $grade->registration->student_id);
            }
        });

        static::deleted(function ($grade) {
            $grade->loadMissing('registration');
            if ($grade->registration) {
                \Illuminate\Support\Facades\Cache::forget('student_results_' . $grade->registration->student_id);
            }
        });
    }
}
