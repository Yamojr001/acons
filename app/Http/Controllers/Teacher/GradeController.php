<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class GradeController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = Auth::user()->teacher;
        $tenant  = app('currentTenant');

        if ($tenant->teacher_mode === 'per_subject') {
            $assignments = \App\Models\ClassSubjectLecturer::where('teacher_id', $teacher->id)->get();
            if ($assignments->isEmpty()) {
                $exams = collect();
            } else {
                $exams = Exam::where(function($query) use ($assignments) {
                    foreach ($assignments as $a) {
                        $query->orWhere(function($q) use ($a) {
                            $q->where('class_room_id', $a->class_room_id)->where('subject_id', $a->subject_id);
                        });
                    }
                })->with(['subject', 'classRoom'])->latest()->get();
            }
        } else {
            $classIds = ClassRoom::where('teacher_id', $teacher->id)->pluck('id');
            $exams    = Exam::whereIn('class_room_id', $classIds)->with(['subject', 'classRoom'])->latest()->get();
        }

        $selected = $request->exam_id ? Exam::with('classRoom')->find($request->exam_id) : null;

        $students = $selected
            ? Student::where('class_room_id', $selected->class_room_id)
                ->where('status', 'active')
                ->with(['user' => fn ($q) => $q->select('id', 'name', 'avatar')])
                ->orderBy('admission_number')
                ->get()
                ->map(function ($s) use ($selected) {
                    $s->existing_grade = Grade::where('student_id', $s->id)
                        ->where('exam_id', $selected->id)
                        ->first(['score', 'grade_letter', 'remarks']);
                    return $s;
                })
            : collect();

        return Inertia::render('Teacher/Grades', [
            'exams'        => $exams,
            'selectedExam' => $selected,
            'students'     => $students,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'exam_id'      => 'required|exists:exams,id',
            'student_id'   => 'required|exists:students,id',
            'score'        => 'required|numeric|min:0',
            'grade_letter' => 'nullable|string|max:3',
            'remarks'      => 'nullable|string|max:300',
        ]);

        $tenant = app('currentTenant');
        $exam   = Exam::findOrFail($request->exam_id);
        abort_unless($this->canGradeExam($exam), 403, 'You are not authorized to grade this subject.');

        abort_if($request->score > $exam->total_marks, 422, 'Score cannot exceed total marks.');

        Grade::updateOrCreate(
            ['tenant_id' => $tenant->id, 'student_id' => $request->student_id, 'exam_id' => $request->exam_id],
            array_merge($request->only('score', 'grade_letter', 'remarks'), ['tenant_id' => $tenant->id])
        );

        return back()->with('success', 'Grade saved.');
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'entries' => 'required|array',
        ]);

        $tenant = app('currentTenant');
        $exam   = Exam::findOrFail($request->exam_id);
        abort_unless($this->canGradeExam($exam), 403, 'You are not authorized to grade this subject.');

        foreach ($request->entries as $entry) {
            Grade::updateOrCreate(
                ['tenant_id' => $tenant->id, 'student_id' => $entry['student_id'], 'exam_id' => $request->exam_id],
                array_merge($entry, ['tenant_id' => $tenant->id])
            );
        }

        return back()->with('success', 'All ' . count($request->entries) . ' grades saved.');
    }

    private function canGradeExam($exam)
    {
        $teacher = Auth::user()->teacher;
        $tenant  = app('currentTenant');

        if ($tenant->teacher_mode === 'per_subject') {
            return \App\Models\ClassSubjectLecturer::where('class_room_id', $exam->class_room_id)
                ->where('subject_id', $exam->subject_id)
                ->where('teacher_id', $teacher->id)
                ->exists();
        } else {
            return \App\Models\ClassRoom::where('id', $exam->class_room_id)
                ->where('teacher_id', $teacher->id)
                ->exists();
        }
    }
}
