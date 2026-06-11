<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('academic_sessions', function (Blueprint $table) {
            $table->json('schedules')->nullable()->after('is_current');
        });
        Schema::table('semesters', function (Blueprint $table) {
            $table->json('schedules')->nullable()->after('is_current');
        });
    }

    public function down(): void
    {
        Schema::table('academic_sessions', function (Blueprint $table) {
            $table->dropColumn('schedules');
        });
        Schema::table('semesters', function (Blueprint $table) {
            $table->dropColumn('schedules');
        });
    }
};
