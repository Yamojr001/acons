<?php
namespace App\Http\Controllers\Teacher;
use App\Http\Controllers\Controller;
use App\Models\{ClassRoom,Student,Attendance,Exam,Grade};
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia,Response};
class DashboardController extends Controller {
    public function index(): Response {
        $teacher = Auth::user()->teacher;
        $myClasses = ClassRoom::where('teacher_id',$teacher->id)->withCount('students')->get();
        $totalStudents = Student::whereIn('class_room_id',$myClasses->pluck('id'))->count();
        $attendanceRate = Attendance::whereIn('class_room_id',$myClasses->pluck('id'))
            ->where('date','>=',now()->subDays(30))
            ->selectRaw('ROUND(AVG(CASE WHEN status IN ("present","late") THEN 100 ELSE 0 END),1) as rate')
            ->value('rate') ?? 0;
        $pendingGrades = Exam::whereIn('class_room_id',$myClasses->pluck('id'))
            ->where('exam_date','<',now())->withCount('grades')->get()
            ->filter(fn($e)=>$e->grades_count < 1)
            ->map(fn($e)=>['exam_id'=>$e->id,'exam_title'=>$e->title,'class'=>$myClasses->find($e->class_room_id)?->name??'','count'=>Student::where('class_room_id',$e->class_room_id)->count()])->values();
        return Inertia::render('Teacher/Dashboard',['myClasses'=>$myClasses,'todaySchedule'=>[],'pendingGrades'=>$pendingGrades,'recentActivity'=>[],'attendanceSummary'=>[],'stats'=>['total_students'=>$totalStudents,'classes_today'=>$myClasses->count(),'pending_exams'=>$pendingGrades->count(),'avg_attendance'=>$attendanceRate]]);
    }
}
