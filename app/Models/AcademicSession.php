<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicSession extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "name", "start_date", "end_date", "is_current", "schedules"];
    protected $casts = ["start_date" => "date", "end_date" => "date", "is_current" => "boolean", "schedules" => "json"];

    public function semesters(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(Semester::class);
    }
}
