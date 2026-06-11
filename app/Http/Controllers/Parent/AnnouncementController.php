<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement, Student, Guardian};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::whereIn('audience', ['all', 'parents'])
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->paginate(20);

        return Inertia::render('Parent/Announcements', ['announcements' => $announcements]);
    }
}
