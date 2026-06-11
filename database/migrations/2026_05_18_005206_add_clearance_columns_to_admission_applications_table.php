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
        Schema::table('admission_applications', function (Blueprint $table) {
            $table->foreignId('admitted_department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->string('admitted_section')->nullable(); // 'ND' or 'HND'
            $table->text('clearance_schedule')->nullable(); // text containing date/schedule for clearance
            $table->text('rejection_reason')->nullable(); // reason from registrar/admission officer
            $table->text('clearance_rejection_reason')->nullable(); // reason from HOD
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            $table->dropForeign(['admitted_department_id']);
            $table->dropColumn([
                'admitted_department_id',
                'admitted_section',
                'clearance_schedule',
                'rejection_reason',
                'clearance_rejection_reason'
            ]);
        });
    }
};
