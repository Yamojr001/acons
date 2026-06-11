import os
import re

directories = [
    'app/Http/Controllers/School',
    'app/Http/Controllers/Teacher',
    'app/Http/Controllers/Student',
    'app/Http/Controllers/Parent',
    'app/Http/Controllers/Admin'
]

for d in directories:
    if not os.path.isdir(d):
        continue
    for filename in os.listdir(d):
        if filename.startswith('All') and filename.endswith('Controllers.php'):
            filepath = os.path.join(d, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Find the header (namespace and uses)
            # Looks for <?php namespace ... up to the first /* ──
            header_match = re.search(r'(<\?php.*?)(?=\s*/\* ──)', content, re.DOTALL)
            if not header_match:
                print(f"Skipping {filepath}, no header found")
                continue
                
            header = header_match.group(1).strip()
            
            # Split the file by the controller comments
            blocks = re.split(r'/\*\s*[─]+\s*([A-Za-z0-9_]+Controller)\s*[─]+\s*\*/', content)
            
            for i in range(1, len(blocks), 2):
                class_name = blocks[i].strip()
                class_body = blocks[i+1].strip()
                
                out_path = os.path.join(d, f"{class_name}.php")
                with open(out_path, 'w') as out_f:
                    out_f.write(f"{header}\n\nclass {class_name} {class_body.split('class ' + class_name, 1)[-1].strip()}\n")
                print(f"Created {out_path}")
            
            # Remove the mega controller
            os.remove(filepath)
            print(f"Removed {filepath}")
