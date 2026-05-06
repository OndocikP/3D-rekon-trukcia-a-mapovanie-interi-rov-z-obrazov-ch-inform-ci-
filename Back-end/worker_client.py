#!/usr/bin/env python3
"""
Worker Server Client - Server 2
Spracovanie 3D rekonštrukcie projektov
- Stiahne fotky z Server 1
- Spustí YOLO rekonštrukciu
- Spustí COLMAP na 3D model
- Uploaduje výsledky na Server 1 a Supabase
"""

import requests
import os
import time
import json
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
import shutil
from dotenv import load_dotenv

# Load .env.server2 (or .env as fallback)
load_dotenv(dotenv_path=".env.server2")  # Load Server 2 config first
load_dotenv()  # Fallback to .env if .env.server2 doesn't exist

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
# WORKER CLIENT
# ============================================

class WorkerClient:
    """Klient na komunikáciu so Server 1"""
    
    def __init__(self, server_url: str, username: str, password: str):
        self.server_url = server_url
        self.username = username
        self.password = password
        self.token = None
        self.user_id = None
        self.headers = {"Content-Type": "application/json"}
    
    def login(self) -> bool:
        """Prihlásenie ako worker (admin)"""
        try:
            logger.info(f"[AUTH] Connecting to: {self.server_url}")
            
            response = requests.post(
                f"{self.server_url}/api/worker/login",
                json={"username": self.username, "password": self.password},
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"[ERROR] Login failed: {response.text}")
                return False
            
            data = response.json()
            self.token = data.get("access_token")
            self.user_id = data.get("user_id")
            
            logger.info(f"[OK] Logged in as: {data.get('username')} | Role: {data.get('role')}")
            
            # Update headers
            self.headers["Authorization"] = f"Bearer {self.token}"
            
            return True
        
        except Exception as e:
            logger.error(f"[ERROR] Login error: {e}")
            return False
    
    def get_pending_projects(self) -> List[Dict]:
        """Načítaj pending projekty"""
        try:
            response = requests.get(
                f"{self.server_url}/api/worker/projects/pending",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"[ERROR] Failed to get projects: {response.text}")
                return []
            
            projects = response.json()
            logger.info(f"[PROJECTS] Found {len(projects)} pending projects")
            
            return projects
        
        except Exception as e:
            logger.error(f"[ERROR] Error fetching projects: {e}")
            return []
    
    def download_images(self, project_id: str, owner_id: str, output_dir: str) -> bool:
        """Stiahni všetky fotky projektu"""
        try:
            logger.info(f"[DOWNLOAD] Downloading images for project: {project_id}")
            
            # Zoznam fotiek
            list_response = requests.get(
                f"{self.server_url}/api/worker/projects/{project_id}/images/list",
                headers=self.headers,
                params={"owner_id": owner_id},
                timeout=10
            )
            
            if list_response.status_code != 200:
                logger.error(f"[ERROR] Failed to list images: {list_response.text}")
                return False
            
            images_data = list_response.json()
            images = images_data.get("images", [])
            
            logger.info(f"[OK] Found {len(images)} images to download")
            
            # Vytvor output priečinok
            output_path = Path(output_dir) / project_id / "images"
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Stiahni každú fotku
            downloaded = 0
            for i, filename in enumerate(images, 1):
                try:
                    logger.info(f"   [{i}/{len(images)}] Downloading: {filename}")
                    
                    img_response = requests.get(
                        f"{self.server_url}/api/worker/projects/{project_id}/images/download/{filename}",
                        headers=self.headers,
                        params={"owner_id": owner_id},
                        timeout=30
                    )
                    
                    if img_response.status_code != 200:
                        logger.warning(f"[WARN] Failed to download: {filename}")
                        continue
                    
                    # Ulož fotku
                    file_path = output_path / filename
                    with open(file_path, "wb") as f:
                        f.write(img_response.content)
                    
                    size_mb = len(img_response.content) / (1024 * 1024)
                    logger.info(f"      [OK] Downloaded ({size_mb:.2f} MB)")
                    downloaded += 1
                
                except Exception as e:
                    logger.error(f"[ERROR] Error downloading {filename}: {e}")
            
            logger.info(f"[OK] Downloaded {downloaded}/{len(images)} images to: {output_path}")
            return downloaded > 0
        
        except Exception as e:
            logger.error(f"[ERROR] Error downloading images: {e}")
            return False
    
    def update_objects(self, project_id: str, objects: str) -> bool:
        """Aktualizuj objekty (YOLO výsledky)"""
        try:
            logger.info(f"[UPDATE] Updating objects for project: {project_id}")
            logger.info(f"   Objects: {objects}")
            
            response = requests.post(
                f"{self.server_url}/api/worker/projects/{project_id}/update-objects",
                headers=self.headers,
                json={"objects": objects},
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"[ERROR] Failed to update objects: {response.text}")
                return False
            
            logger.info(f"[OK] Objects updated successfully")
            
            return True
        
        except Exception as e:
            logger.error(f"[ERROR] Error updating objects: {e}")
            return False
    
    def upload_3d_model(self, project_id: str, owner_id: str, model_path: str) -> bool:
        """Uploaduj 3D model"""
        try:
            logger.info(f"[PROCESSING] Uploading 3D model for project: {project_id}")
            
            if not os.path.exists(model_path):
                logger.error(f"[ERROR] Model file not found: {model_path}")
                return False
            
            file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
            logger.info(f"   File size: {file_size_mb:.2f} MB")
            
            # Uploaduj súbor
            with open(model_path, "rb") as f:
                files = {"file": (Path(model_path).name, f, "application/octet-stream")}
                
                response = requests.post(
                    f"{self.server_url}/api/worker/projects/{project_id}/upload-3d-model",
                    headers={"Authorization": self.headers.get("Authorization")},
                    files=files,
                    params={"owner_id": owner_id},
                    timeout=60
                )
            
            if response.status_code != 200:
                logger.error(f"[ERROR] Failed to upload model: {response.text}")
                return False
            
            data = response.json()
            logger.info(f"[OK] Model uploaded: {data.get('filename')}")
            
            return True
        
        except Exception as e:
            logger.error(f"[ERROR] Error uploading model: {e}")
            return False

# ============================================
# FORMATTING HELPER
# ============================================

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
    Format:
    - 1 objekt: "Object 1"
    - Viac objektov: "Object 1-X"
    """
    try:
        logger.info(f"[YOLO] Running YOLO detection on: {images_dir}")
        
        # TODO: Integrácia s YOLO modelom
        # Príklad s ultralytics:
        # from ultralytics import YOLO
        # model = YOLO('yolov8l.pt')
        # results = model.predict(source=images_dir, conf=0.5)
        
        # Parsuj výsledky a spočítaj objekty...
        
        # Príklad dummy výstup pre testing:
        logger.info("   [INFO] YOLO integration not implemented yet")
        logger.info("   Using dummy results for testing...")
        
        # Dummy detekcia - počet objektov
        detected_counts = {
            "Bed": 3,
            "Notebook": 2,
            "Table": 1,
            "Chair": 5,
            "Lamp": 2,
            "Window": 1
        }
        
        # Formatuj objekty
        detected_objects = format_detected_objects(detected_counts)
        
        logger.info(f"[OK] Detection complete: {detected_objects}")
        return detected_objects
    
    except Exception as e:
        logger.error(f"[ERROR] YOLO error: {e}")
        return None

def run_colmap_reconstruction(images_dir: str, output_model: str) -> bool:
    """
    Spusti COLMAP na generovanie 3D modelu
    
    Výstup: PLY súbor v output_model
    """
    try:
        logger.info(f"[COLMAP] Running COLMAP 3D reconstruction on: {images_dir}")
        
        # TODO: Integrácia s COLMAP
        # Príklad príkazový riadok:
        # os.system(f"colmap automatic_reconstructor --image_path {images_dir} --workspace_path {output_dir}")
        
        logger.info("   [INFO] COLMAP integration not implemented yet")
        logger.info("   Creating dummy PLY file for testing...")
        
        # Príklad dummy PLY súbor
        ply_header = """ply
format binary_little_endian 1.0
element vertex 8
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
element face 6
property list uchar int vertex_indices
end_header
"""
        
        import struct
        
        with open(output_model, "wb") as f:
            f.write(ply_header.encode())
            
            # Dummy vertices (kocka)
            vertices = [
                (-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
                (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1),
            ]
            
            for x, y, z in vertices:
                # Position + RGB color
                f.write(struct.pack('<fff', x, y, z))
                f.write(struct.pack('BBB', 255, 128, 0))  # Orange
            
            # Dummy faces (6 faces kocky)
            faces = [
                (0, 1, 2), (0, 2, 3),  # Bottom
                (4, 6, 5), (4, 7, 6),  # Top
                (0, 4, 5), (0, 5, 1),  # Front
                (2, 6, 7), (2, 7, 3),  # Back
            ]
            
            for face in faces:
                f.write(struct.pack('B', 3))  # 3 vertices
                f.write(struct.pack('III', face[0], face[1], face[2]))
        
        logger.info(f"[OK] Model generated: {output_model}")
        return True
    
    except Exception as e:
        logger.error(f"[ERROR] COLMAP error: {e}")
        return False

def cleanup_project_dir(project_dir: str):
    """Vymaž pracovný priečinok"""
    try:
        if os.path.exists(project_dir):
            shutil.rmtree(project_dir)
            logger.info(f"[CLEANUP] Cleaned up: {project_dir}")
    except Exception as e:
        logger.error(f"[ERROR] Cleanup error: {e}")

# ============================================
# WORKER LOOP
# ============================================

def run_worker_loop(
    server_url: str,
    admin_username: str,
    admin_password: str,
    work_dir: str = "/tmp/3d-worker",
    sleep_seconds: int = 60,
    yolo_enabled: bool = True,
    colmap_enabled: bool = True
):
    """Spusti worker loop"""
    
    logger.info(f"[START] Starting Worker Loop")
    logger.info(f"   Server URL: {server_url}")
    logger.info(f"   Work Dir: {work_dir}")
    logger.info(f"   Check Interval: {sleep_seconds}s")
    logger.info(f"   YOLO Enabled: {yolo_enabled}")
    logger.info(f"   COLMAP Enabled: {colmap_enabled}")
    
    # Vytvor priečinok
    Path(work_dir).mkdir(parents=True, exist_ok=True)
    
    # Inicializuj klienta
    client = WorkerClient(server_url, admin_username, admin_password)
    
    # Prihlásenie
    if not client.login():
        logger.error("[ERROR] Cannot login, exiting...")
        return
    
    # Worker loop
    iteration = 0
    while True:
        iteration += 1
        
        try:
            logger.info(f"\n{'='*70}")
            logger.info(f"ITERATION {iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info(f"{'='*70}")
            
            # 1. Načítaj pending projekty
            projects = client.get_pending_projects()
            
            if not projects:
                logger.info("[INFO] No projects to process")
            
            else:
                # 2. Spracuj prvý pending projekt
                project = projects[0]
                project_id = project["id"]
                owner_id = project["owner_id"]
                project_name = project["name"]
                objects = project.get("objects")
                status = project.get("status")
                
                logger.info(f"\n[PROCESSING] {project_name} (ID: {project_id})")
                logger.info(f"   Status: {status} | Objects: {objects}")
                
                project_work_dir = Path(work_dir) / project_id
                
                # 3. Ak objects je null/empty a YOLO je enabled, spusti YOLO
                if (objects is None or objects == "") and yolo_enabled:
                    logger.info(f"   -> Step 1: Running YOLO detection...")
                    
                    # Stiahni fotky
                    if client.download_images(project_id, owner_id, str(project_work_dir.parent)):
                        
                        # Spusti YOLO
                        images_dir = project_work_dir / "images"
                        detected_objects = run_yolo_detection(str(images_dir))
                        
                        if detected_objects:
                            # Aktualizuj v Supabase
                            if client.update_objects(project_id, detected_objects):
                                logger.info(f"   [OK] YOLO detection complete")
                            else:
                                logger.error(f"   [ERROR] Failed to update objects")
                        else:
                            logger.error(f"   [ERROR] YOLO detection failed")
                
                elif (objects is None or objects == "") and not yolo_enabled:
                    logger.info(f"   [INFO] YOLO detection disabled (objects=null/empty)")
                
                # 4. Ak status je pending a COLMAP je enabled, spusti COLMAP na 3D model
                if status == "pending" and colmap_enabled:
                    logger.info(f"   -> Step 2: Running COLMAP 3D reconstruction...")
                    
                    images_dir = project_work_dir / "images"
                    model_path = project_work_dir / "model.ply"
                    
                    # Skontroluj či existujú fotky
                    if not images_dir.exists() or not list(images_dir.glob("*")):
                        # Stiahni ak neexistujú
                        logger.info(f"   Downloading images first...")
                        client.download_images(project_id, owner_id, str(project_work_dir.parent))
                    
                    # Spusti COLMAP
                    if run_colmap_reconstruction(str(images_dir), str(model_path)):
                        
                        # Uploaduj model
                        if client.upload_3d_model(project_id, owner_id, str(model_path)):
                            logger.info(f"   [OK] COLMAP reconstruction complete")
                        else:
                            logger.error(f"   [ERROR] Failed to upload model")
                    else:
                        logger.error(f"   [ERROR] COLMAP reconstruction failed")
                
                elif status == "pending" and not colmap_enabled:
                    logger.info(f"   [INFO] COLMAP disabled (status=pending)")
                
                # 5. Čisti pracovný priečinok
                cleanup_project_dir(str(project_work_dir))
        
        except Exception as e:
            logger.error(f"[ERROR] Error in worker loop iteration: {e}", exc_info=True)
        
        # 6. Čakaj do ďalšej iterácie
        logger.info(f"\n[WAIT] Sleeping for {sleep_seconds}s...")
        time.sleep(sleep_seconds)

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import sys
    
    # Konfigurácia z environment variables alebo defaults
    SERVER_URL = os.getenv("WORKER_SERVER_URL", "http://localhost:8000")
    ADMIN_USERNAME = os.getenv("WORKER_ADMIN_USER", "admin")
    ADMIN_PASSWORD = os.getenv("WORKER_ADMIN_PASS", "admin123")
    WORK_DIR = os.getenv("WORKER_WORK_DIR", "/tmp/3d-worker")
    SLEEP_SECONDS = int(os.getenv("WORKER_SLEEP_SECONDS", "60"))
    
    # Processing options
    YOLO_ENABLED = os.getenv("YOLO_ENABLED", "true").lower() == "true"
    COLMAP_ENABLED = os.getenv("COLMAP_ENABLED", "true").lower() == "true"
    
    logger.info(f"Configuration:")
    logger.info(f"  SERVER_URL: {SERVER_URL}")
    logger.info(f"  ADMIN_USERNAME: {ADMIN_USERNAME}")
    logger.info(f"  WORK_DIR: {WORK_DIR}")
    logger.info(f"  SLEEP_SECONDS: {SLEEP_SECONDS}")
    logger.info(f"  YOLO_ENABLED: {YOLO_ENABLED}")
    logger.info(f"  COLMAP_ENABLED: {COLMAP_ENABLED}")
    
    # Spusti worker loop
    try:
        run_worker_loop(
            server_url=SERVER_URL,
            admin_username=ADMIN_USERNAME,
            admin_password=ADMIN_PASSWORD,
            work_dir=WORK_DIR,
            sleep_seconds=SLEEP_SECONDS,
            yolo_enabled=YOLO_ENABLED,
            colmap_enabled=COLMAP_ENABLED
        )
    except KeyboardInterrupt:
        logger.info("\n[STOP] Worker stopped by user")
    except Exception as e:
        logger.error(f"[ERROR] Fatal error: {e}", exc_info=True)
        sys.exit(1)
