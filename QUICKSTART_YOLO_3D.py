#!/usr/bin/env python3
"""
YOLO 3D Annotator - Rýchly Štart
Najrýchlejší spôsob ako začať
"""

# ==============================================================================
# PRÍKLAD 1: Najjednoduche - spustit na konkretnom projekte
# ==============================================================================

from pathlib import Path
from yolo_3d_annotator import process_project_with_yolo_3d

# Cesta k tvojmu projektu
project_path = Path("d:/GitHub/3D-rekon-trukcia-a-mapovanie-interi-rov-z-obrazov-ch-inform-ci-/Back-end/projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8")

# Spusti!
success = process_project_with_yolo_3d(project_path)

if success:
    print("\n✅ Hotovo! Otvor si objects_3d.ply v Meshlab alebo Open3D")


# ==============================================================================
# PRÍKLAD 2: S vlastnými parametrami
# ==============================================================================

from pathlib import Path
from yolo_3d_annotator import process_project_with_yolo_3d

project_path = Path("projects/tvoj_projekt_id/workspace_id")

success = process_project_with_yolo_3d(
    project_dir=project_path,
    yolo_model="yolov8m.pt",           # Menší model = rýchlejší
    yolo_confidence=0.4,               # Nižšia confidence = viac detekció
    distance_estimate=1.5              # Odhad vzdialenosti v metroch
)


# ==============================================================================
# PRÍKLAD 3: Python API
# ==============================================================================

from pathlib import Path
from yolo_3d_annotator import YOLO3DAnnotator

project_path = Path("projects/tvoj_projekt_id/workspace_id")
images_dir = project_path / "images"

# Vytvor annotator
annotator = YOLO3DAnnotator(
    transforms_json_path=project_path / "processed" / "step1" / "transforms.json",
    images_dir=images_dir
)

# Spusti detekciu
objects = annotator.run_yolo_detection(
    yolo_model_path="yolov8l.pt",
    confidence_threshold=0.5
)

print(f"Detekované objekty: {objects}")

# Projektuj do 3D
sparse_pc = project_path / "processed" / "step1" / "sparse_pc.ply"
projected = annotator.project_detections_to_3d(sparse_pc, distance_estimate=2.0)

print(f"Projektovaných 3D bodov: {projected}")

# Ulož
output = project_path / "processed" / "step1" / "objects_3d.ply"
annotator.save_annotated_ply(output)

print(f"Uložené v: {output}")


# ==============================================================================
# PRÍKLAD 4: Integracia do main-generator.py
# ==============================================================================

"""
V main-generator.py najdi:

    if project.get('status') != "generated":
        print("🚀 Spúšťam 3D Generovanie...\\n")
        
        # Run Nerfstudio
        model_output = project_path + "/3Dmodel/model.ply"
        success = run_nerfstudio_reconstruction(...)

A pridaj za tým:

        if success:
            print(f"✅ Úspešné vytvorenie 3D modelu")
            
            # NOVÝ KÓD:
            from pathlib import Path
            from integrate_yolo_3d import integrate_yolo_3d_detection
            
            try:
                yolo_success = integrate_yolo_3d_detection(Path(project_path))
                if yolo_success:
                    print("✅ YOLO 3D detekcia hotová!")
            except Exception as e:
                print(f"⚠️  YOLO error: {e}")
"""


# ==============================================================================
# PRÍKLAD 5: Vizualizácia výsledkov
# ==============================================================================

import open3d as o3d
from pathlib import Path

# Načítaj PLY
ply_file = Path("projects/tvoj_projekt_id/workspace_id/processed/step1/objects_3d.ply")
pcd = o3d.io.read_point_cloud(str(ply_file))

print(f"Počet bodov: {len(pcd.points)}")
print(f"Farby: {'Áno' if pcd.has_colors() else 'Nie'}")

# Vizualizuj
o3d.visualization.draw_geometries([pcd])


# ==============================================================================
# PRÍKLAD 6: Porovnanie s originálnym sparse point cloudom
# ==============================================================================

import open3d as o3d
from pathlib import Path

project_path = Path("projects/tvoj_projekt_id/workspace_id")

# Načítaj obe point cloudy
sparse_pc = o3d.io.read_point_cloud(str(project_path / "processed/step1/sparse_pc.ply"))
objects_pc = o3d.io.read_point_cloud(str(project_path / "processed/step1/objects_3d.ply"))

print(f"Sparse point cloud: {len(sparse_pc.points)} bodov")
print(f"Detekované objekty: {len(objects_pc.points)} bodov")

# Vizualizuj obidve
o3d.visualization.draw_geometries([sparse_pc, objects_pc])


# ==============================================================================
# PRÍKLAD 7: Spustenie z terminalu
# ==============================================================================

"""
Modo 1: Priamo
--------------
cd Back-end
python yolo_3d_annotator.py projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8


Modo 2: Integracia
------------------
python integrate_yolo_3d.py projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8


Modo 3: Pres .env
-----------------
Nastav v .env:
    YOLO_MODEL=yolov8l.pt
    YOLO_CONFIDENCE=0.5
    YOLO_DISTANCE_ESTIMATE=2.0

Potom:
    python main-generator.py
"""


# ==============================================================================
# PRÍKLAD 8: Vlastné nastavenia
# ==============================================================================

"""
V .env súbore vytvor tieto premenné:

# YOLO Settings
YOLO_MODEL=yolov8l.pt              # l, m, s, x - viac x = presnejší ale pomalší
YOLO_CONFIDENCE=0.5                # 0.0-1.0, nižší = viac detekció
YOLO_DISTANCE_ESTIMATE=2.0         # Odhad vzdialenosti od kamery [m]
YOLO_USE_SPARSE_PC=true            # Používať sparse PC na odhad hĺbky

# Alternatívne (pre rýchlý test):
# YOLO_MODEL=yolov8s.pt
# YOLO_CONFIDENCE=0.3
# YOLO_DISTANCE_ESTIMATE=1.5

Potom v Python:
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    yolo_model = os.getenv("YOLO_MODEL", "yolov8l.pt")
    yolo_confidence = float(os.getenv("YOLO_CONFIDENCE", "0.5"))
"""


# ==============================================================================
# PRÍKLAD 9: Export výsledkov
# ==============================================================================

"""
Export do rôznych formátov:

PLY (originál):
    objects_3d.ply ← Direktne z YOLO 3D Annotatora


OBJ format (Meshlab/Blender):
    Otvor v Meshlab:
    1. File → Open
    2. Vyber objects_3d.ply
    3. File → Export As
    4. Vyber .obj format


GLTF format (Web, Three.js):
    import open3d as o3d
    
    pcd = o3d.io.read_point_cloud("objects_3d.ply")
    o3d.io.write_point_cloud("objects_3d.gltf", pcd)


CSV (data analysis):
    import open3d as o3d
    import pandas as pd
    
    pcd = o3d.io.read_point_cloud("objects_3d.ply")
    points = np.asarray(pcd.points)
    colors = np.asarray(pcd.colors)
    
    df = pd.DataFrame({
        'x': points[:, 0],
        'y': points[:, 1],
        'z': points[:, 2],
        'r': (colors[:, 0] * 255).astype(int),
        'g': (colors[:, 1] * 255).astype(int),
        'b': (colors[:, 2] * 255).astype(int)
    })
    df.to_csv("objects_3d.csv", index=False)
"""


# ==============================================================================
# PRÍKLAD 10: Troubleshooting
# ==============================================================================

"""
ISSUE: ImportError: No module named 'yolo_3d_annotator'
RIEŠENIE: Ujisti sa, že si v správnom priečinku (Back-end/)
          alebo pridaj cestu sys.path.insert(0, './Back-end')


ISSUE: No objects detected
RIEŠENIE: 
    - Zmeň YOLO_CONFIDENCE=0.3 (nižšia confidence)
    - Skontroluj či obrázky majú objekty
    - Skús model yolov8x.pt (presnejší)


ISSUE: CUDA out of memory
RIEŠENIE:
    - Zmeň YOLO_MODEL=yolov8s.pt (menší model)
    - Alebo YOLO_MODEL=yolov8m.pt


ISSUE: transforms.json not found
RIEŠENIE: Ujisti sa, že COLMAP processing skončilo
          Skontroluj: processed/step1/transforms.json


ISSUE: Slow performance
RIEŠENIE:
    - Použij menší model (s, m namiesto l, x)
    - Zvýš YOLO_CONFIDENCE (menej detekció)
    - Zmeň YOLO_DISTANCE_ESTIMATE na vyššiu hodnotu
"""


# ==============================================================================
# PRÍKLAD 11: Performance monitoring
# ==============================================================================

import time
from pathlib import Path
from yolo_3d_annotator import YOLO3DAnnotator

project_path = Path("projects/tvoj_projekt_id/workspace_id")

start_time = time.time()

annotator = YOLO3DAnnotator(
    transforms_json_path=project_path / "processed" / "step1" / "transforms.json",
    images_dir=project_path / "images"
)

elapsed_load = time.time() - start_time
print(f"⏱️  Načítanie: {elapsed_load:.2f}s")

# Detekcia
start_time = time.time()
objects = annotator.run_yolo_detection("yolov8l.pt", 0.5)
elapsed_yolo = time.time() - start_time
print(f"⏱️  YOLO detekcia: {elapsed_yolo:.2f}s")

# Projekcia
start_time = time.time()
projected = annotator.project_detections_to_3d(
    project_path / "processed" / "step1" / "sparse_pc.ply", 
    2.0
)
elapsed_project = time.time() - start_time
print(f"⏱️  3D Projekcia: {elapsed_project:.2f}s")

# Zápis
start_time = time.time()
output = project_path / "processed" / "step1" / "objects_3d.ply"
annotator.save_annotated_ply(output)
elapsed_save = time.time() - start_time
print(f"⏱️  Zápis PLY: {elapsed_save:.2f}s")

print(f"\n📊 TOTAL: {elapsed_load + elapsed_yolo + elapsed_project + elapsed_save:.2f}s")


# ==============================================================================
# PRÍKLAD 12: Filter podľa triedy objektu
# ==============================================================================

"""
Ak chceš filtrovat len určité objekty (napr. len osoby):

from yolo_3d_annotator import YOLO3DAnnotator
import numpy as np

annotator = YOLO3DAnnotator(...)
annotator.run_yolo_detection(...)
annotator.project_detections_to_3d(...)

# Filter len 'person'
person_indices = [i for i, cls in enumerate(annotator.object_classes) 
                   if cls.lower() == 'person']

# Vytvor nové zoznamy
filtered_points = [annotator.object_points_3d[i] for i in person_indices]
filtered_colors = [annotator.object_colors[i] for i in person_indices]

# Alebo ulož len specific objekty
annotator.object_points_3d = filtered_points
annotator.object_colors = filtered_colors
annotator.save_annotated_ply(Path("persons_only.ply"))
"""


print("\n✅ Rýchly štart gotový! Vyberi si príklad vyššie a spusti ho!")
