<?php

use Illuminate\Support\Facades\Schedule;

// Mark overdue fees every day at 1 AM
Schedule::command('fees:mark-overdue')->dailyAt('01:00');

// Send low attendance alerts every Monday at 8 AM
Schedule::command('attendance:send-alerts --threshold=75')->weeklyOn(1, '08:00');

// Prune old activity logs monthly
Schedule::command('activitylog:clean --days=90')->monthly();
