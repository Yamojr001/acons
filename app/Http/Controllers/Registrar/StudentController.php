<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\{Student, User, Department, Program};
use App\Exports\StudentsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::get(['id', 'name']);
        
        $students = Student::with(['user', 'department'])
            ->when($request->search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->whereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    })->orWhere('matriculation_number', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%");
                });
            })
            ->when($request->department_id, function ($query, $deptId) {
                if ($deptId !== 'all') {
                    $query->where('department_id', $deptId);
                }
            })
            ->when($request->level, function ($query, $level) {
                if ($level !== 'all') {
                    $query->where('current_level', $level);
                }
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Registrar/Students/Index', [
            'students' => $students,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department_id', 'level'])
        ]);
    }

    public function show($id)
    {
        $student = Student::with(['user', 'department', 'registrations.course', 'registrations.semester', 'payments'])
            ->findOrFail($id);

        return Inertia::render('Registrar/Students/Show', [
            'student' => $student
        ]);
    }

    public function create()
    {
        abort(403, 'Unauthorized action. Registrars cannot manually enroll/add students.');
    }

    public function store(Request $request)
    {
        abort(403, 'Unauthorized action. Registrars cannot manually enroll/add students.');
    }

    public function export($format)
    {
        $institution = \App\Models\InstitutionSetting::current();
        $students = Student::with(['user', 'department'])
            ->latest()
            ->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.students', [
                'students' => $students,
                'tenant' => $institution,
                'institution' => $institution,
            ]);
            return $pdf->download('students_' . now()->format('Ymd') . '.pdf');
        }

        if ($format === 'csv') {
            return Excel::download(new StudentsExport(), 'students_' . now()->format('Ymd') . '.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        if ($format === 'excel' || $format === 'xlsx') {
            return Excel::download(new StudentsExport(), 'students_' . now()->format('Ymd') . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
        }

        abort(400, 'Invalid format');
    }

    public function edit($id)
    {
        return redirect()->route('registrar.students.show', $id);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'phone_number'  => 'nullable|string|max:20',
            'status'        => 'sometimes|required|in:active,suspended,graduated,withdrawn',
            'current_level' => 'nullable|string|max:50',
            'department_id' => 'nullable|exists:departments,id',
            'program_id'    => 'nullable|exists:programs,id',
        ]);

        $student->update($validated);

        if ($request->has('name') || $request->has('email')) {
            $userValidated = $request->validate([
                'name'  => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $student->user_id,
            ]);
            $student->user->update($userValidated);
        }

        return redirect()->back()->with('success', 'Student record updated successfully.');
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->update(['status' => 'withdrawn']);
        $student->delete();

        return redirect()->route('registrar.students.index')->with('success', 'Student record archived successfully.');
    }
}
