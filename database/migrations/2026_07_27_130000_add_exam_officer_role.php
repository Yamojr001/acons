<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/**
 * Adds the exam_officer role/permissions to a live database without touching
 * (let alone truncating) existing roles, permissions, or role assignments —
 * safe to run via `php artisan migrate` on production.
 */
return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view students', 'view courses', 'view course_registrations',
            'view grades', 'upload course grades', 'approve senate grades',
            'view timetables', 'create timetables', 'edit timetables',
            'view announcements', 'create announcements',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $role = Role::firstOrCreate(['name' => 'exam_officer', 'guard_name' => 'web']);
        $role->syncPermissions($permissions);
    }

    public function down(): void
    {
        // Intentionally left blank: do not remove the role/permissions on rollback,
        // since that could strip access from live exam_officer users.
    }
};
