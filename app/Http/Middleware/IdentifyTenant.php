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

        if (str_ends_with($host, '.localhost') && $host !== 'localhost') {
            $port = $request->getPort();
            $target = $request->getScheme() . '://localhost' . ($port ? ':' . $port : '') . $request->getRequestUri();
            return redirect()->away($target);
        }

        if (str_ends_with($host, '.127.0.0.1') && $host !== '127.0.0.1') {
            $port = $request->getPort();
            $target = $request->getScheme() . '://127.0.0.1' . ($port ? ':' . $port : '') . $request->getRequestUri();
            return redirect()->away($target);
        }

        $tenant = $this->resolver->resolve($host);

        if (!$tenant) {
            throw new NotFoundHttpException('Ameenatu College Of Nursing Science portal configuration not found.');
        }

        app()->instance('currentTenant', $tenant);
        config(['app.tenant_id' => $tenant->id]);

        return $next($request);
    }
}
