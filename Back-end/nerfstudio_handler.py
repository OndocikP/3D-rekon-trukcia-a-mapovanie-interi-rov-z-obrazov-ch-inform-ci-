#!/usr/bin/env python3
"""
Nerfstudio rekonštrukcia - handler pre 3D modelovanie
"""

import os
import subprocess
from pathlib import Path
import sys
import signal
import time
from datetime import datetime
from dotenv import load_dotenv
import json
from collections import defaultdict
from supabase_comunication import (
    get_oldest_pending_project,
    get_all_projects,
    update_project_status,
    update_project_objects,
    increment_project_try
)

# Load .env
load_dotenv()

# Nerfstudio config
NERFSTUDIO_PATH = os.getenv("NERFSTUDIO_PATH", "C:\\Users\\papo1\\nerfstudio\\nerfstudio")
NERFSTUDIO_VIEWER_PORT = int(os.getenv("NERFSTUDIO_VIEWER_PORT", "7007"))
NERFSTUDIO_WEBSOCKET_PORT = int(os.getenv("NERFSTUDIO_WEBSOCKET_PORT", "7008"))

# Globálne premenné na sledovanie vieweru
_viewer_process = None
_current_project_id = None


def find_config_yml(search_dir: Path) -> Path:
    """
    Rekurzívne hľadá config.yml v priečinku a jeho podpriečinkoch.
    Vracia cestu k najnovšiemu config.yml súboru (podľa modifikačného času).
    
    Args:
        search_dir: Priečinok, v ktorom sa má hľadať
        
    Returns:
        Path: Cesta k nájdenému config.yml
        
    Raises:
        FileNotFoundError: Ak config.yml nie je nájdený
    """
    print(f"   🔍 Hľadám config.yml v: {search_dir}\n")
    
    config_files = list(search_dir.rglob("config.yml"))
    
    if not config_files:
        print(f"   ❌ config.yml nebol nájdený v: {search_dir}")
        raise FileNotFoundError(f"config.yml not found in {search_dir}")
    
    # Zoradi podľa modifikačného času (najnovší prvý)
    config_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    
    selected_config = config_files[0]
    print(f"   ✅ Nájdený config.yml:")
    print(f"      📄 {selected_config}")
    print(f"      🕐 Modifikácia: {datetime.fromtimestamp(selected_config.stat().st_mtime)}\n")
    
    if len(config_files) > 1:
        print(f"   ℹ️  Nájdených {len(config_files)} config.yml súborov, používam najnovší\n")
    
    return selected_config


def run_process_data(images_path: Path, step1_dir: Path) -> bool:
    """
    STEP 1: Process images using ns-process-data
    """
    print(f"   Step 1: Processing images with ns-process-data (30 min)...")
    print(f"      📁 Input:  {images_path}")
    print(f"      📁 Output: {step1_dir}\n")
    
    try:
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        cmd = (
            f"cd /d {NERFSTUDIO_PATH} && "
            f"conda activate nerfstudio && "
            f"ns-process-data images "
            f"--num-downscales 2 "
            f"--data {images_path} "
            f"--output-dir {step1_dir}"
        )
        
        result = subprocess.run(
            ['cmd', '/c', cmd],
            text=True,
            timeout=18000,  # 5 hodín
            env=env
        )
        
        if result.returncode != 0:
            print(f"   ❌ ns-process-data failed")
            print(f"   Return code: {result.returncode}")
            return False
        
        print(f"   ✅ Step 1 hotový!\n")
        return True
        
    except subprocess.TimeoutExpired:
        print(f"   ❌ ns-process-data timeout (operácia trvala >5 hodín)")
        return False
    except Exception as e:
        print(f"   ❌ ns-process-data error: {e}")
        return False


def run_train_nerf(step1_dir: Path, step2_dir: Path) -> bool:
    """
    STEP 2: Train NeRF model using ns-train s normálami
    Číta výstup a hľadá "Training Finished", potom ukončí proces
    """
    print(f"   Step 2: Training NeRF model with ns-train (60 min)...")
    print(f"      📁 Data:   {step1_dir}")
    print(f"      📁 Output: {step2_dir}\n")
    
    try:
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        # Tréňovanie s normálami - nerfacto s predict-normals
        cmd = (
            f"cd /d {NERFSTUDIO_PATH} && "
            f"conda activate nerfstudio && "
            f"ns-train nerfacto "
            f"--data {step1_dir} "
            f"--output-dir {step2_dir} "
            f"--pipeline.model.predict-normals True"
        )
        
        # Spusti proces s Popen aby bolo možné čítať výstup v reálnom čase
        process = subprocess.Popen(
            ['cmd', '/c', cmd],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env,
            bufsize=1
        )
        
        training_finished = False
        
        # Čítaj výstup riadok po riadku
        try:
            for line in process.stdout:
                print(line, end='')  # Vypiš output
                
                # Hľadaj "Training Finished"
                if "Training Finished" in line:
                    print(f"\n   ✅ Training finished detekovaný!")
                    training_finished = True
                    print(f"   ⏳ Čakám 5 sekúnd pred ukončením...\n")
                    time.sleep(5)
                    break
        
        except Exception as e:
            print(f"   ❌ Chyba pri čítaní výstupu: {e}")
            process.kill()
            return False
        
        # Poslať terminate ak bol training_finished
        if training_finished:
            try:
                print(f"   📤 Ukončujem proces (terminate)...\n")
                process.terminate()  # Graceful shutdown
                
                # Počkaj aby sa proces ukončil
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    print(f"   ⚠️  Proces sa neukončil, force kill...")
                    process.kill()
                    process.wait()
                
                print(f"   ✅ Step 2 hotový!\n")
                return True
                
            except Exception as e:
                print(f"   ❌ Chyba pri ukončení procesu: {e}")
                try:
                    process.kill()
                except:
                    pass
                return False
        else:
            # Ak nie je training_finished, čakaj na koniec procesu
            process.wait(timeout=10800)  # 3 hodiny
            print(f"   ❌ Training Finished nebol detekovaný")
            return False
        
    except subprocess.TimeoutExpired:
        print(f"   ❌ ns-train timeout (operácia trvala >3 hodiny)")
        if 'process' in locals():
            process.kill()
        return False
    except Exception as e:
        print(f"   ❌ ns-train error: {e}")
        if 'process' in locals():
            process.kill()
        return False


def run_export_pointcloud(config_path: Path, model_dir: Path) -> bool:
    """
    STEP 3: Export trained model to PLY pointcloud using ns-export
    """
    print(f"   Step 3: Exporting to PLY...")
    
    # Skontroluj či config_path existuje, ak nie - hľadaj ho
    if not config_path.exists():
        print(f"   ⚠️  Config nebol nájdený na očakávanej ceste")
        print(f"      Pôvodná: {config_path}\n")
        try:
            # Hľadaj config.yml v parent directories
            search_dir = config_path.parent.parent  # Skúšaj step2 priečinok
            config_path = find_config_yml(search_dir)
        except FileNotFoundError:
            print(f"   ❌ config.yml nebol nájdený ani v subpriečinkoch")
            return False
    else:
        print(f"      🔧 Config: {config_path}")
        print(f"      📁 Output: {model_dir}\n")
    
    try:
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        cmd = (
            f"cd /d {NERFSTUDIO_PATH} && "
            f"conda activate nerfstudio && "
            f"ns-export pointcloud "
            f"--load-config={config_path} "
            f"--output-dir {model_dir}"
        )
        
        result = subprocess.run(
            ['cmd', '/c', cmd],
            text=True,
            timeout=600,  # 10 min
            env=env
        )
        
        if result.returncode != 0:
            print(f"   ❌ ns-export failed")
            print(f"   Return code: {result.returncode}")
            return False
        
        print(f"   ✅ Step 3 hotový!\n")
        return True
        
    except subprocess.TimeoutExpired:
        print(f"   ❌ ns-export timeout (operácia trvala >10 min)")
        return False
    except Exception as e:
        print(f"   ❌ ns-export error: {e}")
        return False


def kill_viewer() -> bool:
    """
    Zastaví bežiaci Nerfstudio viewer proces
    
    Returns:
        bool: True ak bol viewer zastavený
    """
    global _viewer_process, _current_project_id
    
    if _viewer_process is None:
        return False
    
    try:
        print(f"\n   🛑 Zastavujem bežiaci viewer (project: {_current_project_id})...")
        
        # Terminuj proces - compatible s Windows/Linux/Mac
        _viewer_process.terminate()
        
        # Počkaj aby sa proces ukončil
        try:
            _viewer_process.wait(timeout=3)
            print(f"   ✅ Viewer zastavený")
        except subprocess.TimeoutExpired:
            print(f"   ⚠️  Viewer sa neukončil, force kill...")
            _viewer_process.kill()
            _viewer_process.wait()
            print(f"   ✅ Viewer kilnut")
        
        _viewer_process = None
        _current_project_id = None
        return True
        
    except Exception as e:
        print(f"   ❌ Chyba pri zastavení vieweru: {e}")
        _viewer_process = None
        _current_project_id = None
        return False


def start_viewer(project_id: str, config_path: Path) -> bool:
    """
    Spustí Nerfstudio viewer v pozadí
    - Zastaví starý viewer ak beží pre iný projekt
    - Spustí nový viewer pre projekt
    
    Args:
        project_id: ID projektu
        config_path: Cesta k config.yml
        
    Returns:
        bool: True ak sa viewer spustil úspešne
    """
    global _viewer_process, _current_project_id
    
    print(f"\n" + "="*70)
    print(f"🎬 SPÚŠŤAM NERFSTUDIO VIEWER PRE PROJEKT: {project_id}")
    print(f"="*70)
    
    try:
        # Ak je viewer spustený pre iný projekt, zastaň ho
        if _viewer_process is not None and _current_project_id != project_id:
            print(f"\n   ⚠️  Viewer je spustený pre projekt: {_current_project_id}")
            print(f"   🔄 Zastavujem a spúšťam nový...\n")
            kill_viewer()
        
        # Skontroluj config
        config = Path(config_path)
        if not config.exists() or config.is_dir():
            print(f"   ⚠️  Config nebol nájdený na: {config_path}")
            print(f"   🔍 Hľadám config.yml...")
            try:
                config = find_config_yml(config if config.is_dir() else config.parent)
            except FileNotFoundError:
                print(f"   ❌ config.yml nebol nájdený")
                return False
        
        print(f"   📄 Config: {config}")
        print(f"   🌐 HTTP Port: {NERFSTUDIO_VIEWER_PORT}")
        print(f"   📡 WebSocket Port: {NERFSTUDIO_WEBSOCKET_PORT}\n")
        
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        cmd = (
            f"cd /d {NERFSTUDIO_PATH} && "
            f"conda activate nerfstudio && "
            f"ns-viewer --load-config={config} "
            f"--viewer.http-port {NERFSTUDIO_VIEWER_PORT} "
            f"--viewer.websocket-port {NERFSTUDIO_WEBSOCKET_PORT}"
        )
        
        # Spustí ako daemon proces v novu process group (Windows)
        if sys.platform == 'win32':
            _viewer_process = subprocess.Popen(
                ['cmd', '/c', cmd],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                env=env,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            _viewer_process = subprocess.Popen(
                cmd,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                env=env,
                start_new_session=True
            )
        
        _current_project_id = project_id
        print(f"   ✅ Viewer spustený!")
        print(f"   🌍 Dostupný na: http://localhost:{NERFSTUDIO_VIEWER_PORT}")
        print(f"="*70 + "\n")
        return True
        
    except Exception as e:
        print(f"   ❌ Chyba: {e}\n")
        return False

def Generate_Podoris(model_dir: Path, config_path: Path, images_dir: Path) -> bool:
    """
    Generuje 3D mapu miestnosti s farbene označenými objektami (detekované YOLO)
    
    Pipeline:
    1. YOLO detekcia objektov zo všetkých obrázkov
    2. Mapovanie detekovaných objektov do 3D priestoru
    3. Top-down projekcia s farebným značením objektov
    4. Vizualizácia ako 3D mapa s farebnými štorcami
    
    Args:
        model_dir: Adresár s PLY modelom
        config_path: Cesta k config.yml
        images_dir: Cesta k obrázkam
    
    Výstup: 
        - podoris_3d_map.png (3D mapa s objektami)
        - objects_map.json (pozície objektov)
    
    Returns:
        bool: True ak bola mapa úspešne vygenerovaná
    """
    print(f"   Step 4: Generating floor plan (CLEANED v2)...")
    print(f"      📁 Model dir: {model_dir}\n")
    
    try:
        import numpy as np
        import cv2
        import open3d as o3d
        
        print(f"   1️⃣  Loading point cloud...")
        
        podoris_dir = model_dir / "podoris"
        podoris_dir.mkdir(parents=True, exist_ok=True)
        
        ply_files = list(model_dir.glob("**/*.ply"))
        if not ply_files:
            print(f"   ❌ Point cloud nenájdený")
            return False
        
        ply_path = max(ply_files, key=lambda p: p.stat().st_size)
        pcd = o3d.io.read_point_cloud(str(ply_path))
        print(f"      📊 Body pred čistením: {len(pcd.points):,}")
        
        # =========================================
        # AGGRESSIVE CLEANING
        # =========================================
        print(f"   1️⃣.5️⃣  Aggressive outlier removal...")
        
        # Statistical outlier removal
        pcd, _ = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=1.5)
        print(f"      📊 Po statistical: {len(pcd.points):,}")
        
        # Radius outlier removal  
        pcd, _ = pcd.remove_radius_outlier(nb_points=10, radius=0.05)
        print(f"      📊 Po radius: {len(pcd.points):,}")
        
        # Voxel downsampling
        pcd = pcd.voxel_down_sample(voxel_size=0.02)
        print(f"      📊 Po voxel: {len(pcd.points):,}\n")
        
        points = np.asarray(pcd.points)
        
        z_values = points[:, 2]
        z_min_all = np.percentile(z_values, 5)
        z_max_all = np.percentile(z_values, 95)
        z_range = z_max_all - z_min_all
        
        # Filtruj steny - body medzi 10% a 90% výšky
        z_wall_min = z_min_all + z_range * 0.10
        z_wall_max = z_min_all + z_range * 0.90
        
        wall_mask = (z_values >= z_wall_min) & (z_values <= z_wall_max)
        wall_points = points[wall_mask]
        
        print(f"      📊 Body na stenách: {len(wall_points):,}")
        print(f"      📏 Výšková vrstva: [{z_wall_min:.2f}, {z_wall_max:.2f}]m\n")
        
        if len(wall_points) < 1000:
            wall_points = points
        
        # =========================================
        # 3. PROJEKCIA DO 2D (TOP-DOWN) - IQR FILTERING
        # =========================================
        print(f"   3️⃣  Projecting to 2D (IQR method)...")
        
        points_2d = wall_points[:, [0, 1]]
        
        # IQR method
        center = np.median(points_2d, axis=0)
        distances = np.linalg.norm(points_2d - center, axis=1)
        
        q1 = np.percentile(distances, 25)
        q3 = np.percentile(distances, 75)
        iqr = q3 - q1
        
        # Body mimo IQR * 3
        inlier_mask = (distances >= q1 - 3*iqr) & (distances <= q3 + 3*iqr)
        points_2d = points_2d[inlier_mask]
        
        print(f"      📊 Body po IQR filtrácii: {len(points_2d):,}")
        
        x_min, y_min = points_2d.min(axis=0)
        x_max, y_max = points_2d.max(axis=0)
        x_range = x_max - x_min
        y_range = y_max - y_min
        
        print(f"      📐 X: [{x_min:.2f}, {x_max:.2f}] ({x_range:.2f}m)")
        print(f"      📐 Y: [{y_min:.2f}, {y_max:.2f}] ({y_range:.2f}m)\n")
        
        # =========================================
        # 4. KONVERZIA NA RASTER - VÄČŠÍ PADDING
        # =========================================
        print(f"   4️⃣  Rasterizing to image...")
        
        pad = max(x_range, y_range) * 0.15  # 15% padding
        x_min -= pad
        y_min -= pad
        x_max += pad
        y_max += pad
        
        scale = 200
        img_width = int((x_max - x_min) * scale)
        img_height = int((y_max - y_min) * scale)
        
        img_width = max(400, min(img_width, 2000))
        img_height = max(400, min(img_height, 2000))
        
        print(f"      📐 Rozmer: {img_width}x{img_height} px\n")
        
        img = np.zeros((img_height, img_width), dtype=np.uint8)
        
        for p in points_2d:
            x_idx = int((p[0] - x_min) / (x_max - x_min) * img_width)
            y_idx = int((p[1] - y_min) / (y_max - y_min) * img_height)
            
            if 0 <= x_idx < img_width and 0 <= y_idx < img_height:
                img[y_idx, x_idx] = 255
        
        # =========================================
        # 5. IMAGE PROCESSING - AGGRESSIVE
        # =========================================
        print(f"   5️⃣  Aggressive image processing...")
        
        # Väčší blur
        img_blur = cv2.GaussianBlur(img, (51, 51), 0)
        # Nižší threshold
        _, img_binary = cv2.threshold(img_blur, 40, 255, cv2.THRESH_BINARY)
        
        # Väčšie kernels
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (51, 51))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
        kernel_final = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        
        # Viac iterácií
        img_close = cv2.morphologyEx(img_binary, cv2.MORPH_CLOSE, kernel_close, iterations=3)
        img_open = cv2.morphologyEx(img_close, cv2.MORPH_OPEN, kernel_open, iterations=2)
        img_clean = cv2.morphologyEx(img_open, cv2.MORPH_CLOSE, kernel_final, iterations=1)
        
        print(f"      ✅ Processing hotové\n")
        
        # =========================================
        # 6. EXTRAKCIA OBRYSU - FILTRÁCIA
        # =========================================
        print(f"   6️⃣  Extracting contours...")
        
        contours, _ = cv2.findContours(img_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        print(f"      📊 Nájdené obrysy: {len(contours)}")
        
        if len(contours) == 0:
            print(f"   ❌ Žiadne obrysy nenájdené")
            return False
        
        # Filtruj len veľké obrysy (min 5% plôchy)
        min_area = img_clean.size * 0.05
        large_contours = [c for c in contours if cv2.contourArea(c) > min_area]
        
        if not large_contours:
            large_contours = contours
        
        largest_contour = max(large_contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        print(f"      📊 Veľké obrysy: {len(large_contours)}")
        print(f"      📊 Plocha: {area:.0f} px²\n")
        
        epsilon = 0.02 * perimeter
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        print(f"      📊 Počet vrcholov: {len(approx)}\n")
        
        # =========================================
        # 7. VIZUALIZÁCIA
        # =========================================
        print(f"   7️⃣  Creating visualization...")
        
        vis_img = cv2.cvtColor(img_clean, cv2.COLOR_GRAY2BGR)
        
        # Všetky obrysy
        cv2.drawContours(vis_img, large_contours, -1, (200, 200, 200), 2)
        # Najväčší obrys
        cv2.drawContours(vis_img, [largest_contour], 0, (200, 100, 50), 3)
        # Zjednodušený polygon
        cv2.drawContours(vis_img, [approx], 0, (0, 0, 255), 3)
        
        for point in approx:
            cv2.circle(vis_img, tuple(point[0]), 8, (0, 255, 0), -1)
        
        # =========================================
        # 8. INFO A LEGENDA
        # =========================================
        
        cv2.putText(vis_img, "Floor Plan - Cleaned v2", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)
        
        scale_m = 1.0 / scale
        real_area = area * scale_m * scale_m
        
        info_text = [
            f"Vertices: {len(approx)}",
            f"Area: {real_area:.1f} m² ({area:.0f} px²)",
            f"Points: {len(wall_points):,}",
            f"Scale: 1px = {scale_m*100:.1f}cm"
        ]
        
        y_pos = 80
        for text in info_text:
            cv2.putText(vis_img, text, (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1)
            y_pos += 35
        
        legend_y = img_height - 100
        cv2.putText(vis_img, "Legend:", (20, legend_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        
        cv2.circle(vis_img, (40, legend_y + 35), 5, (0, 255, 0), -1)
        cv2.putText(vis_img, "Vertices", (60, legend_y + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        
        cv2.line(vis_img, (40, legend_y + 65), (80, legend_y + 65), (0, 0, 255), 3)
        cv2.putText(vis_img, "Simplified", (90, legend_y + 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        
        cv2.line(vis_img, (40, legend_y + 95), (80, legend_y + 95), (200, 100, 50), 3)
        cv2.putText(vis_img, "Main outline", (90, legend_y + 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        
        # =========================================
        # 9. ULOŽ VÝSLEDKY
        # =========================================
        print(f"   8️⃣  Saving results...")
        
        output_png = podoris_dir / "podoris_floor_plan.png"
        cv2.imwrite(str(output_png), vis_img)
        print(f"      ✅ Obrázok: {output_png.name}")
        
        # JSON metadáta
        metadata = {
            'floor_plan': {
                'type': 'Top-down 2D projection - CLEANED v2',
                'vertices': int(len(approx)),
                'area_m2': float(real_area),
                'area_pixels': float(area),
                'perimeter_pixels': float(perimeter),
                'image_size': [img_height, img_width],
                'scale': f"{scale_m*100:.1f} cm per pixel"
            },
            'point_cloud': {
                'total_points_original': int(len(points)),
                'wall_points_filtered': int(len(wall_points)),
                'projection_points': int(len(points_2d)),
                'height_range': [float(z_wall_min), float(z_wall_max)],
                'bounds_xy': {
                    'x': [float(x_min), float(x_max)],
                    'y': [float(y_min), float(y_max)]
                }
            },
            'cleaning_pipeline': {
                'statistical_outlier_removal': {'nb_neighbors': 20, 'std_ratio': 1.5},
                'radius_outlier_removal': {'nb_points': 10, 'radius': 0.05},
                'voxel_downsampling': '0.02m',
                'iqr_2d_filtering': 'q1-q3±3*iqr'
            },
            'image_processing': {
                'blur': '51x51 gaussian',
                'threshold': 40,
                'morph_close': '51x51 ellipse, 3 iter',
                'morph_open': '21x21 ellipse, 2 iter',
                'morph_close2': '11x11 ellipse, 1 iter'
            },
            'polygon': {
                'vertices': [[int(p[0][0]), int(p[0][1])] for p in approx],
                'vertex_count': int(len(approx))
            },
            'generated_at': datetime.now().isoformat()
        }
        
        metadata_json = podoris_dir / "floor_plan.json"
        with open(metadata_json, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"      ✅ Metadáta: {metadata_json.name}")
        
        print(f"\n   📊 SUMARIZÁCIA FLOOR PLANU (ČISTENÝ v2):")
        print(f"      • Vstupných bodov: {len(points):,}")
        print(f"      • Po stat. removal: pred filtrovaním")
        print(f"      • Po radius removal: pred filtrovaním")
        print(f"      • Po voxel downsampling: {len(np.asarray(pcd.points)):,}")
        print(f"      • Bodov na stenách: {len(wall_points):,}")
        print(f"      • Bodov v 2D (IQR): {len(points_2d):,}")
        print(f"      • Veľké obrysy: {len(large_contours)}")
        print(f"      • Vrcholy polygónu: {len(approx)}")
        print(f"      • Plocha: {real_area:.2f} m²")
        print(f"      • Rozmer: {img_width}x{img_height} px")
        print(f"   ✅ FLOOR PLAN HOTOVÝ (CLEANED)!\n")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Generate podoris error: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_nerfstudio_reconstruction(images_dir: str, output_model: str, status: str, project_id: str) -> bool:
    """
    Spusti Nerfstudio na generovanie 3D modelu
    
    Args:
        images_dir: Cesta k priečinku s obrazmi
        output_model: Cesta k výstupnému PLY súboru
        status: Aktuálny status projektu
        project_id: ID projektu (na update Supabase)
    
    Výstup: PLY súbor v output_model
    """
    try:
        print(f"\n⏳ NERFSTUDIO spustená na: {images_dir}\n{status}")

        print(f"   ⌛ Čakam na dokončenie (30 min pre ns-process-data + 60 min pre ns-train)...\n")
        
        # =========================================
        # 2. DETEKCIA PODLAHY
        # =========================================
        print(f"   2️⃣  Detecting floor plane...")
        
        try:
            # RANSAC detekcia podlahy (najväčšia horizontálna rovina)
            plane_model, inliers = pcd.segment_plane(
                distance_threshold=0.05,  # 5cm tolerance
                ransac_n=3,
                num_iterations=1000
            )
            
            [a, b, c, d] = plane_model
            print(f"      Rovina: [{a:.3f}x + {b:.3f}y + {c:.3f}z + {d:.3f} = 0]")
            print(f"      Body na podlahe: {len(inliers):,}")
            
            # Vyber podlahu
            floor = pcd.select_by_index(inliers)
            rest = pcd.select_by_index(inliers, invert=True)
            
            # Nájdi výšku podlahy (Z-os)
            floor_points = np.asarray(floor.points)
            floor_height = np.median(floor_points[:, 2])
            print(f"      Výška podlahy: {floor_height:.2f}m")
            
            print(f"      ✅ Podlaha detekovaná\n")
            
        except Exception as e:
            print(f"   ⚠️  Detekcia podlahy zlyhala: {e}")
            print(f"   💡 Budem používať filtráciu podľa výšky\n")
            floor = pcd
            rest = pcd
            floor_height = np.median(np.asarray(pcd.points)[:, 2])
        
        # =========================================
        # 2.5 FILTRÁCIA BODOV PODĽA VÝŠKY (STENY)
        # =========================================
        print(f"   2️⃣.5️⃣  Filtering wall points by height...")
        
        # Body ktoré nie sú na podlahe a nie na strope sú steny
        rest_points = np.asarray(rest.points)
        
        # Zabezpeč výšku stien - väčšinu bodov medzi podlahou a stropom
        z_values = rest_points[:, 2]
        z_min_wall = np.percentile(z_values, 10)
        z_max_wall = np.percentile(z_values, 90)
        
        # Filtruj body - body ktoré sú blízko tejto výškovej vrstvy
        wall_height_range = 0.3  # 30cm rôznorodosti
        wall_mask = (z_values >= z_min_wall - wall_height_range) & (z_values <= z_max_wall + wall_height_range)
        wall_points_filtered = rest_points[wall_mask]
        
        print(f"      Výšková vrstva stien: [{z_min_wall:.2f}, {z_max_wall:.2f}]")
        print(f"      Bodov po filtrácii výšky: {len(wall_points_filtered):,}")
        print(f"      ✅ Filtrácia hotová\n")
        
        # =========================================
        # 3. DETEKCIA STIEN - ZJEDNODUŠENÝ PRÍSTUP
        # =========================================
        print(f"   3️⃣  Preparing wall points...")
        
        # Namiesto detekcie jednotlivých stien, jednoducho použi všetky filtrované body
        # (sú to už len steny vďaka filtrácii podľa výšky)
        print(f"      Body na stenách (po filtrácii výšky): {len(wall_points_filtered):,}")
        print(f"      ✅ Steny pripravené\n")
        
        # =========================================
        # 4. PROJEKCIA DO 2D (TOP-DOWN VIEW)
        # =========================================
        print(f"   4️⃣  Projecting to 2D...")
        
        # Priamo použi filtrované body (sú to všetky body na stenách)
        floorplan_3d = wall_points_filtered
        
        if len(floorplan_3d) < 500:
            print(f"      ⚠️  Málo bodov na stenách, neskúšam filtráciu")
            floorplan_3d = np.asarray(pcd.points)
        
        print(f"      Body na projekcii: {len(floorplan_3d):,}")
        
        # XY projekcia (top-down bez Y-osi/výšky)
        # Odstráň Z-os (výšku) a použi iba X,Y
        floorplan_2d = floorplan_3d[:, [0, 1]]  # [X, Y] - top-down
        
        # Filtuj outliers v 2D projekcii (body mimo typickej vzdialenosti)
        center_2d = np.median(floorplan_2d, axis=0)
        distances = np.linalg.norm(floorplan_2d - center_2d, axis=1)
        median_dist = np.median(distances)
        
        # Použi body ktoré sú v rozsahu 5x mediánu
        max_dist = median_dist * 5
        mask = distances <= max_dist
        floorplan_2d = floorplan_2d[mask]
        
        print(f"      Body po 2D filtrácii: {len(floorplan_2d):,}")
        print(f"      Rozsah X: [{floorplan_2d[:, 0].min():.2f}, {floorplan_2d[:, 0].max():.2f}]")
        print(f"      Rozsah Y: [{floorplan_2d[:, 1].min():.2f}, {floorplan_2d[:, 1].max():.2f}]")
        print(f"      ✅ Projekcia hotová\n")
        
        # =========================================
        # 5. KONVERZIA NA RASTER OBRAZ
        # =========================================
        print(f"   5️⃣  Converting to image...")
        
        # Normalizuj na image súradnice
        x_min, x_max = floorplan_2d[:, 0].min(), floorplan_2d[:, 0].max()
        y_min, y_max = floorplan_2d[:, 1].min(), floorplan_2d[:, 1].max()
        
        # Zabezpeč nenulovú veľkosť
        x_range = max(x_max - x_min, 0.1)
        y_range = max(y_max - y_min, 0.1)
        max_range = max(x_range, y_range)
        
        # Padding
        pad = max_range * 0.1
        x_min -= pad
        y_min -= pad
        x_max += pad
        y_max += pad
        
        scale = 500  # pixels na meter
        img_size = int(max(x_max - x_min, y_max - y_min) * scale) + 50
        
        # Zabezpeč rozumnu veľkosť
        img_size = max(400, min(img_size, 2000))
        
        img = np.zeros((img_size, img_size), dtype=np.uint8)
        
        # Transformuj body do image súradníc
        for p in floorplan_2d:
            x = (p[0] - x_min) / (x_max - x_min) * img_size
            y = (p[1] - y_min) / (y_max - y_min) * img_size
            
            x, y = int(x), int(y)
            
            if 0 <= x < img_size and 0 <= y < img_size:
                cv2.circle(img, (x, y), 1, 255, -1)  # Bodka
        
        print(f"      Rozmer obrazu: {img_size}x{img_size}")
        print(f"      Body v obraze: {np.count_nonzero(img)}")
        
        # =========================================
        # 6. MORPHOLOGICAL CLEANUP
        # =========================================
        print(f"      Cleaning up image...")
        
        # Gaussian blur na vyhladenie
        img_blur = cv2.GaussianBlur(img, (11, 11), 0)
        
        # Prah pre binárny obraz
        _, img_binary = cv2.threshold(img_blur, 20, 255, cv2.THRESH_BINARY)
        
        # Morfologické operácie
        kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # Closing - spoji blízke časti
        img_close = cv2.morphologyEx(img_binary, cv2.MORPH_CLOSE, kernel_large, iterations=3)
        
        # Opening - odstráni malý šum
        img_clean = cv2.morphologyEx(img_close, cv2.MORPH_OPEN, kernel_small, iterations=1)
        
        # Dilatácia na spôsobenie lepších obrysom
        img_clean = cv2.dilate(img_clean, kernel_small, iterations=1)
        
        print(f"      ✅ Cleaning complete")
        
        # =========================================
        # 7. CONTOUR EXTRACTION
        # =========================================
        print(f"      Extracting contours...")
        
        contours, _ = cv2.findContours(img_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        print(f"      Nájdené obrysy: {len(contours)}")
        
        if len(contours) == 0:
            print(f"   ⚠️  Žiadne obrysy nenájdené")
            print(f"   💾 Ukladám raw visualization\n")
            
            # Ulož iba raw vizualizáciu
            vis_img = cv2.cvtColor(img_clean, cv2.COLOR_GRAY2BGR)
            output_path = podoris_dir / "podoris_floor_plan.png"
            cv2.imwrite(str(output_path), vis_img)
            
            metadata = {
                'status': 'no_contours',
                'points': int(len(points)),
                'generated_at': datetime.now().isoformat()
            }
            metadata_json = podoris_dir / "detections.json"
            with open(metadata_json, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            return True
        
        # Vyber najväčší obrys (hlavná miestnosť)
        # Ale skontroluj aby bol rozumne veľký
        valid_contours = [c for c in contours if cv2.contourArea(c) > (img_clean.size * 0.01)]  # Min 1% obrazu
        
        if not valid_contours:
            print(f"   ⚠️  Žiadny dostatočne veľký obrys")
            print(f"   💾 Ukladám všetky obrysy\n")
            largest_contour = max(contours, key=cv2.contourArea)
        else:
            largest_contour = max(valid_contours, key=cv2.contourArea)
        
        area = cv2.contourArea(largest_contour)
        print(f"      Hlavný obrys: {area:.0f} px²")
        
        # =========================================
        # 8. POLYGON SIMPLIFICATION
        # =========================================
        # Adaptívny epsilon podľa perimetra
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        print(f"      Zjednodušené body: {len(approx)}")
        print(f"      ✅ Floor plan pripravený\n")
        
        # =========================================
        # 9. VIZUALIZÁCIA A EXPORT
        # =========================================
        print(f"   6️⃣  Rendering and exporting...")
        
        # Vytvori barevný výstup
        vis_img = cv2.cvtColor(img_clean, cv2.COLOR_GRAY2BGR)
        
        # Nakresli všetky obrysy (svetlo šedé)
        cv2.drawContours(vis_img, contours, -1, (200, 200, 200), 2)
        
        # Nakresli hlavný obrys (tmavomodrý)
        cv2.drawContours(vis_img, [largest_contour], 0, (200, 100, 50), 3)
        
        # Nakresli zjednodušený polygon (červený)
        cv2.drawContours(vis_img, [approx], 0, (0, 0, 255), 2)
        
        # Nakresli vrcholy (zelené bodky)
        for point in approx:
            cv2.circle(vis_img, tuple(point[0]), 5, (0, 255, 0), -1)
        
        # Info texty
        cv2.putText(vis_img, f"Vertices: {len(approx)}", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(vis_img, f"Area: {area:.0f} px", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(vis_img, f"Points: {len(floorplan_2d):,}", 
                   (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(vis_img, f"Scale: {scale} px/m", 
                   (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        
        # Legenda
        cv2.putText(vis_img, "Legend:", 
                   (10, img_size - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        cv2.circle(vis_img, (30, img_size - 30), 3, (0, 255, 0), -1)
        cv2.putText(vis_img, "Vertices", 
                   (45, img_size - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        
        # Ulož PNG
        output_png = podoris_dir / "podoris_floor_plan.png"
        cv2.imwrite(str(output_png), vis_img)
        print(f"      ✅ PNG: {output_png.name}")
        
        # =========================================
        # 10. EXPORT SVG
        # =========================================
        try:
            import svgwrite
            
            svg_path = podoris_dir / "podoris_floor_plan.svg"
            dwg = svgwrite.Drawing(str(svg_path), size=(f"{img_size}px", f"{img_size}px"))
            
            # Polygón stien
            svg_points = [(float(p[0][0]), float(p[0][1])) for p in approx]
            dwg.add(dwg.polygon(svg_points, stroke='black', stroke_width=2, fill='white'))
            
            # Body
            for p in svg_points:
                dwg.add(dwg.circle(center=p, r=2, fill='red'))
            
            dwg.save()
            print(f"      ✅ SVG: {svg_path.name}")
            
        except ImportError:
            print(f"      ℹ️  svgwrite neinstalovaný, SVG preskočený")
        
        # =========================================
        # 11. METADÁTA
        # =========================================
        metadata = {
            'floor_plan': {
                'vertices': int(len(approx)),
                'area_pixels': float(area),
                'polygons': int(len(contours)),
                'scale': f"{scale} pixels per meter",
                'image_size': img_size,
                'perimeter': float(cv2.arcLength(largest_contour, True))
            },
            'point_cloud': {
                'total_points_before': int(len(points)),
                'wall_points': int(len(wall_points_filtered)),
                'projection_points': int(len(floorplan_2d)),
                'bounds': {
                    'x': [float(floorplan_2d[:, 0].min()), float(floorplan_2d[:, 0].max())],
                    'y': [float(floorplan_2d[:, 1].min()), float(floorplan_2d[:, 1].max())]
                }
            },
            'processing': {
                'outlier_removal': True,
                'gaussian_blur': True,
                'morphological_ops': True,
                'projection': 'XY (top-down)',
                'height_filtering': True,
                '2d_filtering': True
            },
            'generated_at': datetime.now().isoformat()
        }
        
        metadata_json = podoris_dir / "detections.json"
        with open(metadata_json, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"      ✅ Metadáta: {metadata_json.name}")
        
        print(f"\n   📊 Sumarizácia floor planu:")
        print(f"      • Vstupných bodov: {len(points):,}")
        print(f"      • Bodov na stenách: {len(wall_points_filtered):,}")
        print(f"      • Bodov v projekcii: {len(floorplan_2d):,}")
        print(f"      • Obrysy: {len(contours)}")
        print(f"      • Vrcholy polygónu: {len(approx)}")
        print(f"      • Plocha: {area:.0f} pixelov")
        print(f"      • Rozmer: {img_size}x{img_size}")
        print(f"   ✅ Step 4 hotový!\n")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Generate podoris error: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_nerfstudio_reconstruction(images_dir: str, output_model: str, status: str, project_id: str) -> bool:
    """
    Spusti Nerfstudio na generovanie 3D modelu
    
    Args:
        images_dir: Cesta k priečinku s obrazmi
        output_model: Cesta k výstupnému PLY súboru
        status: Aktuálny status projektu
        project_id: ID projektu (na update Supabase)
    
    Výstup: PLY súbor v output_model
    """
    try:
        print(f"\n⏳ NERFSTUDIO spustená na: {images_dir}\n{status}")

        print(f"   ⌛ Čakam na dokončenie (30 min pre ns-process-data + 60 min pre ns-train)...\n")
        
        images_path = Path(images_dir)
        if not images_path.exists() or not list(images_path.glob("*")):
            print(f"❌ No images found in: {images_dir}")
            return False
        
        # Všetko do processed foldra v owner_id/project_id/
        project_dir = images_path.parent  # owner_id/project_id
        processed_base = project_dir / "processed"  # owner_id/project_id/processed
        step1_dir = processed_base / "step1"  # owner_id/project_id/processed/step1
        step2_dir = processed_base / "step2"  # owner_id/project_id/processed/step2
        model_dir = project_dir / "3Dmodel"  # owner_id/project_id/3Dmodel
        
        step1_dir.mkdir(parents=True, exist_ok=True)
        step2_dir.mkdir(parents=True, exist_ok=True)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        
        # ============================================
        # STEP 1: Process images
        # ============================================

        if status == "pending":
            print("Zacinam run_process_data")
            if not run_process_data(images_path, step1_dir):
                return False
            update_project_status(project_id, "procesing")
            status = "procesing"
        
        # ============================================
        # STEP 2: Train NeRF
        # ============================================
        if status == "procesing":
            print("Zacinam run_train_nerf")
            if not run_train_nerf(step1_dir, step2_dir):
                return False
            update_project_status(project_id, "training")
            status = "training"
        
        # ============================================
        # STEP 3: Export to PLY
        # ============================================
        if status == "training":
            print("Zacinam run_export_pointcloud")
            # Hľadaj config.yml - ak neexistuje na štandardnej ceste, hľadaj rekurzívne
            config_path = step2_dir / "nerfacto" / "config.yml"
            if not config_path.exists():
                try:
                    config_path = find_config_yml(step2_dir)
                except FileNotFoundError:
                    print(f"❌ config.yml nebol nájdený v priečinku: {step2_dir}")
                    return False

            if not run_export_pointcloud(config_path, model_dir):
                return False
            update_project_status(project_id, "generated")
            status = "generated"
        
        if status == "generated" or status == "Generated":
            print("Zacinam Generate_Podoris")
            # Hľadaj config.yml ak nie je definovaný
            if 'config_path' not in locals() or not config_path.exists():
                try:
                    config_path = find_config_yml(step2_dir)
                except FileNotFoundError:
                    print(f"❌ config.yml nebol nájdený v priečinku: {step2_dir}")
                    return False
            
            if not Generate_Podoris(model_dir, config_path, images_path):
                return False
            update_project_status(project_id, "podoris")
            status = "podoris"

        print(f"\n✅ NERFSTUDIO rekonštrukcia skončená!")
        print(f"   📁 PLY model: {model_dir}\n")
        return True
        
    except Exception as e:
        print(f"❌ Nerfstudio error: {e}")
        import traceback
        traceback.print_exc()
        return False
