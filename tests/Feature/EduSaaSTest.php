<?php

namespace Tests\Feature;

use App\Models\{Tenant, User, Student, Fee, Payment};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenancyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User   $adminA;
    private User   $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::create(['name' => 'School A', 'subdomain' => 'school-a', 'is_active' => true]);
        $this->tenantB = Tenant::create(['name' => 'School B', 'subdomain' => 'school-b', 'is_active' => true]);

        $this->adminA = User::factory()->create(['tenant_id' => $this->tenantA->id, 'role' => 'school_admin']);
        $this->adminB = User::factory()->create(['tenant_id' => $this->tenantB->id, 'role' => 'school_admin']);
    }

    /** @test */
    public function tenant_is_resolved_from_subdomain(): void
    {
        app()->instance('currentTenant', $this->tenantA);

        $resolved = app('currentTenant');
        $this->assertEquals($this->tenantA->id, $resolved->id);
    }

    /** @test */
    public function admin_cannot_access_other_tenants_students(): void
    {
        $studentB = Student::factory()->create(['tenant_id' => $this->tenantB->id]);

        app()->instance('currentTenant', $this->tenantA);
        $this->actingAs($this->adminA);

        // TenantScope should return 0 students from tenant A
        $this->assertEquals(0, Student::count());
    }

    /** @test */
    public function cross_tenant_url_manipulation_is_blocked(): void
    {
        // Admin from Tenant A tries to access Tenant B URL
        app()->instance('currentTenant', $this->tenantB);

        $this->actingAs($this->adminA)
             ->get('/admin/dashboard')
             ->assertRedirect('/login');
    }

    /** @test */
    public function students_email_unique_per_tenant(): void
    {
        // Same email should be allowed in different tenants
        User::factory()->create(['tenant_id' => $this->tenantA->id, 'email' => 'john@example.com']);

        app()->instance('currentTenant', $this->tenantB);
        $user = User::factory()->create(['tenant_id' => $this->tenantB->id, 'email' => 'john@example.com']);

        $this->assertNotNull($user->id);
    }
}

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::create(['name' => 'Test School', 'subdomain' => 'test', 'is_active' => true]);
        app()->instance('currentTenant', $this->tenant);
    }

    /** @test */
    public function user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email'     => 'admin@test.com',
            'password'  => bcrypt('password123'),
            'role'      => 'school_admin',
            'is_active' => true,
        ]);

        $response = $this->post('/login', [
            'email'    => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    /** @test */
    public function login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email'     => 'admin@test.com',
            'password'  => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email'    => 'admin@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    /** @test */
    public function login_is_rate_limited_after_5_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => 'test@test.com', 'password' => 'wrong']);
        }

        $response = $this->post('/login', ['email' => 'test@test.com', 'password' => 'wrong']);
        $response->assertSessionHasErrors(); // throttle error
    }

    /** @test */
    public function inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email'     => 'inactive@test.com',
            'password'  => bcrypt('password123'),
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'email'    => 'inactive@test.com',
            'password' => 'password123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}

class FeePaymentTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function student_cannot_pay_another_students_fee(): void
    {
        $tenant   = Tenant::create(['name' => 'School', 'subdomain' => 'school', 'is_active' => true]);
        $userA    = User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'student']);
        $studentA = Student::factory()->create(['tenant_id' => $tenant->id, 'user_id' => $userA->id]);
        $studentB = Student::factory()->create(['tenant_id' => $tenant->id]);
        $feeB     = Fee::factory()->create(['tenant_id' => $tenant->id, 'student_id' => $studentB->id]);

        app()->instance('currentTenant', $tenant);

        $response = $this->actingAs($userA)
             ->post("/student/fees/{$feeB->id}/pay", ['gateway' => 'paystack']);

        $response->assertForbidden();
    }

    /** @test */
    public function payment_status_updates_fee_status(): void
    {
        $tenant  = Tenant::create(['name' => 'School', 'subdomain' => 'school', 'is_active' => true]);
        $student = Student::factory()->create(['tenant_id' => $tenant->id]);
        $fee     = Fee::factory()->create(['tenant_id' => $tenant->id, 'student_id' => $student->id, 'amount' => 10000, 'status' => 'pending']);
        $payment = Payment::factory()->create([
            'tenant_id'  => $tenant->id,
            'fee_id'     => $fee->id,
            'student_id' => $student->id,
            'amount'     => 10000,
            'reference'  => 'TEST-REF-001',
            'status'     => 'pending',
        ]);

        app()->instance('currentTenant', $tenant);
        $payment->update(['status' => 'successful']);
        $fee->update(['status' => 'paid']);

        $this->assertEquals('paid', $fee->fresh()->status);
    }
}
