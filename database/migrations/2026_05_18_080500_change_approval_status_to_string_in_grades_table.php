<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->string('approval_status', 50)->default('draft')->change();
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            $table->enum('approval_status', ['draft', 'hod_approved', 'dean_approved', 'senate_approved'])->default('draft')->change();
        });
    }
};
