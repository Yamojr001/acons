<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing admission workflow columns to applicants table
        Schema::table('applicants', function (Blueprint $table) {
            if (!Schema::hasColumn('applicants', 'admission_form_id')) {
                $table->foreignId('admission_form_id')->nullable()->after('tenant_id')->constrained('admission_forms')->nullOnDelete();
            }
            if (!Schema::hasColumn('applicants', 'admitted_department_id')) {
                $table->foreignId('admitted_department_id')->nullable()->after('admitted_program_id')->constrained('departments')->nullOnDelete();
            }
            if (!Schema::hasColumn('applicants', 'admitted_section')) {
                $table->string('admitted_section')->nullable()->after('admitted_department_id');
            }
            if (!Schema::hasColumn('applicants', 'clearance_schedule')) {
                $table->text('clearance_schedule')->nullable()->after('admitted_section');
            }
            if (!Schema::hasColumn('applicants', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('clearance_schedule');
            }
            if (!Schema::hasColumn('applicants', 'clearance_rejection_reason')) {
                $table->text('clearance_rejection_reason')->nullable()->after('rejection_reason');
            }
            if (!Schema::hasColumn('applicants', 'data')) {
                $table->json('data')->nullable()->after('clearance_rejection_reason');
            }
            if (!Schema::hasColumn('applicants', 'status')) {
                $table->string('status', 50)->default('pending')->after('admission_status')->index();
            }
        });

        // 2. Synchronize status from admission_status and set default admission_form_id
        $defaultFormId = DB::table('admission_forms')->where('is_active', true)->value('id')
            ?? DB::table('admission_forms')->value('id');

        DB::table('applicants')->whereNull('status')->orWhere('status', '')->update([
            'status' => DB::raw("COALESCE(admission_status, 'pending')"),
        ]);

        if ($defaultFormId) {
            DB::table('applicants')->whereNull('admission_form_id')->update([
                'admission_form_id' => $defaultFormId,
            ]);
        }

        // 3. Drop admission_applications table
        Schema::dropIfExists('admission_applications');
    }

    public function down(): void
    {
        // Re-create admission_applications table if rolled back
        if (!Schema::hasTable('admission_applications')) {
            Schema::create('admission_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('admission_form_id')->constrained('admission_forms')->cascadeOnDelete();
                $table->foreignId('applicant_id')->nullable()->constrained('applicants')->nullOnDelete();
                $table->string('applicant_name');
                $table->string('applicant_email');
                $table->json('data')->nullable();
                $table->string('status', 50)->default('pending')->index();
                $table->string('payment_status', 50)->default('pending')->index();
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->string('payment_reference')->nullable();
                $table->foreignId('admitted_department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->string('admitted_section')->nullable();
                $table->text('clearance_schedule')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->text('clearance_rejection_reason')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        Schema::table('applicants', function (Blueprint $table) {
            if (Schema::hasColumn('applicants', 'admission_form_id')) {
                $table->dropForeign(['admission_form_id']);
                $table->dropColumn('admission_form_id');
            }
            if (Schema::hasColumn('applicants', 'admitted_department_id')) {
                $table->dropForeign(['admitted_department_id']);
                $table->dropColumn('admitted_department_id');
            }
            if (Schema::hasColumn('applicants', 'admitted_section')) {
                $table->dropColumn('admitted_section');
            }
            if (Schema::hasColumn('applicants', 'clearance_schedule')) {
                $table->dropColumn('clearance_schedule');
            }
            if (Schema::hasColumn('applicants', 'rejection_reason')) {
                $table->dropColumn('rejection_reason');
            }
            if (Schema::hasColumn('applicants', 'clearance_rejection_reason')) {
                $table->dropColumn('clearance_rejection_reason');
            }
            if (Schema::hasColumn('applicants', 'data')) {
                $table->dropColumn('data');
            }
            if (Schema::hasColumn('applicants', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
