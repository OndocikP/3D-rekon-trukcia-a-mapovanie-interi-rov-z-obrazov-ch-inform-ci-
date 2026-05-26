#!/usr/bin/env python3
"""
PRÍKLAD: Ako integrovat YOLO 3D Annotator do main-generator.py

Tento file ukazuje ako połmodification existujúceho main-generator.py
aby automaticky spustil YOLO 3D detekciu po COLMAP procese.
"""

# ============================================================================
# KROK 1: Přidej import na začiatok main-generator.py
# ============================================================================

"""
Pridaj týchto importov na začiatok:

from integrate_yolo_3d import integrate_yolo_3d_detection
from pathlib import Path
"""


# ============================================================================
# KROK 2: Modifikuj funkciu spracuj_projekt()
# ============================================================================

"""
V existujúcej spracuj_projekt() funkcii, po tomto bloky:

    if project.get('status') != "generated":
        print("🚀 Spúšťam 3D Generovanie...\\n")
        
        # Run Nerfstudio
        model_output = project_path + "/3Dmodel/model.ply"
        success = run_nerfstudio_reconstruction(...)

PRIDAJ NOVÝ BLOK:

"""


def example_modified_spracuj_projekt():
    """
    PRÍKLAD upravené spracuj_projekt s YOLO 3D integráciou
    """
    
    # ... existujúci kód ...
    
    if project.get('status') != "generated":
        print("🚀 Spúšťam 3D Generovanie...\\n")
        
        # STEP 1: COLMAP Processing (už existuje)
        model_output = project_path + "/3Dmodel/model.ply"
        success = run_nerfstudio_reconstruction(
            project_path + "/images", 
            model_output, 
            project.get('status'), 
            project_id
        )
        
        if success:
            print(f"✅ Úspešné vytvorenie 3D modelu")
            
            # ===== NOVÝ KÓD: STEP 1.5 YOLO 3D Detection =====
            
            print("\n" + "="*70)
            print("🎯 STEP 1.5: YOLO 3D Object Detection")
            print("="*70 + "\n")
            
            try:
                project_dir = Path(project_path)
                
                # Spusti YOLO 3D detekciu
                yolo_success = integrate_yolo_3d_detection(project_dir)
                
                if yolo_success:
                    print("✅ YOLO 3D detekcia dokončená!")
                    print("   Objekty sú uložené v: objects_3d.ply")
                else:
                    print("⚠️  YOLO detekcia bola ukončená bez výsledkov")
                    print("   Pokračujem bez objektov")
                
            except Exception as e:
                print(f"⚠️  Chyba pri YOLO 3D detekcii: {e}")
                print("   Pokračujem bez objektov")
            
            # ===== KONIEC NOVÉHO KÓDU =====
            
        else:
            print(f"❌ Chyba pri vytváraní 3D modelu\\n")
            increment_project_try(project_id, project.get('try') or 0)


# ============================================================================
# KROK 3: Príklady konfigurácie
# ============================================================================

"""
V .env súbore pridaj tieto konfigúrácie:

# YOLO 3D Settings
YOLO_MODEL=yolov8l.pt
YOLO_CONFIDENCE=0.5
YOLO_DISTANCE_ESTIMATE=2.0

Alebo v environment premenných:
export YOLO_MODEL=yolov8l.pt
export YOLO_CONFIDENCE=0.5
export YOLO_DISTANCE_ESTIMATE=2.0
"""


# ============================================================================
# KROK 4: Spôsoby používania
# ============================================================================

"""
SPÔSOB A: Automaticky po spustení main-generator
=========================================
python main-generator.py

Systém automaticky:
1. Nájde pending projekt
2. Spustí COLMAP (ns-process-data)
3. Spustí YOLO 3D detekciu ← NOVÝ
4. Spustí NeRF trénink (ns-train)
5. Uloží výsledky do Supabase


SPÔSOB B: Ručne pre konkrétny projekt
=======================================
from pathlib import Path
from integrate_yolo_3d import integrate_yolo_3d_detection

project_dir = Path("projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8")
integrate_yolo_3d_detection(project_dir)


SPÔSOB C: V separátnom procese
================================
python integrate_yolo_3d.py projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8
"""


# ============================================================================
# KROK 5: Výstupy a ich umiestnenie
# ============================================================================

"""
Po spustení sa v projekte vytvorí:

projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8/
├── images/
│   ├── frame_00001.jpg
│   ├── frame_00002.jpg
│   └── ...
│
├── processed/
│   └── step1/
│       ├── transforms.json          (COLMAP)
│       ├── sparse_pc.ply            (Sparse point cloud)
│       ├── objects_3d.ply           ← NOVÝ! (YOLO 3D annotations)
│       ├── config.yml
│       └── ...
│
├── 3Dmodel/
│   ├── model.ply
│   └── ...
│
└── ...

FILES:
------
objects_3d.ply:
  • 3D body detekovaných objektov
  • RGB farby (podľa triedy objektu)
  • Confidence skóre
  • Otvoriteľný v: Meshlab, Open3D, NeRFStudio viewer

Príklad obsahu:
  ply
  format ascii 1.0
  element vertex 1234
  property float x
  property float y
  property float z
  property uchar red
  property uchar green
  property uchar blue
  property float confidence
  end_header
  
  1.234 5.678 9.012 0 255 0 0.95      # Osoba (zelená)
  2.345 6.789 8.901 255 0 0 0.87      # Posteľ (modrá)
  ...
"""


# ============================================================================
# KROK 6: Monitorovanie a logging
# ============================================================================

"""
Logovanie sa automaticky tlačí:

🎯 STEP 1.5: YOLO 3D Object Detection & Annotation
====================================================

📁 Projekt: projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8
🎯 YOLO Model: yolov8l.pt
🔍 Confidence: 0.5
📏 Distance estimate: 2.0m
🗂️  Sparse PC: ✅ Nájdený

🤖 Spúšťam YOLO detekciu...
   Model: yolov8l.pt
   Threshold: 0.5

   ⏳ Spracovaných 10/389 obrázkov
   ⏳ Spracovaných 20/389 obrázkov
   ...

   ✅ YOLO detekcia ukončená!
   Počet detekovaných objektov:
      • person: 245
      • bed: 42
      • chair: 187
      • table: 89
      • monitor: 34

🎯 Projektujem detekcie do 3D priestoru...
   📦 Načítavam sparse point cloud: ...
      Počet bodov: 45892
   ✅ Projektovaných bodov: 597

💾 Ukladám annotovaný PLY: ...
   ✅ Uložených bodov: 597
      📍 projects/.../objects_3d.ply

============================================================
✅ Hotovo!
============================================================

Objekty sú teraz v: objects_3d.ply
Môžeš si ich pozrieť v NeRFStudio vieweri
"""


# ============================================================================
# KROK 7: Troubleshooting
# ============================================================================

"""
PROBLÉM: "ModuleNotFoundError: No module named 'yolo_3d_annotator'"
RIEŠENIE: Ujisti sa, že yolo_3d_annotator.py je v Back-end/ priečinku


PROBLÉM: "ultralytics is not installed"
RIEŠENIE: pip install ultralytics


PROBLÉM: "CUDA memory error"
RIEŠENIE: Zmeň na menší model v .env
  YOLO_MODEL=yolov8m.pt  # alebo yolov8s.pt


PROBLÉM: "No objects detected"
RIEŠENIE: Zmeň YOLO_CONFIDENCE na nižšiu hodnotu:
  YOLO_CONFIDENCE=0.3


PROBLÉM: "transforms.json not found"
RIEŠENIE: Ujisti sa, že COLMAP processing (step 1) skončil úspešne
"""


# ============================================================================
# KROK 8: Performance očakávania
# ============================================================================

"""
Časy spustenia (priemery):

Projekt s 100 obrázkami:
  • YOLO detekcia:    ~1-2 minúty
  • 3D Projekcia:     ~10-30 sekúnd
  • PLY Zápis:        ~1-2 sekundy
  TOTAL:              ~2-3 minúty

Projekt s 389 obrázkami:
  • YOLO detekcia:    ~5-10 minút
  • 3D Projekcia:     ~30-60 sekúnd
  • PLY Zápis:        ~2-5 sekúnd
  TOTAL:              ~6-12 minút

Pamäť:
  • GPU (CUDA):       2-4 GB
  • CPU (CPU mode):   4-8 GB
"""


# ============================================================================
# KROK 9: Vizualizácia výsledkov
# ============================================================================

"""
VIZUALIZÁCIA 1: NeRFStudio viewer
==================================
ns-viewer --load-config projects/.../processed/step1/config.yml

V viewer:
1. Klikni na "Open" v menu
2. Načítaj "objects_3d.ply"
3. Uvidíš farebne označené objekty v 3D priestore


VIZUALIZÁCIA 2: Python (Open3D)
================================
import open3d as o3d

pcd = o3d.io.read_point_cloud("objects_3d.ply")
o3d.visualization.draw_geometries([pcd])


VIZUALIZÁCIA 3: Meshlab
========================
1. Otvor Meshlab
2. File → Open Project
3. Vyber "objects_3d.ply"
4. Nastavenia: Render → Render Mode → Dots
"""


# ============================================================================
# PRÍKLAD KOMPLETNÉHO INTEGROVANÉHO KÓDU
# ============================================================================

example_complete_code = """
#!/usr/bin/env python3
from pathlib import Path
from dotenv import load_dotenv
import os
import time

# NEW IMPORTS
from integrate_yolo_3d import integrate_yolo_3d_detection
from nerfstudio_handler import run_nerfstudio_reconstruction
from supabase_comunication import update_project_status

load_dotenv()

PROJECTS_PATH = os.getenv("PROJECTS_PATH", "./projects")

def generate_project_with_yolo_3d(project_path: str, project_id: str):
    '''
    Kompletný pipeline:
    1. COLMAP processing (Step 1)
    2. YOLO 3D detection (Step 1.5) ← NOVÝ
    3. NeRF training (Step 2)
    '''
    
    project_dir = Path(project_path)
    
    print("\\n" + "="*70)
    print("🚀 3D Reconstruction Pipeline with YOLO 3D Detection")
    print("="*70)
    
    # STEP 1: COLMAP (ns-process-data)
    print("\\n📍 STEP 1: COLMAP Processing...")
    step1_dir = project_dir / "processed" / "step1"
    images_path = project_dir / "images"
    
    # ... existujúci kód COLMAP ...
    success_step1 = run_nerfstudio_reconstruction(
        str(images_path),
        str(project_dir / "3Dmodel" / "model.ply"),
        "pending",
        project_id
    )
    
    if not success_step1:
        print("❌ Step 1 failed")
        return False
    
    print("✅ Step 1 Complete")
    
    # STEP 1.5: YOLO 3D Detection (NOVÝ!)
    print("\\n📍 STEP 1.5: YOLO 3D Object Detection...")
    try:
        yolo_success = integrate_yolo_3d_detection(project_dir)
        print(f"{'✅' if yolo_success else '⚠️'} Step 1.5 Complete")
    except Exception as e:
        print(f"⚠️  Step 1.5 warning: {e}")
    
    # STEP 2: NeRF Training
    print("\\n📍 STEP 2: NeRF Training...")
    # ... existujúci kód NeRF training ...
    
    print("\\n" + "="*70)
    print("✅ Pipeline Complete!")
    print("   3D Model:        3Dmodel/model.ply")
    print("   Detected Objects: processed/step1/objects_3d.ply")
    print("="*70 + "\\n")
    
    return True


# Spustenie
if __name__ == "__main__":
    generate_project_with_yolo_3d(
        "projects/9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/d1ebd644-7788-4cf7-97d2-1fc88474e8a8",
        "9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4"
    )
"""

print(example_complete_code)
