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
        Schema::table('applicants', function (Blueprint $table) {
            $table->boolean('acceptance_fee_paid')->default(false)->after('amount_paid');
            $table->decimal('acceptance_fee_amount', 10, 2)->default(10000.00)->after('acceptance_fee_paid');
            $table->string('acceptance_fee_reference')->nullable()->after('acceptance_fee_amount');
            $table->timestamp('acceptance_fee_paid_at')->nullable()->after('acceptance_fee_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn([
                'acceptance_fee_paid',
                'acceptance_fee_amount',
                'acceptance_fee_reference',
                'acceptance_fee_paid_at',
            ]);
        });
    }
};
