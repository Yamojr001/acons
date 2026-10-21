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
            ->first() ?? Semester::with('academicSession')->latest('id')->first();

        $currentSession = $currentSemester?->academicSession
            ?? \App\Models\AcademicSession::where('is_current', true)->first()
            ?? \App\Models\AcademicSession::latest('id')->first();

        $sessionId = $currentSemester?->academic_session_id ?? $currentSession?->id;

        $invoice = null;
        $hostelFee = null;
        $hostelInvoice = null;
        $facilitationFee = null;
        $facilitationInvoice = null;

        // 1. Find Academic Facilitation Fee (N3,850 - Mandatory prerequisite before school fees)
        $facilitationFee = Fee::where('fee_type', 'facilitation')
            ->when($sessionId, fn($q) => $q->where(fn($sub) => $sub->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id')))
            ->first() ?? Fee::where('fee_type', 'facilitation')->first();

        if ($student && $facilitationFee) {
            $facilitationInvoice = StudentInvoice::firstOrCreate(
                [
                    'student_id' => $student->id,
                    'fee_id'     => $facilitationFee->id,
                ],
                [
                    'amount_due'  => $facilitationFee->amount,
                    'amount_paid' => 0,
                    'status'      => 'pending',
                ]
            );
            $facilitationInvoice->load(['fee.academicSession', 'payments']);
        }

        // 2. Find tuition / school fees (N535,000)
        $feeQuery = Fee::whereIn('fee_type', ['tuition', 'registration']);
        if ($sessionId) {
            $feeQuery->where(fn($sub) => $sub->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id'));
        }
        if ($student?->department_id) {
            $feeQuery->where(fn($sub) => $sub->whereNull('department_id')->orWhere('department_id', $student->department_id));
        }
        if ($student?->current_level) {
            $feeQuery->where(fn($sub) => $sub->whereNull('level')->orWhere('level', $student->current_level));
        }

        $fee = $feeQuery->orderByRaw("fee_type = 'tuition' DESC, department_id IS NULL, level IS NULL")->first()
            ?? Fee::whereIn('fee_type', ['tuition', 'registration'])->first();

        if ($student && $fee) {
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

        // 3. Find optional hostel accommodation fee (N105,000)
        $hostelFee = Fee::where('fee_type', 'hostel')
            ->when($sessionId, fn($q) => $q->where(fn($sub) => $sub->where('academic_session_id', $sessionId)->orWhereNull('academic_session_id')))
            ->first() ?? Fee::where('fee_type', 'hostel')->first();

        if ($student && $hostelFee) {
            $hostelInvoice = StudentInvoice::firstOrCreate(
                [
                    'student_id' => $student->id,
                    'fee_id'     => $hostelFee->id,
                ],
                [
                    'amount_due'  => $hostelFee->amount ?: 105000.00,
                    'amount_paid' => 0,
                    'status'      => 'pending',
                ]
            );
        }

        $isFacilitationPaid = ($facilitationInvoice && $facilitationInvoice->status === 'paid');

        return Inertia::render('Student/Registration', [
            'facilitationFee'     => $facilitationFee,
            'facilitationInvoice' => $facilitationInvoice,
            'isFacilitationPaid'  => $isFacilitationPaid,
            'invoice'             => $invoice,
            'hostelFee'           => $hostelFee,
            'hostelInvoice'       => $hostelInvoice,
            'gatewayChargeCap'    => 0,
            'currentSession'      => $currentSession?->name ?? $currentSemester?->academicSession?->name ?? '2026/2027',
            'currentSemesterName' => $currentSemester?->name ?? 'First Semester',
            'activeGateway'       => $institution->payment_gateway ?? 'zainpay',
        ]);
    }
}
