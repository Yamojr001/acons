<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement, Student, Guardian};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Parent/Profile', [
            'user'     => Auth::user(),
            'guardian' => Auth::user()->guardian,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'phone'        => 'nullable|string|max:20',
            'occupation'   => 'nullable|string|max:150',
        ]);

        Auth::user()->update($request->only('name', 'phone'));
        Auth::user()->guardian?->update(['occupation' => $request->occupation]);
        return back()->with('success', 'Profile updated.');
    }
}
