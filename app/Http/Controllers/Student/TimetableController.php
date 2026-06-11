<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB};
use Inertia\{Inertia, Response};

class TimetableController extends Controller
{
    public function index(): Response
    {
        $student = Auth::user()->student->load('classRoom');
        return Inertia::render('Student/Timetable', [
            'timetable' => [],
            'class'     => $student->classRoom,
        ]);
    }
}
