<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Grade, Exam, Student, ClassRoom};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\{Inertia, Response};

class GradeController extends Controller
{
    public function index(Request $request): Response
    {
        $exams = Exam::with('subject','classRoom')->orderBy('exam_date','desc')->get(['id','title','subject_id','class_room_id','exam_date','total_marks','passing_marks']);
        $selectedExam = $request->exam_id ? Exam::with(['classRoom.students.user','grades'])->find($request->exam_id) : null;

        return Inertia::render('SchoolAdmin/Grades', [
            'exams'         => $exams,
            'selected_exam' => $selectedExam,
            'filters'       => $request->only('exam_id'),
        ]);
    }

    public function reports(Request $request): Response
    {
        $classrooms = ClassRoom::orderBy('name')->get(['id','name']);
        $classId    = $request->class_room_id;
        $term       = $request->term ?? 'first';

        $report = $classId ? Student::with(['user','grades.exam.subject'])
            ->where('class_room_id', $classId)->get()
            ->map(fn ($s) => [
                'name'    => $s->user->name,
                'scores'  => $s->grades->groupBy('exam.subject.name')
                    ->map(fn ($grades) => $grades->avg('score')),
                'average' => $s->grades->avg('score'),
            ]) : collect();

        return Inertia::render('SchoolAdmin/GradeReports', [
            'classrooms' => $classrooms,
            'report'     => $report,
            'filters'    => $request->only('class_room_id','term'),
        ]);
    }

    public function reportCards(Request $request): Response
    {
        $classrooms = ClassRoom::orderBy('name')->get(['id','name']);
        $students   = $request->class_room_id
            ? Student::with(['user','grades.exam.subject','attendances','classRoom'])
                ->where('class_room_id', $request->class_room_id)->get()
            : collect();

        return Inertia::render('SchoolAdmin/ReportCards', [
            'classrooms' => $classrooms,
            'students'   => $students,
            'filters'    => $request->only('class_room_id','term'),
            'tenant'     => app('currentTenant'),
        ]);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'exam_id'  => 'required|integer|exists:exams,id',
            'grades'   => 'required|array',
            'grades.*.student_id' => 'required|integer|exists:students,id',
            'grades.*.score'      => 'required|numeric|min:0',
            'grades.*.remarks'    => 'nullable|string|max:500',
        ]);
        $exam = Exam::findOrFail($request->exam_id);
        DB::transaction(function () use ($request, $exam) {
            foreach ($request->grades as $g) {
                Grade::updateOrCreate(
                    ['student_id' => $g['student_id'], 'exam_id' => $exam->id],
                    [
                        'tenant_id'    => $exam->tenant_id,
                        'score'        => min($g['score'], $exam->total_marks),
                        'grade_letter' => Grade::letterGrade($g['score'], $exam->total_marks),
                        'remarks'      => $g['remarks'] ?? null,
                    ]
                );
            }
        });
        return back()->with('success', 'Grades saved successfully.');
    }
}
