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

class SubjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SchoolAdmin/Subjects', [
            'subjects' => Course::withCount(['exams'])->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100', 
            'code'     => 'nullable|string|max:20', 
            'category' => 'nullable|string|max:50',
            'section'  => 'nullable|string|max:50'
        ]);
        Course::create(array_merge($request->only('name','code','category','section'), ['tenant_id' => app('currentTenant')->id]));
        return back()->with('success', 'Subject created.');
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return back()->with('success', 'Subject deleted.');
    }
}
