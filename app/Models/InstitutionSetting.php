<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class InstitutionSetting extends Model
{
    protected $table = 'institution_settings';

    protected $fillable = [
        'name',
        'short_name',
        'tagline',
        'phone',
        'email',
        'address',
        'logo_path',
        'favicon_path',
        'primary_color',
        'secondary_color',
        'grading_scale',
        'payment_gateway',
        'max_credit_units_per_year',
        'min_credit_units_per_year',
        'settings',
    ];

    protected $casts = [
        'settings'                  => 'array',
        'max_credit_units_per_year' => 'integer',
        'min_credit_units_per_year' => 'integer',
    ];

    /**
     * Singleton accessor for the institution's settings.
     */
    public static function current(): self
    {
        return Cache::remember('institution_settings_current', 3600, function () {
            return static::first() ?? static::create([
                'name'                      => 'Ameenatu College of Nursing Sciences (ACONS)',
                'short_name'                => 'ACONS',
                'tagline'                   => 'Leading in Nursing Education, Leading in Health Care Delivery',
                'phone'                     => '07065754443',
                'email'                     => 'info@ameenatu.edu.ng',
                'address'                   => 'Takur Adua, P.M.B. 105, Dutse, Jigawa State, Nigeria',
                'logo_path'                 => '/assets/images/acons_logo.png',
                'primary_color'             => '#2e5fa9',
                'secondary_color'           => '#a31d1d',
                'grading_scale'             => '5.0',
                'payment_gateway'           => 'zainpay',
                'max_credit_units_per_year' => 48,
                'min_credit_units_per_year' => 30,
                'settings'                  => [
                    'grading_scale'             => '5.0',
                    'payment_gateway'           => 'zainpay',
                    'max_credit_units_per_year' => 48,
                    'min_credit_units_per_year' => 30,
                ],
            ]);
        });
    }

    /**
     * Clear cached settings upon update.
     */
    public static function clearCache(): void
    {
        Cache::forget('institution_settings_current');
    }

    protected static function booted(): void
    {
        static::saved(function () {
            static::clearCache();
        });
    }

    /**
     * Helper to get a dynamic configuration setting with fallback.
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $this->{$key} ?? $default;
    }

    /**
     * Format into an array compatible with Inertia shared data.
     */
    public function toInertiaArray(): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'short_name'        => $this->short_name ?: 'ACONS',
            'tagline'           => $this->tagline,
            'phone'             => $this->phone,
            'email'             => $this->email,
            'address'           => $this->address,
            'logo_path'         => $this->logo_path ? (str_starts_with($this->logo_path, 'http') || str_starts_with($this->logo_path, '/') ? asset($this->logo_path) : asset('storage/' . $this->logo_path)) : null,
            'favicon_path'      => $this->favicon_path ? (str_starts_with($this->favicon_path, 'http') || str_starts_with($this->favicon_path, '/') ? asset($this->favicon_path) : asset('storage/' . $this->favicon_path)) : null,
            'primary_color'     => $this->primary_color ?: '#2e5fa9',
            'secondary_color'   => $this->secondary_color ?: '#a31d1d',
            'grading_scale'     => $this->grading_scale ?: '5.0',
            'payment_gateway'   => $this->payment_gateway ?: 'zainpay',
            'settings'          => $this->settings ?: [],
        ];
    }
}
