<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassSubjectTeacher extends Pivot
{
    use SoftDeletes;
    protected $table = 'class_subject_teacher';

    public function classRoom(): BelongsTo { return $this->belongsTo(ClassRoom::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Course::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(Lecturer::class); }
}
