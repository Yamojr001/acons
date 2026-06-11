<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class StudentsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
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
        return Student::with(['user', 'department'])
            ->where('tenant_id', $this->tenantId)
            ->latest()
            ->get();
    }

    /**
     * @param mixed $student
     * @return array
     */
    public function map($student): array
    {
        return [
            $student->user->name ?? '',
            $student->user->email ?? '',
            $student->matriculation_number ?? '',
            $student->department->name ?? 'N/A',
            $student->current_level ?? 'N/A',
            $student->status ?? 'active',
            $student->created_at ? $student->created_at->format('Y-m-d H:i') : '',
        ];
    }

    public function headings(): array
    {
        return [
            'Full Name',
            'Email',
            'Matric Number',
            'Department',
            'Level',
            'Status',
            'Enrolled At',
        ];
    }
}
