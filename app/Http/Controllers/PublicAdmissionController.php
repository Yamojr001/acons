<?php

namespace App\Http\Controllers;

use App\Models\AdmissionForm;
use App\Models\AdmissionApplication;
use Illuminate\Http\Request;
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

        AdmissionApplication::create([
            'tenant_id' => $tenant->id,
            'admission_form_id' => $form->id,
            'applicant_name' => $request->applicant_name,
            'applicant_email' => $request->applicant_email,
            'data' => $request->data,
            'status' => 'pending'
        ]);

        return back()->with('success', 'Application submitted successfully! We will contact you soon.');
    }
}
