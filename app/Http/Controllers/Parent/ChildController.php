<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement, Student, Guardian};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ChildController extends Controller
{
    public function index(): Response
    {
        $guardian = Auth::user()->guardian;
        $children = $guardian
            ? $guardian->students()->with(['user', 'classRoom'])->get()
            : collect();

        return Inertia::render('Parent/Children', ['children' => $children]);
    }

    public function results(Student $student): Response
    {
        $this->authorizeChild($student);

        $results = Grade::where('student_id', $student->id)
            ->with(['exam.subject'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Parent/ChildResults', [
            'student' => $student->load('user', 'classRoom'),
            'results' => $results,
        ]);
    }

    public function attendance(Student $student): Response
    {
        $this->authorizeChild($student);

        $attendance = Attendance::where('student_id', $student->id)
            ->where('date', '>=', now()->startOfMonth())
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Parent/ChildAttendance', [
            'student'    => $student->load('user', 'classRoom'),
            'attendance' => $attendance,
        ]);
    }

    private function authorizeChild(Student $student): void
    {
        $guardian = Auth::user()->guardian;
        abort_unless(
            $guardian && $guardian->students()->where('students.id', $student->id)->exists(),
            403,
            'Access denied.'
        );
    }
}
