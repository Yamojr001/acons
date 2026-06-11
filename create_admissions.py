import os
from datetime import datetime

timestamp = datetime.now().strftime('%Y_%m_%d_%H%M%S')
migration_filename = f"{timestamp}_create_admissions_tables.php"
migration_path = os.path.join('database/migrations', migration_filename)

content = """<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('fields');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_form_id')->constrained('admission_forms')->cascadeOnDelete();
            $table->string('applicant_name');
            $table->string('applicant_email');
            $table->json('data');
            $table->enum('status', ['pending', 'under_review', 'accepted', 'rejected'])->default('pending');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
        Schema::dropIfExists('admission_forms');
    }
};
"""

with open(migration_path, 'w') as f:
    f.write(content)
print(f"Created migration: {migration_path}")
