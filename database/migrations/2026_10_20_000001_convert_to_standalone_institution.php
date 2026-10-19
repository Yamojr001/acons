<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create institution_settings table
        if (!Schema::hasTable('institution_settings')) {
            Schema::create('institution_settings', function (Blueprint $table) {
                $table->id();
                $table->string('name')->default('Ameenatu College of Nursing Sciences (ACONS)');
                $table->string('short_name')->default('ACONS');
                $table->string('tagline')->nullable()->default('Leading in Nursing Education, Leading in Health Care Delivery');
                $table->string('phone')->nullable()->default('07065754443');
                $table->string('email')->nullable()->default('info@ameenatu.edu.ng');
                $table->text('address')->nullable();
                $table->string('logo_path')->nullable()->default('/assets/images/acons_logo.png');
                $table->string('favicon_path')->nullable();
                $table->string('primary_color')->default('#2e5fa9');
                $table->string('secondary_color')->default('#a31d1d');
                $table->string('grading_scale')->default('5.0');
                $table->string('payment_gateway')->default('zainpay');
                $table->integer('max_credit_units_per_year')->default(48);
                $table->integer('min_credit_units_per_year')->default(30);
                $table->json('settings')->nullable();
                $table->timestamps();
            });
        }

        // 2. Migrate existing ACONS tenant data if present
        if (Schema::hasTable('tenants')) {
            $existingTenant = DB::table('tenants')->where('id', 1)->first() ?? DB::table('tenants')->first();
            if ($existingTenant) {
                $rawSettings = json_decode($existingTenant->settings ?? '{}', true) ?: [];
                DB::table('institution_settings')->updateOrInsert(
                    ['id' => 1],
                    [
                        'name'                      => $existingTenant->name ?? 'Ameenatu College of Nursing Sciences (ACONS)',
                        'short_name'                => 'ACONS',
                        'tagline'                   => $existingTenant->tagline ?? 'Leading in Nursing Education, Leading in Health Care Delivery',
                        'phone'                     => $existingTenant->phone ?? '07065754443',
                        'email'                     => $existingTenant->email ?? 'info@ameenatu.edu.ng',
                        'address'                   => $existingTenant->address ?? 'Takur Site, Dutse, Jigawa State',
                        'logo_path'                 => $existingTenant->logo_path ?? '/assets/images/acons_logo.png',
                        'favicon_path'              => $existingTenant->favicon_path ?? null,
                        'primary_color'             => $existingTenant->primary_color ?? '#2e5fa9',
                        'secondary_color'           => $existingTenant->secondary_color ?? '#a31d1d',
                        'grading_scale'             => $rawSettings['grading_scale'] ?? '5.0',
                        'payment_gateway'           => $rawSettings['payment_gateway'] ?? 'zainpay',
                        'max_credit_units_per_year' => (int)($rawSettings['max_credit_units_per_year'] ?? 48),
                        'min_credit_units_per_year' => (int)($rawSettings['min_credit_units_per_year'] ?? 30),
                        'settings'                  => json_encode($rawSettings),
                        'created_at'                => now(),
                        'updated_at'                => now(),
                    ]
                );
            }
        }

        // List of all 20 business tables with tenant_id
        $tables = [
            'academic_records',
            'academic_sessions',
            'admission_forms',
            'announcements',
            'applicants',
            'broadcast_recipients',
            'course_registrations',
            'courses',
            'departments',
            'faculties',
            'fees',
            'grades',
            'lecturers',
            'payments',
            'programs',
            'semesters',
            'student_invoices',
            'students',
            'transactions',
            'users',
        ];

        // 3. Safely drop foreign key constraints pointing to tenants
        foreach ($tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $foreignKeys = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = ? 
                  AND COLUMN_NAME = 'tenant_id'
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                  AND TABLE_SCHEMA = DATABASE()
            ", [$tableName]);

            foreach ($foreignKeys as $fk) {
                try {
                    DB::statement("ALTER TABLE `{$tableName}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
                } catch (\Throwable $e) {
                    // Ignore if already dropped
                }
            }
        }

        // 4. Update unique constraints before dropping tenant_id column
        // users: drop tenant_id_email unique, add email unique
        if (Schema::hasTable('users')) {
            try {
                DB::statement("ALTER TABLE `users` DROP INDEX `users_tenant_id_email_unique`");
            } catch (\Throwable $e) {}

            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->unique('email');
                });
            } catch (\Throwable $e) {}
        }

        // lecturers: drop tenant_id_employee_id unique, add employee_id unique
        if (Schema::hasTable('lecturers')) {
            try {
                DB::statement("ALTER TABLE `lecturers` DROP INDEX `lecturers_tenant_id_employee_id_unique`");
            } catch (\Throwable $e) {}

            try {
                Schema::table('lecturers', function (Blueprint $table) {
                    $table->unique('employee_id');
                });
            } catch (\Throwable $e) {}
        }

        // courses: drop tenant_id_code unique, add code unique
        if (Schema::hasTable('courses')) {
            try {
                DB::statement("ALTER TABLE `courses` DROP INDEX `courses_tenant_id_code_unique`");
            } catch (\Throwable $e) {}

            try {
                Schema::table('courses', function (Blueprint $table) {
                    $table->unique('code');
                });
            } catch (\Throwable $e) {}
        }

        // 5. Drop any remaining indexes on tenant_id column
        foreach ($tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $indexes = DB::select("
                SELECT INDEX_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_NAME = ? 
                  AND COLUMN_NAME = 'tenant_id'
                  AND TABLE_SCHEMA = DATABASE()
            ", [$tableName]);

            foreach ($indexes as $idx) {
                try {
                    DB::statement("ALTER TABLE `{$tableName}` DROP INDEX `{$idx->INDEX_NAME}`");
                } catch (\Throwable $e) {
                    // Ignore if already dropped
                }
            }
        }

        // 6. Drop tenant_id columns across all tables
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('tenant_id');
                });
            }
        }

        // 7. Drop legacy tenants table
        if (Schema::hasTable('tenants')) {
            Schema::dropIfExists('tenants');
        }
    }

    public function down(): void
    {
        // Non-reversible as this is an intentional one-way architectural transition to standalone.
    }
};
