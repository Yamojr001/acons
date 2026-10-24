<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update any academic sessions named '2025/2026' to '2026/2027'
        if (Schema::hasTable('academic_sessions')) {
            // Check if 2026/2027 exists
            $session26 = DB::table('academic_sessions')->where('name', '2026/2027')->first();
            $session25 = DB::table('academic_sessions')->where('name', '2025/2026')->first();

            if ($session25 && !$session26) {
                DB::table('academic_sessions')
                    ->where('id', $session25->id)
                    ->update([
                        'name'       => '2026/2027',
                        'is_current' => true,
                    ]);
            } elseif ($session26) {
                DB::table('academic_sessions')
                    ->where('id', $session26->id)
                    ->update(['is_current' => true]);

                if ($session25) {
                    DB::table('academic_sessions')
                        ->where('id', $session25->id)
                        ->update(['is_current' => false]);
                }
            }
        }

        // 2. Update any fee names mentioning 2025/2026
        if (Schema::hasTable('fees')) {
            DB::statement("UPDATE fees SET name = REPLACE(name, '2025/2026', '2026/2027') WHERE name LIKE '%2025/2026%'");
        }

        // 3. Clear application caches
        try {
            \Illuminate\Support\Facades\Cache::flush();
        } catch (\Throwable) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
