<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Exam, Grade, Attendance, Announcement, Student};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $student = Auth::user()->student->load('classRoom','user');

        $recentGrades = Grade::with(['exam.subject'])
            ->where('student_id', $student->id)
            ->latest()->limit(6)->get();

        $upcomingExams = Exam::with('subject')
            ->where('class_room_id', $student->class_room_id)
            ->where('exam_date', '>=', today())->orderBy('exam_date')->limit(3)->get();

        $pendingFees = Fee::where('student_id', $student->id)
            ->whereIn('status', ['pending','partial','overdue'])->sum('amount');

        $attendanceThisMonth = Attendance::where('student_id', $student->id)
            ->whereMonth('date', now()->month)->get();
        $attendanceRate = $attendanceThisMonth->count() > 0
            ? round($attendanceThisMonth->whereIn('status',['present','late'])->count() / $attendanceThisMonth->count() * 100, 1)
            : 0;

        $latestAnnouncements = Announcement::where('audience','all')
            ->orWhere('audience','students')->latest()->limit(3)->get();

        return Inertia::render('Student/Dashboard', [
            'student'              => $student,
            'recent_grades'        => $recentGrades,
            'upcoming_exams'       => $upcomingExams,
            'pending_fees'         => $pendingFees,
            'attendance_rate'      => $attendanceRate,
            'announcements'        => $latestAnnouncements,
        ]);
    }
}

class ResultController extends Controller
{
    public function index(): Response
    {
        $student = Auth::user()->student;
        $exams   = Exam::with(['subject','classRoom','grades' => fn ($q) => $q->where('student_id', $student->id)])
            ->where('class_room_id', $student->class_room_id)->orderBy('exam_date','desc')->get();

        return Inertia::render('Student/Results', ['exams' => $exams, 'student' => $student]);
    }

    public function show(Exam $exam): Response
    {
        $student = Auth::user()->student;
        $grade   = Grade::where(['student_id' => $student->id, 'exam_id' => $exam->id])->first();
        $exam->load('subject','classRoom');

        return Inertia::render('Student/ResultDetail', [
            'exam'    => $exam,
            'grade'   => $grade,
            'student' => $student->load('user','classRoom'),
        ]);
    }
}

class AttendanceController extends Controller
{
    public function index(): Response
    {
        $student     = Auth::user()->student;
        $attendances = Attendance::where('student_id', $student->id)
            ->orderBy('date','desc')->paginate(30);

        $stats = [
            'total'   => Attendance::where('student_id', $student->id)->count(),
            'present' => Attendance::where('student_id', $student->id)->whereIn('status',['present','late'])->count(),
            'absent'  => Attendance::where('student_id', $student->id)->where('status','absent')->count(),
        ];
        $stats['rate'] = $stats['total'] > 0 ? round($stats['present'] / $stats['total'] * 100, 1) : 0;

        return Inertia::render('Student/Attendance', [
            'attendances' => $attendances,
            'stats'       => $stats,
        ]);
    }
}

class TimetableController extends Controller
{
    public function index(): Response
    {
        $student = Auth::user()->student;
        return Inertia::render('Student/Timetable', [
            'class_room' => $student->classRoom->load('subjects','teacher.user'),
            'exams'      => Exam::with('subject')->where('class_room_id', $student->class_room_id)
                ->where('exam_date', '>=', today())->orderBy('exam_date')->get(),
        ]);
    }
}

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Student/Announcements', [
            'announcements' => Announcement::where('audience','all')
                ->orWhere('audience','students')->latest()->paginate(15),
        ]);
    }
}

class ProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Student/Profile', [
            'user'    => Auth::user(),
            'student' => Auth::user()->student->load('classRoom','guardians.user'),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);
        Auth::user()->update($request->only('name','phone'));
        return back()->with('success', 'Profile updated.');
    }
}
