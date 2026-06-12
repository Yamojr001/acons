<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Clear existing to avoid duplicates when re-seeding
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('TRUNCATE TABLE role_has_permissions, model_has_roles, model_has_permissions, roles, permissions CASCADE');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('role_has_permissions')->truncate();
            DB::table('model_has_roles')->truncate();
            DB::table('model_has_permissions')->truncate();
            DB::table('roles')->truncate();
            DB::table('permissions')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $entities = [
            'settings', 'roles', 'users', 'lecturers', 'students', 
            'faculties', 'departments', 'programs', 'courses', 'academic_sessions', 'semesters',
            'course_registrations', 'grades', 'academic_records', 'fees', 'payments', 
            'announcements', 'reports', 'admissions', 'timetables'
        ];

        // Platform level permissions (Super Admin only)
        $platformPermissions = [
            'manage tenants', 'manage subscription plans', 'view platform analytics', 'manage system configuration'
        ];

        $allPermissions = $platformPermissions;

        // Generate extensive CRUD permissions for each entity
        foreach ($entities as $entity) {
            $allPermissions[] = "view $entity";
            $allPermissions[] = "create $entity";
            $allPermissions[] = "edit $entity";
            $allPermissions[] = "delete $entity";
        }

        // Specific Higher Ed Workflow Permissions
        $uniquePermissions = [
            'approve course registrations', 'upload course grades', 
            'approve department grades', 'approve faculty grades', 'approve senate grades',
            'view own records', 'register courses', 'pay own fees', 'view own timetable'
        ];

        $allPermissions = array_merge($allPermissions, $uniquePermissions);

        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        /* ────── ROLES ────── */
        
        $roleSuperAdmin = Role::create(['name' => 'super_admin', 'guard_name' => 'web']);
        $roleSuperAdmin->givePermissionTo(Permission::all());

        // Provost (View-only executive dashboard)
        $roleProvost = Role::create(['name' => 'provost', 'guard_name' => 'web']);
        $roleProvost->givePermissionTo([
            'view students', 'view lecturers', 'view faculties', 'view departments', 
            'view reports', 'view announcements', 'view payments'
        ]);

        // Registrar (Academic Management)
        $roleRegistrar = Role::create(['name' => 'registrar', 'guard_name' => 'web']);
        $roleRegistrar->givePermissionTo([
            'view students', 'create students', 'edit students',
            'view faculties', 'create faculties', 'edit faculties',
            'view departments', 'create departments', 'edit departments',
            'view programs', 'create programs', 'edit programs',
            'view academic_sessions', 'create academic_sessions', 'edit academic_sessions',
            'view semesters', 'create semesters', 'edit semesters',
            'view admissions', 'create admissions', 'edit admissions',
            'view announcements', 'create announcements'
        ]);

        // Bursar (Financial Management)
        $roleBursar = Role::create(['name' => 'bursar', 'guard_name' => 'web']);
        $roleBursar->givePermissionTo([
            'view students', 'view fees', 'create fees', 'edit fees', 'delete fees',
            'view payments', 'create payments', 'edit payments', 'delete payments', 'view reports',
            'view announcements'
        ]);

        // Admission Officer (Admissions Management)
        $roleAdmissionOfficer = Role::create(['name' => 'admission_officer', 'guard_name' => 'web']);
        $roleAdmissionOfficer->givePermissionTo([
            'view students', 'view admissions', 'create admissions', 'edit admissions', 'delete admissions',
            'view programs', 'view announcements'
        ]);

        // Head of Department (HOD)
        $roleHOD = Role::create(['name' => 'hod', 'guard_name' => 'web']);
        $roleHOD->givePermissionTo([
            'view students', 'view lecturers', 'view courses', 'create courses', 'edit courses',
            'view course_registrations', 'view grades', 'approve department grades', 
            'view announcements', 'create announcements'
        ]);

        // School System Admin (High level institutional admin)
        $roleSchoolAdmin = Role::create(['name' => 'school_admin', 'guard_name' => 'web']);
        $roleSchoolAdmin->givePermissionTo(Permission::all()); // Broad permissions within the school

        // Lecturer
        $roleLecturer = Role::create(['name' => 'lecturer', 'guard_name' => 'web']);
        $roleLecturer->givePermissionTo([
            'view students', 'view courses', 'view timetables',
            'upload course grades', 'view announcements'
        ]);

        // Student
        $roleStudent = Role::create(['name' => 'student', 'guard_name' => 'web']);
        $roleStudent->givePermissionTo([
            'register courses', 'view own records', 'pay own fees', 'view own timetable',
            'view announcements'
        ]);
    }
}
