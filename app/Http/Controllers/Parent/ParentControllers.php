<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Payment, Attendance, Announcement, Student, Exam, Grade};
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class DashboardController extends Controller
{
    public function index(): Response
    {
        $guardian = Auth::user()->guardian ?? null;
        $children = $guardian
            ? $guardian->students()->with(['user','classRoom','fees'])->get()
            : collect();

        // Build per-child summary
        $childSummaries = $children->map(fn ($child) => [
            'id'              => $child->id,
            'name'            => $child->user->name,
            'class'           => $child->classRoom->name ?? '—',
            'admission'       => $child->admission_number,
            'attendance_rate' => $child->attendance_rate,
            'pending_fees'    => $child->fees->whereIn('status',['pending','partial','overdue'])->sum('amount'),
            'recent_grade'    => Grade::with('exam.subject')->where('student_id', $child->id)->latest()->first(),
        ]);

        $latestAnnouncements = Announcement::where('audience','all')
            ->orWhere('audience','parents')->latest()->limit(3)->get();

        return Inertia::render('Parent/Dashboard', [
            'children'      => $childSummaries,
            'announcements' => $latestAnnouncements,
        ]);
    }
}

class ChildController extends Controller
{
    public function index(): Response
    {
        $children = Auth::user()->guardian->students()
            ->with(['user','classRoom','fees'])->get();
        return Inertia::render('Parent/Children', ['children' => $children]);
    }

    public function results(Student $student): Response
    {
        $this->authorizeChild($student);
        $exams = Exam::with(['subject','grades' => fn ($q) => $q->where('student_id', $student->id)])
            ->where('class_room_id', $student->class_room_id)
            ->orderBy('exam_date','desc')->get();
        return Inertia::render('Parent/ChildResults', [
            'student' => $student->load('user','classRoom'),
            'exams'   => $exams,
        ]);
    }

    public function attendance(Student $student): Response
    {
        $this->authorizeChild($student);
        $attendances = Attendance::where('student_id', $student->id)
            ->orderBy('date','desc')->paginate(30);
        $stats = [
            'total'   => Attendance::where('student_id', $student->id)->count(),
            'present' => Attendance::where('student_id', $student->id)->whereIn('status',['present','late'])->count(),
            'rate'    => $student->attendance_rate,
        ];
        return Inertia::render('Parent/ChildAttendance', [
            'student'     => $student->load('user','classRoom'),
            'attendances' => $attendances,
            'stats'       => $stats,
        ]);
    }

    private function authorizeChild(Student $student): void
    {
        $guardian = Auth::user()->guardian;
        abort_unless($guardian && $guardian->students()->where('students.id', $student->id)->exists(), 403);
    }
}

class FeeController extends Controller
{
    public function index(): Response
    {
        $guardian = Auth::user()->guardian;
        $children = $guardian->students()->with(['user','fees'])->get();
        $allFees  = $children->flatMap(fn ($c) => $c->fees->map(fn ($f) => array_merge($f->toArray(), ['student_name' => $c->user->name])));

        return Inertia::render('Parent/Fees', [
            'children' => $children->map(fn ($c) => ['id' => $c->id, 'name' => $c->user->name]),
            'fees'     => $allFees->sortByDesc('created_at')->values(),
            'summary'  => [
                'total_pending' => $allFees->whereIn('status',['pending','partial','overdue'])->sum('amount'),
                'total_paid'    => $allFees->where('status','paid')->sum('amount'),
            ],
            'available_gateways' => array_values(array_filter([
                config('services.stripe.secret')     ? 'stripe'   : null,
                config('services.paystack.secret_key') ? 'paystack' : null,
                config('services.monnify.api_key')   ? 'monnify'  : null,
            ])),
        ]);
    }

    public function pay(Request $request, Fee $fee)
    {
        $request->validate(['gateway' => 'required|in:stripe,paystack,monnify']);
        // Verify this fee belongs to one of the parent's children
        $guardian = Auth::user()->guardian;
        $isOwned  = $guardian->students()->where('students.id', $fee->student_id)->exists();
        abort_unless($isOwned, 403);
        abort_if($fee->isPaid(), 422, 'Fee already paid.');

        $fee->load('student.user');
        $result = app(PaymentService::class)->initiate($fee, $request->gateway, app('currentTenant'));

        if (isset($result['authorization_url'])) return redirect($result['authorization_url']);
        if (isset($result['checkout_url']))      return redirect($result['checkout_url']);
        return back()->withErrors(['payment' => 'Payment initialization failed.']);
    }
}

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Parent/Announcements', [
            'announcements' => Announcement::where('audience','all')
                ->orWhere('audience','parents')->latest()->paginate(15),
        ]);
    }
}

class ProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Parent/Profile', ['user' => Auth::user()]);
    }
    public function update(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100', 'phone' => 'nullable|string|max:20']);
        Auth::user()->update($request->only('name','phone'));
        return back()->with('success', 'Profile updated.');
    }
}
