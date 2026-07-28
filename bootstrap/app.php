<?php

use App\Http\Middleware\{
    HandleInertiaRequests,
    IdentifyTenant,
    SecurityHeaders,
    EnsureTenantAccess,
    ThrottleByTenant,
};
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\{Exceptions, Middleware};
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'identify.tenant'    => IdentifyTenant::class,
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'tenant.access'      => EnsureTenantAccess::class,
            'security.headers'   => SecurityHeaders::class,
            'throttle.tenant'    => ThrottleByTenant::class,
            'force.password.change' => \App\Http\Middleware\ForcePasswordChange::class,
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $accessDeniedRedirect = function ($request) {
            $user = $request->user();

            // Authenticated users get sent back to *their own* dashboard, not the
            // public marketing page — landing there looked like a mysterious
            // redirect to "Academic Portal" and gave no indication of what happened.
            if ($user) {
                $route = match ($user->role) {
                    \App\Models\User::ROLE_SUPER_ADMIN       => '/superadmin/system-health',
                    \App\Models\User::ROLE_SCHOOL_ADMIN      => '/admin/dashboard',
                    \App\Models\User::ROLE_LECTURER,
                    \App\Models\User::ROLE_TEACHER           => '/lecturer/dashboard',
                    \App\Models\User::ROLE_STUDENT           => '/student/dashboard',
                    \App\Models\User::ROLE_REGISTRAR         => '/registrar/dashboard',
                    \App\Models\User::ROLE_BURSAR            => '/bursary/dashboard',
                    \App\Models\User::ROLE_ADMISSION_OFFICER => '/admissions/dashboard',
                    \App\Models\User::ROLE_EXAM_OFFICER      => '/exam-office/dashboard',
                    \App\Models\User::ROLE_PROVOST           => '/provost/dashboard',
                    \App\Models\User::ROLE_HOD               => '/hod/dashboard',
                    \App\Models\User::ROLE_DEAN               => '/dean/dashboard',
                    default                                  => '/',
                };
                return redirect($route)->with('error', 'You do not have permission to access that page.');
            }

            return redirect()->route('login')->with('error', 'Please log in to continue.');
        };

        $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, $request) use ($accessDeniedRedirect) {
            Log::warning('Unauthorized access attempt (Spatie)', [
                'url' => $request->url(),
                'user_id' => $request->user()?->id,
                'role' => $request->user()?->role,
                'message' => $e->getMessage()
            ]);
            return $accessDeniedRedirect($request);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, $request) use ($accessDeniedRedirect) {
            Log::warning('Access denied attempt (HttpKernel)', [
                'url' => $request->url(),
                'user_id' => $request->user()?->id,
                'role' => $request->user()?->role,
                'message' => $e->getMessage()
            ]);
            return $accessDeniedRedirect($request);
        });
        
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::render('Error', [
                    'status'  => $e->getStatusCode(),
                    'message' => $e->getMessage() ?: 'An error occurred.',
                ])->toResponse($request)->setStatusCode($e->getStatusCode());
            }
        });
    })
    ->create();
