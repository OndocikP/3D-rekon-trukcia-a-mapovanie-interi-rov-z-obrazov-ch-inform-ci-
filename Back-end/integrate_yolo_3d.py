#!/usr/bin/env python3
"""
Integrácia YOLO 3D Annotator do NeRFStudio pipeline
Spusti sa automaticky po kroku 1 COLMAP spracovania
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import sys

# Načítaj .env
load_dotenv()

# Import YOLO 3D annotator
from yolo_3d_annotator import process_project_with_yolo_3d

# Config
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8l.pt")
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.5"))
YOLO_DISTANCE_ESTIMATE = float(os.getenv("YOLO_DISTANCE_ESTIMATE", "2.0"))


def integrate_yolo_3d_detection(project_dir: Path) -> bool:
    """
    Integruj YOLO 3D detekciu do NeRFStudio pipeline.
    
    Spusti sa po ns-process-data (Step 1) a pred ns-train (Step 2).
    
    Args:
        project_dir: Priečinok projektu
        
    Returns:
        True ak bolo úspešné
    """
    print("\n" + "="*70)
    print("🎯 STEP 1.5: YOLO 3D Object Detection & Annotation")
    print("="*70 + "\n")
    
    # Nájdi sparse point cloud
    sparse_pc_path = project_dir / "processed" / "step1" / "sparse_pc.ply"
    
    print(f"📁 Projekt: {project_dir}")
    print(f"🎯 YOLO Model: {YOLO_MODEL}")
    print(f"🔍 Confidence: {YOLO_CONFIDENCE}")
    print(f"📏 Distance estimate: {YOLO_DISTANCE_ESTIMATE}m")
    print(f"🗂️  Sparse PC: {'✅ Nájdený' if sparse_pc_path.exists() else '⚠️  Nenájdený'}\n")
    
    # Spusti detekciu
    success = process_project_with_yolo_3d(
        project_dir=project_dir,
        sparse_pc_path=sparse_pc_path if sparse_pc_path.exists() else None,
        yolo_model=YOLO_MODEL,
        yolo_confidence=YOLO_CONFIDENCE,
        distance_estimate=YOLO_DISTANCE_ESTIMATE
    )
    
    if success:
        print("\n✅ YOLO 3D detekcia hotová!")
        print("   Objekty sú teraz v: objects_3d.ply")
        print("   Možeš si ich pozrieť v NeRFStudio vieweri\n")
        return True
    else:
        print("\n⚠️  Detekcia skončila bez výsledkov")
        print("   Pokračujem s tréningom bez objektov\n")
        return False


if __name__ == "__main__":
    if len(sys.argv) > 1:
        project_dir = Path(sys.argv[1])
        integrate_yolo_3d_detection(project_dir)
    else:
        print("❌ Použi: python integrate_yolo_3d.py <project_dir>")
