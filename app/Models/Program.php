<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Program extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "department_id", "name", "degree_type", "duration_years"];
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
}
