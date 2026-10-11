<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('broadcast_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('announcement_id')->constrained()->cascadeOnDelete();
            
            $table->string('recipient_type')->nullable();
            $table->unsignedBigInteger('recipient_id')->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_email')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->string('formatted_phone')->nullable();
            
            $table->string('sms_status')->default('pending')->index(); // pending, sent, failed, skipped
            $table->text('sms_error')->nullable();
            $table->string('sms_message_id')->nullable();
            $table->string('sms_batch_id')->nullable();
            $table->timestamp('sms_sent_at')->nullable();

            $table->string('email_status')->default('pending')->index(); // pending, sent, failed, skipped
            $table->text('email_error')->nullable();
            $table->timestamp('email_sent_at')->nullable();

            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'announcement_id']);
            $table->index(['announcement_id', 'sms_status']);
        });

        // Add summary columns to announcements table if not present
        Schema::table('announcements', function (Blueprint $table) {
            $table->unsignedInteger('total_recipients')->default(0)->after('send_sms');
            $table->unsignedInteger('sms_sent_count')->default(0)->after('total_recipients');
            $table->unsignedInteger('sms_failed_count')->default(0)->after('sms_sent_count');
            $table->unsignedInteger('email_sent_count')->default(0)->after('sms_failed_count');
            $table->unsignedInteger('email_failed_count')->default(0)->after('email_sent_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcast_recipients');
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn([
                'total_recipients',
                'sms_sent_count',
                'sms_failed_count',
                'email_sent_count',
                'email_failed_count',
            ]);
        });
    }
};
