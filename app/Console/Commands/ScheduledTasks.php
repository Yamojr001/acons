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

// ─────────────────────────────────────────────────────────────────────────────
// Send low attendance alerts to parents
// ─────────────────────────────────────────────────────────────────────────────
class SendAttendanceAlerts extends Command
{
    protected $signature   = 'attendance:send-alerts {--threshold=75 : Attendance % below which to alert}';
    protected $description = 'Alert parents when a student\'s attendance drops below the threshold';

    public function handle(): int
    {
        $threshold = (int) $this->option('threshold');

        $lowAttendance = Attendance::withoutGlobalScopes()
            ->select('student_id', \Illuminate\Support\Facades\DB::raw('ROUND(AVG(CASE WHEN status IN ("present","late") THEN 100 ELSE 0 END),1) as rate'))
            ->where('date', '>=', now()->subDays(30))
            ->groupBy('student_id')
            ->having('rate', '<', $threshold)
            ->get();

        $alerted = 0;
        foreach ($lowAttendance as $record) {
            $student = Student::withoutGlobalScopes()->with('guardians.user')->find($record->student_id);
            if (! $student) continue;

            foreach ($student->guardians as $guardian) {
                try {
                    // Send notification (mail/SMS)
                    $guardian->user->notify(new \App\Notifications\LowAttendanceAlert($student, $record->rate));
                    $alerted++;
                } catch (\Exception $e) {
                    Log::warning("Failed to send attendance alert for student {$student->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Sent {$alerted} low attendance alerts (threshold: {$threshold}%).");
        return self::SUCCESS;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Console Kernel - schedule the above
// ─────────────────────────────────────────────────────────────────────────────
// In routes/console.php, add:
// use Illuminate\Support\Facades\Schedule;
//
// Schedule::command('fees:mark-overdue')->dailyAt('01:00');
// Schedule::command('attendance:send-alerts --threshold=75')->weeklyOn(1, '08:00');
