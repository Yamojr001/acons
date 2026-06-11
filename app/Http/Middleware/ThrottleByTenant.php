<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, RateLimiter};
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ThrottleByTenant {
    public function handle(Request $request, Closure $next, int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $tenantId = app()->has('currentTenant') ? app('currentTenant')->id : 'global';
        $key = "throttle:tenant:{$tenantId}:" . $request->ip();

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            abort(429, "Too many requests. Retry in {$seconds} seconds.");
        }

        RateLimiter::hit($key, $decayMinutes * 60);
        return $next($request);
    }
}
