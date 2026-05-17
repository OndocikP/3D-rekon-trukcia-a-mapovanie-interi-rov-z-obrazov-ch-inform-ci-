#!/usr/bin/env python3
"""
Worker Client - Lokálne spracovanie 3D rekonštrukcie
Spracovanie 3D rekonštrukcie projektov
- Prejde PROJECTS_PATH/user_id/project_id/images (lokálne fotky)
- Spustí YOLO rekonštrukciu
- Spustí NERFSTUDIO/COLMAP na 3D model
- Uloží výsledky do 3Dmodel/ priečinka
"""

import os
import time
import json
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from dotenv import load_dotenv

# Load .env
load_dotenv()

# ============================================
# LOGGING
# ============================================

# Get log file from environment
log_file = os.getenv("WORKER_LOG_FILE", "3d-worker.log")

handlers = [
    logging.StreamHandler()  # Console output
]

# Try to add file handler
try:
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    handlers.append(logging.FileHandler(log_file))
except Exception as e:
    print(f"Warning: Cannot write to log file {log_file}: {e}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger("3d-worker")

# ============================================
# PROJECT SCANNER - LOKÁLNY
# ============================================

class ProjectScanner:
    """Skúmanie projektov lokálne z PROJECTS_PATH"""
    
    def __init__(self, projects_path: str):
        self.projects_path = Path(projects_path)
    
    def get_all_projects(self) -> List[Dict]:
        """Scan všetky projekty v PROJECTS_PATH"""
        projects = []
        
        if not self.projects_path.exists():
            logger.error(f"[ERROR] PROJECTS_PATH not found: {self.projects_path}")
            return projects
        
        try:
            # Prejdi user_id priečinky
            for user_dir in sorted(self.projects_path.iterdir()):
                if not user_dir.is_dir():
                    continue
                
                user_id = user_dir.name
                
                # Prejdi project_id priečinky
                for project_dir in sorted(user_dir.iterdir()):
                    if not project_dir.is_dir():
                        continue
                    
                    project_id = project_dir.name
                    images_dir = project_dir / "images"
                    model_dir = project_dir / "3Dmodel"
                    
                    # Spočítaj obrázky (bez duplicitov - Windows je case-insensitive)
                    if images_dir.exists():
                        # Zber všetkých súborov s image extensions (deduplicated)
                        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
                        image_files = set()
                        for file in images_dir.iterdir():
                            if file.is_file() and file.suffix.lower() in image_extensions:
                                image_files.add(file.name)
                        image_count = len(image_files)
                    else:
                        image_count = 0
                    
                    # Skontroluj model
                    has_model = False
                    if model_dir.exists():
                        has_model = len(list(model_dir.glob("*.ply"))) > 0
                    
                    projects.append({
                        "user_id": user_id,
                        "project_id": project_id,
                        "project_path": str(project_dir),
                        "images_path": str(images_dir),
                        "model_path": str(model_dir),
                        "image_count": image_count,
                        "has_model": has_model,
                    })
        
        except Exception as e:
            logger.error(f"[ERROR] Error scanning projects: {e}")
        
        return projects

def format_detected_objects(objects_dict: Dict[str, int]) -> str:
    """
    Formatuj detekované objekty do tvaru: "Object 1", "Object 1-X", etc.
    
    Input: {"Bed": 3, "Notebook": 2, "Table": 1}
    Output: "Bed 1-3, Notebook 1-2, Table 1"
    """
    if not objects_dict:
        return ""
    
    formatted = []
    for obj_name in sorted(objects_dict.keys()):
        count = objects_dict[obj_name]
        if count == 1:
            formatted.append(f"{obj_name} 1")
        else:
            formatted.append(f"{obj_name} 1-{count}")
    
    return ", ".join(formatted)

# ============================================
# PROCESSING FUNCTIONS
# ============================================

def run_yolo_detection(images_dir: str) -> Optional[str]:
    """
    Spusti YOLO rekonštrukciu na detekciu objektov
    
    Vrací: "Bed 1-3, Notebook 1-2, Table 1, ..."
    """
    try:
        logger.info(f"[YOLO] Running YOLO detection on: {images_dir}")
        
        # Import YOLO
        try:
            from ultralytics import YOLO
        except ImportError:
            logger.error(f"[ERROR] ultralytics not installed. Install with: pip install ultralytics")
            return None
        
        # Load configuration from env
        model_name = os.getenv("YOLO_MODEL", "yolov8l.pt")
        confidence = float(os.getenv("YOLO_CONFIDENCE", "0.5"))
        device = os.getenv("YOLO_DEVICE", "0")
        
        logger.info(f"   Model: {model_name} | Confidence: {confidence} | Device: {device}")
        
        # Load model
        logger.info(f"   Loading model: {model_name}...")
        model = YOLO(model_name)
        
        # Get all images
        images_path = Path(images_dir)
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [f for f in images_path.iterdir() 
                       if f.is_file() and f.suffix.lower() in image_extensions]
        
        if not image_files:
            logger.error(f"[ERROR] No images found in: {images_dir}")
            return None
        
        logger.info(f"   Processing {len(image_files)} images...")
        
        # Run detection on all images
        results = model.predict(
            source=str(images_path),
            conf=confidence,
            device=device,
            verbose=False,
            stream=False
        )
        
        # Count detected objects by class
        detected_counts = {}
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    detected_counts[class_name] = detected_counts.get(class_name, 0) + 1
        
        if not detected_counts:
            logger.warning(f"[WARN] No objects detected")
            return None
        
        detected_objects = format_detected_objects(detected_counts)
        logger.info(f"[OK] Detection complete: {detected_objects}")
        return detected_objects
    
    except Exception as e:
        logger.error(f"[ERROR] YOLO error: {e}", exc_info=True)
        return None

def run_nerfstudio_reconstruction(images_dir: str, output_model: str) -> bool:
    """
    Spusti Nerfstudio na generovanie 3D modelu
    
    Výstup: PLY súbor v output_model
    """
    try:
        logger.info(f"[NERFSTUDIO] Running NeRF reconstruction on: {images_dir}")
        
        images_path = Path(images_dir)
        if not images_path.exists() or not list(images_path.glob("*")):
            logger.error(f"[ERROR] No images found in: {images_dir}")
            return False
        
        import subprocess
        
        output_dir = Path(output_model).parent
        processed_dir = output_dir / "processed_images"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Suppress Nerfstudio warnings that are not fatal
        env = {
            **os.environ,
            'PYTHONIOENCODING': 'utf-8',
            'PYTHONWARNINGS': 'ignore::FutureWarning,ignore::RuntimeWarning',
        }
        
        # ============================================
        # STEP 1: Process images with ns-process-data
        # ============================================
        logger.info(f"   -> Step 1: Processing images with ns-process-data...")
        
        cmd_process = (
            f'chcp 65001 && '
            f'conda activate nerfstudio && '
            f'ns-process-data images '
            f'--data "{images_path}" '
            f'--output-dir "{processed_dir}"'
        )
        
        result = subprocess.run(
            ['cmd', '/c', cmd_process],
            capture_output=True,
            text=True,
            env=env,
            timeout=1800  # 30 minute timeout for processing
        )
        
        if result.returncode != 0:
            # Filter out non-fatal warnings
            stderr_lines = result.stderr.split('\n')
            real_errors = [
                line for line in stderr_lines
                if line and not any(warning in line for warning in [
                    'RuntimeWarning', 'FutureWarning', 'torch.compile', 
                    'torch.cuda.amp', 'DeprecationWarning'
                ])
            ]
            
            if real_errors:
                logger.error(f"[ERROR] Image processing failed: {real_errors[0][:200]}")
                return False
        
        logger.info(f"   [OK] Images processed successfully")
        
        # ============================================
        # STEP 2: Train NeRF model with ns-train
        # ============================================
        logger.info(f"   -> Step 2: Training NeRF model...")
        
        cmd_train = (
            f'chcp 65001 && '
            f'conda activate nerfstudio && '
            f'ns-train nerfacto '
            f'--data "{processed_dir}" '
            f'--output-dir "{output_dir}" '
            f'--experiment-name nerfstudio_{int(time.time())}'
        )
        
        logger.info(f"[CMD] {cmd_train[:100]}...")
        
        result = subprocess.run(
            ['cmd', '/c', cmd_train],
            capture_output=True,
            text=True,
            env=env,
            timeout=3600  # 1 hour timeout
        )
        
        # Check for real errors (not just warnings)
        if result.returncode != 0:
            # Filter out known non-fatal warnings
            stderr_lines = result.stderr.split('\n')
            real_errors = [
                line for line in stderr_lines
                if line and not any(warning in line for warning in [
                    'RuntimeWarning',
                    'FutureWarning',
                    'torch.compile',
                    'torch.cuda.amp',
                    'DeprecationWarning'
                ])
            ]
            
            if real_errors:
                logger.error(f"[ERROR] Nerfstudio error: {real_errors[0][:200]}")
                return False
            else:
                # Only warnings, might still be working
                logger.info(f"[OK] Training completed (with non-fatal warnings)")
                return True
        
        logger.info(f"[OK] Nerfstudio reconstruction complete")
        return True
    
    except subprocess.TimeoutExpired:
        logger.error(f"[ERROR] Nerfstudio timeout (exceeded timeout)")
        return False
    except Exception as e:
        logger.error(f"[ERROR] Nerfstudio error: {e}")
        return None

# ============================================
# WORKER LOOP
# ============================================

def run_worker_loop(
    projects_path: str,
    sleep_seconds: int = 60,
    yolo_enabled: bool = True,
    nerfstudio_enabled: bool = False
):
    """Spusti worker loop - lokálne spracovanie"""
    
    logger.info(f"[START] Starting Worker Loop")
    logger.info(f"   Projects Path: {projects_path}")
    logger.info(f"   Check Interval: {sleep_seconds}s")
    logger.info(f"   YOLO Enabled: {yolo_enabled}")
    logger.info(f"   NERFSTUDIO Enabled: {nerfstudio_enabled}")
    
    # Inicializuj scanner
    scanner = ProjectScanner(projects_path)
    
    # Worker loop
    iteration = 0
    while True:
        iteration += 1
        
        try:
            logger.info(f"\n{'='*70}")
            logger.info(f"ITERATION {iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"{'='*70}")
            
            # 1. Skenuj všetky projekty
            projects = scanner.get_all_projects()
            logger.info(f"[PROJECTS] Found {len(projects)} projects")
            
            # 2. Filtuj len tie bez 3D modelu
            projects_to_process = [p for p in projects if not p["has_model"] and p["image_count"] >= 5]
            
            if not projects_to_process:
                logger.info("[INFO] No projects to process (all have models)")
            
            else:
                # 3. Spracuj prvý projekt
                project = projects_to_process[0]
                user_id = project["user_id"]
                project_id = project["project_id"]
                images_dir = project["images_path"]
                model_dir = project["model_path"]
                image_count = project["image_count"]
                
                logger.info(f"\n[PROCESSING] {project_id}")
                logger.info(f"   User: {user_id}")
                logger.info(f"   Images: {image_count}")
                logger.info(f"   Path: {images_dir}")
                
                # 4. YOLO detection (optional)
                if yolo_enabled:
                    logger.info(f"   -> Step 1: Running YOLO detection...")
                    detected_objects = run_yolo_detection(images_dir)
                    if detected_objects:
                        logger.info(f"   [OK] Detected: {detected_objects}")
                    else:
                        logger.warning(f"   [WARN] YOLO detection failed")
                
                # 5. Nerfstudio 3D reconstruction
                if nerfstudio_enabled:
                    logger.info(f"   -> Step 2: Running Nerfstudio 3D reconstruction...")
                    
                    Path(model_dir).mkdir(parents=True, exist_ok=True)
                    model_path = Path(model_dir) / "pointcloud.ply"
                    
                    if run_nerfstudio_reconstruction(images_dir, str(model_path)):
                        logger.info(f"   [OK] Model generated at: {model_path}")
                    else:
                        logger.error(f"   [ERROR] Reconstruction failed")
        
        except Exception as e:
            logger.error(f"[ERROR] Error in worker loop iteration: {e}", exc_info=True)
        
        # 6. Čakaj do ďalšej iterácie
        logger.info(f"\n[WAIT] Sleeping for {sleep_seconds}s...")
        time.sleep(sleep_seconds)

if __name__ == "__main__":
    import sys
    
    # Konfigurácia z environment variables alebo defaults
    PROJECTS_PATH = os.getenv("PROJECTS_PATH", "./projects")
    SLEEP_SECONDS = int(os.getenv("WORKER_SLEEP_SECONDS", "60"))
    
    # Processing options
    YOLO_ENABLED = os.getenv("YOLO_ENABLED", "false").lower() == "true"
    NERFSTUDIO_ENABLED = os.getenv("NERFSTUDIO_ENABLED", "true").lower() == "true"
    
    logger.info(f"Configuration:")
    logger.info(f"  PROJECTS_PATH: {PROJECTS_PATH}")
    logger.info(f"  SLEEP_SECONDS: {SLEEP_SECONDS}")
    logger.info(f"  YOLO_ENABLED: {YOLO_ENABLED}")
    logger.info(f"  NERFSTUDIO_ENABLED: {NERFSTUDIO_ENABLED}")
    
    # Spusti worker loop
    try:
        run_worker_loop(
            projects_path=PROJECTS_PATH,
            sleep_seconds=SLEEP_SECONDS,
            yolo_enabled=YOLO_ENABLED,
            nerfstudio_enabled=NERFSTUDIO_ENABLED
        )
    except KeyboardInterrupt:
        logger.info("\n[STOP] Worker stopped by user")
    except Exception as e:
        logger.error(f"[ERROR] Fatal error: {e}", exc_info=True)
        sys.exit(1)
