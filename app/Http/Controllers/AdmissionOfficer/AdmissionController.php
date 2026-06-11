<?php

namespace App\Http\Controllers\AdmissionOfficer;

use App\Http\Controllers\Controller;
use App\Models\{AdmissionApplication, AdmissionForm, AcademicSession, Announcement};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ApplicantAnnouncementMail;

class AdmissionController extends Controller
{
    private function getOrCreateDefaultForm()
    {
        $tenant = app('currentTenant');
        return AdmissionForm::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'title' => 'General Admission Form',
                'description' => 'Admissions application for Nursing and Midwifery programs.',
                'fields' => [
                    ['name' => 'jamb_number', 'type' => 'text', 'required' => true],
                    ['name' => 'phone', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true
            ]
        );
    }

    public function showOpenAdmission()
    {
        $form = $this->getOrCreateDefaultForm();
        $sessions = AcademicSession::all();

        return Inertia::render('AdmissionOfficer/OpenAdmission', [
            'form' => $form,
            'sessions' => $sessions
        ]);
    }

    public function updateOpenAdmission(Request $request, AdmissionForm $form)
    {
        $request->validate([
            'admission_year' => 'required|digits:4',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'nursing_limit' => 'required|integer|min:1',
            'midwifery_limit' => 'required|integer|min:1',
            'opening_date' => 'required|date',
            'closing_date' => 'required|date|after_or_equal:opening_date',
            'registration_start_date' => 'nullable|date',
            'is_active' => 'required|boolean',
            'default_clearance_schedule' => 'nullable|string'
        ]);

        $form->update($request->only([
            'admission_year',
            'academic_session_id',
            'nursing_limit',
            'midwifery_limit',
            'opening_date',
            'closing_date',
            'registration_start_date',
            'is_active',
            'default_clearance_schedule'
        ]));

        return redirect()->back()->with('success', 'Admission window settings updated successfully!');
    }

    public function admittedList(Request $request)
    {
        $search = $request->input('search');
        $year = $request->input('year');

        $query = AdmissionApplication::whereIn('status', ['admitted', 'cleared']);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('applicant_name', 'like', "%{$search}%")
                  ->orWhere('applicant_email', 'like', "%{$search}%");
            });
        }

        if ($year) {
            $query->whereHas('form', function($q) use ($year) {
                $q->where('admission_year', $year);
            });
        }

        $applications = $query->with('admittedDepartment')->orderBy('updated_at', 'desc')->paginate(15);

        // Fetch available years for filter
        $availableYears = AdmissionForm::whereNotNull('admission_year')
            ->distinct()
            ->pluck('admission_year');

        return Inertia::render('AdmissionOfficer/AdmittedStudents', [
            'applications' => $applications,
            'filters' => [
                'search' => $search,
                'year' => $year
            ],
            'availableYears' => $availableYears
        ]);
    }

    public function announcementsIndex()
    {
        $tenant = app('currentTenant');
        
        // Fetch past announcements targeted at applicants or superadmin/admissions
        $announcements = Announcement::where('tenant_id', $tenant->id)
            ->where('audience', 'applicant')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('AdmissionOfficer/Announcements', [
            'announcements' => $announcements
        ]);
    }

    public function announcementsStore(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'target' => 'required|in:all,pending,admitted,rejected',
            'channel' => 'required|in:email,sms,both'
        ]);

        $tenant = app('currentTenant');

        // 1. Fetch target applicants
        $query = AdmissionApplication::where('tenant_id', $tenant->id);

        if ($request->target === 'pending') {
            $query->where('status', 'pending');
        } elseif ($request->target === 'admitted') {
            $query->whereIn('status', ['admitted', 'cleared']);
        } elseif ($request->target === 'rejected') {
            $query->where('status', 'rejected');
        } // 'all' fetches everyone

        $applicants = $query->get();

        if ($applicants->isEmpty()) {
            return back()->withErrors(['message' => 'No applicants match the selected target audience.']);
        }

        // 2. Broadcast dispatches
        $emailCount = 0;
        $smsCount = 0;

        foreach ($applicants as $applicant) {
            // Email dispatch
            if (in_array($request->channel, ['email', 'both'])) {
                try {
                    Mail::to($applicant->applicant_email)->send(
                        new ApplicantAnnouncementMail(
                            $applicant->applicant_name,
                            $request->subject,
                            $request->message
                        )
                    );
                    $emailCount++;
                } catch (\Exception $e) {
                    Log::error("Failed sending email announcement to {$applicant->applicant_email}: " . $e->getMessage());
                }
            }

            // SMS dispatch simulation
            if (in_array($request->channel, ['sms', 'both'])) {
                $phone = $applicant->data['phone'] ?? $applicant->data['phone_number'] ?? 'N/A';
                Log::info("Simulating SMS Broadcast to {$applicant->applicant_name} ({$phone}): {$request->message}");
                $smsCount++;
            }
        }

        // 3. Save Announcement log
        Announcement::create([
            'tenant_id' => $tenant->id,
            'created_by' => auth()->id() ?? 1,
            'title' => $request->subject,
            'body' => "Broadcasted to {$request->target} via {$request->channel}. Emails sent: {$emailCount}, SMS simulated: {$smsCount}. Message: " . $request->message,
            'audience' => 'applicant',
            'send_email' => in_array($request->channel, ['email', 'both']),
            'send_sms' => in_array($request->channel, ['sms', 'both']),
            'published_at' => now()
        ]);

        return redirect()->back()->with('success', "Announcement broadcast completed! Emails sent: {$emailCount}, SMS simulated: {$smsCount}.");
    }
}
