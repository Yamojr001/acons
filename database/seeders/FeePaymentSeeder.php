<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicSession;
use App\Models\Semester;
use App\Models\Fee;

class FeePaymentSeeder extends Seeder
{
    /**
     * Run the database seeds for all school fees and payment schedules.
     */
    public function run(): void
    {
        $this->command->info('Seeding Academic Session, Semester, and Fee Schedules...');

        // 1. Ensure `fees.fee_type` ENUM contains 'facilitation'
        try {
            DB::statement("ALTER TABLE fees MODIFY COLUMN fee_type ENUM('tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'registration', 'facilitation', 'other') DEFAULT 'tuition'");
            $this->command->line('✓ fees.fee_type ENUM confirmed/updated.');
        } catch (\Throwable $e) {
            $this->command->warn('Notice: ' . $e->getMessage());
        }

        // 2. Ensure current Academic Session (2026/2027)
        $session = AcademicSession::where('is_current', true)->first();
        if (!$session) {
            $session = AcademicSession::where('name', '2026/2027')->first();
        }

        if (!$session) {
            $session = AcademicSession::create([
                'name'       => '2026/2027',
                'start_date' => '2025-08-31',
                'end_date'   => '2026-08-30',
                'is_current' => true,
            ]);
            $this->command->line("✓ Created Academic Session: {$session->name} (Current)");
        } else {
            $session->update(['is_current' => true]);
            $this->command->line("✓ Active Academic Session: {$session->name} (ID: {$session->id})");
        }

        // 3. Ensure current Semester (First Semester)
        $semester = Semester::where('academic_session_id', $session->id)
            ->where('is_current', true)
            ->first();

        if (!$semester) {
            $semester = Semester::where('academic_session_id', $session->id)->first();
        }

        if (!$semester) {
            $semester = Semester::create([
                'academic_session_id' => $session->id,
                'name'                => 'First Semester',
                'type'                => 'first',
                'start_date'          => '2025-09-14',
                'end_date'            => '2026-02-19',
                'is_current'          => true,
            ]);
            $this->command->line("✓ Created Semester: {$semester->name} (Current)");
        } else {
            $semester->update(['is_current' => true]);
            $this->command->line("✓ Active Semester: {$semester->name} (ID: {$semester->id})");
        }

        // 4. Seed Fee #1: Academic Facilitation Fee (N3,850.00 - Mandatory Prerequisite)
        $facilitationFee = Fee::updateOrCreate(
            [
                'fee_type'            => 'facilitation',
                'academic_session_id' => $session->id,
            ],
            [
                'name'          => "Academic Facilitation Fee ({$session->name})",
                'amount'        => 3850.00,
                'department_id' => null,
                'level'         => null,
                'metadata'      => [
                    'description' => 'Mandatory prerequisite fee required prior to semester registration & tuition payment.',
                ],
            ]
        );
        $this->command->info("✓ [Fee #1] Academic Facilitation Fee: ₦" . number_format($facilitationFee->amount, 2) . " (ID: {$facilitationFee->id})");

        // 5. Seed Fee #2: School Fees / Tuition (N535,000.00 - 100% or 70% installment)
        $tuitionFee = Fee::updateOrCreate(
            [
                'fee_type'            => 'tuition',
                'academic_session_id' => $session->id,
            ],
            [
                'name'          => "School Fees / Tuition ({$session->name})",
                'amount'        => 535000.00,
                'department_id' => null,
                'level'         => null,
                'metadata'      => [
                    'installment_allowed'       => 1,
                    'first_installment_percent' => 70,
                    'gateway_charge_cap'        => 0,
                ],
            ]
        );
        $this->command->info("✓ [Fee #2] School Fees / Tuition: ₦" . number_format($tuitionFee->amount, 2) . " (ID: {$tuitionFee->id})");

        // 6. Seed Fee #3: Hostel Accommodation Fee (N105,000.00 - Optional)
        $hostelFee = Fee::updateOrCreate(
            [
                'fee_type'            => 'hostel',
                'academic_session_id' => $session->id,
            ],
            [
                'name'          => "Hostel Accommodation Fee ({$session->name})",
                'amount'        => 105000.00,
                'department_id' => null,
                'level'         => null,
                'metadata'      => [
                    'is_optional' => 1,
                ],
            ]
        );
        $this->command->info("✓ [Fee #3] Hostel Accommodation Fee: ₦" . number_format($hostelFee->amount, 2) . " (ID: {$hostelFee->id})");

        $this->command->info("\nAll payment schedules seeded successfully!");
    }
}
