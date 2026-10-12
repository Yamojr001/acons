<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            if (!Schema::hasColumn('applicants', 'passport_photo')) {
                $table->string('passport_photo')->nullable()->after('jamb_score');
            }
            if (!Schema::hasColumn('applicants', 'applied_program_id')) {
                $table->unsignedBigInteger('applied_program_id')->nullable()->after('admitted_program_id');
            }
            if (!Schema::hasColumn('applicants', 'exam_date')) {
                $table->dateTime('exam_date')->nullable()->after('passport_photo');
            }
            if (!Schema::hasColumn('applicants', 'exam_venue')) {
                $table->string('exam_venue')->nullable()->after('exam_date');
            }
            if (!Schema::hasColumn('applicants', 'seat_number')) {
                $table->string('seat_number')->nullable()->after('exam_venue');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn(['passport_photo', 'applied_program_id', 'exam_date', 'exam_venue', 'seat_number']);
        });
    }
};
