<?php

namespace App\Exports;

use App\Models\Lecturer;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class LecturersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
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
        return Lecturer::with(['user', 'department'])
            ->where('tenant_id', $this->tenantId)
            ->latest()
            ->get();
    }

    /**
     * @param mixed $lecturer
     * @return array
     */
    public function map($lecturer): array
    {
        return [
            $lecturer->user->name ?? '',
            $lecturer->user->email ?? '',
            $lecturer->employee_id ?? 'N/A',
            $lecturer->department->name ?? 'N/A',
            $lecturer->qualification ?? 'N/A',
            $lecturer->status ?? 'active',
            $lecturer->created_at ? $lecturer->created_at->format('Y-m-d H:i') : '',
        ];
    }

    public function headings(): array
    {
        return [
            'Full Name',
            'Email',
            'Employee ID',
            'Department',
            'Qualification',
            'Status',
            'Created At',
        ];
    }
}
