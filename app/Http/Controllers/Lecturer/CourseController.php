<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Semester;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        $lecturer = Auth::user()->lecturer;
        $tenant = app('currentTenant');
        
        $currentSemester = Semester::where('tenant_id', $tenant->id)
            ->where('is_current', true)
            ->first();

        $courses = Course::where('lecturer_id', $lecturer->id)
            ->withCount(['registrations' => function($q) use ($currentSemester) {
                if ($currentSemester) {
                    $q->where('semester_id', $currentSemester->id);
                }
            }])
            ->get();

        return Inertia::render('Lecturer/Courses', [
            'courses' => $courses,
            'currentSemester' => $currentSemester
        ]);
    }
}
