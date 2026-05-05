import os
from pathlib import Path

# Vytvor test 3D model
project_path = Path("d:/GitHub/3D-rekon-trukcia-a-mapovanie-interi-rov-z-obrazov-ch-inform-ci-/Back-end/routers/projects/5ab4c0d9-8598-4589-a0d0-e8d44be1ec9c/6f2c22b8-d8c6-4011-85b7-2f67d41712ed/3Dmodel")
project_path.mkdir(parents=True, exist_ok=True)

model_content = """# 3D Model
import numpy as np

class Model3D:
    def __init__(self, project_id):
        self.project_id = project_id
        self.vertices = np.array([
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ])
        self.faces = np.array([
            [0, 1, 2],
            [0, 1, 3],
            [0, 2, 3],
            [1, 2, 3]
        ])
    
    def to_dict(self):
        return {
            "project_id": self.project_id,
            "vertices": self.vertices.tolist(),
            "faces": self.faces.tolist()
        }
"""

model_file = project_path / "model.py"
with open(model_file, "w", encoding="utf-8") as f:
    f.write(model_content)

print(f"✅ Model vytvorený: {model_file}")
print(f"📄 Veľkosť: {model_file.stat().st_size} bytes")

# Testujem endpoint
import requests
import json

url = "http://localhost:8000/api/projects/6f2c22b8-d8c6-4011-85b7-2f67d41712ed/3d-model"
print(f"\n🚀 Testing endpoint: {url}")

response = requests.get(url)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\n✅ SUCCESS:")
    print(f"   Project ID: {data.get('project_id')}")
    print(f"   Model size: {data.get('model_size')} bytes")
    print(f"   Model content length: {len(data.get('model_content', ''))} chars")
    print(f"\n📄 Model content preview:")
    print(data.get('model_content')[:200] + "...")
else:
    print(f"\n❌ ERROR:")
    print(json.dumps(response.json(), indent=2))
