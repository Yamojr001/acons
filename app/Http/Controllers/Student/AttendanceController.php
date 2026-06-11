<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB};
use Inertia\{Inertia, Response};

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $student = Auth::user()->student;

        $query = Attendance::where('student_id', $student->id);

        if ($request->month) {
            $query->whereYear('date', substr($request->month, 0, 4))
                  ->whereMonth('date', substr($request->month, 5, 2));
        } else {
            $query->where('date', '>=', now()->startOfMonth());
        }

        $attendance = $query->orderByDesc('date')->get();

        $summary = [
            'present' => $attendance->where('status', 'present')->count(),
            'absent'  => $attendance->where('status', 'absent')->count(),
            'late'    => $attendance->where('status', 'late')->count(),
            'excused' => $attendance->where('status', 'excused')->count(),
        ];
        $total = array_sum($summary);
        $summary['rate'] = $total > 0 ? round((($summary['present'] + $summary['late']) / $total) * 100, 1) : 0;

        return Inertia::render('Student/Attendance', [
            'attendance'    => $attendance,
            'summary'       => $summary,
            'selectedMonth' => $request->month ?? now()->format('Y-m'),
        ]);
    }
}
