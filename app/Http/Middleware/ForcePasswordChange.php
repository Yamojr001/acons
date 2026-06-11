<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->force_password_change) {
            // Check if current route is the force password change page, post, or logout
            if (!$request->is('student/force-password-change*') && !$request->is('logout*') && !$request->is('_inertia*')) {
                return redirect()->route('student.password.force');
            }
        }

        return $next($request);
    }
}
