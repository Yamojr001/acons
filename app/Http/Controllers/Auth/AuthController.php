<?php
namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash, RateLimiter};
use Illuminate\Validation\ValidationException;
use Inertia\{Inertia, Response as InertiaResponse};

class AuthController extends Controller {
    public function showLogin(): InertiaResponse {
        return Inertia::render('Auth/Login', ['canResetPassword' => true, 'status' => session('status')]);
    }

    public function login(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $key = 'login:'.$request->ip().':'.strtolower($request->email);
        $maxAttempts = config('auth.throttle.max_attempts', 5);
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $secs = RateLimiter::availableIn($key);
            throw ValidationException::withMessages(['email' => ["Too many attempts. Try again in {$secs} seconds."]]);
        }
        $tenantId = app()->has('currentTenant') ? app('currentTenant')->id : null;
        $query = User::where('email', $request->email)->where('is_active', true);
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        $user = $query->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, config('auth.throttle.decay_seconds', 900));
            $remaining = RateLimiter::remaining($key, $maxAttempts);
            throw ValidationException::withMessages(['email' => ["The provided credentials are incorrect. You have {$remaining} attempts remaining."]]);
        }
        // Universal Gateway: Centralizing login flow for global users
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $intendedPath = $this->dashboardRoute($user->role);
        
        // If a valid tenant student/staff logs into the ROOT domain, automatically route them into their isolated subdomain space!
        if (!$tenantId && $user->tenant_id && !$user->hasRole('super_admin')) {
            $tenant = \App\Models\Tenant::find($user->tenant_id);
            $host = $tenant->subdomain . '.' . str_replace(['http://', 'https://'], '', config('app.url'));
            
            // Localhost fallback for URL assembling (JS URL object crashes on subdomain.127.0.0.1)
            if (str_contains(request()->getHost(), '127.0.0.1')) {
                $port = request()->getPort();
                $host = $tenant->subdomain . '.localhost' . ($port !== 80 && $port !== 443 ? ':' . $port : '');
            }
            
            $url = request()->getScheme() . '://' . $host . $intendedPath;
            return Inertia::location($url);
        }

        return redirect()->intended($intendedPath);
    }

    public function logout(Request $request): RedirectResponse {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    public function showForgot(): InertiaResponse {
        return Inertia::render('Auth/ForgotPassword', ['status' => session('status')]);
    }

    public function sendReset(Request $request) {
        $request->validate(['email' => 'required|email']);
        \Illuminate\Support\Facades\Password::sendResetLink($request->only('email'));
        return back()->with('status', 'If an account with that email exists, a reset link has been sent.');
    }

    public function showReset(Request $request, string $token): InertiaResponse {
        return Inertia::render('Auth/ResetPassword', ['token' => $token, 'email' => $request->email]);
    }

    public function resetPassword(Request $request) {
        $request->validate(['token' => 'required', 'email' => 'required|email', 'password' => 'required|min:8|confirmed']);
        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) { $user->forceFill(['password' => Hash::make($password)])->save(); }
        );
        return $status === \Illuminate\Support\Facades\Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', 'Password reset successfully.')
            : back()->withErrors(['email' => [__($status)]]);
    }

    private function dashboardRoute(string $role): string {
        return match($role) {
            User::ROLE_SUPER_ADMIN       => '/superadmin/dashboard',
            User::ROLE_SCHOOL_ADMIN      => '/admin/dashboard',
            User::ROLE_LECTURER          => '/lecturer/dashboard',
            User::ROLE_TEACHER           => '/lecturer/dashboard',
            User::ROLE_STUDENT           => '/student/dashboard',
            User::ROLE_REGISTRAR         => '/registrar/dashboard',
            User::ROLE_BURSAR            => '/bursary/dashboard',
            User::ROLE_ADMISSION_OFFICER => '/admissions/dashboard',
            User::ROLE_EXAM_OFFICER      => '/exam-office/dashboard',
            User::ROLE_PROVOST           => '/admin/dashboard', // Provost uses Admin dash
            User::ROLE_HOD               => '/hod/dashboard',
            User::ROLE_DEAN              => '/dean/dashboard',
            default                 => '/',
        };
    }
}
