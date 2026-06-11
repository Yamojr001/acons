<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Exam, ClassRoom, Subject};
use App\Http\Requests\School\StoreExamRequest;
use Illuminate\Http\Request;
use Inertia\{Inertia, Response};

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $exams = Exam::with(['classRoom','subject'])
            ->when($request->term, fn ($q, $t) => $q->where('term', $t))
            ->when($request->class_room_id, fn ($q, $id) => $q->where('class_room_id', $id))
            ->orderBy('exam_date','desc')->paginate(25)->withQueryString();

        return Inertia::render('SchoolAdmin/Exams', [
            'exams'      => $exams,
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'filters'    => $request->only('term','class_room_id'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/ExamForm', [
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'subjects'   => Course::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(StoreExamRequest $request)
    {
        Exam::create(array_merge($request->validated(), ['tenant_id' => app('currentTenant')->id]));
        return redirect()->route('admin.exams.index')->with('success', 'Exam scheduled.');
    }

    public function edit(Exam $exam): Response
    {
        return Inertia::render('SchoolAdmin/ExamForm', [
            'exam'       => $exam,
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'subjects'   => Course::orderBy('name')->get(['id','name']),
        ]);
    }

    public function update(StoreExamRequest $request, Exam $exam)
    {
        $exam->update($request->validated());
        return redirect()->route('admin.exams.index')->with('success', 'Exam updated.');
    }

    public function destroy(Exam $exam)
    {
        $exam->delete();
        return redirect()->route('admin.exams.index')->with('success', 'Exam deleted.');
    }
}
