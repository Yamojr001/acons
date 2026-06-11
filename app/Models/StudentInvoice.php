<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentInvoice extends Model {
    use SoftDeletes;
    protected $fillable = ["tenant_id", "student_id", "fee_id", "amount_due", "amount_paid", "status"];
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function fee(): BelongsTo { return $this->belongsTo(Fee::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
