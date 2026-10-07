<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ZainpayReconciliationService;

class ReconcileZainpayPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'zainpay:reconcile 
        {--count=50 : Number of recent transactions to inspect}
        {--window=40 : Time window in minutes to match transactions against applicant timestamp (default: 40)}
        {--applicant= : Reconcile a specific applicant by ID or JAMB number}
        {--email= : Customer email to search and reconcile in Zainpay}
        {--ref= : Specific transaction reference to verify and reconcile}
        {--force : Force mark applicant as paid if payment was confirmed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile pending payments and admission applications against Zainpay transaction history';

    /**
     * Execute the console command.
     */
    public function handle(ZainpayReconciliationService $service): int
    {
        $window = (int) ($this->option('window') ?: 40);

        // ─── Case 1: Specific Applicant Lookup / Force Clear ─────────────────
        if ($applicantInput = $this->option('applicant')) {
            $force = (bool) $this->option('force');
            $this->info("Reconciling applicant '{$applicantInput}' (Window: {$window}m)..." . ($force ? " (FORCED)" : ""));

            $result = $service->reconcileApplicantById($applicantInput, $force, $window);

            if (!($result['success'] ?? false)) {
                $this->error($result['error'] ?? 'Applicant reconciliation failed.');
                return Command::FAILURE;
            }

            $applicant = $result['applicant'];
            $this->info($result['message']);

            $rows = [
                ['Applicant ID', $applicant->id],
                ['Full Name', $applicant->full_name],
                ['JAMB Number', $applicant->jamb_number],
                ['Email', $applicant->email],
                ['Payment Status', $applicant->payment_status],
                ['Amount Paid', '₦' . number_format((float) $applicant->amount_paid, 2)],
                ['Payment Reference', $applicant->payment_reference ?? 'N/A'],
            ];

            if (isset($result['transaction']['diffMinutes'])) {
                $rows[] = ['Time Difference', $result['transaction']['diffMinutes'] . ' minutes'];
            }

            $this->table(['Field', 'Value'], $rows);

            return Command::SUCCESS;
        }

        // ─── Case 2: Specific Reference Verification ────────────────────────
        if ($ref = $this->option('ref')) {
            $this->info("Verifying transaction reference '{$ref}' on Zainpay...");
            $match = $service->verifyAndReconcileTxnRef($ref);

            if ($match) {
                $this->info("Successfully verified and reconciled reference '{$ref}':");
                $this->table(['Type', 'ID', 'Reference / Name', 'Status'], [[
                    $match['type'] ?? 'N/A',
                    $match['id'] ?? 'N/A',
                    $match['name'] ?? ($match['reference'] ?? $ref),
                    $match['status'] ?? 'paid',
                ]]);
                return Command::SUCCESS;
            }

            $this->error("Reference '{$ref}' could not be verified on Zainpay.");
            return Command::FAILURE;
        }

        // ─── Case 3: Customer Email Search ───────────────────────────────────
        if ($email = $this->option('email')) {
            $this->info("Searching Zainpay card transactions for email '{$email}'...");
            $matches = $service->reconcileCardTransactions(50, $email);

            if (empty($matches)) {
                $this->info("No successful card transactions found for email '{$email}'.");
                return Command::SUCCESS;
            }

            $this->info("Found and reconciled " . count($matches) . " record(s) for email '{$email}':");
            $rows = [];
            foreach ($matches as $m) {
                $rows[] = [$m['type'] ?? 'N/A', $m['id'] ?? 'N/A', $m['name'] ?? ($m['reference'] ?? 'N/A'), $m['status'] ?? 'paid'];
            }
            $this->table(['Type', 'ID', 'Name / Reference', 'Status'], $rows);
            return Command::SUCCESS;
        }

        // ─── Case 4: Default Full History & Pending Applicants Scan ─────────
        $count = (int) $this->option('count');
        $this->info("Fetching up to {$count} recent transactions across Card and Bank APIs (Window: {$window}m)...");

        $result = $service->reconcileHistory($count, $window);

        if (!($result['success'] ?? false)) {
            $this->error('Reconciliation failed: ' . ($result['error'] ?? 'Unknown error'));
            return Command::FAILURE;
        }

        $reconciledCount = $result['reconciled_count'] ?? 0;

        if ($reconciledCount === 0) {
            $this->info('Checked recent transactions and pending applicants.');
            $this->info('All records are already in sync. No pending records required updating.');
            return Command::SUCCESS;
        }

        $this->info("Successfully reconciled and marked {$reconciledCount} record(s) as PAID:");

        $headers = ['Type', 'ID', 'Name / Reference', 'Status'];
        $rows = [];

        foreach ($result['reconciled_records'] as $rec) {
            $rows[] = [
                $rec['type'] ?? 'N/A',
                $rec['id'] ?? 'N/A',
                $rec['name'] ?? ($rec['reference'] ?? 'N/A'),
                $rec['status'] ?? 'paid',
            ];
        }

        $this->table($headers, $rows);

        return Command::SUCCESS;
    }
}
