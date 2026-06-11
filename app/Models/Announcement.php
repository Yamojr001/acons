<?php
namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = ['tenant_id','created_by','title','body','audience','send_email','send_sms','published_at'];
    protected $casts = ['send_email' => 'boolean', 'send_sms' => 'boolean', 'published_at' => 'datetime'];

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
