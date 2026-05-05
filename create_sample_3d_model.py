#!/usr/bin/env python3
"""
Script to create a sample 3D model (simple cube) in PLY format
This helps test the 3D viewer without needing a full photogrammetry pipeline
"""

import sys
import os
from pathlib import Path

# Get the project directory from command line or use the one from the UI
project_user_id = input("Enter User ID (from your project path): ").strip()
project_id = input("Enter Project ID (from your project path): ").strip()

# Create the directory structure
backend_path = Path(__file__).parent / "Back-end"
projects_dir = backend_path / "projects" / project_user_id / project_id / "3Dmodel"
projects_dir.mkdir(parents=True, exist_ok=True)

model_file = projects_dir / "model.ply"

# Create a simple cube PLY model
ply_content = """ply
format ascii 1.0
element vertex 8
property float x
property float y
property float z
property float nx
property float ny
property float nz
end_header
-1 -1 -1 -0.577 -0.577 -0.577
1 -1 -1 0.577 -0.577 -0.577
1 1 -1 0.577 0.577 -0.577
-1 1 -1 -0.577 0.577 -0.577
-1 -1 1 -0.577 -0.577 0.577
1 -1 1 0.577 -0.577 0.577
1 1 1 0.577 0.577 0.577
-1 1 1 -0.577 0.577 0.577
"""

with open(model_file, 'w') as f:
    f.write(ply_content)

print(f"\n✅ Sample 3D model created successfully!")
print(f"📁 Location: {model_file}")
print(f"📊 Size: {model_file.stat().st_size} bytes")
print(f"\nNow refresh your app to see the 3D cube displayed!")
