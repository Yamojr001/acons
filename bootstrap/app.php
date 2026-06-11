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
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, $request) {
            return redirect()->route('landing')->with('error', 'You do not have permission to access that page.');
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, $request) {
            return redirect()->route('landing')->with('error', 'You do not have permission to access that page.');
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
