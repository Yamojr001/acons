<?php

namespace App\Http\Middleware;

use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class IdentifyTenant {
    public function __construct(private TenantResolver $resolver) {}

    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();

        $tenant = $this->resolver->resolve($host);

        if (!$tenant) {
            throw new NotFoundHttpException('School portal configuration not found.');
        }

        app()->instance('currentTenant', $tenant);
        config(['app.tenant_id' => $tenant->id]);

        return $next($request);
    }
}
