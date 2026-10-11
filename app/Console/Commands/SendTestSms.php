<?php

namespace App\Console\Commands;

use App\Services\SmsService;
use Illuminate\Console\Command;

class SendTestSms extends Command
{
    protected $signature = 'sms:send {phone : The destination phone number (e.g. 08012345678)} {message? : The test message to send}';
    protected $description = 'Send a test transactional SMS via Sendar Messaging API';

    public function handle(SmsService $sms): int
    {
        $phone = $this->argument('phone');
        $message = $this->argument('message') ?: 'Hello! This is a test transactional SMS from ACONS via Sendar.';

        $formatted = $sms->formatPhoneNumber($phone);
        $this->info("Sending SMS to: {$phone} (formatted: {$formatted})");
        $this->line("Message: {$message}");

        $result = $sms->send($phone, $message);

        if ($result['success'] ?? false) {
            $this->info("✓ SMS successfully dispatched!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['Batch ID', $result['batch_id'] ?? 'N/A'],
                    ['Queued', $result['queued'] ?? 'N/A'],
                    ['Total', $result['total'] ?? 'N/A'],
                ]
            );
            return Command::SUCCESS;
        }

        $this->error("✗ SMS dispatch failed: " . ($result['error'] ?? 'Unknown error'));
        if (!empty($result['status'])) {
            $this->line("HTTP Status: " . $result['status']);
        }

        return Command::FAILURE;
    }
}
