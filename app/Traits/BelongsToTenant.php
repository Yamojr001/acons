<?php
namespace App\Traits;
use App\Scopes\TenantScope;
trait BelongsToTenant {
    protected static function bootBelongsToTenant(): void {
        static::addGlobalScope(new TenantScope());
        static::creating(function (self $model) {
            if (empty($model->tenant_id) && app()->has('currentTenant')) {
                $model->tenant_id = app('currentTenant')->id;
            }
            if (empty($model->tenant_id) && !app()->isLocal()) {
                throw new \RuntimeException('Attempted to create '.static::class.' without a tenant_id.');
            }
        });
    }
    public static function withoutTenantScope(): \Illuminate\Database\Eloquent\Builder {
        return static::withoutGlobalScope(TenantScope::class);
    }
}
