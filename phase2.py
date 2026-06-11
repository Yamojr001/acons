import os
import re
from datetime import datetime

# 1. Update Models
models_dir = 'app/Models'
for filename in os.listdir(models_dir):
    if not filename.endswith('.php'):
        continue
    
    filepath = os.path.join(models_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
        
    if 'use Illuminate\\Database\\Eloquent\\SoftDeletes;' not in content:
        content = re.sub(r'(namespace App\\Models;)', r'\1\n\nuse Illuminate\\Database\\Eloquent\\SoftDeletes;', content)
        
    if 'use SoftDeletes;' not in content:
        content = re.sub(r'(class [A-Za-z0-9_]+[^{]*\{)', r'\1\n    use SoftDeletes;', content, 1)
        
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Added SoftDeletes to {filename}")

# 2. Create Migration
timestamp = datetime.now().strftime('%Y_%m_%d_%H%M%S')
migration_filename = f"{timestamp}_add_soft_deletes_to_core_tables.php"
migration_path = os.path.join('database/migrations', migration_filename)

tables = [
    'tenants', 'users', 'teachers', 'class_rooms', 'students', 'guardians', 
    'subjects', 'attendances', 'exams', 'grades', 'fees', 'payments', 'announcements'
]

up_statements = "\n".join([f"        Schema::table('{t}', function (Blueprint $table) {{ $table->softDeletes(); }});" for t in tables])
down_statements = "\n".join([f"        Schema::table('{t}', function (Blueprint $table) {{ $table->dropSoftDeletes(); }});" for t in tables])

migration_content = f"""<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{{
    public function up(): void
    {{
{up_statements}
    }}

    public function down(): void
    {{
{down_statements}
    }}
}};
"""

with open(migration_path, 'w') as f:
    f.write(migration_content)
    
print(f"Created migration: {migration_path}")
