<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Core Tenant & Users
        Schema::create('tenants', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('subdomain')->unique(); $t->string('custom_domain')->nullable()->unique();
            $t->boolean('custom_domain_verified')->default(false); $t->string('domain_verification_token')->nullable();
            $t->string('logo_path')->nullable(); $t->string('favicon_path')->nullable();
            $t->string('primary_color')->default('#6366f1'); $t->string('secondary_color')->default('#10b981');
            $t->string('tagline')->nullable(); $t->string('phone')->nullable(); $t->string('email')->nullable(); $t->text('address')->nullable();
            $t->enum('billing_type', ['per_institution', 'per_faculty', 'per_student'])->default('per_institution');
            $t->decimal('billing_amount', 10, 2)->default(0); 
            $t->integer('max_students')->nullable();
            $t->enum('billing_payer', ['institution', 'student'])->default('institution');
            $t->timestamp('subscription_expires_at')->nullable(); $t->boolean('is_active')->default(true);
            $t->json('settings')->nullable(); // Dynamic features (CGPA scale, Remita keys, etc)
            $t->timestamps(); $t->softDeletes();
            $t->index('subdomain'); $t->index('is_active');
        });

        Schema::create('users', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->string('name'); $t->string('email'); $t->string('password');
            $t->string('phone')->nullable(); $t->string('avatar')->nullable();
            $t->boolean('is_active')->default(true); $t->timestamp('email_verified_at')->nullable();
            $t->rememberToken(); $t->timestamps(); $t->softDeletes();
            $t->unique(['tenant_id','email']); $t->index(['tenant_id','is_active']);
        });

        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary(); $t->foreignId('user_id')->nullable()->index();
            $t->string('ip_address',45)->nullable(); $t->text('user_agent')->nullable();
            $t->longText('payload'); $t->integer('last_activity')->index();
        });

        Schema::create('password_reset_tokens', function (Blueprint $t) {
            $t->string('email')->primary(); $t->string('token'); $t->timestamp('created_at')->nullable();
        });

        // Academic Structure
        Schema::create('academic_sessions', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->string('name'); // e.g. 2023/2024
            $t->date('start_date'); $t->date('end_date');
            $t->boolean('is_current')->default(false);
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        Schema::create('semesters', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $t->string('name'); $t->enum('type', ['first', 'second']);
            $t->date('start_date')->nullable(); $t->date('end_date')->nullable();
            $t->boolean('is_current')->default(false);
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        Schema::create('faculties', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->string('name'); $t->string('code')->nullable();
            $t->foreignId('dean_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        Schema::create('departments', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $t->string('name'); $t->string('code')->nullable();
            $t->foreignId('hod_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        Schema::create('programs', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->constrained()->cascadeOnDelete();
            $t->string('name'); // e.g. B.Sc Computer Science
            $t->string('degree_type'); // B.Sc, B.A, HND, ND
            $t->integer('duration_years')->default(4);
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        // Staff & Students
        Schema::create('lecturers', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->constrained()->cascadeOnDelete();
            $t->string('employee_id'); $t->date('hire_date'); $t->string('qualification')->nullable();
            
            // Bio-data
            $t->date('date_of_birth')->nullable();
            $t->enum('gender',['male','female','other'])->nullable();
            $t->string('phone_number')->nullable();
            $t->text('address')->nullable();
            $t->string('nationality')->default('Nigerian');
            $t->string('state_of_origin')->nullable();
            $t->string('lga')->nullable();

            // Medical
            $t->string('blood_group')->nullable();
            $t->string('genotype')->nullable();
            $t->text('allergies')->nullable();

            // Next of Kin / Parental
            $t->string('next_of_kin_name')->nullable();
            $t->string('next_of_kin_relationship')->nullable();
            $t->string('next_of_kin_phone')->nullable();
            $t->string('next_of_kin_email')->nullable();
            $t->text('next_of_kin_address')->nullable();

            $t->enum('status', ['active', 'suspended', 'on_leave', 'sabbatical'])->default('active');
            $t->timestamps(); $t->softDeletes();
            $t->unique(['tenant_id','employee_id']); $t->index('tenant_id');
        });

        Schema::create('students', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->constrained()->restrictOnDelete();
            $t->foreignId('program_id')->constrained()->restrictOnDelete();
            $t->string('matriculation_number')->unique(); $t->string('jamb_registration_number')->nullable();
            $t->string('current_level'); // 100, 200, ND1, etc
            $t->date('date_of_birth');
            $t->enum('gender',['male','female','other']);
            $t->string('phone_number')->nullable();
            $t->text('address')->nullable();
            $t->string('nationality')->default('Nigerian');
            $t->string('state_of_origin')->nullable();
            $t->string('lga')->nullable();

            // Medical
            $t->string('blood_group')->nullable();
            $t->string('genotype')->nullable();
            $t->text('allergies')->nullable();

            // Next of Kin / Parental
            $t->string('next_of_kin_name')->nullable();
            $t->string('next_of_kin_relationship')->nullable();
            $t->string('next_of_kin_phone')->nullable();
            $t->string('next_of_kin_email')->nullable();
            $t->text('next_of_kin_address')->nullable();

            $t->enum('status',['active','graduated','suspended','withdrawn'])->default('active');
            $t->timestamps(); $t->softDeletes();
            $t->index(['tenant_id','department_id']); $t->index(['tenant_id','status']);
        });

        // Courses & Registrations
        Schema::create('courses', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lecturer_id')->nullable()->constrained('lecturers')->nullOnDelete();
            $t->string('name'); $t->string('code'); // e.g. MTH101
            $t->integer('credit_units');
            $t->string('level'); // 100, 200
            $t->enum('semester_type', ['first', 'second', 'both']);
            $t->enum('type', ['core', 'elective']);
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id'); $t->unique(['tenant_id', 'code']);
        });

        Schema::create('course_prerequisites', function (Blueprint $t) {
            $t->foreignId('course_id')->constrained()->cascadeOnDelete();
            $t->foreignId('prerequisite_course_id')->constrained('courses')->cascadeOnDelete();
            $t->primary(['course_id', 'prerequisite_course_id']);
        });

        Schema::create('course_registrations', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $t->foreignId('course_id')->constrained()->cascadeOnDelete();
            $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $t->boolean('is_carryover')->default(false);
            $t->timestamps(); $t->softDeletes(); $t->unique(['student_id', 'semester_id', 'course_id']);
        });

        // Results Engine
        Schema::create('grades', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('course_registration_id')->constrained()->cascadeOnDelete();
            $t->decimal('ca_score', 5, 2)->nullable();
            $t->decimal('exam_score', 5, 2)->nullable();
            $t->decimal('total_score', 5, 2)->nullable();
            $t->boolean('is_absent')->default(false);
            $t->string('grade_letter')->nullable(); // A, B, C...
            $t->decimal('grade_points', 4, 2)->nullable(); // 5.0, 4.0...
            $t->enum('approval_status', ['draft', 'hod_approved', 'dean_approved', 'senate_approved'])->default('draft');
            $t->timestamps(); $t->softDeletes();
        });

        Schema::create('academic_records', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $t->decimal('gpa', 5, 2)->nullable();
            $t->decimal('cgpa', 5, 2)->nullable();
            $t->integer('total_credit_units_registered')->default(0);
            $t->integer('total_credit_units_earned')->default(0);
            $t->timestamps(); $t->softDeletes(); $t->unique(['student_id', 'semester_id']);
        });

        // Finance
        Schema::create('fees', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->cascadeOnDelete();
            $t->string('level')->nullable();
            $t->string('name'); // e.g. Acceptance Fee, Tuition
            $t->enum('fee_type', ['tuition', 'acceptance', 'dues', 'hostel', 'departmental', 'other'])->default('tuition');
            $t->decimal('amount', 12, 2);
            $t->timestamps(); $t->softDeletes(); $t->index('tenant_id');
        });

        Schema::create('student_invoices', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('fee_id')->constrained()->cascadeOnDelete();
            $t->decimal('amount_due', 12, 2);
            $t->decimal('amount_paid', 12, 2)->default(0);
            $t->enum('status', ['pending', 'partial', 'paid'])->default('pending');
            $t->timestamps(); $t->softDeletes();
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('student_invoice_id')->constrained()->cascadeOnDelete();
            $t->decimal('amount', 12, 2); 
            $t->string('reference')->unique(); // For Remita RRR or Paystack Ref
            $t->string('payment_gateway'); // remita, paystack, monnify
            $t->enum('status', ['pending', 'successful', 'failed', 'refunded']); 
            $t->json('metadata')->nullable(); 
            $t->timestamps(); $t->softDeletes();
            $t->index(['tenant_id','status']); $t->index(['tenant_id','created_at']);
        });

        // Communication & Logs
        Schema::create('announcements', function (Blueprint $t) {
            $t->id(); $t->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $t->foreignId('created_by')->constrained('users');
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title'); $t->text('body'); $t->enum('audience', ['all', 'lecturers', 'students', 'course_students']);
            $t->boolean('send_email')->default(false); $t->boolean('send_sms')->default(false);
            $t->timestamp('published_at')->nullable(); $t->timestamps(); $t->softDeletes();
            $t->index(['tenant_id','audience']);
        });

        Schema::create('activity_log', function (Blueprint $t) {
            $t->id(); $t->string('log_name')->nullable()->index(); $t->text('description');
            $t->nullableMorphs('subject','subject'); $t->nullableMorphs('causer','causer');
            $t->json('properties')->nullable(); $t->uuid('batch_uuid')->nullable(); $t->timestamps(); $t->softDeletes();
        });
    }

    public function down(): void {
        Schema::dropIfExists('activity_log'); Schema::dropIfExists('announcements'); 
        Schema::dropIfExists('payments'); Schema::dropIfExists('student_invoices'); Schema::dropIfExists('fees'); 
        Schema::dropIfExists('academic_records'); Schema::dropIfExists('grades'); 
        Schema::dropIfExists('course_registrations'); Schema::dropIfExists('course_prerequisites'); Schema::dropIfExists('courses'); 
        Schema::dropIfExists('students'); Schema::dropIfExists('lecturers'); 
        Schema::dropIfExists('programs'); Schema::dropIfExists('departments'); Schema::dropIfExists('faculties'); 
        Schema::dropIfExists('semesters'); Schema::dropIfExists('academic_sessions');
        Schema::dropIfExists('password_reset_tokens'); Schema::dropIfExists('sessions'); Schema::dropIfExists('users'); Schema::dropIfExists('tenants');
    }
};
