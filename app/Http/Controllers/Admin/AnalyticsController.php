<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, User, Student, Teacher, Payment, Fee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $schools = Tenant::withCount('students')->orderByDesc('students_count')->get();

        $mrr = Tenant::where('is_active', true)
            ->select('id', 'billing_type', 'billing_amount')
            ->withCount('students')
            ->get()
            ->sum(function ($t) {
                return $t->billing_type === 'per_student' ? $t->billing_amount * $t->students_count : $t->billing_amount;
            });

        return Inertia::render('SuperAdmin/Analytics', [
            'schools'        => $schools,
            'total_revenue'  => Payment::withoutGlobalScopes()->where('status','successful')->sum('amount'),
            'monthly_mrr'    => $mrr,
        ]);
    }
}
