<?php

namespace App\Http\Controllers\HOD;

use App\Http\Controllers\Controller;
use App\Models\{Applicant, Department, User, Student, Role};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\{ClearanceApprovedMail, ClearanceRejectedMail};

class DashboardController extends Controller
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

        $stats = [
            'pending_clearance' => Applicant::where('admitted_department_id', $deptId)->where('status', 'admitted')->count(),
            'cleared' => Applicant::where('admitted_department_id', $deptId)->where('status', 'cleared')->count(),
            'rejected' => Applicant::where('admitted_department_id', $deptId)->where('status', 'clearance_rejected')->count(),
        ];

        return Inertia::render('University/AdminDashboard', [
            'role' => 'hod',
            'department_name' => $dept?->name ?? 'N/A',
            'stats' => $stats
        ]);
    }

    public function clearanceList(Request $request)
    {
        $deptId = $this->getHodDepartmentId();
        $dept = Department::find($deptId);

        $query = Applicant::where('admitted_department_id', $deptId)
            ->whereIn('status', ['admitted', 'cleared', 'clearance_rejected']);

        if ($request->filled('section') && $request->section !== 'all') {
            $query->where('admitted_section', $request->section);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('phone_number', 'like', $search)
                  ->orWhere('jamb_number', 'like', $search);
            });
        }

        $perPageInput = $request->input('per_page', 15);
        $perPage = ($perPageInput === 'all' || (is_numeric($perPageInput) && (int)$perPageInput >= 9999)) 
            ? 9999 
            : (is_numeric($perPageInput) ? max((int)$perPageInput, 5) : 15);

        $applications = $query->orderBy('updated_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HOD/Clearance/Index', [
            'applications' => $applications,
            'department' => $dept,
            'filters' => $request->only(['search', 'section', 'per_page'])
        ]);
    }

    public function clearanceApprove(Request $request, Applicant $application)
    {
        $deptId = $this->getHodDepartmentId();
        if ($application->admitted_department_id !== $deptId) {
            abort(403, 'Unauthorized departmental access.');
        }

        if ($application->status !== 'admitted') {
            return back()->withErrors(['message' => 'This application is not pending clearance.']);
        }

        $tenant = app('currentTenant');
        
        $jambEmail = $application->email ?: ($application->jamb_number . '@acons.edu.ng');
        $phone = $application->phone_number ?: '08000000000';

        // Check if user already exists
        $user = User::where('email', $jambEmail)->where('tenant_id', $tenant->id)->first();
        if (!$user) {
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $application->full_name,
                'email' => $jambEmail,
                'password' => Hash::make($phone), // password is phone number
                'phone' => $phone,
                'is_active' => true,
                'force_password_change' => true, // force password change flag
            ]);
            $user->assignRole(User::ROLE_STUDENT);
        }

        // Check if student profile exists
        $student = Student::where('user_id', $user->id)->first();
        if (!$student) {
            $program = null;
            if ($application->admitted_program_id) {
                $program = \App\Models\Program::find($application->admitted_program_id);
            }

            if (!$program && $application->applied_program_id) {
                $program = \App\Models\Program::find($application->applied_program_id);
            }

            if (!$program) {
                // Fallback to department's first program
                $program = \App\Models\Program::where('department_id', $deptId)->first();
            }

            $programName = $program?->name ?? '';
            
            $initialLevel = 'ND1';
            if (stripos($programName, 'Basic') !== false || stripos($programName, 'General') !== false || stripos($programName, 'RN') !== false || stripos($programName, 'RM') !== false) {
                $initialLevel = 'Basic Nursing Level 1';
            }

            $matriculationNumber = 'ACONS/' . date('y') . '/' . str_pad($user->id, 4, '0', STR_PAD_LEFT);

            $gender = strtolower($application->sex ?: 'other');
            if (!in_array($gender, ['male', 'female', 'other'])) {
                $gender = 'other';
            }

            Student::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'department_id' => $deptId,
                'program_id' => $program?->id,
                'matriculation_number' => $matriculationNumber,
                'phone_number' => $phone,
                'status' => 'active',
                'current_level' => $initialLevel,
                'jamb_registration_number' => $application->jamb_number,
                'date_of_birth' => $application->dob ? $application->dob->format('Y-m-d') : '2000-01-01',
                'gender' => $gender,
                'nationality' => $application->nationality ?? 'Nigerian',
                'state_of_origin' => $application->state_of_origin,
                'lga' => $application->lga,
                'academic_status' => 'Good Standing',
                'years_in_current_level' => 0,
            ]);
        }

        // Set status to cleared
        $application->update([
            'status' => 'cleared',
            'admission_status' => 'cleared',
        ]);

        try {
            if (!empty($application->email)) {
                Mail::to($application->email)->send(
                    new ClearanceApprovedMail(
                        $application->full_name,
                        $jambEmail,
                        $phone
                    )
                );
            }
        } catch (\Exception $e) {
            // Ignore email errors to avoid blocking the workflow
        }

        return redirect()->back()->with('success', 'Physical clearance approved! Student credentials generated and emailed.');
    }

    public function clearanceReject(Request $request, Applicant $application)
    {
        $deptId = $this->getHodDepartmentId();
        if ($application->admitted_department_id !== $deptId) {
            abort(403, 'Unauthorized departmental access.');
        }

        $request->validate([
            'reason' => 'required|string'
        ]);

        $application->update([
            'status' => 'clearance_rejected',
            'admission_status' => 'clearance_rejected',
            'clearance_rejection_reason' => $request->reason,
        ]);

        try {
            if (!empty($application->email)) {
                Mail::to($application->email)->send(
                    new ClearanceRejectedMail(
                        $application->full_name,
                        $request->reason
                    )
                );
            }
        } catch (\Exception $e) {
            // Ignore email errors to avoid blocking
        }

        return redirect()->back()->with('success', 'Clearance rejected successfully.');
    }

    public function lecturers()
    {
        $deptId = $this->getHodDepartmentId();
        $dept = Department::find($deptId);

        $lecturers = \App\Models\Lecturer::where('department_id', $deptId)
            ->with(['user'])
            ->latest()
            ->paginate(15);

        return Inertia::render('HOD/Lecturers/Index', [
            'lecturers' => $lecturers,
            'department_name' => $dept?->name ?? 'N/A'
        ]);
    }

    public function storeLecturer(Request $request)
    {
        $deptId = $this->getHodDepartmentId();
        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,NULL,id,tenant_id,' . $tenant->id,
            'employee_id' => 'required|string|max:100|unique:lecturers,employee_id,NULL,id,tenant_id,' . $tenant->id,
            'qualification' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other',
            'phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make('password123'), // Default temporary password
            'phone' => $request->phone_number,
            'is_active' => true,
            'force_password_change' => true,
        ]);
        $user->assignRole(User::ROLE_LECTURER);

        \App\Models\Lecturer::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'department_id' => $deptId,
            'employee_id' => strtoupper($request->employee_id),
            'qualification' => $request->qualification,
            'gender' => $request->gender,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'status' => 'active',
        ]);

        return redirect()->back()->with('success', 'New lecturer registered successfully! Temporary password is: password123');
    }

    public function updateLecturer(Request $request, \App\Models\Lecturer $lecturer)
    {
        $deptId = $this->getHodDepartmentId();
        if ($lecturer->department_id !== $deptId) {
            abort(403, 'Unauthorized access to department lecturer profile.');
        }

        $tenant = app('currentTenant');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $lecturer->user_id . ',id,tenant_id,' . $tenant->id,
            'employee_id' => 'required|string|max:100|unique:lecturers,employee_id,' . $lecturer->id . ',id,tenant_id,' . $tenant->id,
            'qualification' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other',
            'phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $lecturer->user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone_number,
        ]);

        $lecturer->update([
            'employee_id' => strtoupper($request->employee_id),
            'qualification' => $request->qualification,
            'gender' => $request->gender,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', 'Lecturer profile updated successfully.');
    }

    public function toggleLecturerStatus(\App\Models\Lecturer $lecturer)
    {
        $deptId = $this->getHodDepartmentId();
        if ($lecturer->department_id !== $deptId) {
            abort(403, 'Unauthorized access to department lecturer.');
        }

        $newStatus = $lecturer->status === 'active' ? 'inactive' : 'active';
        $lecturer->update(['status' => $newStatus]);

        // Also block user account if inactive
        $lecturer->user->update(['is_active' => $newStatus === 'active']);

        return redirect()->back()->with('success', 'Lecturer status toggled to ' . $newStatus . ' successfully.');
    }

    public function students()
    {
        $deptId = $this->getHodDepartmentId();
        $dept = Department::find($deptId);

        $students = \App\Models\Student::where('department_id', $deptId)
            ->with(['user', 'program'])
            ->latest()
            ->paginate(15);

        return Inertia::render('HOD/Students/Index', [
            'students' => $students,
            'department_name' => $dept?->name ?? 'N/A'
        ]);
    }
}
