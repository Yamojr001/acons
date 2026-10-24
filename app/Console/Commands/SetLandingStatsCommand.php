<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InstitutionSetting;

class SetLandingStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'landing:stats 
                            {--students= : Display value for Enrolled Students (e.g. 500+ or 89)}
                            {--lecturers= : Display value for Expert Lecturers (e.g. 25+ or 18)}
                            {--departments= : Display value for Departments / Programs (e.g. 4 or 2)}
                            {--reset : Reset to live database counts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set or reset showcase statistics displayed on the public landing page';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $institution = InstitutionSetting::current();
        if (!$institution) {
            $this->error('No InstitutionSetting record found.');
            return Command::FAILURE;
        }

        $settings = $institution->settings ?? [];

        if ($this->option('reset')) {
            unset($settings['landing_stats']);
            $institution->update(['settings' => $settings]);
            InstitutionSetting::clearCache();
            $this->info('✓ Landing page stats reset to live database counts.');
            return Command::SUCCESS;
        }

        $students    = $this->option('students');
        $lecturers   = $this->option('lecturers');
        $departments = $this->option('departments');

        if (!$students && !$lecturers && !$departments) {
            $current = $settings['landing_stats'] ?? null;
            $this->line('Current landing stats:');
            if ($current) {
                $this->line('  Enrolled Students: ' . ($current['students'] ?? 'live'));
                $this->line('  Expert Lecturers:  ' . ($current['lecturers'] ?? 'live'));
                $this->line('  Departments:       ' . ($current['departments'] ?? 'live'));
            } else {
                $this->line('  Using live database counts (no custom override configured).');
            }
            $this->line('');
            $this->line('To customize, run: php artisan landing:stats --students=500+ --lecturers=25+ --departments=4');
            $this->line('To reset to live DB counts, run: php artisan landing:stats --reset');
            return Command::SUCCESS;
        }

        $landingStats = $settings['landing_stats'] ?? [];
        if ($students !== null) {
            $landingStats['students'] = $students;
        }
        if ($lecturers !== null) {
            $landingStats['lecturers'] = $lecturers;
        }
        if ($departments !== null) {
            $landingStats['departments'] = $departments;
        }

        $settings['landing_stats'] = $landingStats;
        $institution->update(['settings' => $settings]);
        InstitutionSetting::clearCache();

        $this->info('✓ Landing page stats updated successfully:');
        $this->line('  Enrolled Students: ' . ($landingStats['students'] ?? 'live'));
        $this->line('  Expert Lecturers:  ' . ($landingStats['lecturers'] ?? 'live'));
        $this->line('  Departments:       ' . ($landingStats['departments'] ?? 'live'));

        return Command::SUCCESS;
    }
}
