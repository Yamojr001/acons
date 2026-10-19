<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BroadcastRecipient extends Model
{
    protected $fillable = [
        'announcement_id',
        'recipient_type',
        'recipient_id',
        'recipient_name',
        'recipient_email',
        'recipient_phone',
        'formatted_phone',
        'sms_status',
        'sms_error',
        'sms_message_id',
        'sms_batch_id',
        'sms_sent_at',
        'email_status',
        'email_error',
        'email_sent_at',
        'retry_count',
        'last_attempt_at',
    ];

    protected $casts = [
        'sms_sent_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'last_attempt_at' => 'datetime',
        'retry_count' => 'integer',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }

    public function recipient(): MorphTo
    {
        return $this->morphTo();
    }
}
