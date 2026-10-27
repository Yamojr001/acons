<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Student, User, Fee, StudentInvoice, Payment, Transaction, Applicant};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClearStudentFeesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:clear-fees
        {--all-32 : Clear fees for all 32 admitted candidates}
        {--jamb= : Clear fees for a specific student by JAMB registration number}
        {--phone= : Clear fees for a specific student by phone number}
        {--matric= : Clear fees for a specific student by matriculation number}
        {--only-facilitation : Clear only the Academic Facilitation Fee (₦3,850)}
        {--only-school-fees : Clear only the School Fees / Tuition (₦535,000)}
        {--gateway=admin_clearance : Payment gateway label (admin_clearance, bank_transfer, zainpay)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear and mark Academic Facilitation Fee and Full School Fees / Registration as PAID for admitted students';

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
        $targetJamb = $this->option('jamb');
        $targetPhone = $this->option('phone');
        $targetMatric = $this->option('matric');
        $onlyFacilitation = $this->option('only-facilitation');
        $onlySchoolFees = $this->option('only-school-fees');
        $gateway = $this->option('gateway') ?: 'admin_clearance';

        // 1. Locate Fees
        $facilitationFee = Fee::where('fee_type', 'facilitation')->first();
        $schoolFee = Fee::whereIn('fee_type', ['tuition', 'registration'])
            ->orderByRaw("fee_type = 'tuition' DESC")
            ->first();

        if (!$facilitationFee && !$onlySchoolFees) {
            $this->error("Academic Facilitation Fee was not found in the fees table. Run 'php artisan db:seed --class=FeePaymentSeeder' first.");
            return Command::FAILURE;
        }

        if (!$schoolFee && !$onlyFacilitation) {
            $this->error("School Fees / Tuition fee was not found in the fees table.");
            return Command::FAILURE;
        }

        $this->info("=== Student Fee Clearance Tool ===");
        if ($facilitationFee && !$onlySchoolFees) {
            $this->line("• Facilitation Fee: ₦" . number_format($facilitationFee->amount, 2) . " [Fee ID: {$facilitationFee->id}]");
        }
        if ($schoolFee && !$onlyFacilitation) {
            $this->line("• School Fees / Tuition: ₦" . number_format($schoolFee->amount, 2) . " [Fee ID: {$schoolFee->id}]");
        }
        $this->newLine();

        // 2. Determine target students
        $students = collect();

        if ($targetMatric) {
            $s = Student::with('user')->where('matriculation_number', $targetMatric)->first();
            if ($s) $students->push($s);
        } elseif ($targetJamb) {
            $s = Student::with('user')->where('jamb_registration_number', $targetJamb)->first();
            if ($s) $students->push($s);
        } elseif ($targetPhone) {
            $phoneSuffix = substr(preg_replace('/[^0-9]/', '', $targetPhone), -10);
            $s = Student::with('user')->where(function ($q) use ($phoneSuffix) {
                $q->where('phone_number', 'LIKE', "%{$phoneSuffix}")
                  ->orWhereHas('user', fn($u) => $u->where('phone', 'LIKE', "%{$phoneSuffix}"));
            })->first();
            if ($s) $students->push($s);
        } else {
            // Process the 32 admitted candidates
            $this->info("Scanning the 32 admitted candidates...");
            foreach ($this->admittedCandidates as $cand) {
                $jamb = trim($cand['jamb']);
                $phoneSuffix = substr(preg_replace('/[^0-9]/', '', $cand['phone']), -10);

                $s = Student::with('user')->where('jamb_registration_number', $jamb)
                    ->orWhere(function ($q) use ($phoneSuffix) {
                        $q->where('phone_number', 'LIKE', "%{$phoneSuffix}")
                          ->orWhereHas('user', fn($u) => $u->where('phone', 'LIKE', "%{$phoneSuffix}"));
                    })->first();

                if ($s) {
                    $students->push($s);
                } else {
                    $this->warn("Candidate {$cand['name']} (JAMB: {$jamb}) is not yet provisioned in students table. Run 'php artisan applicants:provision-admitted' first.");
                }
            }
        }

        if ($students->isEmpty()) {
            $this->warn("No matching students found to clear fees.");
            return Command::SUCCESS;
        }

        $this->info("Clearing fees for {$students->count()} student(s)...");
        $rows = [];

        foreach ($students as $student) {
            $user = $student->user;
            $studentName = $user?->name ?? 'Student #' . $student->id;
            $email = $user?->email ?: ($student->phone_number . '@acons.edu.ng');

            DB::beginTransaction();
            try {
                $facStatus = 'Skipped';
                $schStatus = 'Skipped';

                // A. Clear Facilitation Fee
                if ($facilitationFee && !$onlySchoolFees) {
                    $facInvoice = StudentInvoice::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'fee_id'     => $facilitationFee->id,
                        ],
                        [
                            'amount_due'  => $facilitationFee->amount,
                            'amount_paid' => $facilitationFee->amount,
                            'status'      => 'paid',
                        ]
                    );

                    $facInvoice->update([
                        'amount_due'  => $facilitationFee->amount,
                        'amount_paid' => $facilitationFee->amount,
                        'status'      => 'paid',
                    ]);

                    $facRef = 'ACON_FAC_' . $student->id . '_' . Str::upper(Str::random(6));

                    // Record Payment
                    $payment = Payment::firstOrCreate(
                        [
                            'student_invoice_id' => $facInvoice->id,
                            'status'             => 'successful',
                        ],
                        [
                            'email'           => $email,
                            'payer_name'      => $studentName,
                            'amount'          => $facilitationFee->amount,
                            'reference'       => $facRef,
                            'payment_gateway' => $gateway,
                            'status'          => 'successful',
                            'metadata'        => [
                                'fee_type' => 'facilitation',
                                'notes'    => 'Cleared by Bursary/Administration'
                            ],
                        ]
                    );

                    // Record Transaction
                    Transaction::updateOrCreate(
                        [
                            'payable_type' => StudentInvoice::class,
                            'payable_id'   => $facInvoice->id,
                            'type'         => 'facilitation_fee',
                        ],
                        [
                            'user_id'        => $user?->id,
                            'email'          => $email,
                            'payer_name'     => $studentName,
                            'amount'         => $facilitationFee->amount,
                            'currency'       => 'NGN',
                            'status'         => 'successful',
                            'payment_method' => $gateway,
                            'reference'      => $payment->reference ?: $facRef,
                            'metadata'       => [
                                'invoice_id' => $facInvoice->id,
                                'fee_id'     => $facilitationFee->id,
                            ],
                        ]
                    );

                    $facStatus = '<fg=green>PAID (₦' . number_format($facilitationFee->amount) . ')</>';
                }

                // B. Clear School Fees / Tuition
                if ($schoolFee && !$onlyFacilitation) {
                    $schInvoice = StudentInvoice::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'fee_id'     => $schoolFee->id,
                        ],
                        [
                            'amount_due'  => $schoolFee->amount,
                            'amount_paid' => $schoolFee->amount,
                            'status'      => 'paid',
                        ]
                    );

                    $schInvoice->update([
                        'amount_due'  => $schoolFee->amount,
                        'amount_paid' => $schoolFee->amount,
                        'status'      => 'paid',
                    ]);

                    $schRef = 'ACON_SCH_' . $student->id . '_' . Str::upper(Str::random(6));

                    // Record Payment
                    $payment = Payment::firstOrCreate(
                        [
                            'student_invoice_id' => $schInvoice->id,
                            'status'             => 'successful',
                        ],
                        [
                            'email'           => $email,
                            'payer_name'      => $studentName,
                            'amount'          => $schoolFee->amount,
                            'reference'       => $schRef,
                            'payment_gateway' => $gateway,
                            'status'          => 'successful',
                            'metadata'        => [
                                'fee_type' => 'tuition',
                                'notes'    => 'Full School Fees cleared by Bursary/Administration'
                            ],
                        ]
                    );

                    // Record Transaction
                    Transaction::updateOrCreate(
                        [
                            'payable_type' => StudentInvoice::class,
                            'payable_id'   => $schInvoice->id,
                            'type'         => 'school_fees',
                        ],
                        [
                            'user_id'        => $user?->id,
                            'email'          => $email,
                            'payer_name'     => $studentName,
                            'amount'         => $schoolFee->amount,
                            'currency'       => 'NGN',
                            'status'         => 'successful',
                            'payment_method' => $gateway,
                            'reference'      => $payment->reference ?: $schRef,
                            'metadata'       => [
                                'invoice_id' => $schInvoice->id,
                                'fee_id'     => $schoolFee->id,
                            ],
                        ]
                    );

                    $schStatus = '<fg=green>PAID (₦' . number_format($schoolFee->amount) . ')</>';
                }

                DB::commit();

                $rows[] = [
                    $student->id,
                    $studentName,
                    $student->matriculation_number,
                    $facStatus,
                    $schStatus,
                    '<fg=green>CLEARED & UNLOCKED</>'
                ];
            } catch (\Throwable $e) {
                DB::rollBack();
                $rows[] = [
                    $student->id,
                    $studentName,
                    $student->matriculation_number,
                    'ERROR',
                    'ERROR',
                    '<fg=red>' . substr($e->getMessage(), 0, 35) . '...</>'
                ];
            }
        }

        $this->table(['Student ID', 'Student Name', 'Matric Number', 'Facilitation Fee', 'School Fees', 'Course Reg Status'], $rows);
        $this->newLine();
        $this->info("✓ Fee Clearance Completed successfully!");

        return Command::SUCCESS;
    }
}
