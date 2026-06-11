<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, RateLimiter};
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class RoleMiddleware {
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = Auth::user();
        
        // Root Platform Governance: Super Admins bypass all localized container restraints
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        if (! $user || ! in_array($user->role, $roles, true)) {
            if ($request->header('X-Inertia')) {
                abort(403, 'Access denied: insufficient permissions.');
            }
            abort(403, 'Access denied.');
        }
        return $next($request);
    }
}
