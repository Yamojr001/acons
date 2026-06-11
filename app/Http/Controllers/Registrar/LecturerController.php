<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\{User, Lecturer};
use App\Exports\LecturersExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class LecturerController extends Controller
{
    public function changeRole(Request $request, User $user)
    {
        // Only Provost has this administrative authority
        if (!auth()->user()->hasRole('provost')) {
            abort(403, 'Unauthorized action. Only the Provost can appoint or change staff roles.');
        }

        $request->validate([
            'role' => 'required|string|in:registrar,bursar,hod,lecturer,admission_officer,provost',
        ]);

        $user->syncRoles([$request->role]);

        return back()->with('success', "Staff member assigned as {$request->role} successfully!");
    }

    public function export($format)
    {
        $tenant = app('currentTenant');
        $lecturers = Lecturer::with(['user.roles', 'department'])
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.lecturers', [
                'lecturers' => $lecturers,
                'tenant' => $tenant
            ]);
            return $pdf->download('staff_' . now()->format('Ymd') . '.pdf');
        }

        if ($format === 'csv') {
            return Excel::download(new LecturersExport($tenant->id), 'staff_' . now()->format('Ymd') . '.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        if ($format === 'excel' || $format === 'xlsx') {
            return Excel::download(new LecturersExport($tenant->id), 'staff_' . now()->format('Ymd') . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
        }

        abort(400, 'Invalid format');
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,NULL,id,tenant_id,' . $tenant->id,
            'employee_id' => 'required|string|max:100|unique:lecturers,employee_id,NULL,id,tenant_id,' . $tenant->id,
            'department_id' => 'required|exists:departments,id,tenant_id,' . $tenant->id,
            'qualification' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other',
            'phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $tenant) {
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('password123'),
                'phone' => $request->phone_number,
                'is_active' => true,
                'force_password_change' => true,
            ]);
            $user->assignRole('lecturer');

            Lecturer::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'employee_id' => strtoupper($request->employee_id),
                'qualification' => $request->qualification,
                'gender' => $request->gender,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'status' => 'active',
            ]);
        });

        return redirect()->back()->with('success', 'New staff member registered successfully! Temporary password is: password123');
    }

    public function update(Request $request, Lecturer $lecturer)
    {
        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $lecturer->user_id . ',id,tenant_id,' . $tenant->id,
            'employee_id' => 'required|string|max:100|unique:lecturers,employee_id,' . $lecturer->id . ',id,tenant_id,' . $tenant->id,
            'department_id' => 'required|exists:departments,id,tenant_id,' . $tenant->id,
            'qualification' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other',
            'phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        DB::transaction(function () use ($request, $lecturer) {
            $lecturer->user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone_number,
            ]);

            $lecturer->update([
                'department_id' => $request->department_id,
                'employee_id' => strtoupper($request->employee_id),
                'qualification' => $request->qualification,
                'gender' => $request->gender,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'status' => $request->status,
            ]);
        });

        return redirect()->back()->with('success', 'Staff details updated successfully!');
    }

    public function toggleStatus(Lecturer $lecturer)
    {
        $newStatus = $lecturer->status === 'active' ? 'inactive' : 'active';
        
        DB::transaction(function () use ($lecturer, $newStatus) {
            $lecturer->update(['status' => $newStatus]);
            $lecturer->user->update(['is_active' => $newStatus === 'active']);
        });

        return redirect()->back()->with('success', 'Staff active status updated successfully!');
    }
}
