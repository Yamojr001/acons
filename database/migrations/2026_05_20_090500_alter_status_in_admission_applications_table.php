<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE admission_applications MODIFY COLUMN status ENUM('pending', 'under_review', 'accepted', 'rejected', 'admitted', 'cleared', 'clearance_rejected') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE admission_applications MODIFY COLUMN status ENUM('pending', 'under_review', 'accepted', 'rejected') DEFAULT 'pending'");
    }
};
