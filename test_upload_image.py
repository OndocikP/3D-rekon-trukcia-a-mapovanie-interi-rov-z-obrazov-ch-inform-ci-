import requests
import json
from pathlib import Path
from PIL import Image
import io

# Vytvorím test obrázok
img = Image.new('RGB', (100, 100), color='red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test dáta
user_id = "5ab4c0d9-8598-4589-a0d0-e8d44be1ec9c"
project_id = "6f2c22b8-d8c6-4011-85b7-2f67d41712ed"
token = "Bearer token123"

# Upload image
url = f"http://localhost:8000/api/projects/{project_id}/upload-image"
headers = {
    "Authorization": token,
}
files = {
    "file": ("test_image.jpg", img_bytes, "image/jpeg")
}

print(f"🚀 Uploading image to {url}")
response = requests.post(url, headers=headers, files=files)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Skontroluj či súbor existuje
image_path = Path(f"d:/GitHub/3D-rekon-trukcia-a-mapovanie-interi-rov-z-obrazov-ch-inform-ci-/Back-end/routers/projects/{user_id}/{project_id}/images/test_image.jpg")
if image_path.exists():
    print(f"✅ File found at: {image_path}")
else:
    print(f"❌ File not found at: {image_path}")
