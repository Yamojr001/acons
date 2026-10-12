<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Program;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicApplicantController extends Controller
{
    /**
     * Show the ACONS Application Form.
     */
    public function showApplyForm(): Response
    {
        $tenant = app('currentTenant');
        $programs = Program::where('tenant_id', $tenant->id)->get();

        return Inertia::render('Public/Admissions/Apply', [
            'tenant' => $tenant,
            'programs' => $programs
        ]);
    }

    /**
     * Store the applicant registration.
     */
    public function submitApplyForm(Request $request)
    {
        $tenant = app('currentTenant');

        $request->validate([
            // Personal Info
            'full_name' => 'required|string|max:255',
            'dob' => 'required|date',
            'place_of_birth' => 'required|string|max:255',
            'lga' => 'required|string|max:255',
            'state_of_origin' => 'required|string|max:255',
            'nationality' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'contact_address' => 'required|string',
            'phone_number' => 'required|string|max:30',
            'sex' => 'required|string|max:20',
            'next_of_kin_name' => 'required|string|max:255',
            'next_of_kin_address' => 'required|string',
            'jamb_score' => 'required|integer|min:150',
            'jamb_number' => 'required|string|max:40|unique:applicants,jamb_number',
            'physical_disabilities' => 'nullable|string|max:255',
            'highest_qualification' => 'nullable|string|max:255',

            // Parents
            'parent_name' => 'required|string|max:255',
            'parent_address' => 'required|string',
            'parent_phone' => 'required|string|max:30',
            'sponsor_name_address' => 'required|string',

            // Schools
            'primary_school_name' => 'required|string|max:255',
            'primary_school_from' => 'required|string|max:20',
            'primary_school_to' => 'required|string|max:20',
            'secondary_school_name' => 'required|string|max:255',
            'secondary_school_from' => 'required|string|max:20',
            'secondary_school_to' => 'required|string|max:20',

            // O'Levels Sitting 1
            'first_sitting_type' => 'required|string|max:40',
            'first_sitting_year' => 'required|string|max:10',
            'first_sitting_no' => 'required|string|max:40',
            'first_sitting_grades' => 'required|array',

            // Program Choice
            'applied_program_id' => 'nullable|exists:programs,id',

            // O'Levels Sitting 2 (Optional)
            'second_sitting_type' => 'nullable|string|max:40',
            'second_sitting_year' => 'nullable|string|max:10',
            'second_sitting_no' => 'nullable|string|max:40',
            'second_sitting_grades' => 'nullable|array',
        ]);

        // Create applicant record. Initial password is their phone number
        $applicant = Applicant::create([
            'tenant_id' => $tenant->id,
            'jamb_number' => strtoupper($request->jamb_number),
            'password' => Hash::make($request->phone_number),
            
            // Personal
            'full_name' => $request->full_name,
            'dob' => $request->dob,
            'place_of_birth' => $request->place_of_birth,
            'lga' => $request->lga,
            'state_of_origin' => $request->state_of_origin,
            'nationality' => $request->nationality,
            'email' => $request->email,
            'contact_address' => $request->contact_address,
            'phone_number' => $request->phone_number,
            'sex' => $request->sex,
            'next_of_kin_name' => $request->next_of_kin_name,
            'next_of_kin_address' => $request->next_of_kin_address,
            'physical_disabilities' => $request->physical_disabilities ?? 'None',
            'highest_qualification' => $request->highest_qualification ?? 'None',
            'jamb_score' => $request->jamb_score,

            // Schools Attended
            'primary_school_name' => $request->primary_school_name,
            'primary_school_from' => $request->primary_school_from,
            'primary_school_to' => $request->primary_school_to,
            'secondary_school_name' => $request->secondary_school_name,
            'secondary_school_from' => $request->secondary_school_from,
            'secondary_school_to' => $request->secondary_school_to,
            'tertiary_school_name' => $request->tertiary_school_name,
            'tertiary_school_from' => $request->tertiary_school_from,
            'tertiary_school_to' => $request->tertiary_school_to,

            // O'Levels Sitting 1
            'first_sitting_type' => $request->first_sitting_type,
            'first_sitting_year' => $request->first_sitting_year,
            'first_sitting_no' => $request->first_sitting_no,
            'first_sitting_grades' => $request->first_sitting_grades,

            // O'Levels Sitting 2
            'second_sitting_type' => $request->second_sitting_type,
            'second_sitting_year' => $request->second_sitting_year,
            'second_sitting_no' => $request->second_sitting_no,
            'second_sitting_grades' => $request->second_sitting_grades,

            // Contacts
            'parent_name' => $request->parent_name,
            'parent_address' => $request->parent_address,
            'parent_phone' => $request->parent_phone,
            'sponsor_name_address' => $request->sponsor_name_address,

            // States
            'applied_program_id' => $request->applied_program_id,
            'payment_status' => 'pending',
            'admission_status' => 'pending'
        ]);

        $this->syncAdmissionApplication($applicant);

        return redirect()->route('admissions.pay', ['applicant' => $applicant->id]);
    }

    /**
     * Show ACONS admission form fee gateway screen (ZainPay).
     */
    public function showPaymentPage(Applicant $applicant)
    {
        if ($applicant->payment_status === 'paid') {
            try {
                Auth::guard('applicant')->login($applicant);
                request()->session()->regenerate();
            } catch (\Throwable) {}

            return redirect()->route('admissions.receipt', $applicant->id)
                ->with('success', 'Your fee is already cleared. Here is your official e-Receipt.');
        }

        $tenant = app('currentTenant');

        return Inertia::render('Public/Admissions/PaymentGateway', [
            'tenant'     => $tenant,
            'applicant'  => $applicant,
            'fee_amount' => 14700.00,
        ]);
    }

    /**
     * Initialize a ZainPay payment session and redirect applicant to ZainPay.
     */
    public function zainpayInit(Applicant $applicant)
    {
        if ($applicant->payment_status === 'paid') {
            return Inertia::location(route('admissions.receipt', $applicant->id));
        }

        $txnRef      = 'ACON_ADM_' . $applicant->id . '_' . time();
        $callbackUrl = route('admissions.pay.verify', $applicant->id);
        $baseUrl     = rtrim(config('services.zainpay.base_url', 'https://sandbox.zainpay.ng'), '/');

        $applicantEmail = trim($applicant->email ?? '');
        if (empty($applicantEmail) || !filter_var($applicantEmail, FILTER_VALIDATE_EMAIL)) {
            $applicantEmail = strtolower($applicant->jamb_number) . '@acons.edu.ng';
        }

        $response = Http::timeout(60)->withToken(config('services.zainpay.public_key'))
            ->post("{$baseUrl}/zainbox/card/initialize/payment", [
                'amount'        => (string) 14700,
                'txnRef'        => $txnRef,
                'emailAddress'  => $applicantEmail,
                'email'         => $applicantEmail,
                'mobileNumber'  => $applicant->phone_number ?: '08000000000',
                'zainboxCode'   => config('services.zainpay.zainbox_code'),
                'callBackUrl'   => $callbackUrl,
            ])->json();

        if (($response['code'] ?? '') !== '00') {
            Log::error('ZainPay initialization failed', [
                'applicant_id' => $applicant->id,
                'response'     => $response,
                'baseUrl'      => $baseUrl,
                'zainboxCode'  => config('services.zainpay.zainbox_code'),
            ]);
            return back()->withErrors(['payment' => 'ZainPay initialization failed: ' . ($response['description'] ?? 'Unknown error. Check your ZainPay credentials.')]);
        }

        // Stash ref in session and persist in DB for verification/reconciliation fallback
        session(['zainpay_txn_' . $applicant->id => $txnRef]);
        $applicant->update(['payment_reference' => $txnRef]);

        $redirectUrl = is_array($response['data'] ?? null)
            ? ($response['data']['url'] ?? $response['data']['paymentUrl'] ?? '')
            : ($response['data'] ?? '');

        return Inertia::location($redirectUrl);
    }

    /**
     * Verify ZainPay callback after applicant completes payment.
     */
    public function zainpayVerify(Request $request, Applicant $applicant)
    {
        if ($applicant->payment_status === 'paid') {
            try {
                Auth::guard('applicant')->login($applicant);
                $request->session()->regenerate();
            } catch (\Throwable) {}

            return redirect()->route('admissions.receipt', $applicant->id)
                ->with('success', 'Fee already cleared. Here is your official e-Receipt.');
        }

        $txnRef  = $request->query('txnRef', session('zainpay_txn_' . $applicant->id, $applicant->payment_reference));
        $baseUrl = rtrim(config('services.zainpay.base_url', 'https://sandbox.zainpay.ng'), '/');
        $pubKey  = config('services.zainpay.public_key');
        $zainboxCode = config('services.zainpay.zainbox_code');

        if (!$txnRef) {
            return redirect()->route('admissions.pay', $applicant->id)
                ->with('error', 'Payment reference missing. Please try again.');
        }

        $isVerified = false;
        $amountPaid = 14700.00;

        // 1. Verify via virtual-account wallet deposit verification v2
        try {
            $verify = Http::timeout(30)->withToken($pubKey)
                ->get("{$baseUrl}/virtual-account/wallet/deposit/verify/v2/{$txnRef}")
                ->json();

            if (($verify['code'] ?? '') === '00' && strtolower($verify['data']['status'] ?? '') === 'success') {
                $isVerified = true;
                $rawAmount = (float) ($verify['data']['amount'] ?? $verify['data']['depositedAmount'] ?? 14700);
                $amountPaid = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;
            }
        } catch (\Exception $e) {}

        // 2. Fallback: Verify via Zainpay hanging card transaction reconcile endpoint
        if (!$isVerified) {
            try {
                $cardReconcile = Http::timeout(30)->withToken($pubKey)
                    ->get("{$baseUrl}/virtual-account/wallet/transaction/reconcile/card-payment", [
                        'txnRef' => $txnRef,
                    ])->json();

                if (($cardReconcile['code'] ?? '') === '00') {
                    $txnStatus = strtolower($cardReconcile['data']['txnStatus'] ?? '');
                    if (in_array($txnStatus, ['success', 'successful'])) {
                        $isVerified = true;
                    }
                }
            } catch (\Exception $e) {}
        }

        // 3. Fallback: Search Zainbox card transactions by reference
        if (!$isVerified && !empty($zainboxCode)) {
            try {
                $cardTxns = Http::timeout(30)->withToken($pubKey)
                    ->get("{$baseUrl}/zainbox/card/transactions/{$zainboxCode}", [
                        'txnRef' => $txnRef,
                    ])->json();

                if (($cardTxns['code'] ?? '') === '00' && !empty($cardTxns['data'])) {
                    foreach ($cardTxns['data'] as $cardTxn) {
                        $txnStatus = strtolower($cardTxn['txnStatus'] ?? '');
                        if (in_array($txnStatus, ['success', 'successful'])) {
                            $isVerified = true;
                            $rawAmount = (float) ($cardTxn['amount'] ?? 14700);
                            $amountPaid = $rawAmount > 100000 ? round($rawAmount / 100, 2) : $rawAmount;
                            break;
                        }
                    }
                }
            } catch (\Exception $e) {}
        }

        // 4. Fallback: Match by amount (₦14,700) and timestamp within 40-minute window
        if (!$isVerified) {
            try {
                $reconcileService = app(\App\Services\ZainpayReconciliationService::class);
                $refTime = $applicant->created_at ?: now();
                $matchedTx = $reconcileService->findMatchingTransactionByAmountAndTimestamp(14700.00, $refTime, 40);

                if ($matchedTx) {
                    $isVerified = true;
                    $txnRef = $matchedTx['txnRef'] ?: ($txnRef ?: ('ACON_ADM_' . $applicant->id . '_' . time()));
                    $amountPaid = 14700.00;
                }
            } catch (\Exception $e) {}
        }

        if ($isVerified) {
            $applicant->update([
                'payment_status'    => 'paid',
                'amount_paid'       => $amountPaid > 0 ? $amountPaid : 14700.00,
                'payment_reference' => $txnRef,
            ]);

            $this->createAdmissionApplication($applicant);

            // Send transactional SMS notification via Sendar
            if (!empty($applicant->phone_number)) {
                try {
                    app(\App\Services\SmsService::class)->send(
                        $applicant->phone_number,
                        "Dear {$applicant->full_name}, your ACONS application fee payment of NGN 14,700 was confirmed. Ref: {$txnRef}. Print your receipt at: " . url('/admissions/login')
                    );
                } catch (\Throwable) {}
            }

            // Automatically log in the applicant and take them directly to their payment receipt
            try {
                Auth::guard('applicant')->login($applicant);
                $request->session()->regenerate();
            } catch (\Throwable) {}

            return redirect()->route('admissions.receipt', $applicant->id)
                ->with('success', 'Payment confirmed! Here is your official e-Receipt.');
        }

        return redirect()->route('admissions.pay', $applicant->id)
            ->with('error', 'Payment not confirmed yet. Please complete payment or contact support if you were charged.');
    }

    /**
     * Show authentic Remita-style electronic payment receipt (e-Receipt).
     */
    public function showReceipt(Applicant $applicant): Response
    {
        if ($applicant->payment_status !== 'paid') {
            return redirect()->route('admissions.pay', $applicant->id)
                ->with('error', 'Please complete the application fee payment first to view your receipt.');
        }

        // Auto-authenticate applicant if not logged in
        if (!Auth::guard('applicant')->check() || Auth::guard('applicant')->id() !== $applicant->id) {
            try {
                Auth::guard('applicant')->login($applicant);
                request()->session()->regenerate();
            } catch (\Throwable) {}
        }

        $tenant = app('currentTenant');
        $academicSession = \App\Models\AcademicSession::where('tenant_id', $tenant->id ?? 1)->where('is_current', true)->first();

        return Inertia::render('Public/Admissions/Receipt', [
            'tenant'          => $tenant,
            'applicant'       => $applicant,
            'academicSession' => $academicSession,
            'fee_amount'      => (float) ($applicant->amount_paid ?: 14700.00),
            'amount_in_words' => 'Fourteen Thousand Seven Hundred Naira Only',
        ]);
    }

    /**
     * Create or update the AdmissionApplication record with payment tracking.
     */
    private function syncAdmissionApplication(Applicant $applicant): void
    {
        $tenant       = app('currentTenant');
        $tenantId     = $tenant ? $tenant->id : ($applicant->tenant_id ?: 1);
        $admissionForm = \App\Models\AdmissionForm::where('tenant_id', $tenantId)->where('is_active', true)->first();
        $formId = $admissionForm ? $admissionForm->id : 1;

        $existing = \App\Models\AdmissionApplication::where('applicant_id', $applicant->id)
            ->orWhere(function ($q) use ($applicant) {
                if (!empty($applicant->email)) {
                    $q->where('applicant_email', $applicant->email);
                }
                if (!empty($applicant->jamb_number)) {
                    $q->orWhere('data->jamb_number', $applicant->jamb_number);
                }
            })
            ->first();

        $data = [
            'payment_status'       => $applicant->payment_status ?: 'pending',
            'payment_reference'    => $applicant->payment_reference,
            'amount_paid'          => (float) ($applicant->amount_paid ?: 0),
            'passport_photo'       => $applicant->passport_photo,
            'applied_program_id'   => $applicant->applied_program_id,
            'applied_program_name' => $applicant->appliedProgram?->name ?? 'Basic Nursing',
            'exam_date'            => $applicant->exam_date ? $applicant->exam_date->format('Y-m-d H:i:s') : null,
            'exam_venue'           => $applicant->exam_venue,
            'seat_number'          => $applicant->seat_number,
            'jamb_number'          => $applicant->jamb_number,
            'phone_number'         => $applicant->phone_number,
            'jamb_score'           => $applicant->jamb_score,
            'state_of_origin'      => $applicant->state_of_origin,
            'lga'                  => $applicant->lga,
            'gender'               => $applicant->sex,
            'date_of_birth'        => $applicant->dob ? $applicant->dob->format('Y-m-d') : null,
            'first_sitting_type'   => $applicant->first_sitting_type,
            'first_sitting_year'   => $applicant->first_sitting_year,
            'first_sitting_no'     => $applicant->first_sitting_no,
            'first_sitting_grades' => $applicant->first_sitting_grades,
            'second_sitting_type'  => $applicant->second_sitting_type,
            'second_sitting_year'  => $applicant->second_sitting_year,
            'second_sitting_no'    => $applicant->second_sitting_no,
            'second_sitting_grades'=> $applicant->second_sitting_grades,
        ];

        if ($existing) {
            $mergedData = array_merge($existing->data ?: [], $data);
            $existing->update([
                'applicant_id'      => $applicant->id,
                'applicant_name'    => $applicant->full_name,
                'applicant_email'   => $applicant->email ?: ($applicant->jamb_number . '@acons.edu.ng'),
                'payment_status'    => $applicant->payment_status ?: 'pending',
                'amount_paid'       => (float) ($applicant->amount_paid ?: 0),
                'payment_reference' => $applicant->payment_reference,
                'data'              => $mergedData,
            ]);
        } else {
            \App\Models\AdmissionApplication::create([
                'tenant_id'         => $tenantId,
                'admission_form_id' => $formId,
                'applicant_id'      => $applicant->id,
                'applicant_name'    => $applicant->full_name,
                'applicant_email'   => $applicant->email ?: ($applicant->jamb_number . '@acons.edu.ng'),
                'status'            => 'pending',
                'payment_status'    => $applicant->payment_status ?: 'pending',
                'amount_paid'       => (float) ($applicant->amount_paid ?: 0),
                'payment_reference' => $applicant->payment_reference,
                'data'              => $data,
                'created_at'        => $applicant->created_at ?: now(),
            ]);
        }
    }

    private function createAdmissionApplication(Applicant $applicant): void
    {
        $this->syncAdmissionApplication($applicant);
    }

    /**
     * Legacy authorize fallback (kept for any direct POST scenarios).
     */
    public function authorizePayment(Request $request, Applicant $applicant)
    {
        if ($applicant->payment_status === 'paid') {
            return redirect()->route('admissions.receipt', $applicant->id)->with('success', 'Fee already authorized.');
        }

        $applicant->update([
            'payment_status'    => 'paid',
            'amount_paid'       => 14700.00,
            'payment_reference' => 'ACON_ADM_' . strtoupper(Str::random(12)),
        ]);

        $this->createAdmissionApplication($applicant);

        // Send transactional SMS notification via Sendar
        if (!empty($applicant->phone_number)) {
            try {
                app(\App\Services\SmsService::class)->send(
                    $applicant->phone_number,
                    "Dear {$applicant->full_name}, your ACONS application fee has been authorized. Ref: {$applicant->payment_reference}. Print your receipt at: " . url('/admissions/login')
                );
            } catch (\Throwable) {}
        }

        try {
            Auth::guard('applicant')->login($applicant);
            $request->session()->regenerate();
        } catch (\Throwable) {}

        return redirect()->route('admissions.receipt', $applicant->id)
            ->with('success', 'Payment authorized! Here is your official e-Receipt.');
    }

    /**
     * Show applicant login form.
     */
    public function showLoginForm(): Response
    {
        $tenant = app('currentTenant');

        return Inertia::render('Public/Admissions/Login', [
            'tenant' => $tenant
        ]);
    }



    /**
     * Authenticate applicant credentials.
     */
    public function login(Request $request)
    {
        $request->validate([
            'jamb_number' => 'required|string',
            'phone_number' => 'required|string',
        ]);

        $jamb = strtoupper($request->jamb_number);

        // Find applicant
        $applicant = Applicant::where('jamb_number', $jamb)->first();

        if (!$applicant) {
            return back()->withErrors(['jamb_number' => 'No registration details found matching this JAMB Number.']);
        }

        if ($applicant->payment_status !== 'paid') {
            return redirect()->route('admissions.pay', ['applicant' => $applicant->id])
                ->with('error', 'Please complete the application form fee settlement of N14,700 to unlock your portal.');
        }

        // Auth check: initial password is their phone number
        if (Auth::guard('applicant')->attempt([
            'jamb_number' => $jamb,
            'password' => $request->phone_number
        ], $request->filled('remember'))) {
            $request->session()->regenerate();
            return redirect()->route('admissions.dashboard');
        }

        return back()->withErrors(['phone_number' => 'The provided phone number is incorrect. Please verify your details.']);
    }

    /**
     * Applicant Dashboard tracking page with tabs, photocard, and screening edit.
     */
    public function dashboard(): Response
    {
        $applicant = Auth::guard('applicant')->user();
        $tenant = app('currentTenant');
        
        $applicantWithProgram = Applicant::with(['admittedProgram', 'appliedProgram'])->find($applicant->id);
        $academicSession = \App\Models\AcademicSession::where('tenant_id', $tenant->id ?? 1)->where('is_current', true)->first();
        $admissionForm = \App\Models\AdmissionForm::where('tenant_id', $tenant->id ?? 1)->where('is_active', true)->first();
        $programs = \App\Models\Program::where('tenant_id', $tenant->id ?? 1)->get(['id', 'name', 'degree_type', 'duration_years']);

        // Default or configured exam details
        $examDate = $applicantWithProgram->exam_date 
            ? $applicantWithProgram->exam_date->format('l, F j, Y — g:i A') 
            : 'Wednesday, October 14, ' . date('Y') . ' — 8:30 AM';

        $examVenue = $applicantWithProgram->exam_venue 
            ?: 'ACONS Advanced CBT Centre, Main Campus, Takur Site, Dutse, Jigawa State';

        $seatNumber = $applicantWithProgram->seat_number 
            ?: ('ACONS/CBT/' . date('Y') . '/' . str_pad($applicantWithProgram->id, 4, '0', STR_PAD_LEFT));

        $examDetails = [
            'exam_date'    => $examDate,
            'exam_venue'   => $examVenue,
            'seat_number'  => $seatNumber,
            'batch'        => 'Batch A (Morning Session)',
            'cbt_duration' => '90 Minutes (Computer-Based Test)',
            'subjects'     => [
                ['name' => 'English Language', 'questions' => 20],
                ['name' => 'Biology & Human Anatomy', 'questions' => 20],
                ['name' => 'Chemistry', 'questions' => 20],
                ['name' => 'Physics', 'questions' => 20],
                ['name' => 'Current Affairs & General Nursing Aptitude', 'questions' => 20],
            ],
            'instructions' => [
                'Arrive at the CBT Examination Centre at least 45 minutes prior to the scheduled start time for biometric verification and facial accreditation.',
                'Candidates must present a printed color copy of this Examination Photocard along with the original JAMB UTME result slip and Photo ID.',
                'Electronic gadgets, mobile phones, smartwatches, recording devices, and programmable scientific calculators are strictly prohibited inside the CBT exam hall.',
                'Impersonation or examination malpractice of any form will lead to immediate disqualification, cancellation of results, and prosecution by law enforcement.',
                'Ensure your verified passport photograph is clearly printed on this card. Photocards without a photograph or with defaced images will not be admitted.',
            ],
        ];

        return Inertia::render('Public/Admissions/Dashboard', [
            'tenant'          => $tenant,
            'applicant'       => $applicantWithProgram,
            'academicSession' => $academicSession,
            'admissionForm'   => $admissionForm,
            'programs'        => $programs,
            'examDetails'     => $examDetails,
        ]);
    }

    /**
     * Upload / Update applicant passport photo.
     */
    public function uploadPhoto(Request $request)
    {
        $applicant = Auth::guard('applicant')->user();
        if (!$applicant) {
            return redirect()->route('admissions.login');
        }

        $request->validate([
            'passport_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('passport_photo')) {
            $file = $request->file('passport_photo');
            $filename = 'applicant_' . $applicant->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('passports', $filename, 'public');

            $applicant->update([
                'passport_photo' => '/storage/' . $path,
            ]);

            $this->syncAdmissionApplication($applicant);

            return back()->with('success', 'Passport photograph uploaded and verified successfully! Your Exam Card is now unlocked for download and printing.');
        }

        return back()->withErrors(['passport_photo' => 'Unable to process the uploaded photo. Please ensure it is a valid JPG/PNG under 2MB.']);
    }

    /**
     * Update applicant examination qualifications (O'Levels, Awaiting results, contact).
     */
    public function updateExam(Request $request)
    {
        $applicant = Auth::guard('applicant')->user();
        if (!$applicant) {
            return redirect()->route('admissions.login');
        }

        if (in_array($applicant->admission_status, ['admitted', 'cleared'])) {
            return back()->with('error', 'Your admission screening has already been finalized and can no longer be modified.');
        }

        $validated = $request->validate([
            // O'Levels Sitting 1
            'first_sitting_type'   => 'required|string|max:40',
            'first_sitting_year'   => 'required|string|max:10',
            'first_sitting_no'     => 'nullable|string|max:60',
            'first_sitting_grades' => 'required|array|min:1',

            // O'Levels Sitting 2 (Optional)
            'second_sitting_type'  => 'nullable|string|max:40',
            'second_sitting_year'  => 'nullable|string|max:10',
            'second_sitting_no'    => 'nullable|string|max:60',
            'second_sitting_grades'=> 'nullable|array',

            // Program choice
            'applied_program_id'   => 'nullable|exists:programs,id',

            // Contact updates
            'phone_number'         => 'nullable|string|max:30',
            'email'                => 'nullable|email|max:255',
            'contact_address'      => 'nullable|string',
            'next_of_kin_name'     => 'nullable|string|max:255',
            'next_of_kin_address'  => 'nullable|string',
        ]);

        $applicant->update($validated);
        $this->syncAdmissionApplication($applicant);

        return back()->with('success', 'Your examination qualifications and application details have been updated successfully.');
    }

    /**
     * Log out applicant guard session.
     */
    public function logout(Request $request)
    {
        Auth::guard('applicant')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admissions.login');
    }
}
