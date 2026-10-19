<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\{Fee, StudentInvoice, Semester, InstitutionSetting};
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Request $request)
    {
        $institution = InstitutionSetting::current();
        $student = $request->user()->student;

        $currentSemester = Semester::with('academicSession')
            ->where('is_current', true)
            ->first();

        $invoice = null;
        $hostelFee = null;
        $hostelInvoice = null;

        if ($currentSemester) {
            // Find tuition / school fees (N540,000)
            $fee = Fee::where('academic_session_id', $currentSemester->academic_session_id)
                ->whereIn('fee_type', ['tuition', 'registration'])
                ->where(function ($q) use ($student) {
                    $q->whereNull('department_id')->orWhere('department_id', $student->department_id);
                })
                ->where(function ($q) use ($student) {
                    $q->whereNull('level')->orWhere('level', $student->current_level);
                })
                ->orderByRaw("fee_type = 'tuition' DESC, department_id IS NULL, level IS NULL")
                ->first();

            // Fallback if specific not found
            if (!$fee) {
                $fee = Fee::whereIn('fee_type', ['tuition', 'registration'])->first();
            }

            if ($fee) {
                $invoice = StudentInvoice::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_id'     => $fee->id,
                    ],
                    [
                        'amount_due'  => $fee->amount,
                        'amount_paid' => 0,
                        'status'      => 'pending',
                    ]
                );
                $invoice->load(['fee.academicSession', 'payments']);
            }

            // Find optional hostel accommodation fee (N105,000)
            $hostelFee = Fee::where('fee_type', 'hostel')
                ->where(function ($q) use ($currentSemester) {
                    $q->where('academic_session_id', $currentSemester->academic_session_id)
                      ->orWhereNull('academic_session_id');
                })
                ->first();

            if ($hostelFee) {
                $hostelInvoice = StudentInvoice::where([
                    'student_id' => $student->id,
                    'fee_id'     => $hostelFee->id,
                ])->first();
            }
        }

        return Inertia::render('Student/Registration', [
            'invoice'             => $invoice,
            'hostelFee'           => $hostelFee,
            'hostelInvoice'       => $hostelInvoice,
            'gatewayChargeCap'    => 2000,
            'currentSession'      => $currentSemester?->academicSession?->name ?? '2026/2027',
            'currentSemesterName' => $currentSemester?->name ?? 'First Semester',
            'activeGateway'       => $institution->payment_gateway ?? 'zainpay',
        ]);
    }
}
