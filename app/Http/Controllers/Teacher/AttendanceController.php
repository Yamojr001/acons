<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher       = Auth::user()->teacher;
        $classes       = ClassRoom::where('teacher_id', $teacher->id)->get();
        $selectedClass = $request->class_room_id ?? $classes->first()?->id;
        $selectedDate  = $request->date ?? now()->toDateString();

        $students = $selectedClass
            ? Student::where('class_room_id', $selectedClass)
                ->where('status', 'active')
                ->with(['user' => fn ($q) => $q->select('id', 'name', 'avatar')])
                ->orderBy('admission_number')
                ->get()
                ->map(function ($s) use ($selectedDate) {
                    $s->today_status = Attendance::where('student_id', $s->id)
                        ->where('date', $selectedDate)->value('status');
                    return $s;
                })
            : collect();

        return Inertia::render('Teacher/Attendance', [
            'classes'       => $classes,
            'students'      => $students,
            'selectedClass' => (string) $selectedClass,
            'selectedDate'  => $selectedDate,
            'alreadyMarked' => $selectedClass
                && Attendance::where('class_room_id', $selectedClass)->where('date', $selectedDate)->exists(),
        ]);
    }

    public function mark(Request $request)
    {
        $request->validate([
            'class_room_id' => 'required|exists:class_rooms,id',
            'date'          => 'required|date|before_or_equal:today',
            'attendance'    => 'required|array',
            'attendance.*'  => 'required|in:present,absent,late,excused',
        ]);

        $teacher = Auth::user()->teacher;
        $class   = ClassRoom::where('id', $request->class_room_id)
            ->where('teacher_id', $teacher->id)->firstOrFail();
        $tenant  = app('currentTenant');

        foreach ($request->attendance as $studentId => $status) {
            Attendance::updateOrCreate(
                ['tenant_id' => $tenant->id, 'student_id' => (int) $studentId, 'date' => $request->date],
                ['class_room_id' => $class->id, 'status' => $status, 'tenant_id' => $tenant->id]
            );
        }

        return back()->with('success', 'Attendance saved for ' . count($request->attendance) . ' students.');
    }
}
