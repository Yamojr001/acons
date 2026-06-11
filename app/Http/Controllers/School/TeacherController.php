<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{
    Tenant, User, Teacher, Student, ClassRoom, Subject,
    Fee, Payment, Exam, Grade, Attendance, Announcement, Guardian
};
use App\Services\TenantResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Storage, Cache};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $teachers = Lecturer::with('user')
            ->withCount(['classRooms'])
            ->when($request->search, fn ($q, $s) =>
                $q->whereHas('user', fn ($u) => $u->where('name','like',"%{$s}%")->orWhere('email','like',"%{$s}%"))
            )
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Teachers', [
            'teachers' => $teachers->through(fn ($t) => array_merge($t->toArray(), ['subjects_count' => 0])),
            'filters'  => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/Teachers/Create');
    }

    public function show(Teacher $teacher): Response
    {
        return Inertia::render('SchoolAdmin/Teachers/Show', [
            'teacher' => $teacher->load(['user', 'classRooms'])
        ]);
    }

    public function edit(Teacher $teacher): Response
    {
        return Inertia::render('SchoolAdmin/Teachers/Edit', [
            'teacher' => $teacher->load('user')
        ]);
    }

    public function store(Request $request)
    {
        $tenant = app('currentTenant');
        $request->validate([
            'name'          => 'required|string|max:100',
            'email'         => 'required|email|max:150',
            'employee_id'   => 'required|string|max:30',
            'hire_date'     => 'required|date',
            'qualification' => 'nullable|string|max:200',
            'phone'         => 'nullable|string|max:20',
        ]);

        abort_if(User::where('tenant_id',$tenant->id)->where('email',$request->email)->exists(), 422, 'Email already exists.');

        DB::transaction(function () use ($request, $tenant) {
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => bcrypt(Str::random(12)),
                'role'      => 'teacher',
                'phone'     => $request->phone,
                'is_active' => true,
            ]);

            Lecturer::create([
                'tenant_id'     => $tenant->id,
                'user_id'       => $user->id,
                'employee_id'   => $request->employee_id,
                'hire_date'     => $request->hire_date,
                'qualification' => $request->qualification,
            ]);
        });

        return redirect()->route('admin.teachers.index')->with('success', 'Teacher added.');
    }
    public function update(Request $request, Teacher $teacher)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'employee_id'   => 'required|string|max:30',
            'hire_date'     => 'required|date',
            'qualification' => 'nullable|string|max:200',
            'phone'         => 'nullable|string|max:20',
        ]);

        DB::transaction(function () use ($request, $teacher) {
            $teacher->user->update([
                'name'  => $request->name,
                'phone' => $request->phone,
            ]);

            $teacher->update([
                'employee_id'   => $request->employee_id,
                'hire_date'     => $request->hire_date,
                'qualification' => $request->qualification,
            ]);
        });

        return redirect()->route('admin.teachers.index')->with('success', 'Teacher updated.');
    }
    public function destroy(Teacher $teacher)
    {
        DB::transaction(fn () => $teacher->user->delete());
        return redirect()->route('admin.teachers.index')->with('success', 'Teacher removed.');
    }
}
