<?php

namespace App\Console\Commands;

use App\Models\{Fee, Student, Attendance};
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

// ─────────────────────────────────────────────────────────────────────────────
// Mark overdue fees daily
// ─────────────────────────────────────────────────────────────────────────────
class MarkOverdueFees extends Command
{
    protected $signature   = 'fees:mark-overdue';
    protected $description = 'Mark all past-due fees as overdue across all tenants';

    public function handle(): int
    {
        $updated = Fee::withoutGlobalScopes()
            ->where('status', 'pending')
            ->whereDate('due_date', '<', now())
            ->update(['status' => 'overdue']);

        $this->info("Marked {$updated} fees as overdue.");
        Log::info("fees:mark-overdue — {$updated} fees updated");

        return self::SUCCESS;
    }
}


