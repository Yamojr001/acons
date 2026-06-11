<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('students', function (Blueprint $table) {
            $table->string('academic_status')->default('normal'); // normal, reseat, repeat, withdrawn
            $table->integer('years_in_current_level')->default(1);
            $table->json('reseat_course_ids')->nullable();
        });
    }

    public function down(): void {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['academic_status', 'years_in_current_level', 'reseat_course_ids']);
        });
    }
};
