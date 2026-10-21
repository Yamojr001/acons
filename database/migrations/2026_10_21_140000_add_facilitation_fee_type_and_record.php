<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'facilitation' to fee_type enum on fees table
        DB::statement("ALTER TABLE fees MODIFY COLUMN fee_type ENUM('tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'registration', 'facilitation', 'other') DEFAULT 'tuition'");

        // Seed or update the Academic Facilitation Fee
        $currentSession = DB::table('academic_sessions')->where('is_current', true)->first();
        $sessionId = $currentSession?->id ?? 1;
        $sessionName = $currentSession?->name ?? '2026/2027';

        DB::table('fees')->updateOrInsert(
            [
                'fee_type' => 'facilitation',
                'academic_session_id' => $sessionId,
            ],
            [
                'name' => "Academic Facilitation Fee ({$sessionName})",
                'amount' => 3850.00,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('fees')->where('fee_type', 'facilitation')->delete();
        DB::statement("ALTER TABLE fees MODIFY COLUMN fee_type ENUM('tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'registration', 'other') DEFAULT 'tuition'");
    }
};
