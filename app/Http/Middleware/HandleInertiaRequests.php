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
        $tenant = app()->has('currentTenant') ? app('currentTenant') : null;

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
                'tenant' => $tenant ? [
                    'id'                   => $tenant->id,
                    'name'                 => $tenant->name,
                    'subdomain'            => $tenant->subdomain,
                    'custom_domain'        => $tenant->custom_domain,
                    'custom_domain_verified' => $tenant->custom_domain_verified,
                    'domain_verification_token' => $tenant->domain_verification_token,
                    'logo_path'            => $tenant->logo_path ? (str_starts_with($tenant->logo_path, 'http') || str_starts_with($tenant->logo_path, '/') ? asset($tenant->logo_path) : asset('storage/' . $tenant->logo_path)) : null,
                    'favicon_path'         => $tenant->favicon_path ? (str_starts_with($tenant->favicon_path, 'http') || str_starts_with($tenant->favicon_path, '/') ? asset($tenant->favicon_path) : asset('storage/' . $tenant->favicon_path)) : null,
                    'primary_color'        => $tenant->primary_color,
                    'secondary_color'      => $tenant->secondary_color,
                    'tagline'              => $tenant->tagline,
                    'phone'                => $tenant->phone,
                    'email'                => $tenant->email,
                    'address'              => $tenant->address,
                    'subscription_plan'    => $tenant->subscription_plan,
                    'charge_portal_fee'    => $tenant->charge_portal_fee,
                    'portal_maintenance_fee' => $tenant->portal_maintenance_fee,
                    'teacher_mode'         => $tenant->teacher_mode,
                    'current_session'      => $tenant->current_session,
                    'current_term'         => $tenant->current_term,
                    'is_active'            => $tenant->is_active,
                ] : null,
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
