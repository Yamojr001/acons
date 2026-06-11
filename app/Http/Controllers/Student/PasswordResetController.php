<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
    public function showForceChange()
    {
        return Inertia::render('Student/ForcePasswordChange');
    }

    public function postForceChange(Request $request)
    {
        $request->validate([
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $user = Auth::user();
        
        $user->update([
            'password' => Hash::make($request->password),
            'force_password_change' => false
        ]);

        // Log out user
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Your password has been updated successfully! Please log in with your new password.');
    }
}
