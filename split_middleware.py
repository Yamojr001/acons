import os
import re

filepath = 'app/Http/Middleware/AllMiddleware.php'
d = 'app/Http/Middleware'

with open(filepath, 'r') as f:
    content = f.read()

# Grab header (namespaces and uses)
header_match = re.search(r'(<\?php.*?)(?=// ──)', content, re.DOTALL)
header = header_match.group(1).strip() if header_match else "<?php\nnamespace App\\Http\\Middleware;\n"

blocks = re.split(r'//\s*[─]+\s*class\s+([A-Za-z0-9_]+)', content)
# Ensure we map properly
for i in range(1, len(blocks), 2):
    class_name = blocks[i].strip()
    class_body = blocks[i+1]
    
    # Extract just the class body part until the next separator
    body_match = re.match(r'(.*?)(?=(?://\s*─|$))', class_body, re.DOTALL)
    if body_match:
        class_content = body_match.group(1).strip()
        
        out_path = os.path.join(d, f"{class_name}.php")
        with open(out_path, 'w') as out_f:
            out_f.write(f"{header}\n\nclass {class_name} {class_content}\n")
        print(f"Created {out_path}")

os.remove(filepath)
print(f"Removed {filepath}")
