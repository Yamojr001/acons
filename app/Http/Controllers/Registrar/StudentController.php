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
        $tenant = app('currentTenant');
        $departments = Department::where('tenant_id', $tenant->id)->get(['id', 'name']);
        
        $students = Student::with(['user', 'department'])
            ->where('tenant_id', $tenant->id)
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
        $tenant = app('currentTenant');
        $students = Student::with(['user', 'department'])
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.students', [
                'students' => $students,
                'tenant' => $tenant
            ]);
            return $pdf->download('students_' . now()->format('Ymd') . '.pdf');
        }

        if ($format === 'csv') {
            return Excel::download(new StudentsExport($tenant->id), 'students_' . now()->format('Ymd') . '.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        if ($format === 'excel' || $format === 'xlsx') {
            return Excel::download(new StudentsExport($tenant->id), 'students_' . now()->format('Ymd') . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
        }

        abort(400, 'Invalid format');
    }
}
