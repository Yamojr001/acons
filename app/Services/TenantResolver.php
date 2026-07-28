<?php
namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class TenantResolver {
    public function resolve(string $host): ?Tenant {
        // In single-tenant mode, we always resolve the first school tenant (Ameenatu College Of Nursing Science)
        return Tenant::first() ?? Tenant::create([
            'name' => 'Ameenatu College of Nursing Sciences (ACONS)',
            'subdomain' => 'acons',
            'is_active' => true,
            'phone' => '07065754443',
            'email' => 'info@ameenatu.edu.ng',
            'address' => 'Dutse, Jigawa State',
            'settings' => [
                'max_credit_units_per_year' => 48,
                'min_credit_units_per_year' => 30,
                'grading_scale' => '5.0',
                'payment_gateway' => 'zainpay'
            ]
        ]);
    }

    public function clearCache(Tenant $tenant): void {
        // No-op as cache is disabled for robust real-time updates
    }
}
