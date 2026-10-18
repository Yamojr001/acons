<?php
namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{RedirectResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash, RateLimiter, Log};
use Illuminate\Validation\ValidationException;
use Inertia\{Inertia, Response as InertiaResponse};

class AuthController extends Controller {
    public function showLogin(): InertiaResponse {
        return Inertia::render('Auth/Login', ['canResetPassword' => true, 'status' => session('status')]);
    }

    public function login(Request $request) {
        $loginInput = trim((string)$request->email);
        $ip = $request->ip();

        Log::info('Login process started', ['ip' => $ip, 'login' => $loginInput]);

        $request->validate(['email' => 'required|string', 'password' => 'required|string']);

        $key = 'login:'.$ip.':'.strtolower($loginInput);
        $maxAttempts = config('auth.throttle.max_attempts', 5);

        Log::info('Checking rate limit', ['key' => $key]);
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            Log::warning('Rate limit exceeded', ['login' => $loginInput]);
            $secs = RateLimiter::availableIn($key);
            throw ValidationException::withMessages(['email' => ["Too many attempts. Try again in {$secs} seconds."]]);
        }

        Log::info('Querying user from database', ['login' => $loginInput]);
        $cleanPhone = preg_replace('/[^0-9]/', '', $loginInput);

        try {
            $user = User::where('is_active', true)
                ->where(function ($query) use ($loginInput, $cleanPhone) {
                    $query->where('email', strtolower($loginInput))
                          ->orWhere('email', strtolower($loginInput) . '@acons.edu.ng');

                    if (!empty($cleanPhone) && strlen($cleanPhone) >= 7) {
                        $query->orWhere('phone', $cleanPhone)
                              ->orWhere('phone', 'like', '%' . substr($cleanPhone, -10));
                    }

                    $query->orWhereHas('student', function ($sq) use ($loginInput) {
                        $sq->where('matriculation_number', $loginInput)
                          ->orWhere('jamb_registration_number', $loginInput);
                    });
                })
                ->first();
        } catch (\Exception $e) {
            Log::error('Database error during user query', ['message' => $e->getMessage()]);
            throw $e;
        }

        if (!$user) {
            Log::warning('User not found or inactive', ['login' => $loginInput]);
        } elseif (!Hash::check($request->password, $user->password)) {
            Log::warning('Invalid password', ['login' => $loginInput]);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, config('auth.throttle.decay_seconds', 900));
            $remaining = RateLimiter::remaining($key, $maxAttempts);
            throw ValidationException::withMessages(['email' => ["The provided credentials are incorrect. You have {$remaining} attempts remaining."]]);
        }

        // IP-to-Email Student Lockout Check (2 Hours Window)
        // Prevents students from logging into peers' accounts on the same device/IP to view others' results
        if ($user->hasRole('student') || $user->role === 'student') {
            $ipLockKey = 'ip_student_lock:' . $ip;
            $ipLockData = \Illuminate\Support\Facades\Cache::get($ipLockKey);

            if ($ipLockData && is_array($ipLockData)) {
                $lockedEmail = strtolower($ipLockData['email'] ?? '');
                $expiresAt   = $ipLockData['expires_at'] ?? 0;

                if ($lockedEmail && $lockedEmail !== strtolower($user->email) && now()->timestamp < $expiresAt) {
                    $remainingMinutes = max(1, (int) ceil(($expiresAt - now()->timestamp) / 60));
                    Log::warning('IP lockout triggered: different student login attempted on locked device', [
                        'ip' => $ip,
                        'locked_to' => $lockedEmail,
                        'attempted' => $user->email,
                        'minutes_remaining' => $remainingMinutes,
                    ]);

                    // Obfuscate the locked email for security (e.g. aco***@acons.edu.ng)
                    $parts = explode('@', $lockedEmail);
                    $maskedName = substr($parts[0], 0, 3) . '***' . substr($parts[0], -2);
                    $maskedEmail = $maskedName . '@' . ($parts[1] ?? 'acons.edu.ng');

                    throw ValidationException::withMessages([
                        'email' => [
                            "Device Security Lockout: This device is currently bound to student account ({$maskedEmail}) for examination privacy. You cannot log in with another student account on this device for another {$remainingMinutes} minute(s)."
                        ],
                    ]);
                }
            }
        }

        Log::info('Authenticating user', ['user_id' => $user->id]);
        try {
            Auth::login($user, $request->boolean('remember'));
            Log::info('Regenerating session');
            $request->session()->regenerate();
            RateLimiter::clear($key);

            // If the user is a student, bind this IP to their email for 2 hours
            if ($user->hasRole('student') || $user->role === 'student') {
                $ipLockKey = 'ip_student_lock:' . $ip;
                \Illuminate\Support\Facades\Cache::put($ipLockKey, [
                    'email' => strtolower($user->email),
                    'expires_at' => now()->addHours(2)->timestamp,
                ], now()->addHours(2));

                Log::info('Device/IP locked to student email for 2 hours', [
                    'ip' => $ip,
                    'email' => $user->email,
                    'expires_at' => now()->addHours(2)->toDateTimeString(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error during Auth::login or session regeneration', ['message' => $e->getMessage()]);
            throw $e;
        }

        Log::info('Login successful, determining route', ['role' => $user->role]);
        $route = $this->dashboardRoute($user->role);
        Log::info('Redirecting', ['route' => $route]);
        return redirect()->intended($route);
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

    private function dashboardRoute(?string $role): string {
        return match($role) {
            User::ROLE_SUPER_ADMIN       => '/superadmin/system-health',
            User::ROLE_SCHOOL_ADMIN      => '/admin/dashboard',
            User::ROLE_LECTURER          => '/lecturer/dashboard',
            User::ROLE_TEACHER           => '/lecturer/dashboard',
            User::ROLE_STUDENT           => '/student/dashboard',
            User::ROLE_REGISTRAR         => '/registrar/dashboard',
            User::ROLE_BURSAR            => '/bursary/dashboard',
            User::ROLE_ADMISSION_OFFICER => '/admissions/dashboard',
            User::ROLE_EXAM_OFFICER      => '/exam-office/dashboard',
            User::ROLE_PROVOST           => '/provost/dashboard',
            User::ROLE_HOD               => '/hod/dashboard',
            User::ROLE_DEAN              => '/dean/dashboard',
            default                      => '/',
        };
    }
}
