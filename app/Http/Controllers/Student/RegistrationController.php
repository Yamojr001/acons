<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, StudentInvoice, Semester};
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Request $request)
    {
        $tenant  = app('currentTenant');
        $student = $request->user()->student;

        $currentSemester = Semester::with('academicSession')
            ->where('tenant_id', $tenant->id)
            ->where('is_current', true)
            ->first();

        $invoice = null;

        if ($currentSemester) {
            // A registration fee schedule may be set for the student's specific
            // department+level, or apply institution-wide (department_id/level null).
            $fee = Fee::where('tenant_id', $tenant->id)
                ->where('academic_session_id', $currentSemester->academic_session_id)
                ->where('fee_type', 'registration')
                ->where(function ($q) use ($student) {
                    $q->whereNull('department_id')->orWhere('department_id', $student->department_id);
                })
                ->where(function ($q) use ($student) {
                    $q->whereNull('level')->orWhere('level', $student->current_level);
                })
                ->orderByRaw('department_id IS NULL, level IS NULL') // prefer the most specific match
                ->first();

            if ($fee) {
                $invoice = StudentInvoice::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_id'     => $fee->id,
                        'tenant_id'  => $tenant->id,
                    ],
                    [
                        'amount_due'  => $fee->amount,
                        'amount_paid' => 0,
                        'status'      => 'pending',
                    ]
                );
                $invoice->load('fee.academicSession');
            }
        }

        return Inertia::render('Student/Registration', [
            'invoice' => $invoice,
            'currentSession' => $currentSemester?->academicSession?->name,
            'currentSemesterName' => $currentSemester?->name,
            'activeGateway' => $tenant->settings['payment_gateway'] ?? 'monnify',
        ]);
    }
}
