<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name','subdomain','custom_domain','custom_domain_verified','domain_verification_token',
        'logo_path','favicon_path','primary_color','secondary_color','tagline',
        'phone','email','address','billing_type','billing_amount','max_students',
        'billing_payer','subscription_expires_at','is_active','settings',
    ];
    
    protected $casts = [
        'custom_domain_verified' => 'boolean',
        'is_active' => 'boolean',
        'billing_amount' => 'decimal:2',
        'max_students' => 'integer',
        'subscription_expires_at' => 'datetime',
        'settings' => 'array',
    ];

    public function getTeacherModeAttribute() {
        return $this->settings['teacher_mode'] ?? 'per_class';
    }

    public function getSectionsAttribute() {
        // Defaults if no explicit setting is provided
        return $this->settings['sections'] ?? [
            ['name' => 'Primary', 'level_limit' => 6],
            ['name' => 'Junior Secondary', 'level_limit' => 3],
            ['name' => 'Senior Secondary', 'level_limit' => 3],
        ];
    }

    public function getCurrentSessionAttribute() {
        return $this->settings['current_session'] ?? date('Y') . '/' . (date('Y') + 1);
    }

    public function getCurrentTermAttribute() {
        return $this->settings['current_term'] ?? '1st Term';
    }

    public function users(): HasMany { return $this->hasMany(User::class); }
    public function students(): HasMany { return $this->hasMany(Student::class); }
    public function lecturers(): HasMany { return $this->hasMany(Lecturer::class); }
    public function faculties(): HasMany { return $this->hasMany(Faculty::class); }
    public function departments(): HasMany { return $this->hasMany(Department::class); }
    public function courses(): HasMany { return $this->hasMany(Course::class); }
    public function fees(): HasMany { return $this->hasMany(Fee::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
