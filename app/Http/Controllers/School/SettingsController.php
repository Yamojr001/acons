<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\InstitutionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class SettingsController extends Controller
{
    public function index(): Response
    {
        $institution = InstitutionSetting::current();
        return Inertia::render('SchoolAdmin/Settings', [
            'tenant' => $institution,
            'institution' => $institution,
        ]);
    }

    public function update(Request $request)
    {
        $institution = InstitutionSetting::current();
        $request->validate([
            'name'            => 'required|string|max:100',
            'tagline'         => 'nullable|string|max:200',
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:150',
            'address'         => 'nullable|string|max:300',
            'primary_color'   => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $institution->update($request->only(
            'name','tagline','phone','email','address',
            'primary_color','secondary_color'
        ));

        InstitutionSetting::clearCache();

        return back()->with('success', 'Settings saved successfully.');
    }

    public function updateAcademic(Request $request)
    {
        $institution = InstitutionSetting::current();
        $request->validate([
            'current_session' => 'nullable|string|max:20',
            'current_term'    => 'nullable|string|max:50',
        ]);

        $settings = $institution->settings ?? [];
        $settings['current_session'] = $request->current_session;
        $settings['current_term']    = $request->current_term;

        $institution->update(['settings' => $settings]);
        InstitutionSetting::clearCache();

        return back()->with('success', 'Academic settings updated successfully.');
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:jpeg,jpg,png,webp|max:2048|dimensions:max_width=2000,max_height=2000',
        ]);

        $institution = InstitutionSetting::current();

        if ($institution->logo_path) {
            Storage::disk('public')->delete($institution->logo_path);
        }

        $path = $request->file('logo')->store('institution/logos', 'public');
        $institution->update(['logo_path' => $path]);
        InstitutionSetting::clearCache();

        return back()->with('success', 'Logo updated.');
    }
}
