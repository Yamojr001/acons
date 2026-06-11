<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Teacher/Profile', [
            'user'    => Auth::user()->load('teacher'),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'phone'         => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:200',
        ]);

        $user = Auth::user();
        $user->update($request->only('name', 'phone'));
        $user->teacher?->update(['qualification' => $request->qualification]);

        return back()->with('success', 'Profile updated.');
    }
}
