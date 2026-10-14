<?php

namespace App\Http\Controllers;

use App\Models\AdmissionForm;
use App\Models\Applicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicAdmissionController extends Controller
{
    public function show(Request $request, AdmissionForm $form): Response
    {
        $tenant = app('currentTenant');
        abort_if(!$form->is_active, 404, 'This admission form is no longer active.');
        abort_if($form->tenant_id !== $tenant->id, 404);

        return Inertia::render('Public/AdmissionApply', [
            'tenant' => $tenant,
            'form' => $form
        ]);
    }

    public function submit(Request $request, AdmissionForm $form)
    {
        $tenant = app('currentTenant');
        abort_if(!$form->is_active, 404, 'This admission form is no longer active.');
        abort_if($form->tenant_id !== $tenant->id, 404);

        $request->validate([
            'applicant_name' => 'required|string|max:255',
            'applicant_email' => 'required|email|max:255',
            'data' => 'required|array'
        ]);

        $jambNumber = $request->data['jamb_number'] ?? ('ADM' . date('Y') . strtoupper(Str::random(6)));
        $phone = $request->data['phone_number'] ?? $request->data['phone'] ?? '08000000000';

        Applicant::create([
            'tenant_id' => $tenant->id,
            'admission_form_id' => $form->id,
            'full_name' => $request->applicant_name,
            'email' => $request->applicant_email,
            'jamb_number' => $jambNumber,
            'password' => Hash::make($phone),
            'phone_number' => $phone,
            'dob' => $request->data['dob'] ?? $request->data['date_of_birth'] ?? now()->subYears(18)->format('Y-m-d'),
            'place_of_birth' => $request->data['place_of_birth'] ?? 'N/A',
            'lga' => $request->data['lga'] ?? 'N/A',
            'state_of_origin' => $request->data['state_of_origin'] ?? 'N/A',
            'contact_address' => $request->data['contact_address'] ?? 'N/A',
            'sex' => $request->data['sex'] ?? $request->data['gender'] ?? 'other',
            'next_of_kin_name' => $request->data['next_of_kin_name'] ?? 'N/A',
            'next_of_kin_address' => $request->data['next_of_kin_address'] ?? 'N/A',
            'jamb_score' => (int) ($request->data['jamb_score'] ?? 0),
            'data' => $request->data,
            'status' => 'pending',
            'admission_status' => 'pending',
            'payment_status' => 'pending',
        ]);

        return back()->with('success', 'Application submitted successfully! We will contact you soon.');
    }
}
