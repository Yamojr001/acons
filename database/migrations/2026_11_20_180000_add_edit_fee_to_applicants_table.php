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
            $table->boolean('edit_fee_paid')->default(false)->after('acceptance_fee_paid_at');
            $table->decimal('edit_fee_amount', 10, 2)->default(2000.00)->after('edit_fee_paid');
            $table->string('edit_fee_reference')->nullable()->after('edit_fee_amount');
            $table->timestamp('edit_fee_paid_at')->nullable()->after('edit_fee_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn([
                'edit_fee_paid',
                'edit_fee_amount',
                'edit_fee_reference',
                'edit_fee_paid_at',
            ]);
        });
    }
};
