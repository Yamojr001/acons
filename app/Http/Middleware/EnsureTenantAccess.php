<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, RateLimiter};
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class EnsureTenantAccess {
    public function handle(Request $request, Closure $next): Response
    {
        $user   = Auth::user();
        $tenant = app()->has('currentTenant') ? app('currentTenant') : null;

        if ($user && $tenant && (int) $user->tenant_id !== (int) $tenant->id) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors(['error' => 'Session mismatch. Please log in again.']);
        }

        return $next($request);
    }
}
