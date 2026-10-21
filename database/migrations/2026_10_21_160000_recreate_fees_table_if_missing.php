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
        if (!Schema::hasTable('fees')) {
            Schema::create('fees', function (Blueprint $t) {
                $t->id();
                $t->foreignId('academic_session_id')->nullable()->constrained()->cascadeOnDelete();
                $t->foreignId('department_id')->nullable()->constrained()->cascadeOnDelete();
                $t->string('level')->nullable();
                $t->string('name');
                $t->enum('fee_type', ['tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'registration', 'facilitation', 'other'])->default('tuition');
                $t->decimal('amount', 12, 2);
                $t->json('metadata')->nullable();
                $t->timestamps();
                $t->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down: do not drop table if it contains data
    }
};
