<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Applicant, Student, CourseRegistration};
use Illuminate\Support\Facades\DB;

class MigrateAdmittedStudentsTo26Command extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:migrate-to-26
        {--dry-run : Preview changes without modifying the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate newly admitted 2026 students from /25/ to /26/ while strictly preserving last year result-uploaded students';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $this->info("===============================================================================");
        $this->info("   ACONS REGISTRATION NUMBER MIGRATION (ADMITTED 2026 INTAKE -> /26/)");
        $this->info("===============================================================================");
        if ($isDryRun) {
            $this->warn("[DRY-RUN MODE] No changes will be saved to the database.");
        }

        // 1. Gather all student IDs that have historical course registrations or grades (last year's result uploaded students)
        $studentsWithHistory = CourseRegistration::whereNotNull('student_id')
            ->distinct()
            ->pluck('student_id')
            ->toArray();

        $this->line("Found <fg=cyan>" . count($studentsWithHistory) . "</> students with past course registrations/grades (strictly protected as /25/).");

        // 2. Process Applicants
        $applicantsToUpdate = Applicant::where('registration_number', 'like', '%/25/%')->get();
        $this->line("Found <fg=cyan>{$applicantsToUpdate->count()}</> applicant(s) with /25/ in registration number.");

        $applicantRows = [];
        foreach ($applicantsToUpdate as $applicant) {
            $oldReg = $applicant->registration_number;
            $newReg = str_replace('/25/', '/26/', $oldReg);

            if (!$isDryRun) {
                $applicant->update(['registration_number' => $newReg]);
            }

            $applicantRows[] = [
                $applicant->id,
                $applicant->full_name,
                $applicant->jamb_number ?? 'N/A',
                $oldReg,
                $newReg,
                $isDryRun ? '<fg=yellow>DRY-RUN</>' : '<fg=green>UPDATED TO /26/</>'
            ];
        }

        if (!empty($applicantRows)) {
            $this->newLine();
            $this->info("--- APPLICANTS UPDATED ---");
            $this->table(['ID', 'Applicant Name', 'JAMB Number', 'Old Reg Number', 'New Reg Number', 'Status'], $applicantRows);
        }

        // 3. Process Students
        // Find admitted students who have /25/ in their matriculation number
        // Criteria: Has JAMB reg number OR matches an applicant, AND NOT in $studentsWithHistory
        $students = Student::with(['user', 'department', 'program'])
            ->where('matriculation_number', 'like', '%/25/%')
            ->get();

        $admittedRows = [];
        $preservedRows = [];
        $migratedCount = 0;
        $preservedCount = 0;

        foreach ($students as $student) {
            $isResultUploaded = in_array($student->id, $studentsWithHistory) || empty($student->jamb_registration_number);

            // Double check if this student matches any applicant
            $hasApplicantMatch = false;
            if (!empty($student->jamb_registration_number)) {
                $hasApplicantMatch = Applicant::where('jamb_number', $student->jamb_registration_number)->exists();
            }
            if (!$hasApplicantMatch && !empty($student->phone_number)) {
                $hasApplicantMatch = Applicant::where('phone_number', 'like', '%' . substr(preg_replace('/[^0-9]/', '', $student->phone_number), -10))->exists();
            }

            // If the student has grades AND has no applicant match, they are definitely last year's uploaded student!
            if ($isResultUploaded && !$hasApplicantMatch) {
                $preservedCount++;
                $preservedRows[] = [
                    $student->id,
                    $student->user?->name ?? 'Student #' . $student->id,
                    $student->matriculation_number,
                    'Last Year (Result Upload)',
                    '<fg=cyan>PRESERVED /25/</>'
                ];
                continue;
            }

            // This is an admitted student with /25/ that needs migration to /26/
            $oldMatric = $student->matriculation_number;
            $newMatric = str_replace('/25/', '/26/', $oldMatric);

            // Check if this newMatric already exists for another student
            $conflict = Student::where('matriculation_number', $newMatric)
                ->where('id', '!=', $student->id)
                ->exists();

            if ($conflict) {
                // Re-calculate next sequential number under /26/
                $parts = explode('/', $newMatric);
                array_pop($parts);
                $prefix = implode('/', $parts) . '/';

                $maxSerial = (int) (Student::where('matriculation_number', 'like', $prefix . '%')
                    ->where('id', '!=', $student->id)
                    ->selectRaw("MAX(CAST(SUBSTRING_INDEX(matriculation_number, '/', -1) AS UNSIGNED)) as max_serial")
                    ->value('max_serial') ?? 0);

                $newMatric = $prefix . str_pad($maxSerial + 1, 3, '0', STR_PAD_LEFT);
            }

            if (!$isDryRun) {
                $student->update(['matriculation_number' => $newMatric]);
            }

            $migratedCount++;
            $admittedRows[] = [
                $student->id,
                $student->user?->name ?? 'Student #' . $student->id,
                $student->jamb_registration_number ?? 'N/A',
                $oldMatric,
                $newMatric,
                $isDryRun ? '<fg=yellow>DRY-RUN</>' : '<fg=green>MIGRATED TO /26/</>'
            ];
        }

        if (!empty($admittedRows)) {
            $this->newLine();
            $this->info("--- ADMITTED STUDENTS MIGRATED TO /26/ ---");
            $this->table(['ID', 'Student Name', 'JAMB Number', 'Old Matric (/25/)', 'New Matric (/26/)', 'Status'], $admittedRows);
        }

        $this->newLine();
        $this->info("===============================================================================");
        $this->info("Summary:");
        $this->line(" - Admitted Students Migrated to /26/: <fg=green>{$migratedCount}</>");
        $this->line(" - Last Year Uploaded Students Preserved as /25/: <fg=cyan>{$preservedCount}</>");
        $this->line(" - Applicants Updated to /26/: <fg=green>{$applicantsToUpdate->count()}</>");
        $this->info("===============================================================================");

        return Command::SUCCESS;
    }
}
