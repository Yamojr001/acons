<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{
    User, Teacher, Student, ClassRoom, Subject,
    Fee, Payment, Exam, Grade, Attendance, Announcement, Guardian
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Storage, Cache};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class ClassRoomController extends Controller
{
    public function index(): Response
    {
        $institution = \App\Models\InstitutionSetting::current();
        $sections = $institution->settings['sections'] ?? [
            ['name' => 'Primary', 'level_limit' => 6],
            ['name' => 'Junior Secondary', 'level_limit' => 3],
            ['name' => 'Senior Secondary', 'level_limit' => 3],
        ];

        return Inertia::render('SchoolAdmin/Classrooms', [
            'classrooms' => ClassRoom::with('teacher.user')->withCount('students')->orderBy('section')->orderBy('level')->get(),
            'teachers'   => Lecturer::with('user')->get(),
            'sections'   => $sections,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'section'       => 'required|string|max:50',
            'level'         => 'required|integer|min:1',
            'capacity'      => 'required|integer|min:1|max:200',
            'academic_year' => 'required|string|max:20',
            'teacher_id'    => 'nullable|exists:teachers,id',
        ]);

        ClassRoom::create(array_merge($request->only('section','level','capacity','academic_year','teacher_id'), [
            'name'      => $request->section . ' ' . $request->level // Fallback for old code
        ]));
        return back()->with('success', 'Class created.');
    }

    public function destroy(ClassRoom $classroom)
    {
        $classroom->delete();
        return back()->with('success', 'Class deleted.');
    }
}
