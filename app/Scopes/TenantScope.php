<?php
namespace App\Scopes;
use Illuminate\Database\Eloquent\{Builder, Model, Scope};
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        if (app()->has('currentTenant')) {
            $builder->where($model->getTable().'.tenant_id', app('currentTenant')->id);
        }
    }
}
