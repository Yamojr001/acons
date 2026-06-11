<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Grade, Exam, Attendance, Announcement};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB};
use Inertia\{Inertia, Response};

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::whereIn('audience', ['all', 'students'])
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->paginate(20);

        return Inertia::render('Student/Announcements', ['announcements' => $announcements]);
    }
}
