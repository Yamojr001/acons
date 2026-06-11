<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Program;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'payment_status' => 'pending',
            'admission_status' => 'pending'
        ]);

        return redirect()->route('admissions.pay', ['applicant' => $applicant->id]);
    }

    /**
     * Show mock ACONS admission form fee gateway screen.
     */
    public function showPaymentPage(Applicant $applicant): Response
    {
        // Safety: if already paid, forward to success login
        if ($applicant->payment_status === 'paid') {
            return redirect()->route('admissions.login')->with('success', 'Your fee is already cleared. Please log in.');
        }

        $tenant = app('currentTenant');

        return Inertia::render('Public/Admissions/PaymentGateway', [
            'tenant' => $tenant,
            'applicant' => $applicant,
            'fee_amount' => 14700.00,
            'monnify' => [
                'apiKey' => config('services.monnify.api_key'),
                'contractCode' => config('services.monnify.contract_code'),
            ]
        ]);
    }

    /**
     * Authorize and record applicant form fee payment.
     */
    public function authorizePayment(Request $request, Applicant $applicant)
    {
        if ($applicant->payment_status === 'paid') {
            return redirect()->route('admissions.login')->with('success', 'Fee already authorized.');
        }

        $tenant = app('currentTenant');
        
        $applicant->update([
            'payment_status' => 'paid',
            'amount_paid' => 14700.00,
            'payment_reference' => 'ACON_ADM_' . strtoupper(Str::random(12))
        ]);

        $admissionForm = \App\Models\AdmissionForm::where('tenant_id', $tenant->id)->where('is_active', true)->first();

        \App\Models\AdmissionApplication::create([
            'tenant_id' => $tenant->id,
            'admission_form_id' => $admissionForm ? $admissionForm->id : 1,
            'applicant_name' => $applicant->full_name,
            'applicant_email' => $applicant->email,
            'status' => 'pending',
            'data' => [
                'jamb_number' => $applicant->jamb_number,
                'phone_number' => $applicant->phone_number,
                'jamb_score' => $applicant->jamb_score,
                'state_of_origin' => $applicant->state_of_origin,
                'lga' => $applicant->lga,
                'gender' => $applicant->sex,
                'date_of_birth' => $applicant->dob ? $applicant->dob->format('Y-m-d') : null,
                'first_sitting_type' => $applicant->first_sitting_type,
                'first_sitting_no' => $applicant->first_sitting_no,
                'first_sitting_grades' => $applicant->first_sitting_grades,
                'second_sitting_type' => $applicant->second_sitting_type,
                'second_sitting_no' => $applicant->second_sitting_no,
                'second_sitting_grades' => $applicant->second_sitting_grades,
            ]
        ]);

        return redirect()->route('admissions.login')->with('success', 'Payment authorized successfully! You can now log in using your JAMB Number and Phone Number.');
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
     * Applicant Dashboard tracking page.
     */
    public function dashboard(): Response
    {
        $applicant = Auth::guard('applicant')->user();
        $tenant = app('currentTenant');
        
        $applicantWithProgram = Applicant::with('admittedProgram')->find($applicant->id);
        $academicSession = \App\Models\AcademicSession::where('tenant_id', $tenant->id)->where('is_current', true)->first();
        $admissionForm = \App\Models\AdmissionForm::where('tenant_id', $tenant->id)->where('is_active', true)->first();
        
        return Inertia::render('Public/Admissions/Dashboard', [
            'tenant' => $tenant,
            'applicant' => $applicantWithProgram,
            'academicSession' => $academicSession,
            'admissionForm' => $admissionForm
        ]);
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
