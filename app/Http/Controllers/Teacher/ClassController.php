<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ClassController extends Controller
{
    public function index(): Response
    {
        $teacher = Auth::user()->teacher;
        $classes = ClassRoom::where('teacher_id', $teacher->id)
            ->withCount('students')
            ->with(['students.user'])
            ->get();

        return Inertia::render('Teacher/Classes', ['classes' => $classes]);
    }

    public function subjects(ClassRoom $class): Response
    {
        $tenant = app('currentTenant');
        if ($class->teacher_id !== Auth::user()->teacher->id) {
            abort(403, 'Unauthorized. Only the Class Master can manage subjects.');
        }

        $allSubjects = Course::orderBy('name')->get();
        $teachers = \App\Models\Lecturer::with('user')->get();
        // Load existing assignments
        $class->load('subjects', 'subjectTeachers.teacher.user');

        return Inertia::render('Teacher/ClassSubjects', [
            'classroom' => $class,
            'subjects' => $allSubjects,
            'teachers' => $teachers,
            'teacherMode' => $tenant->teacher_mode
        ]);
    }

    public function updateSubjects(Request $request, ClassRoom $class)
    {
        $tenant = app('currentTenant');
        if ($class->teacher_id !== Auth::user()->teacher->id) {
            abort(403);
        }

        $request->validate([
            'subjects' => 'array',
            'subjects.*' => 'exists:subjects,id',
            'assignments' => 'array', // object: subject_id -> teacher_id
        ]);

        // Sync subjects
        $class->subjects()->sync($request->subjects ?? []);

        // Sync subject teachers if in per_subject mode
        if ($tenant->teacher_mode === 'per_subject' && $request->has('assignments')) {
            // Delete old assignments
            $class->subjectTeachers()->delete();
            $assignments = [];
            foreach ($request->assignments as $subject_id => $teacher_id) {
                if ($teacher_id && in_array($subject_id, $request->subjects ?? [])) {
                    $assignments[] = [
                        'class_room_id' => $class->id,
                        'subject_id' => $subject_id,
                        'teacher_id' => $teacher_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
            if (!empty($assignments)) {
                \App\Models\ClassSubjectLecturer::insert($assignments);
            }
        }

        return back()->with('success', 'Class subjects updated successfully.');
    }
}
