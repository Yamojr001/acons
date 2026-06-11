<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        // Don't let tenant modify super_admin. Show standard roles and custom ones.
        $roles = Role::whereNotIn('name', ['super_admin'])
                     ->with('permissions')
                     ->get();

        // Get all permissions except platform level ones
        $permissions = Permission::whereNotIn('name', [
            'manage tenants', 'manage subscription plans', 'view platform analytics', 'manage system configuration'
        ])->orderBy('name')->get();

        // Group permissions contextually for the UI
        $groupedPermissions = [];
        foreach ($permissions as $permission) {
            // "view students" -> action = "view", entity = "students"
            // "pay own fees" -> action = "pay", entity = "own fees"
            $parts = explode(' ', $permission->name, 2);
            if (count($parts) === 2) {
                $action = $parts[0];
                $entity = $parts[1];
            } else {
                $action = 'other';
                $entity = $permission->name;
            }
            $groupedPermissions[ucfirst($entity)][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'action' => ucfirst($action)
            ];
        }

        return Inertia::render('SchoolAdmin/Roles', [
            'roles' => $roles,
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        DB::transaction(function () use ($request) {
            $role = Role::create([
                'name' => strtolower($request->name),
                'guard_name' => 'web'
            ]);

            $role->syncPermissions($request->permissions);
        });

        return back()->with('success', 'Custom role created successfully.');
    }

    public function update(Request $request, Role $role)
    {
        // Prevent editing core system roles totally via this interface, or allow only permissions modification
        $coreRoles = ['super_admin', 'school_admin', 'teacher', 'lecturer', 'student', 'registrar', 'bursar', 'admissions_officer', 'exam_officer', 'hod', 'dean', 'accountant'];
        
        $request->validate([
            'name' => 'sometimes|string|max:100|unique:roles,name,' . $role->id,
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        DB::transaction(function () use ($request, $role, $coreRoles) {
            if (!in_array($role->name, $coreRoles) && $request->has('name')) {
                $role->update(['name' => strtolower($request->name)]);
            }

            // Standard school_admins shouldn't be demoted from managing roles/settings themselves
            $role->syncPermissions($request->permissions);
        });

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        $coreRoles = ['super_admin', 'school_admin', 'teacher', 'lecturer', 'student', 'registrar', 'bursar', 'admissions_officer', 'exam_officer', 'hod', 'dean', 'accountant'];
        
        if (in_array($role->name, $coreRoles)) {
            return back()->withErrors(['error' => 'Core system roles cannot be deleted.']);
        }

        // Ensure no users have this role before deleting
        if ($role->users()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete role assigned to active users.']);
        }

        $role->delete();

        return back()->with('success', 'Custom role deleted.');
    }
}
