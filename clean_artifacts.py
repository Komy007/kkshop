import json, subprocess

with open('images.json', encoding='utf-16') as f:
    data = json.load(f)

# Sort by creation time descending (newest first)
data.sort(key=lambda x: x['createTime'], reverse=True)

# Keep the top 5 newest images to be safe, delete the rest
if len(data) > 5:
    to_delete = data[5:]
    print(f"Total images: {len(data)}. Keeping newest 5. Deleting {len(to_delete)} images.")
    
    for img in to_delete:
        image_uri = f"{img['package']}@{img['version']}"
        print(f"Deleting {image_uri}")
        subprocess.run([
            'gcloud.cmd', 'artifacts', 'docker', 'images', 'delete', 
            image_uri, '--quiet'
        ])
else:
    print(f"Only {len(data)} images found. No cleanup necessary.")
