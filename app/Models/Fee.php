<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class Fee extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'academic_session_id',
        'department_id',
        'level',
        'name',
        'fee_type',
        'amount',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function academicSession(): BelongsTo { return $this->belongsTo(AcademicSession::class); }
    public function department(): BelongsTo      { return $this->belongsTo(Department::class); }
    public function invoices(): HasMany          { return $this->hasMany(StudentInvoice::class); }
}
