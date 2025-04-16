import os
import json

input_folder = 'listing'
output_file = 'listing/merged_listings.json'

merged = []

for filename in os.listdir(input_folder):
    if filename.endswith('.json'):
        file_path = os.path.join(input_folder, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    merged.extend(data)  # add all items from list
                else:
                    merged.append(data)  # add single object
            except json.JSONDecodeError as e:
                print(f"❌ Error reading {filename}: {e}")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print(f"✅ Merged {len(merged)} records into '{output_file}'")
