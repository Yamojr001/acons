<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Http\Requests\School\StoreAnnouncementRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SchoolAdmin/Announcements', [
            'announcements' => Announcement::with('author')->latest()->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/AnnouncementForm');
    }

    public function store(StoreAnnouncementRequest $request)
    {
        Announcement::create(array_merge($request->validated(), [
            'tenant_id'  => app('currentTenant')->id,
            'created_by' => Auth::id(),
            'published_at' => $request->published_at ?? now(),
        ]));
        return redirect()->route('admin.announcements.index')->with('success', 'Announcement published.');
    }

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('SchoolAdmin/AnnouncementForm', ['announcement' => $announcement]);
    }

    public function update(StoreAnnouncementRequest $request, Announcement $announcement)
    {
        $announcement->update($request->validated());
        return redirect()->route('admin.announcements.index')->with('success', 'Announcement updated.');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }
}
