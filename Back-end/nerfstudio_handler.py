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
        print(f"\n⏳ NERFSTUDIO spustená na: {images_dir}")
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
        
        print(f"\n✅ NERFSTUDIO rekonštrukcia skončená!")
        print(f"   📁 PLY model: {model_dir}\n")
        return True
        
    except Exception as e:
        print(f"❌ Nerfstudio error: {e}")
        import traceback
        traceback.print_exc()
        return False
