<?php

namespace App\Http\Controllers\HOD;

use App\Http\Controllers\Controller;
use App\Models\{Course, Lecturer, Department};
use Illuminate\Http\Request;
use Inertia\Inertia;

class HODCourseController extends Controller
{
    private function getHodDepartmentId()
    {
        $lecturer = auth()->user()->lecturer;
        if (!$lecturer) {
            abort(403, 'Your HOD account is not linked to a Lecturer profile. Please contact the administrator.');
        }
        return $lecturer->department_id;
    }

    public function index()
    {
        $deptId = $this->getHodDepartmentId();
        $dept = Department::find($deptId);

        // Fetch all courses belonging to this HOD's department
        $courses = Course::where('department_id', $deptId)
            ->with(['lecturer.user'])
            ->orderBy('code', 'asc')
            ->get();

        // Fetch lecturers in this department for assignment dropdown
        $lecturers = Lecturer::where('department_id', $deptId)
            ->with('user')
            ->get()
            ->map(function ($lect) {
                return [
                    'id' => $lect->id,
                    'name' => $lect->user->name
                ];
            });

        return Inertia::render('HOD/Courses/Index', [
            'courses' => $courses,
            'lecturers' => $lecturers,
            'department_name' => $dept?->name ?? 'N/A'
        ]);
    }

    public function store(Request $request)
    {
        $deptId = $this->getHodDepartmentId();

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:courses,code,NULL,id,tenant_id,' . app('currentTenant')->id,
            'credit_units' => 'required|integer|min:1|max:10',
            'level' => 'required|string|max:20',
            'semester_type' => 'required|in:first,second,both',
            'type' => 'required|in:core,elective',
            'lecturer_id' => 'nullable|exists:lecturers,id'
        ]);

        Course::create([
            'tenant_id' => app('currentTenant')->id,
            'department_id' => $deptId,
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'credit_units' => $request->credit_units,
            'level' => $request->level,
            'semester_type' => $request->semester_type,
            'type' => $request->type,
            'lecturer_id' => $request->lecturer_id
        ]);

        return redirect()->back()->with('success', 'Course added to department register successfully.');
    }

    public function update(Request $request, Course $course)
    {
        $deptId = $this->getHodDepartmentId();
        if ($course->department_id !== $deptId) {
            abort(403, 'Unauthorized departmental course access.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:courses,code,' . $course->id . ',id,tenant_id,' . app('currentTenant')->id,
            'credit_units' => 'required|integer|min:1|max:10',
            'level' => 'required|string|max:20',
            'semester_type' => 'required|in:first,second,both',
            'type' => 'required|in:core,elective',
            'lecturer_id' => 'nullable|exists:lecturers,id'
        ]);

        $course->update([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'credit_units' => $request->credit_units,
            'level' => $request->level,
            'semester_type' => $request->semester_type,
            'type' => $request->type,
            'lecturer_id' => $request->lecturer_id
        ]);

        return redirect()->back()->with('success', 'Course updated successfully.');
    }

    public function destroy(Course $course)
    {
        $deptId = $this->getHodDepartmentId();
        if ($course->department_id !== $deptId) {
            abort(403, 'Unauthorized departmental course access.');
        }

        $course->delete();

        return redirect()->back()->with('success', 'Course deleted from department register.');
    }

    public function assignLecturer(Request $request, Course $course)
    {
        $deptId = $this->getHodDepartmentId();
        if ($course->department_id !== $deptId) {
            abort(403, 'Unauthorized departmental course access.');
        }

        $request->validate([
            'lecturer_id' => 'nullable|exists:lecturers,id'
        ]);

        $course->update([
            'lecturer_id' => $request->lecturer_id
        ]);

        $lecturerName = $request->lecturer_id 
            ? Lecturer::find($request->lecturer_id)->user->name 
            : 'Unassigned';

        return redirect()->back()->with('success', "Course {$course->code} successfully assigned to {$lecturerName}.");
    }
}
