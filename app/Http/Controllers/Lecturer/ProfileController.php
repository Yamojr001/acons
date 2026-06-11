<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        $lecturer = Auth::user()->lecturer->load(['user', 'department']);
        return Inertia::render('Lecturer/Profile', [
            'lecturer' => $lecturer
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        $lecturer = $user->lecturer;

        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'state_of_origin' => 'nullable|string',
            'lga' => 'nullable|string',
            'blood_group' => 'nullable|string|max:5',
            'genotype' => 'nullable|string|max:5',
            'allergies' => 'nullable|string',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_relationship' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:255',
            'next_of_kin_email' => 'nullable|email|max:255',
            'next_of_kin_address' => 'nullable|string',
        ]);

        $user->update(['name' => $request->name]);
        
        $lecturer->update($request->only([
            'phone_number', 'address', 'state_of_origin', 'lga',
            'blood_group', 'genotype', 'allergies',
            'next_of_kin_name', 'next_of_kin_relationship', 
            'next_of_kin_phone', 'next_of_kin_email', 'next_of_kin_address'
        ]));

        return back()->with('success', 'Profile updated successfully.');
    }
}
