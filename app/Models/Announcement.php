<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'created_by',
        'course_id',
        'title',
        'body',
        'audience',
        'send_email',
        'send_sms',
        'total_recipients',
        'sms_sent_count',
        'sms_failed_count',
        'email_sent_count',
        'email_failed_count',
        'published_at',
    ];

    protected $casts = [
        'send_email' => 'boolean',
        'send_sms' => 'boolean',
        'published_at' => 'datetime',
        'total_recipients' => 'integer',
        'sms_sent_count' => 'integer',
        'sms_failed_count' => 'integer',
        'email_sent_count' => 'integer',
        'email_failed_count' => 'integer',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(BroadcastRecipient::class);
    }

    public function refreshDeliveryCounts(): void
    {
        $this->update([
            'total_recipients'   => $this->recipients()->count(),
            'sms_sent_count'     => $this->recipients()->where('sms_status', 'sent')->count(),
            'sms_failed_count'   => $this->recipients()->where('sms_status', 'failed')->count(),
            'email_sent_count'   => $this->recipients()->where('email_status', 'sent')->count(),
            'email_failed_count' => $this->recipients()->where('email_status', 'failed')->count(),
        ]);
    }
}
