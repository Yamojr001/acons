<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, MorphTo};

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'email',
        'payer_name',
        'payable_type',
        'payable_id',
        'type',
        'amount',
        'currency',
        'status',
        'payment_method',
        'reference',
        'metadata'
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
}
