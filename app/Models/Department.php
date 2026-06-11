<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "faculty_id", "name", "code", "hod_id"];
    public function faculty(): BelongsTo { return $this->belongsTo(Faculty::class); }
    public function hod(): BelongsTo { return $this->belongsTo(User::class, "hod_id"); }
    public function programs(): HasMany { return $this->hasMany(Program::class); }
    public function lecturers(): HasMany { return $this->hasMany(Lecturer::class); }
    public function students(): HasMany { return $this->hasMany(Student::class); }
    public function fees(): HasMany { return $this->hasMany(Fee::class); }
}
