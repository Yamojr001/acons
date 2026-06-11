<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AdmissionForm;
use App\Models\AdmissionApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionController extends Controller
{
    public function index(): Response
    {
        $tenant = app('currentTenant');
        $forms = AdmissionForm::where('tenant_id', $tenant->id)->get();
        return Inertia::render('SchoolAdmin/Admissions/Forms', ['forms' => $forms]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array'
        ]);

        $tenant = app('currentTenant');
        AdmissionForm::create([
            'tenant_id' => $tenant->id,
            'title' => $request->title,
            'description' => $request->description,
            'fields' => $request->fields,
            'is_active' => true,
        ]);

        return back()->with('success', 'Admission form created.');
    }

    public function update(Request $request, AdmissionForm $admission)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fields' => 'required|array',
            'is_active' => 'boolean'
        ]);

        $admission->update($request->only('title', 'description', 'fields', 'is_active'));
        return back()->with('success', 'Admission form updated.');
    }

    public function destroy(AdmissionForm $admission)
    {
        $admission->delete();
        return back()->with('success', 'Admission form deleted.');
    }

    public function applications(): Response
    {
        $tenant = app('currentTenant');
        $applications = AdmissionApplication::where('tenant_id', $tenant->id)
            ->with('form')->latest()->paginate(20);
        return Inertia::render('SchoolAdmin/Admissions/Applications', ['applications' => $applications]);
    }

    public function updateApplicationStatus(Request $request, AdmissionApplication $application)
    {
        $request->validate(['status' => 'required|in:pending,under_review,accepted,rejected']);
        $application->update(['status' => $request->status]);
        return back()->with('success', 'Application status updated.');
    }
}
