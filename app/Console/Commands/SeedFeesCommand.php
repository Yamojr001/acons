<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\FeePaymentSeeder;

class SeedFeesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fees:seed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed all school fees, facilitation fee, hostel fee, and current session payment schedules';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting fee payment schedules seed...');
        
        $seeder = new FeePaymentSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        return Command::SUCCESS;
    }
}
