<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Applicant, User, Student};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProvisionAdmittedStudentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'applicants:provision-admitted
        {--jamb= : Specific JAMB registration number to provision}
        {--phone= : Specific candidate phone number to provision}
        {--dry-run : Preview matching candidates without committing changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision user and student accounts for the 32 admitted candidates who completed payment';

    /**
     * The list of 32 candidates provided by administration.
     */
    protected array $admittedCandidates = [
        ['name' => 'KHADIJA BASIRU',          'jamb' => '202661687958HJ', 'phone' => '7047813760'],
        ['name' => 'FATIMA ABDULLAHI SARKI',  'jamb' => '20261694632HA',  'phone' => '7030556293'],
        ['name' => 'ZULAIHAT MUHAMMAD',       'jamb' => '202661691486DG', 'phone' => '9017829395'],
        ['name' => 'AISHA MUHAMMAD JAJI',     'jamb' => '20266198215GA',  'phone' => '8140315562'],
        ['name' => 'USAINA ADO YA’U',         'jamb' => '202661702173JH', 'phone' => '7010075884'],
        ['name' => 'MARYAM ALIYU MADAKI',     'jamb' => '202661700893BJ', 'phone' => '7062183851'],
        ['name' => 'AMIRA AUWAL BELLO',       'jamb' => '202661703087BH', 'phone' => '8036856970'],
        ['name' => 'FATIMA ALI MUSA',         'jamb' => '202661703323FH', 'phone' => '7089691870'],
        ['name' => 'MARYAM KABIRU',           'jamb' => '202661682186HE', 'phone' => '9161891228'],
        ['name' => 'SARATU HASSAN',           'jamb' => '22261694158JH',  'phone' => '8024032112'],
        ['name' => 'NABILA KABIRU',           'jamb' => '202661689707EG', 'phone' => '7080191153'],
        ['name' => 'MUSA ABDULLAHI',          'jamb' => '202661703717ED', 'phone' => '8139278958'],
        ['name' => 'MUHAMMAD ALHAJI MAGAJI',  'jamb' => '202661690933HG', 'phone' => '9027011384'],
        ['name' => 'FATIMA MUHAMMAD KABIR',   'jamb' => '202661699334FI', 'phone' => '8037670091'],
        ['name' => 'RUKAYYA USMAN HAKIMI',    'jamb' => '202661698110AG', 'phone' => '7046701676'],
        ['name' => 'KALISA ABDULLAHI MIDO',   'jamb' => '202661684933EE', 'phone' => '8129555228'],
        ['name' => 'ZARA’U NURA',             'jamb' => '202661697267JG', 'phone' => '8089683665'],
        ['name' => 'IDRIS ADAMU',             'jamb' => '202661703532DH', 'phone' => '9164615706'],
        ['name' => 'AMINA LAWAN AHMAD',       'jamb' => '202661683509AD', 'phone' => '8166232692'],
        ['name' => 'FIDDAUSI MUHAMMAD',       'jamb' => '202661682484CI', 'phone' => '9040823818'],
        ['name' => 'KHADIJA RABI’U IBRAHIM',  'jamb' => '202661691651EB', 'phone' => '9166202154'],
        ['name' => 'KHADIJA HUSSAINI',        'jamb' => '202661169796EA', 'phone' => '7026276546'],
        ['name' => 'YUSRA YUSUF MAINA',       'jamb' => '202661685066GD', 'phone' => '9024610246'],
        ['name' => 'FATIMA AHMAD USMAN',      'jamb' => '202661697143FH', 'phone' => '9040302061'],
        ['name' => 'FURERA MUSA',             'jamb' => '202661693489AB', 'phone' => '9033842646'],
        ['name' => 'YA’U MUKTAR',             'jamb' => '202661697265BC', 'phone' => '9077987290'],
        ['name' => 'HUSSAINA',                'jamb' => '202661883750JC', 'phone' => '8060214407'],
        ['name' => 'NAFISA SHU’AIBU HAMBALI', 'jamb' => '202661685305DC', 'phone' => '8029132738'],
        ['name' => 'HAUWA ABUBAKAR',          'jamb' => '202660989110IG', 'phone' => '7019590162'],
        ['name' => 'MUHAMMAD AUWAL YAHAYA',   'jamb' => '202661702098JI', 'phone' => '7080140330'],
        ['name' => 'AMINATU HAFIZ SALMAN',    'jamb' => '202661684748DJ', 'phone' => '7025432279'],
        ['name' => 'FATIMA MUSA',             'jamb' => '202660967643CC', 'phone' => '8061908554'],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $targetJamb = $this->option('jamb');
        $targetPhone = $this->option('phone');

        $candidates = $this->admittedCandidates;

        if ($targetJamb || $targetPhone) {
            $candidates = array_filter($candidates, function ($item) use ($targetJamb, $targetPhone) {
                if ($targetJamb && strcasecmp($item['jamb'], $targetJamb) === 0) {
                    return true;
                }
                if ($targetPhone && (str_ends_with($item['phone'], $targetPhone) || str_ends_with($targetPhone, $item['phone']))) {
                    return true;
                }
                return false;
            });
        }

        $this->info("Scanning " . count($candidates) . " candidate(s) for admission & student account provisioning...");
        if ($isDryRun) {
            $this->warn("[DRY RUN MODE] No database modifications will be persisted.");
        }

        $rows = [];
        $provisionedCount = 0;
        $notFoundCount = 0;

        foreach ($candidates as $index => $item) {
            $jamb = trim($item['jamb']);
            $phone = trim($item['phone']);
            $phoneSuffix = substr(preg_replace('/[^0-9]/', '', $phone), -10);

            // Find applicant record
            $applicant = Applicant::where('jamb_number', $jamb)
                ->orWhere(function ($q) use ($phoneSuffix) {
                    if (!empty($phoneSuffix)) {
                        $q->where('phone_number', 'LIKE', "%{$phoneSuffix}");
                    }
                })
                ->first();

            if (!$applicant) {
                $notFoundCount++;
                $rows[] = [
                    $index + 1,
                    $item['name'],
                    $jamb,
                    $phone,
                    'N/A',
                    'N/A',
                    '<fg=red>NOT FOUND IN APPLICANTS</>',
                ];
                continue;
            }

            if ($isDryRun) {
                $rows[] = [
                    $index + 1,
                    $applicant->full_name,
                    $applicant->jamb_number,
                    $applicant->phone_number,
                    $applicant->registration_number ?: '(Will be generated)',
                    $applicant->status,
                    '<fg=yellow>MATCHED (DRY-RUN)</>',
                ];
                continue;
            }

            DB::beginTransaction();
            try {
                // Ensure applicant is marked as paid and cleared
                if (!$applicant->acceptance_fee_paid) {
                    $applicant->update([
                        'acceptance_fee_paid'    => true,
                        'acceptance_fee_paid_at' => now(),
                        'payment_status'         => 'paid',
                    ]);
                    $applicant->acceptance_fee_paid = true;
                }

                // Provision student account and user portal access
                $student = $applicant->provisionStudentAccount();

                DB::commit();
                $provisionedCount++;

                $rows[] = [
                    $index + 1,
                    $applicant->full_name,
                    $applicant->jamb_number,
                    $applicant->phone_number,
                    $student?->matriculation_number ?? $applicant->registration_number ?? 'N/A',
                    $student?->current_level ?? 'ND1',
                    '<fg=green>SUCCESSFULLY PROVISIONED</>',
                ];
            } catch (\Throwable $e) {
                DB::rollBack();
                $rows[] = [
                    $index + 1,
                    $applicant->full_name,
                    $applicant->jamb_number,
                    $applicant->phone_number,
                    'ERROR',
                    'N/A',
                    '<fg=red>ERROR: ' . substr($e->getMessage(), 0, 30) . '...</>',
                ];
            }
        }

        $this->table(['#', 'Candidate Name', 'JAMB Number', 'Phone', 'Matric / Reg No', 'Level', 'Status'], $rows);
        $this->newLine();
        $this->info("Execution Complete: {$provisionedCount} provisioned, {$notFoundCount} not found.");

        return Command::SUCCESS;
    }
}
