<?php
namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = ['parent_id', 'student_invoice_id', 'amount', 'reference', 'payment_gateway', 'status', 'metadata'];
    protected $casts = ['amount' => 'decimal:2', 'metadata' => 'array'];

    public function studentInvoice(): BelongsTo { return $this->belongsTo(StudentInvoice::class); }

    public function student()
    {
        return $this->hasOneThrough(
            Student::class,
            StudentInvoice::class,
            'id',
            'id',
            'student_invoice_id',
            'student_id'
        );
    }
}
