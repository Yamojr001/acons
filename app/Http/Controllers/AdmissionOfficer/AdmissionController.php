<?php

namespace App\Http\Controllers\AdmissionOfficer;

use App\Http\Controllers\Controller;
use App\Models\{Applicant, AdmissionForm, AcademicSession, Announcement, BroadcastRecipient};
use App\Jobs\SendBroadcastSmsJob;
use App\Services\SmsService;
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

        $query = Applicant::whereIn('status', ['admitted', 'cleared']);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('jamb_number', 'like', "%{$search}%");
            });
        }

        if ($year) {
            $query->whereHas('form', function($q) use ($year) {
                $q->where('admission_year', $year);
            });
        }

        $perPageInput = $request->input('per_page', 15);
        $perPage = ($perPageInput === 'all' || (is_numeric($perPageInput) && (int)$perPageInput >= 9999)) 
            ? 9999 
            : (is_numeric($perPageInput) ? max((int)$perPageInput, 5) : 15);

        $applications = $query->with('admittedDepartment')->orderBy('updated_at', 'desc')->paginate($perPage)->withQueryString();

        // Fetch available years for filter
        $availableYears = AdmissionForm::whereNotNull('admission_year')
            ->distinct()
            ->pluck('admission_year');

        return Inertia::render('AdmissionOfficer/AdmittedStudents', [
            'applications' => $applications,
            'filters' => [
                'search' => $search,
                'year' => $year,
                'per_page' => $perPageInput
            ],
            'availableYears' => $availableYears
        ]);
    }

    public function syncPaidApplicants(Request $request)
    {
        $query = Applicant::where(function ($q) {
            $q->where('acceptance_fee_paid', true)
              ->orWhereNotNull('acceptance_fee_paid_at')
              ->orWhere('status', 'cleared')
              ->orWhere('admission_status', 'cleared')
              ->orWhereNotNull('acceptance_fee_reference');
        });

        $applicants = $query->get();
        $count = 0;

        foreach ($applicants as $applicant) {
            if (!$applicant->acceptance_fee_paid) {
                $applicant->update([
                    'acceptance_fee_paid' => true,
                    'acceptance_fee_paid_at' => now(),
                ]);
                $applicant->acceptance_fee_paid = true;
            }
            $applicant->provisionStudentAccount();
            $count++;
        }

        return redirect()->back()->with('success', "Sync completed successfully! Processed {$count} paid applicant(s) into the portal Users & Students directory.");
    }

    public function announcementsIndex()
    {
        $tenant = app('currentTenant');
        
        // Fetch past announcements targeted at applicants with recipient delivery counts
        $announcements = Announcement::where('tenant_id', $tenant->id)
            ->where('audience', 'applicant')
            ->withCount([
                'recipients as total_recipients',
                'recipients as sms_sent_count' => fn($q) => $q->where('sms_status', 'sent'),
                'recipients as sms_failed_count' => fn($q) => $q->where('sms_status', 'failed'),
                'recipients as sms_pending_count' => fn($q) => $q->where('sms_status', 'pending'),
                'recipients as email_sent_count' => fn($q) => $q->where('email_status', 'sent'),
                'recipients as email_failed_count' => fn($q) => $q->where('email_status', 'failed'),
            ])
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
            'target'  => 'required|in:all,pending,admitted,rejected',
            'channel' => 'required|in:email,sms,both'
        ]);

        $tenant = app('currentTenant');

        // 1. Fetch target applicants
        $query = Applicant::where('tenant_id', $tenant->id);

        if ($request->target === 'pending') {
            $query->whereIn('status', ['pending', 'under_review']);
        } elseif ($request->target === 'admitted') {
            $query->whereIn('status', ['admitted', 'cleared']);
        } elseif ($request->target === 'rejected') {
            $query->whereIn('status', ['rejected', 'clearance_rejected']);
        } // 'all' fetches everyone

        $applicants = $query->get();

        if ($applicants->isEmpty()) {
            return back()->withErrors(['target' => 'No applicants match the selected target audience segment.']);
        }

        $sendEmail = in_array($request->channel, ['email', 'both']);
        $sendSms   = in_array($request->channel, ['sms', 'both']);

        // 2. Create Announcement record
        $announcement = Announcement::create([
            'tenant_id'        => $tenant->id,
            'created_by'       => auth()->id() ?? 1,
            'title'            => $request->subject,
            'body'             => $request->message,
            'audience'         => 'applicant',
            'send_email'       => $sendEmail,
            'send_sms'         => $sendSms,
            'total_recipients' => $applicants->count(),
            'published_at'     => now(),
        ]);

        // 3. Create individual tracking recipient records
        $smsRecipientIds = [];
        $smsService = app(SmsService::class);

        foreach ($applicants as $applicant) {
            $phone = $applicant->phone_number;
            $email = $applicant->email;
            $formattedPhone = $phone ? $smsService->formatPhoneNumber($phone) : null;

            $recipient = BroadcastRecipient::create([
                'tenant_id'        => $tenant->id,
                'announcement_id'  => $announcement->id,
                'recipient_type'   => Applicant::class,
                'recipient_id'     => $applicant->id,
                'recipient_name'   => $applicant->full_name,
                'recipient_email'  => $email,
                'recipient_phone'  => $phone,
                'formatted_phone'  => $formattedPhone,
                'sms_status'       => $sendSms ? 'pending' : 'skipped',
                'email_status'     => $sendEmail ? 'pending' : 'skipped',
            ]);

            if ($sendSms) {
                $smsRecipientIds[] = $recipient->id;
            }
        }

        // 4. Dispatch Email if selected
        $queuedEmails = 0;
        if ($sendEmail) {
            foreach ($applicants as $applicant) {
                if (!empty($applicant->email)) {
                    try {
                        Mail::to($applicant->email)->queue(
                            new ApplicantAnnouncementMail(
                                $applicant->full_name,
                                $request->subject,
                                $request->message
                            )
                        );
                        $queuedEmails++;
                    } catch (\Throwable $e) {
                        Log::error("Failed to queue email announcement to {$applicant->email}: " . $e->getMessage());
                    }
                }
            }
        }

        // 5. Dispatch SMS if selected - use background queue when there are multiple receivers
        if ($sendSms && !empty($smsRecipientIds)) {
            if (config('queue.default') === 'database') {
                SendBroadcastSmsJob::dispatch($announcement->id, $smsRecipientIds, $request->message);
            } else {
                SendBroadcastSmsJob::dispatchAfterResponse($announcement->id, $smsRecipientIds, $request->message);
            }
        }

        $messageDetail = "Broadcast campaign dispatched to {$applicants->count()} applicant(s).";
        if ($sendSms) {
            $messageDetail .= " SMS queued via gateway.";
        }
        if ($sendEmail) {
            $messageDetail .= " Emails queued ({$queuedEmails}).";
        }

        return redirect()->back()->with('success', $messageDetail);
    }

    /**
     * Retry sending SMS ONLY to recipients who failed or did not receive it.
     */
    public function retryAnnouncementSms(Request $request, Announcement $announcement)
    {
        $tenant = app('currentTenant');
        abort_if($announcement->tenant_id !== $tenant->id, 403);

        // Find failed/unsent recipients strictly
        $query = $announcement->recipients()->where('sms_status', '!=', 'sent');

        if ($request->has('recipient_ids') && is_array($request->recipient_ids) && !empty($request->recipient_ids)) {
            $query->whereIn('id', $request->recipient_ids);
        }

        $failedRecipients = $query->get();

        if ($failedRecipients->isEmpty()) {
            return back()->with('info', 'All target recipients have already received the broadcast SMS successfully. No retry required.');
        }

        $recipientIds = $failedRecipients->pluck('id')->toArray();

        // Mark them back to pending and clear prior errors
        $announcement->recipients()->whereIn('id', $recipientIds)->update([
            'sms_status' => 'pending',
            'sms_error'  => null,
        ]);

        // Dispatch background queue job
        if (config('queue.default') === 'database') {
            SendBroadcastSmsJob::dispatch($announcement->id, $recipientIds, $announcement->body);
        } else {
            SendBroadcastSmsJob::dispatchAfterResponse($announcement->id, $recipientIds, $announcement->body);
        }

        return back()->with('success', "SMS retry initiated for {$failedRecipients->count()} recipient(s) who did not receive the initial broadcast.");
    }

    /**
     * Get detailed list of recipients and their delivery states for an announcement.
     */
    public function announcementRecipients(Announcement $announcement)
    {
        $tenant = app('currentTenant');
        abort_if($announcement->tenant_id !== $tenant->id, 403);

        $recipients = $announcement->recipients()
            ->orderByRaw("CASE WHEN sms_status = 'failed' THEN 1 WHEN sms_status = 'pending' THEN 2 ELSE 3 END")
            ->orderBy('recipient_name', 'asc')
            ->get([
                'id',
                'announcement_id',
                'recipient_name',
                'recipient_email',
                'recipient_phone',
                'formatted_phone',
                'sms_status',
                'sms_error',
                'sms_message_id',
                'sms_batch_id',
                'sms_sent_at',
                'retry_count',
                'last_attempt_at',
            ]);

        return response()->json([
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'total_recipients' => $announcement->recipients()->count(),
                'sms_sent_count' => $announcement->recipients()->where('sms_status', 'sent')->count(),
                'sms_failed_count' => $announcement->recipients()->where('sms_status', 'failed')->count(),
                'sms_pending_count' => $announcement->recipients()->where('sms_status', 'pending')->count(),
            ],
            'recipients' => $recipients,
        ]);
    }

    /**
     * Update an individual recipient's phone number and reset to pending for retry.
     */
    public function updateRecipientPhone(Request $request, BroadcastRecipient $recipient)
    {
        $tenant = app('currentTenant');
        abort_if($recipient->tenant_id !== $tenant->id, 403);

        $request->validate([
            'phone' => 'required|string|min:10|max:15'
        ]);

        $formatted = app(SmsService::class)->formatPhoneNumber($request->phone);
        $recipient->update([
            'recipient_phone' => $request->phone,
            'formatted_phone' => $formatted,
            'sms_status'      => 'pending',
            'sms_error'       => null,
        ]);

        return back()->with('success', "Phone number updated for {$recipient->recipient_name}.");
    }
}
