<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\{DB, Cache, Storage, Queue};
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SystemHealthController extends Controller
{
    public function index(): Response
    {
        $checks = [
            $this->check('Database Connection', function () {
                DB::connection()->getPdo();
                return 'Connected to ' . DB::connection()->getDatabaseName();
            }),
            $this->check('Cache Store', function () {
                $key = 'health_check_' . time();
                Cache::put($key, true, 5);
                $ok = Cache::pull($key) === true;
                if (!$ok) {
                    throw new \RuntimeException('Cache read/write mismatch');
                }
                return 'Driver: ' . config('cache.default');
            }),
            $this->check('Queue Connection', function () {
                Queue::connection();
                return 'Driver: ' . config('queue.default');
            }),
            $this->check('File Storage', function () {
                $disk = Storage::disk(config('filesystems.default'));
                $path = 'health-check.txt';
                $disk->put($path, 'ok');
                $ok = $disk->exists($path);
                $disk->delete($path);
                if (!$ok) {
                    throw new \RuntimeException('Could not write/read test file');
                }
                return 'Disk: ' . config('filesystems.default');
            }),
            $this->check('Application Environment', function () {
                return 'Env: ' . app()->environment() . ' | Debug: ' . (config('app.debug') ? 'ON' : 'OFF');
            }),
        ];

        return Inertia::render('SuperAdmin/SystemHealth', [
            'checks' => $checks,
        ]);
    }

    private function check(string $label, callable $fn): array
    {
        try {
            $detail = $fn();
            return ['label' => $label, 'status' => true, 'detail' => $detail];
        } catch (Throwable $e) {
            return ['label' => $label, 'status' => false, 'detail' => $e->getMessage()];
        }
    }
}
