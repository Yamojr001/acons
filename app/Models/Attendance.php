<?php
namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = ['tenant_id','student_id','class_room_id','date','status','note'];
    protected $casts = ['date' => 'date'];

    public function student(): BelongsTo   { return $this->belongsTo(Student::class); }
    public function classRoom(): BelongsTo { return $this->belongsTo(ClassRoom::class); }
}
