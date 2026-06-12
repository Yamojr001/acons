<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE admission_applications ALTER COLUMN status TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE admission_applications ALTER COLUMN status SET DEFAULT 'pending'");
        } else {
            DB::statement("ALTER TABLE admission_applications MODIFY COLUMN status ENUM('pending', 'under_review', 'accepted', 'rejected', 'admitted', 'cleared', 'clearance_rejected') DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE admission_applications ALTER COLUMN status TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE admission_applications ALTER COLUMN status SET DEFAULT 'pending'");
        } else {
            DB::statement("ALTER TABLE admission_applications MODIFY COLUMN status ENUM('pending', 'under_review', 'accepted', 'rejected') DEFAULT 'pending'");
        }
    }
};
