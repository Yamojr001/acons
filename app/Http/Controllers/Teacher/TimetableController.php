<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class TimetableController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Teacher/Timetable', [
            'timetable' => [],
            'classes'   => ClassRoom::where('teacher_id', Auth::user()->teacher?->id)->get(),
        ]);
    }
}
