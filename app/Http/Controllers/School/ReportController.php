<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Fee, Attendance, Payment, Grade};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\{Inertia, Response};

class ReportController extends Controller
{
    public function overview(): Response
    {
        $tenant = app('currentTenant');
        return Inertia::render('SchoolAdmin/Reports/Overview', [
            'stats' => [
                'students_by_class'  => ClassRoom::withCount('students')->get(['id','name']),
                'students_by_gender' => Student::selectRaw('gender, count(*) as count')->groupBy('gender')->get(),
                'fees_by_status'     => Fee::selectRaw('status, sum(amount) as total')->groupBy('status')->get(),
                'attendance_summary' => Attendance::selectRaw('status, count(*) as count')
                    ->whereMonth('date', now()->month)->groupBy('status')->get(),
            ],
        ]);
    }

    public function financial(Request $request): Response
    {
        return Inertia::render('SchoolAdmin/Reports/Financial', [
            'monthly_revenue' => Payment::where('status','successful')
                ->selectRaw("TO_CHAR(created_at,'Mon YYYY') as month, sum(amount) as total")
                ->groupBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"), DB::raw("TO_CHAR(created_at,'Mon YYYY')"))
                ->orderBy(DB::raw("TO_CHAR(created_at,'YYYY-MM')"))
                ->get(),
            'fees_summary' => [
                'collected' => Fee::where('status','paid')->sum('amount'),
                'pending'   => Fee::whereIn('status',['pending','partial'])->sum('amount'),
                'overdue'   => Fee::where('status','overdue')->sum('amount'),
            ],
            'top_payers' => Student::with('user')
                ->withSum(['payments as total_paid' => fn ($q) => $q->where('status','successful')], 'amount')
                ->orderByDesc('total_paid')->limit(10)->get(),
        ]);
    }

    public function academic(Request $request): Response
    {
        $classId = $request->class_room_id;
        return Inertia::render('SchoolAdmin/Reports/Academic', [
            'classrooms'      => ClassRoom::orderBy('name')->get(['id','name']),
            'average_by_subject' => $classId
                ? Grade::join('exams', 'grades.exam_id','=','exams.id')
                    ->join('subjects', 'exams.subject_id','=','subjects.id')
                    ->where('exams.class_room_id', $classId)
                    ->selectRaw('subjects.name as subject, avg(grades.total_score) as avg_score')
                    ->groupBy('subjects.id','subjects.name')
                    ->get() : collect(),
            'filters' => $request->only('class_room_id'),
        ]);
    }

    public function attendance(Request $request): Response
    {
        return Inertia::render('SchoolAdmin/Reports/Attendance', [
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'monthly_trend' => Attendance::selectRaw("TO_CHAR(date,'Mon') as month, status, count(*) as count")
                ->where('date', '>=', now()->subMonths(6))
                ->groupBy(DB::raw("TO_CHAR(date,'YYYY-MM')"), DB::raw("TO_CHAR(date,'Mon')"), 'status')
                ->orderBy(DB::raw("TO_CHAR(date,'YYYY-MM')"))
                ->get(),
            'filters' => $request->only('class_room_id'),
        ]);
    }
}
