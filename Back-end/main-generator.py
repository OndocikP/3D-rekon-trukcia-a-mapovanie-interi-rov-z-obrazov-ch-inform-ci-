#!/usr/bin/env python3
"""
Nájdi najstarší projekt so statusom 'pending' v Supabase
"""

import os
from pathlib import Path
from dotenv import load_dotenv

from nerfstudio_handler import run_nerfstudio_reconstruction
from supabase_comunication import (
    get_oldest_pending_project,
    get_all_projects,
    update_project_status,
    update_project_objects,
    increment_project_try
)

# Load .env
load_dotenv()

# Config
PROJECTS_PATH = os.getenv("PROJECTS_PATH", "./projects")

# YOLO config
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8l.pt")
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.7"))
YOLO_DEVICE = os.getenv("YOLO_DEVICE", "0")


def format_detected_objects(objects_dict: dict, min_count: int = 2) -> str:
    """
    Formatuj detekované objekty do tvaru: "Object 1-X", etc.
    IGNORUJE objekty ktoré sa našli menej ako min_count krát (default: min 2x)
    
    Input: {"Bed": 3, "Notebook": 2, "Table": 1, "Chair": 5}
    Output: "Bed 1-3, Chair 1-5, Notebook 1-2"  (Table sa ignoruje lebo len 1x)
    
    Args:
        objects_dict: Dict s počtom objektov
        min_count: Minimálny počet výskytov (default 2)
    """
    if not objects_dict:
        return ""
    
    # Filter objekty - vzaj len tie s min_count alebo viac výskytmi
    filtered_objects = {name: count for name, count in objects_dict.items() if count >= min_count}
    
    if not filtered_objects:
        return ""
    
    formatted = []
    for obj_name in sorted(filtered_objects.keys()):
        count = filtered_objects[obj_name]
        if count == 1:
            formatted.append(f"{obj_name} 1")
        else:
            formatted.append(f"{obj_name} 1-{count}")
    
    return ", ".join(formatted)


def Yolo(image_files):
    """
    Reálna YOLO detekcia objektov v obrazoch - BATCH processing na šetrenie pamäte
    
    Args:
        image_files: Cesta k priečinku s obrazmi
        
    Returns:
        str: Formátovaný reťazec detekovaných objektov (napríklad "Bed 1-3, Chair 1-5")
    """
    print(f"\n⏳ YOLO spustená na: {image_files}")
    print(f"   ⌛ Čakam na dokončenie detekcie objektov...\n")
    
    try:
        # Import YOLO
        try:
            from ultralytics import YOLO as YOLOModel
        except ImportError:
            print("❌ ultralytics knižnica nie je nainštalovaná")
            print("   Inštaluj: pip install ultralytics")
            return None
        
        images_path = Path(image_files)
        
        if not images_path.exists():
            print(f"❌ Priečinok s obrazmi neexistuje: {images_path}")
            return None
        
        # Get all images
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files_list = sorted([f for f in images_path.iterdir() 
                                   if f.is_file() and f.suffix.lower() in image_extensions])
        
        if not image_files_list:
            print(f"❌ Žiadne obrázky nájdené v: {image_files}")
            return None
        
        print(f"📷 Nájdené {len(image_files_list)} obrázkov")
        print(f"🔧 Model: {YOLO_MODEL} | Confidence: {YOLO_CONFIDENCE} | Device: {YOLO_DEVICE}")
        print(f"⌛ Spúšťam detekciu po batch-och (max 15 obrázkov naraz na šetrenie RAM)...\n")
        
        # Load model
        model = YOLOModel(YOLO_MODEL)
        
        # Process images in batches to avoid memory issues
        batch_size = 15  # Menšie batch na CPU (nedostačí RAM inak)
        detected_counts = {}
        total_batches = (len(image_files_list) + batch_size - 1) // batch_size
        
        for batch_idx in range(0, len(image_files_list), batch_size):
            batch = image_files_list[batch_idx:batch_idx+batch_size]
            batch_num = (batch_idx // batch_size) + 1
            
            print(f"   Batch {batch_num}/{total_batches}: Procesiram {len(batch)} obrázkov...")
            
            try:
                # Run detection on batch with stream=True to save memory
                # stream=True = process one image at a time instead of loading all at once
                results = model.predict(
                    source=[str(f) for f in batch],
                    conf=YOLO_CONFIDENCE,
                    device=YOLO_DEVICE,
                    verbose=False,
                    stream=True  # KEY: Memory efficient mode
                )
                
                # Count detected objects by class
                for result in results:
                    if result.boxes is not None and len(result.boxes) > 0:
                        for box in result.boxes:
                            class_id = int(box.cls[0])
                            class_name = result.names[class_id]
                            detected_counts[class_name] = detected_counts.get(class_name, 0) + 1
                
                print(f"      ✅ Batch {batch_num} hotový | Celkovo detektovaných: {sum(detected_counts.values())}")
                
            except Exception as batch_error:
                print(f"      ⚠️  Chyba v batch {batch_num}: {batch_error}")
                continue  # Skip this batch, continue with next
        
        if not detected_counts:
            print(f"\n⚠️  Žiadne objekty detekované")
            return None
        
        # Filter objects - keep only those with min 2 occurrences
        min_count = 2
        filtered_counts = {name: count for name, count in detected_counts.items() if count >= min_count}
        
        objects_result = format_detected_objects(detected_counts, min_count=min_count)
        
        print(f"\n✅ YOLO detekcia skončená!")
        print(f"   📊 Celkovo detektovaných: {sum(detected_counts.values())} objektov")
        print(f"   📊 Všetkých unikátnych tried: {len(detected_counts)}")
        
        # Show all detected objects
        print(f"\n   📋 Všetky detekované objekty:")
        for obj_name in sorted(detected_counts.keys()):
            count = detected_counts[obj_name]
            status = "✅" if count >= min_count else "❌ (preskočené - len 1x)"
            print(f"      {status} {obj_name}: {count}x")
        
        if filtered_counts:
            print(f"\n   ✅ Filtrované objekty (min {min_count}x): {objects_result}\n")
        else:
            print(f"\n   ⚠️  Žiadne objekty nenašli minimálny počet výskytov ({min_count}x)\n")
            return None
        
        return objects_result
    
    except Exception as e:
        print(f"❌ YOLO chyba: {e}")
        import traceback
        traceback.print_exc()
        return None



def spracuj_projekt():
    try:
        project = get_oldest_pending_project()

        if project:
            print(f"\n✅ Nájdený projekt:\n")
            print(f"   ID:        {project.get('id')}")
            print(f"   Owner ID:  {project.get('owner_id')}")
            print(f"   Meno:      {project.get('name', 'N/A')}")
            print(f"   Status:    {project.get('status')}")
            print(f"   Created:   {project.get('created_at')}")
            print(f"   Objects:   {project.get('objects', 'None')}")
            
            print(f"\n📋 Kompletné údaje:\n")
            for key, value in project.items():
                print(f"   {key}: {value}")
            
            # Extract for usage
            owner_id = project.get('owner_id')
            project_id = project.get('id')
            project_path = f"{PROJECTS_PATH}/{owner_id}/{project_id}"
            
            
            print(f"\n" + "="*70)
            print(f"🎯 VÝSLEDOK:")
            print(f"   Owner ID:   {owner_id}")
            print(f"   Project ID: {project_id}")
            print(f"   Path:       {project_path}")
            print(f"="*70 + "\n")

            if not project.get('objects'):
                print("🚀 Spúšťam YOLO detekciu...")
                objects_new = Yolo(project_path + "/images")
                
                # Ulož objects_new do Supabase
                print(f"💾 Ukladám výsledky do Supabase...")
                
                if update_project_objects(project_id, objects_new):
                    print(f"✅ Objekty úspešne uložené do Supabase!")
                    print(f"   Objects: {objects_new}\n")
                else:
                    print(f"❌ Chyba pri ukladaní do Supabase\n")
            if project.get('status') != "generated":
                print("🚀 Spúšťam 3D Generovanie...\n")
                
                # Run Nerfstudio
                model_output = project_path + "/3Dmodel/model.ply"
                success = run_nerfstudio_reconstruction(project_path + "/images", model_output, project.get('status'), project_id)

                if success:
                    print(f"✅ Úspešné vytvorenie 3D modelu")
                    update_project_status(project_id, "Generated")
                else:
                    print(f"❌ Chyba pri vytváraní 3D modelu\n")
                    increment_project_try(project_id, project.get('try') or 0)


            
            
        else:
            print("\n⚠️ Žiadny projekt so statusom 'pending' nebol nájdený\n")
            
            # Show all projects
            print("📊 Všetky projekty:\n")
            all_projects = get_all_projects(limit=10)
            
            if all_projects:
                for proj in all_projects:
                    print(f"   {proj['status']} | {proj['name']} | {proj.get('try', 0)} | {proj['id'][:8]}... | {proj['owner_id'][:8]}... | {proj['created_at']}")
            else:
                print("   (Žiadne projekty)")
            print()

    except Exception as e:
        print(f"\n❌ Chyba: {e}\n")
        exit(1)

def main():
    """Hlavný vstupný bod"""
    
    print("\n" + "="*70)
    print("Supabase Query - Najstarší projekt so statusom 'pending'")
    print("="*70)
    print(f"\n📁 PROJECTS_PATH: {PROJECTS_PATH}\n")
    
    spracuj_projekt()
    


if __name__ == "__main__":
    main()
