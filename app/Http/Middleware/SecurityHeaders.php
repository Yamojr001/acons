<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders {
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        $isProduction = app()->environment('production');

        if ($isProduction) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        }

        $cspArray = [
            "default-src 'self'",
            "font-src 'self' https://fonts.gstatic.com data:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        if ($isProduction) {
            $cspArray[] = "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.paystack.com";
            $cspArray[] = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
            $cspArray[] = "img-src 'self' data: https: blob:";
            $cspArray[] = "connect-src 'self' https://api.stripe.com https://api.paystack.co wss:";
            $cspArray[] = "frame-src https://js.stripe.com https://checkout.paystack.com";
        } else {
            // Allow Vite HMR and local cross-origin dev framing
            $cspArray[] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:* http://localhost:* https://js.stripe.com https://checkout.paystack.com";
            $cspArray[] = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com http://127.0.0.1:* http://localhost:*";
            $cspArray[] = "img-src 'self' data: https: blob: http://127.0.0.1:* http://localhost:*";
            $cspArray[] = "connect-src 'self' ws: wss: http://127.0.0.1:* http://localhost:* https://api.stripe.com https://api.paystack.co";
            $cspArray[] = "frame-src 'self' http://127.0.0.1:* http://localhost:* https://js.stripe.com https://checkout.paystack.com";
        }

        $csp = implode('; ', $cspArray);
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }
}
