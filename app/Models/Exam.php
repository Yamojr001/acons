<?php
namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Exam extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = ['tenant_id','class_room_id','subject_id','title','term','exam_date','total_marks','passing_marks','description'];
    protected $casts = ['exam_date' => 'date'];

    public function classRoom(): BelongsTo { return $this->belongsTo(ClassRoom::class); }
    public function subject(): BelongsTo   { return $this->belongsTo(Course::class); }
    public function grades(): HasMany      { return $this->hasMany(Grade::class); }

    public function getStatusAttribute(): string {
        if ($this->exam_date->isFuture()) return 'upcoming';
        $graded = $this->grades()->count();
        $students = $this->classRoom->students()->count();
        return $graded >= $students ? 'graded' : 'grading';
    }
}
