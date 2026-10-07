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
    protected $signature = 'zainpay:reconcile {--count=50 : Number of recent transactions to inspect}';

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
        $count = (int) $this->option('count');
        $this->info("Fetching up to {$count} recent transactions from Zainpay history...");

        $result = $service->reconcileHistory($count);

        if (!($result['success'] ?? false)) {
            $this->error('Reconciliation failed: ' . ($result['error'] ?? 'Unknown error'));
            return Command::FAILURE;
        }

        $totalChecked = $result['total_checked'] ?? 0;
        $reconciledCount = $result['reconciled_count'] ?? 0;

        $this->info("Checked {$totalChecked} transactions from Zainpay.");

        if ($reconciledCount === 0) {
            $this->info('All database records are already in sync. No pending records required updating.');
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
