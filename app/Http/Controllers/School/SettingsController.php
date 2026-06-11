<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SchoolAdmin/Settings', [
            'tenant' => app('currentTenant'),
        ]);
    }

    public function update(Request $request)
    {
        $tenant = app('currentTenant');
        $request->validate([
            'name'            => 'required|string|max:100',
            'tagline'         => 'nullable|string|max:200',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:300',
            'primary_color'   => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $tenant->update($request->only(
            'name','tagline','phone','email','address',
            'primary_color','secondary_color'
        ));

        app(TenantResolver::class)->clearCache($tenant);

        return back()->with('success', 'Settings saved successfully.');
    }

    public function updateAcademic(Request $request)
    {
        $tenant = app('currentTenant');
        $request->validate([
            'teacher_mode'   => 'required|in:per_class,per_subject',
            'current_session' => 'required|string|max:20',
            'current_term'    => 'required|in:1st Term,2nd Term,3rd Term',
            'sections'       => 'array',
        ]);

        $settings = $tenant->settings ?? [];
        $settings['teacher_mode']    = $request->teacher_mode;
        $settings['current_session'] = $request->current_session;
        $settings['current_term']    = $request->current_term;
        $settings['sections']        = $request->sections;

        $tenant->update(['settings' => $settings]);
        app(TenantResolver::class)->clearCache($tenant);

        return back()->with('success', 'Academic settings updated successfully.');
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:jpeg,jpg,png,webp|max:2048|dimensions:max_width=2000,max_height=2000',
        ]);

        $tenant = app('currentTenant');

        if ($tenant->logo_path) {
            Storage::disk('public')->delete($tenant->logo_path);
        }

        $path = $request->file('logo')->store("tenants/{$tenant->id}/logos", 'public');
        $tenant->update(['logo_path' => $path]);

        return back()->with('success', 'Logo updated.');
    }

    public function setCustomDomain(Request $request)
    {
        $request->validate(['custom_domain' => 'required|string|max:255|regex:/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/']);

        $tenant = app('currentTenant');
        $token  = 'edusaas-verify=' . Str::random(32);

        $tenant->update([
            'custom_domain'             => strtolower($request->custom_domain),
            'custom_domain_verified'    => false,
            'domain_verification_token' => $token,
        ]);

        return back()->with('success', "Domain set. Add TXT record: {$token} to verify.");
    }

    public function verifyDomain(Request $request)
    {
        $tenant = app('currentTenant');
        if (! $tenant->custom_domain) {
            return back()->withErrors(['domain' => 'No custom domain set.']);
        }

        $records = @dns_get_record($tenant->custom_domain, DNS_TXT) ?: [];
        $found   = collect($records)->contains(
            fn ($r) => str_contains($r['txt'] ?? '', $tenant->domain_verification_token)
        );

        if ($found) {
            $tenant->update(['custom_domain_verified' => true]);
            return back()->with('success', 'Domain verified! SSL will be provisioned shortly.');
        }

        return back()->withErrors(['domain' => 'Verification TXT record not found. DNS changes can take up to 24 hours.']);
    }
}
