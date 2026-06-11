<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Semester extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "academic_session_id", "name", "start_date", "end_date", "is_current", "schedules"];
    protected $casts = ["start_date" => "date", "end_date" => "date", "is_current" => "boolean", "schedules" => "json"];
    public function academicSession(): BelongsTo { return $this->belongsTo(AcademicSession::class); }
}
