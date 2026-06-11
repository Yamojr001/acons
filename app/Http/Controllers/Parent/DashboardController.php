<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement, Student, Guardian};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $guardian = Auth::user()->guardian;
        $children  = $guardian
            ? $guardian->students()->with(['user', 'classRoom'])->get()
            : collect();

        $childrenData = $children->map(function ($student) {
            $recentResults = Grade::where('student_id', $student->id)
                ->with(['exam.subject'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($g) => [
                    'subject'      => $g->exam->subject->name,
                    'score'        => (float) $g->score,
                    'total'        => $g->exam->total_marks,
                    'grade_letter' => $g->grade_letter,
                    'date'         => $g->exam->exam_date,
                ]);

            $attStats  = Attendance::where('student_id', $student->id)
                ->where('date', '>=', now()->subDays(30))
                ->selectRaw('status, COUNT(*) as cnt')
                ->groupBy('status')
                ->pluck('cnt', 'status');
            $total    = $attStats->sum();
            $present  = $attStats->get('present', 0) + $attStats->get('late', 0);

            $fees        = Fee::where('student_id', $student->id)->get();
            $outstanding = $fees->whereIn('status', ['pending','partial','overdue'])->sum('amount');

            return [
                'student'       => $student,
                'recentResults' => $recentResults,
                'attendance'    => [
                    'rate'    => $total > 0 ? round(($present / $total) * 100, 1) : 0,
                    'present' => (int) $present,
                    'total'   => (int) $total,
                ],
                'fees'        => $fees,
                'outstanding' => (float) $outstanding,
            ];
        });

        $announcements = Announcement::whereIn('audience', ['all', 'parents'])
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'published_at', 'audience']);

        return Inertia::render('Parent/Dashboard', [
            'children'      => $childrenData,
            'announcements' => $announcements,
        ]);
    }
}
