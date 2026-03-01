import re, subprocess

with open('buckets.txt', encoding='utf-16') as f:
    lines = f.readlines()

zips = []
for line in lines:
    line = line.strip()
    # Looking for lines like: 
    # 41221    2025-02-19T23:59:19Z gs://run-sources-.../...zip
    if line.startswith('gs://') or not line:
        continue
    
    parts = line.split()
    if len(parts) >= 3 and parts[-1].endswith('.zip'):
        size = parts[0]
        date = parts[1]
        url = parts[2]
        zips.append({'url': url, 'date': date})

# Sort newest first
zips.sort(key=lambda x: x['date'], reverse=True)

if len(zips) > 5:
    to_delete = zips[5:]
    print(f"Total zips: {len(zips)}. Keeping newest 5. Deleting {len(to_delete)}.")
    for z in to_delete:
        print(f"Deleting {z['url']}")
        subprocess.run(['gcloud.cmd', 'storage', 'rm', z['url'], '--quiet'])
else:
    print(f"Found {len(zips)} zips. No cleanup needed.")
