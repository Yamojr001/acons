<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Student, ClassRoom};
use Illuminate\Http\Request;
use Inertia\{Inertia, Response};

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $classrooms = ClassRoom::orderBy('name')->get(['id','name']);
        $selectedClass = $request->class_room_id ?? $classrooms->first()?->id;
        $date = $request->date ?? now()->toDateString();

        $students = $selectedClass
            ? Student::with(['user', 'attendances' => fn ($q) => $q->where('date', $date)])
                ->where('class_room_id', $selectedClass)->where('status', 'active')->get()
            : collect();

        return Inertia::render('SchoolAdmin/Attendance', [
            'classrooms'     => $classrooms,
            'students'       => $students,
            'selected_class' => (int) $selectedClass,
            'selected_date'  => $date,
            'filters'        => $request->only('class_room_id','date'),
        ]);
    }

    public function reports(Request $request): Response
    {
        $classrooms = ClassRoom::orderBy('name')->get(['id','name']);
        $classId    = $request->class_room_id ?? $classrooms->first()?->id;
        $from       = $request->from ?? now()->startOfMonth()->toDateString();
        $to         = $request->to   ?? now()->toDateString();

        $report = Student::with(['user'])
            ->where('class_room_id', $classId)
            ->withCount(['attendances as total_days' => fn ($q) => $q->whereBetween('date',[$from,$to])])
            ->withCount(['attendances as present_days' => fn ($q) => $q->whereBetween('date',[$from,$to])->whereIn('status',['present','late'])])
            ->get()
            ->map(fn ($s) => [
                'name'       => $s->user->name,
                'admission'  => $s->admission_number,
                'total'      => $s->total_days,
                'present'    => $s->present_days,
                'rate'       => $s->total_days > 0 ? round(($s->present_days / $s->total_days) * 100, 1) : 0,
            ]);

        return Inertia::render('SchoolAdmin/AttendanceReports', [
            'classrooms' => $classrooms,
            'report'     => $report,
            'filters'    => ['class_room_id' => $classId, 'from' => $from, 'to' => $to],
        ]);
    }
}
