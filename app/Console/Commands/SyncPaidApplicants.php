<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Applicant, User, Student};

class SyncPaidApplicants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admissions:sync-paid-students
        {--applicant= : Specific applicant ID or JAMB number to sync}
        {--include-references : Also sync applicants who have an acceptance payment reference logged}
        {--force-paid : Mark applicant(s) as paid and provision even if acceptance_fee_paid was false}
        {--notify : Send SMS with login credentials to all provisioned applicants}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan applicants who have paid acceptance fee and ensure their Student & User portal accounts are provisioned (phone as username and password)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("Scanning applicants for Student Portal auto-provisioning...");

        $query = Applicant::query();

        if ($appInput = $this->option('applicant')) {
            $query->where(function ($q) use ($appInput) {
                $q->where('id', $appInput)
                  ->orWhere('jamb_number', $appInput)
                  ->orWhere('phone_number', $appInput);
            });
            if ($this->option('force-paid')) {
                $app = $query->first();
                if ($app) {
                    $app->update(['acceptance_fee_paid' => true, 'acceptance_fee_paid_at' => now()]);
                }
            }
        } else {
            $query->where(function ($q) {
                $q->where('acceptance_fee_paid', true)
                  ->orWhereNotNull('acceptance_fee_paid_at')
                  ->orWhere('status', 'cleared')
                  ->orWhere('admission_status', 'cleared');

                if ($this->option('include-references')) {
                    $q->orWhereNotNull('acceptance_fee_reference');
                }
            });
        }

        $applicants = $query->get();

        if ($applicants->isEmpty()) {
            $this->warn("No matching applicants found to provision.");
            return Command::SUCCESS;
        }

        $this->info("Found {$applicants->count()} candidate(s). Provisioning portal user accounts...");

        $rows = [];
        $newlyProvisioned = 0;
        $updatedCount = 0;

        foreach ($applicants as $applicant) {
            $phone = preg_replace('/[^0-9]/', '', (string)$applicant->phone_number);
            $userExisted = User::where(function ($q) use ($phone, $applicant) {
                if (!empty($phone)) {
                    $q->where('phone', $phone);
                }
                if (!empty($applicant->email)) {
                    $q->orWhere('email', $applicant->email);
                }
            })->exists();

            // Mark acceptance_fee_paid true if running sync
            if (!$applicant->acceptance_fee_paid) {
                $applicant->update(['acceptance_fee_paid' => true, 'acceptance_fee_paid_at' => now()]);
                $applicant->acceptance_fee_paid = true;
            }

            $student = $applicant->provisionStudentAccount();

            if ($this->option('notify') && !empty($applicant->phone_number)) {
                try {
                    $phoneNum = $applicant->phone_number;
                    $regNum = $applicant->registration_number;
                    app(\App\Services\SmsService::class)->send(
                        $phoneNum,
                        "Dear {$applicant->full_name}, your ACONS Student Portal is active! Reg No: {$regNum}. Username: {$phoneNum}, Password: {$phoneNum}. Log in at: " . url('/login')
                    );
                } catch (\Throwable $e) {}
            }

            if (!$userExisted) {
                $newlyProvisioned++;
                $statusText = '<fg=green>PROVISIONED (NEW USER)</>';
            } else {
                $updatedCount++;
                $statusText = '<fg=yellow>SYNCED / VERIFIED</>';
            }

            $rows[] = [
                $applicant->id,
                $applicant->full_name,
                $applicant->phone_number ?: 'N/A',
                $applicant->registration_number ?: 'N/A',
                $student?->current_level ?? 'ND1',
                $statusText,
            ];
        }

        $this->table(['ID', 'Candidate Name', 'Phone (Username & Pass)', 'Reg / Admission No', 'Level', 'Status'], $rows);
        $this->newLine();
        $this->info("✓ Sync Complete! Newly Provisioned: {$newlyProvisioned} | Synced/Verified: {$updatedCount}");

        return Command::SUCCESS;
    }
}
