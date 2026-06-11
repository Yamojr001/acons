<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class ExamController extends Controller
{
    public function index(): Response
    {
        $teacher  = Auth::user()->teacher;
        $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
        $exams    = Exam::whereIn('class_room_id', $classIds)
            ->with(['subject', 'classRoom'])
            ->withCount('grades')
            ->latest('exam_date')
            ->paginate(20);

        return Inertia::render('Teacher/Exams', ['exams' => $exams]);
    }
}
