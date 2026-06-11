<?php

namespace App\Http\Controllers\Common;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();
        $role = $user->role;

        if ($role === 'student') {
            $student = $user->student->load(['user', 'department', 'program']);
            return Inertia::render('Student/Profile', [
                'student' => $student
            ]);
        }

        if ($role === 'lecturer') {
            $lecturer = $user->lecturer->load(['user', 'department']);
            return Inertia::render('Lecturer/Profile', [
                'lecturer' => $lecturer
            ]);
        }

        // Administrative staff (Provost, HOD, Bursar, Registrar, Admission Officer, etc)
        return Inertia::render('Common/Profile', [
            'profileUser' => $user
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        $role = $user->role;

        // Handle photo/avatar upload
        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }

        if ($role === 'student') {
            $student = $user->student;
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $user->id . ',id,tenant_id,' . $user->tenant_id,
                'phone_number' => 'nullable|string|max:20',
                'gender' => 'required|in:male,female,other',
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

            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone_number,
                'gender' => $request->gender,
            ]);

            $student->update($request->only([
                'phone_number', 'gender', 'address', 'state_of_origin', 'lga',
                'blood_group', 'genotype', 'allergies',
                'next_of_kin_name', 'next_of_kin_relationship', 
                'next_of_kin_phone', 'next_of_kin_email', 'next_of_kin_address'
            ]));

            return back()->with('success', 'Profile updated successfully.');
        }

        if ($role === 'lecturer') {
            $lecturer = $user->lecturer;
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $user->id . ',id,tenant_id,' . $user->tenant_id,
                'phone_number' => 'nullable|string|max:20',
                'gender' => 'required|in:male,female,other',
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

            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone_number,
                'gender' => $request->gender,
            ]);

            $lecturer->update($request->only([
                'phone_number', 'gender', 'address', 'state_of_origin', 'lga',
                'blood_group', 'genotype', 'allergies',
                'next_of_kin_name', 'next_of_kin_relationship', 
                'next_of_kin_phone', 'next_of_kin_email', 'next_of_kin_address'
            ]));

            return back()->with('success', 'Profile updated successfully.');
        }

        // Generic administrative staff profile update
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id . ',id,tenant_id,' . $user->tenant_id,
            'phone' => 'nullable|string|max:20',
            'gender' => 'required|in:male,female,other',
        ]);

        $user->update($request->only(['name', 'email', 'phone', 'gender']));

        return back()->with('success', 'Profile updated successfully.');
    }
}
