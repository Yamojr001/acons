<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE fees MODIFY COLUMN fee_type ENUM('tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'registration', 'other') DEFAULT 'tuition'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE fees MODIFY COLUMN fee_type ENUM('tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'other') DEFAULT 'tuition'");
    }
};
