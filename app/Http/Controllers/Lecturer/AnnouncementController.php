<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function index()
    {
        $lecturer = Auth::user()->lecturer;
        $courses = Course::where('lecturer_id', $lecturer->id)->get();
        $notices = Announcement::where(function ($query) {
            $query->where('created_by', Auth::id())
                  ->orWhereIn('audience', ['all', 'lecturer', 'staff']);
        })->latest()->get();

        return Inertia::render('Lecturer/Announcements', [
            'notices' => $notices,
            'courses' => $courses
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        Announcement::create([
            'tenant_id' => app('currentTenant')->id,
            'created_by' => Auth::id(),
            'course_id' => $request->course_id,
            'title' => $request->title,
            'body' => $request->body,
            'audience' => $request->course_id ? 'course_students' : 'students',
            'published_at' => now(),
        ]);

        return back()->with('success', 'Notice posted successfully.');
    }
}
