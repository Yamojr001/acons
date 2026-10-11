<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('admission_applications', 'applicant_id')) {
                $table->foreignId('applicant_id')->nullable()->after('admission_form_id')->constrained('applicants')->nullOnDelete();
            }
            if (!Schema::hasColumn('admission_applications', 'payment_status')) {
                $table->string('payment_status', 50)->default('pending')->after('status')->index();
            }
            if (!Schema::hasColumn('admission_applications', 'amount_paid')) {
                $table->decimal('amount_paid', 12, 2)->default(0)->after('payment_status');
            }
            if (!Schema::hasColumn('admission_applications', 'payment_reference')) {
                $table->string('payment_reference')->nullable()->after('amount_paid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('admission_applications', function (Blueprint $table) {
            if (Schema::hasColumn('admission_applications', 'applicant_id')) {
                $table->dropForeign(['applicant_id']);
                $table->dropColumn('applicant_id');
            }
            if (Schema::hasColumn('admission_applications', 'payment_status')) {
                $table->dropColumn('payment_status');
            }
            if (Schema::hasColumn('admission_applications', 'amount_paid')) {
                $table->dropColumn('amount_paid');
            }
            if (Schema::hasColumn('admission_applications', 'payment_reference')) {
                $table->dropColumn('payment_reference');
            }
        });
    }
};
