<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PaymentsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $tenantId;

    public function __construct($tenantId)
    {
        $this->tenantId = $tenantId;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return Payment::with(['student.user', 'student.department'])
            ->where('tenant_id', $this->tenantId)
            ->whereNotIn('id', function($query) {
                $query->select('parent_id')->from('payments')->whereNotNull('parent_id');
            })
            ->latest()
            ->get();
    }

    /**
     * @param mixed $payment
     * @return array
     */
    public function map($payment): array
    {
        return [
            $payment->student->user->name ?? 'N/A',
            $payment->student->user->email ?? 'N/A',
            $payment->student->matriculation_number ?? 'N/A',
            $payment->student->department->name ?? 'N/A',
            $payment->reference ?? '',
            str_replace('_', ' ', strtoupper($payment->payment_gateway)),
            $payment->amount ?? 0,
            strtoupper($payment->status),
            $payment->created_at ? $payment->created_at->format('Y-m-d H:i') : '',
        ];
    }

    public function headings(): array
    {
        return [
            'Student Name',
            'Email',
            'Matric Number',
            'Department',
            'Reference',
            'Payment Method',
            'Amount Paid',
            'Status',
            'Date Paid',
        ];
    }
}
