<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasOne};
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use SoftDeletes;
    use Notifiable, BelongsToTenant, HasRoles;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'gender',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = [
        'avatar_url',
        'role',
    ];

    // Role Constants
    public const ROLE_SUPER_ADMIN       = 'super_admin';
    public const ROLE_SCHOOL_ADMIN      = 'school_admin';
    public const ROLE_LECTURER          = 'lecturer';
    public const ROLE_TEACHER           = 'teacher'; // Legacy
    public const ROLE_STUDENT           = 'student';
    public const ROLE_REGISTRAR         = 'registrar';
    public const ROLE_BURSAR            = 'bursar';
    public const ROLE_ADMISSION_OFFICER = 'admission_officer';
    public const ROLE_EXAM_OFFICER      = 'exam_officer';
    public const ROLE_HOD               = 'hod';
    public const ROLE_DEAN              = 'dean';
    public const ROLE_PROVOST           = 'provost';

    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
    public function student(): HasOne   { return $this->hasOne(Student::class); }
    public function lecturer(): HasOne  { return $this->hasOne(Lecturer::class); }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) return null;
        return str_starts_with($this->avatar, 'http') ? $this->avatar : asset('storage/' . $this->avatar);
    }

    public function getRoleAttribute(): ?string
    {
        return $this->roles->first()?->name;
    }
}
