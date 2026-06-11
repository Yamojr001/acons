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

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SchoolAdmin/Users', [
            'users' => User::orderBy('name')->paginate(25),
        ]);
    }

    public function destroy(User $user)
    {
        abort_if($user->id === Auth::id(), 403, 'Cannot delete your own account.');
        $user->delete();
        return back()->with('success', 'User deleted.');
    }
}
