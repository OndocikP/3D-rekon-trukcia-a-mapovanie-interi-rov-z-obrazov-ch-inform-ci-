import requests
import json
from pathlib import Path
from PIL import Image
import io

# Test dáta
user_id = "5ab4c0d9-8598-4589-a0d0-e8d44be1ec9c"
project_id = "6f2c22b8-d8c6-4011-85b7-2f67d41712ed"
token = "Bearer token123"

print("📸 TESTOVANIE UPLOAD S PHOTOS_COUNT")
print(f"Project ID: {project_id}\n")

# Nahraj 3 obrázky
for i in range(1, 4):
    print(f"\n[{i}/3] Uploading image-{i}.jpg...")
    
    # Vytvorím test obrázok
    img = Image.new('RGB', (100, 100), color=['red', 'green', 'blue'][i-1])
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)

    url = f"http://localhost:8000/api/projects/{project_id}/upload-image"
    headers = {
        "Authorization": token,
    }
    files = {
        "file": (f"image-{i}.jpg", img_bytes, "image/jpeg")
    }

    response = requests.post(url, headers=headers, files=files)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Status: {response.status_code}")
        print(f"   📊 Photos count: {data.get('photos_count')}")
        print(f"   📝 Filename: {data.get('filename')}")
    else:
        print(f"   ❌ Status: {response.status_code}")
        print(f"   Error: {response.json()}")

print("\n✅ Hotovo!")
