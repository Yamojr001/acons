<?php

use App\Models\Tenant;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Database\Migrations\Migration;

/**
 * One-off data-correction migration for the ACONS tenant.
 *
 * This does NOT touch the seeder's create() calls (which would duplicate data
 * if re-run). Instead it updates existing rows in place, and only creates a
 * Program row if one with that exact name doesn't already exist. Safe to run
 * on the live production database.
 */
return new class extends Migration
{
    public function up(): void
    {
        $tenant = Tenant::where('subdomain', 'acons')->first();
        if (!$tenant) {
            return; // Nothing to fix if this tenant doesn't exist in this environment.
        }

        // 1. Correct contact phone (#2) and payment gateway (#10).
        $settings = $tenant->settings ?? [];
        $settings['payment_gateway'] = 'zainpay';

        $tenant->phone = '07065754443';
        $tenant->settings = $settings;
        $tenant->save();

        // 2. Rename existing Nursing / Midwifery departments + programmes to the
        //    final approved names (#3, #12), without deleting/recreating them
        //    (preserves existing student/program_id/department_id links).
        $nursingDept = Department::where('tenant_id', $tenant->id)
            ->where('name', 'National Diploma in Nursing')
            ->first();

        $midwiferyDept = Department::where('tenant_id', $tenant->id)
            ->where('name', 'National Diploma in Midwifery')
            ->first();

        if ($midwiferyDept) {
            $midwiferyDept->update(['name' => 'Midwifery']);
        }

        // Rename the existing single "National Diploma in Nursing" programme
        // to "ND Nursing Programme" (keeps its id / students intact).
        if ($nursingDept) {
            Program::where('tenant_id', $tenant->id)
                ->where('department_id', $nursingDept->id)
                ->where('name', 'National Diploma in Nursing')
                ->update(['name' => 'ND Nursing Programme']);
        }

        // Rename the existing "National Diploma in Midwifery" programme
        // to "Basic Midwifery Programme".
        if ($midwiferyDept) {
            Program::where('tenant_id', $tenant->id)
                ->where('department_id', $midwiferyDept->id)
                ->where('name', 'National Diploma in Midwifery')
                ->update(['name' => 'Basic Midwifery Programme']);
        }

        // 3. Add the two missing programmes if they aren't already present,
        //    so the final active list is exactly:
        //    Basic Nursing Programme, Basic Midwifery Programme,
        //    ND Nursing Programme, HND Nursing Programme.
        if ($nursingDept) {
            foreach (['Basic Nursing Programme', 'HND Nursing Programme'] as $name) {
                Program::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'department_id' => $nursingDept->id, 'name' => $name],
                    ['degree_type' => str_starts_with($name, 'HND') ? 'HND' : 'Basic', 'duration_years' => str_starts_with($name, 'HND') ? 2 : 3]
                );
            }
        }
    }

    public function down(): void
    {
        // Intentionally left blank: this is a one-way data correction.
        // Reverting would risk re-introducing the incorrect production data.
    }
};
