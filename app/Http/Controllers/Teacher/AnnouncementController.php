<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\{ClassRoom, Student, Attendance, Exam, Grade, Announcement, Subject};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::whereIn('audience', ['all', 'teachers'])
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->paginate(20);

        return Inertia::render('Teacher/Announcements', ['announcements' => $announcements]);
    }
}
