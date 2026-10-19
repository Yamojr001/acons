<?php
// ─────────────────────────────────────────────────────────────────────────────
// HandleInertiaRequests - shares auth + tenant data with every Inertia page
// ─────────────────────────────────────────────────────────────────────────────
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $institution = \App\Models\InstitutionSetting::current();
        $institutionData = $institution ? [
            'id'                     => $institution->id,
            'name'                   => $institution->name,
            'short_name'             => $institution->short_name ?: 'ACONS',
            'subdomain'              => 'acons',
            'custom_domain'          => null,
            'logo_path'              => $institution->logo_path ? (str_starts_with($institution->logo_path, 'http') || str_starts_with($institution->logo_path, '/') ? asset($institution->logo_path) : asset('storage/' . $institution->logo_path)) : null,
            'favicon_path'           => $institution->favicon_path ? (str_starts_with($institution->favicon_path, 'http') || str_starts_with($institution->favicon_path, '/') ? asset($institution->favicon_path) : asset('storage/' . $institution->favicon_path)) : null,
            'primary_color'          => $institution->primary_color ?: '#2e5fa9',
            'secondary_color'        => $institution->secondary_color ?: '#a31d1d',
            'tagline'                => $institution->tagline,
            'phone'                  => $institution->phone,
            'email'                  => $institution->email,
            'address'                => $institution->address,
            'grading_scale'          => $institution->grading_scale ?: '5.0',
            'payment_gateway'        => $institution->payment_gateway ?: 'zainpay',
            'is_active'              => true,
            'settings'               => $institution->settings ?: [],
        ] : null;

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'                => $request->user()->id,
                    'name'              => $request->user()->name,
                    'email'             => $request->user()->email,
                    'role'              => $request->user()->role,
                    'avatar'            => $request->user()->avatar_url ?? null,
                    'is_active'         => $request->user()->is_active,
                    'email_verified_at' => $request->user()->email_verified_at,
                ] : null,
                'institution' => $institutionData,
                'tenant'      => $institutionData, // Backward-compatible alias for existing UI layouts
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
                'warning' => session('warning'),
                'info'    => session('info'),
            ],
            'ziggy' => fn () => array_merge((new Ziggy)->toArray(), [
                'location' => $request->url(),
            ]),
        ]);
    }
}
