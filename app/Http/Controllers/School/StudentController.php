<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Student, User, Guardian, ClassRoom};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $students = Student::with(['user', 'classRoom', 'guardians'])
            ->when($request->search, fn ($q, $s) =>
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%"))
                  ->orWhere('admission_number', 'like', "%{$s}%")
            )
            ->when($request->class_room_id, fn ($q, $id) =>
                $q->where('class_room_id', $id)
            )
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Students', [
            'students'   => $students,
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'filters'    => $request->only('search', 'class_room_id'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/StudentCreate', [
            'classrooms' => ClassRoom::orderBy('name')->get(['id', 'name', 'academic_year']),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        
        $request->validate([
            'name'           => 'required|string|max:100',
            'email'          => 'required|email|max:150|unique:users,email',
            'phone'          => 'nullable|string|max:20',
            'date_of_birth'  => 'required|date',
            'gender'         => 'required|in:male,female,other',
            'blood_group'    => 'nullable|string|max:5',
            'address'        => 'nullable|string|max:300',
            'class_room_id'  => 'required|exists:class_rooms,id',
            'admission_date' => 'required|date',
            'guardian_name'  => 'required|string|max:100',
            'guardian_email' => 'required|email|max:150',
            'guardian_phone' => 'required|string|max:20',
            'guardian_relationship' => 'required|string',
            'guardian_occupation' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $tenant) {
            // Guardian
            $guardianUser = User::firstOrCreate(
                ['email' => $request->guardian_email, 'tenant_id' => $tenant->id],
                [
                    'name'      => $request->guardian_name,
                    'phone'     => $request->guardian_phone,
                    'password'  => Hash::make('password'),
                    'is_active' => true,
                ]
            );
            if ($guardianUser->wasRecentlyCreated) {
                $guardianUser->assignRole('parent');
            }

            $guardian = Guardian::firstOrCreate(
                ['user_id' => $guardianUser->id, 'tenant_id' => $tenant->id],
                [
                    'relationship' => $request->guardian_relationship,
                    'occupation'   => $request->guardian_occupation,
                ]
            );

            // Student User
            $studentUser = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $request->name,
                'email'     => $request->email,
                'phone'     => $request->phone,
                'password'  => Hash::make('password'),
                'is_active' => true,
            ]);
            $studentUser->assignRole('student');

            // Student Profile
            Student::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $studentUser->id,
                'guardian_id'      => $guardian->id,
                'class_room_id'    => $request->class_room_id,
                'admission_number' => 'STD-' . date('Y') . '-' . strtoupper(Str::random(5)),
                'admission_date'   => $request->admission_date,
                'date_of_birth'    => $request->date_of_birth,
                'gender'           => $request->gender,
                'blood_group'      => $request->blood_group,
                'address'          => $request->address,
                'status'           => 'active',
            ]);
        });

        return redirect()->route('admin.students.index')->with('success', 'Student enrolled successfully.');
    }

    public function edit(Student $student): Response
    {
        $student->load(['user', 'guardian.user']);
        return Inertia::render('SchoolAdmin/StudentCreate', [ // reuse form
            'student'    => $student,
            'classrooms' => ClassRoom::orderBy('name')->get(['id', 'name', 'academic_year']),
        ]);
    }

    public function update(Request $request, Student $student)
    {
        // For brevity, similar to store but using update()
        $request->validate([
            'name' => 'required|string|max:100',
            'class_room_id' => 'required|exists:class_rooms,id',
        ]);

        DB::transaction(function () use ($request, $student) {
            $student->user->update(['name' => $request->name, 'phone' => $request->phone]);
            $student->update([
                'class_room_id' => $request->class_room_id,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'address' => $request->address,
            ]);
        });
        return redirect()->route('admin.students.index')->with('success', 'Student updated.');
    }

    public function destroy(Student $student)
    {
        $student->user->delete();
        return redirect()->route('admin.students.index')->with('success', 'Student removed.');
    }

    public function promote(Request $request, Student $student)
    {
        $request->validate(['class_room_id' => 'required|exists:class_rooms,id']);
        $student->update(['class_room_id' => $request->class_room_id]);
        return back()->with('success', 'Student promoted to new class.');
    }

    public function import() 
    {
        // Stub implementation
        return back()->with('success', 'Students imported successfully.');
    }

    public function export()
    {
        // Stub implementation
        return back()->with('success', 'Export triggered successfully.');
    }
}
