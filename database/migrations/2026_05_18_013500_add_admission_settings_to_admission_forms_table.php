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
        Schema::table('admission_forms', function (Blueprint $table) {
            $table->string('admission_year')->nullable()->after('description');
            $table->foreignId('academic_session_id')->nullable()->after('admission_year')->constrained('academic_sessions')->nullOnDelete();
            $table->integer('nursing_limit')->default(100)->after('academic_session_id');
            $table->integer('midwifery_limit')->default(100)->after('nursing_limit');
            $table->date('opening_date')->nullable()->after('midwifery_limit');
            $table->date('closing_date')->nullable()->after('opening_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admission_forms', function (Blueprint $table) {
            $table->dropForeign(['academic_session_id']);
            $table->dropColumn([
                'admission_year',
                'academic_session_id',
                'nursing_limit',
                'midwifery_limit',
                'opening_date',
                'closing_date'
            ]);
        });
    }
};
