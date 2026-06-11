<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, User, Student, Teacher, Payment, Fee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class SubscriptionPlanController extends Controller
{
    public function index(): Response
    {
        // Now it tracks custom "Billing Strategies"
        $strategies = [
            ['id' => 'per_school',  'name' => 'Per School',  'description' => 'Flat fee billed to the entire organization globally.'],
            ['id' => 'per_group',   'name' => 'Per Group',   'description' => 'Tiered group limit billed to the organization based on thresholds.'],
            ['id' => 'per_student', 'name' => 'Per Student', 'description' => 'Dynamic pricing strictly scaled per active student headcount.'],
        ];

        $planStats = Tenant::select('billing_type', DB::raw('COUNT(*) as count'))
            ->groupBy('billing_type')
            ->pluck('count', 'billing_type');

        return Inertia::render('SuperAdmin/Plans', [
            'plans'     => $strategies,
            'planStats' => $planStats,
        ]);
    }
}
