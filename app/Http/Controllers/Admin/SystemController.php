<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Tenant, User, Student, Teacher, Payment, Fee};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, DB, Hash};
use Illuminate\Support\Str;
use Inertia\{Inertia, Response};

class SystemController extends Controller
{
    public function health(): Response
    {
        $checks = [
            ['label' => 'Database',    'status' => $this->checkDb(),      'detail' => 'MySQL connection'],
            ['label' => 'Queue',       'status' => $this->checkQueue(),    'detail' => config('queue.default') . ' driver'],
            ['label' => 'Cache',       'status' => $this->checkCache(),    'detail' => config('cache.default') . ' driver'],
            ['label' => 'Storage',     'status' => is_writable(storage_path()), 'detail' => 'storage/ writable'],
            ['label' => 'PHP Version', 'status' => version_compare(PHP_VERSION, '8.3.0', '>='), 'detail' => PHP_VERSION],
            ['label' => 'App Debug',   'status' => !config('app.debug'),   'detail' => config('app.debug') ? '⚠ DEBUG IS ON' : 'Debug off'],
        ];

        return Inertia::render('SuperAdmin/SystemHealth', ['checks' => $checks]);
    }

    private function checkDb(): bool
    {
        try { DB::connection()->getPdo(); return true; } catch (\Exception $e) { return false; }
    }

    private function checkQueue(): bool
    {
        try {
            \Illuminate\Support\Facades\Queue::size();
            return true;
        } catch (\Exception) { return false; }
    }

    private function checkCache(): bool
    {
        try {
            \Illuminate\Support\Facades\Cache::put('health-check', true, 5);
            return \Illuminate\Support\Facades\Cache::get('health-check') === true;
        } catch (\Exception) { return false; }
    }
}
