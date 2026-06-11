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
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            
            // Auth / Identifiers
            $table->string('jamb_number')->unique();
            $table->string('password'); // Will be hashed phone_number initially
            
            // Personal Data
            $table->string('full_name');
            $table->date('dob');
            $table->string('place_of_birth');
            $table->string('lga');
            $table->string('state_of_origin');
            $table->string('nationality')->default('Nigeria');
            $table->string('email')->nullable();
            $table->text('contact_address');
            $table->string('phone_number');
            $table->string('sex');
            $table->string('next_of_kin_name');
            $table->text('next_of_kin_address');
            $table->string('physical_disabilities')->nullable();
            $table->string('highest_qualification')->nullable();
            $table->integer('jamb_score');

            // Schools Attended
            $table->string('primary_school_name')->nullable();
            $table->string('primary_school_from')->nullable();
            $table->string('primary_school_to')->nullable();
            $table->string('secondary_school_name')->nullable();
            $table->string('secondary_school_from')->nullable();
            $table->string('secondary_school_to')->nullable();
            $table->string('tertiary_school_name')->nullable();
            $table->string('tertiary_school_from')->nullable();
            $table->string('tertiary_school_to')->nullable();

            // O'Levels (Sittings 1 & 2)
            $table->string('first_sitting_type')->nullable(); // WAEC, NECO, etc.
            $table->string('first_sitting_year')->nullable();
            $table->string('first_sitting_no')->nullable();
            $table->json('first_sitting_grades')->nullable(); // Subject/Grade map
            $table->string('second_sitting_type')->nullable();
            $table->string('second_sitting_year')->nullable();
            $table->string('second_sitting_no')->nullable();
            $table->json('second_sitting_grades')->nullable();

            // Parent & Guardian Details
            $table->string('parent_name')->nullable();
            $table->text('parent_address')->nullable();
            $table->string('parent_phone')->nullable();
            $table->text('sponsor_name_address')->nullable();

            // Payment and Admission Clearance
            $table->string('payment_status')->default('pending'); // pending, paid
            $table->string('payment_reference')->nullable();
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            
            $table->string('admission_status')->default('pending'); // pending, under_review, admitted, rejected
            $table->foreignId('admitted_program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->text('remarks')->nullable();
            
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};
