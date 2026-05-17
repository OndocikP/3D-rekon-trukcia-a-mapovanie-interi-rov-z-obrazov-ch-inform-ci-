"""
Automatické generovanie 3D modelov pomocou Nerfstudio - WINDOWS COMPATIBLE
- Bezproblémový na Windows CMD (bez Unicode znakov)
- Prejde všetky projekty v PROJECTS_PATH
- Ak projekt nemá vytvorený 3D model, automaticky ho vytvorí
- Exportuje model ako .ply súbor pre ns-viewer
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
import logging

# Nastavenie logovania - bez emojis pre Windows kompatibilitu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('nerfstudio_training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Načítaj .env
load_dotenv()
PROJECTS_PATH = Path(os.getenv('PROJECTS_PATH', './projects'))

# Konfigurácia Nerfstudio
NERFSTUDIO_CONFIG = {
    "method": "nerfacto",
    "output_format": "pointcloud",
    "max_num_iterations": 30000,
    "save_interval": 1000,
}

class NerfstudioTrainer:
    """Trieda na správu Nerfstudio trainingu"""
    
    def __init__(self, project_path: Path, project_id: str, user_id: str):
        self.project_path = project_path
        self.project_id = project_id
        self.user_id = user_id
        self.images_path = project_path / "images"
        self.model_path = project_path / "3Dmodel"
        self.output_path = project_path / "outputs"
        
    def check_images(self) -> bool:
        """Skontroluj či existujú obrázky na training"""
        if not self.images_path.exists():
            logger.warning("[!] Obrazky neexistuju: {}".format(self.images_path))
            return False
        
        image_files = list(self.images_path.glob("*.jpg")) + \
                     list(self.images_path.glob("*.jpeg")) + \
                     list(self.images_path.glob("*.png")) + \
                     list(self.images_path.glob("*.JPG")) + \
                     list(self.images_path.glob("*.PNG"))
        
        if len(image_files) < 5:
            logger.warning("[!] Malo obrazkov ({}). Potrebujem aspon 5.".format(len(image_files)))
            return False
        
        logger.info("[OK] Najdene {} obrazkov".format(len(image_files)))
        return True
    
    def check_existing_model(self) -> bool:
        """Skontroluj či existuje hotový 3D model"""
        if not self.model_path.exists():
            return False
        
        ply_files = list(self.model_path.glob("*.ply"))
        if ply_files:
            logger.info("[OK] Model uz existuje: {}".format(ply_files[0].name))
            return True
        
        return False
    
    def prepare_directories(self):
        """Príprava priečinkov pre training"""
        self.model_path.mkdir(parents=True, exist_ok=True)
        self.output_path.mkdir(parents=True, exist_ok=True)
        logger.info("[OK] Priecinky pripravene: {}".format(self.model_path))
    
    def train_nerf(self) -> bool:
        """Spustenie Nerfstudio trainingu"""
        try:
            logger.info("[RUN] Spustam Nerfstudio training...")
            logger.info("[INFO] Projekt: {}".format(self.project_id))
            logger.info("[INFO] Obrazky: {}".format(self.images_path))
            logger.info("[INFO] Vystup: {}".format(self.output_path))
            
            # Príkaz na spustenie trainingu
            cmd = [
                "ns-train",
                NERFSTUDIO_CONFIG["method"],
                "--data", str(self.images_path),
                "--output-dir", str(self.output_path),
                "--experiment-name", "project_{}".format(self.project_id[:8]),
            ]
            
            logger.info("[CMD] Prikaz: {}".format(' '.join(cmd)))
            
            # Spusti training
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(self.project_path),
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}
            )
            
            if result.returncode != 0:
                logger.error("[ERR] Nerfstudio error: {}".format(result.stderr[:500]))
                return False
            
            logger.info("[OK] Training dokonceny")
            return True
            
        except Exception as e:
            logger.error("[ERR] Chyba pri trainingu: {}".format(e))
            return False
    
    def export_pointcloud(self) -> bool:
        """Exportovanie modelu ako PLY pointcloud"""
        try:
            # Nájdi najnovší config.yml v outputs
            configs = list(self.output_path.glob("**/config.yml"))
            
            if not configs:
                logger.error("[ERR] Config.yml nebol najdeny")
                return False
            
            latest_config = sorted(configs)[-1]
            logger.info("[INFO] Pouzivam config: {}".format(latest_config))
            
            # Príkaz na export
            cmd = [
                "ns-export",
                "pointcloud",
                "--load-config", str(latest_config),
                "--output-dir", str(self.model_path),
                "--num-points", "1000000",
            ]
            
            logger.info("[CMD] Export prikaz: {}".format(' '.join(cmd)))
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(self.project_path),
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}
            )
            
            if result.returncode != 0:
                logger.error("[ERR] Export error: {}".format(result.stderr[:500]))
                return False
            
            logger.info("[OK] Export dokonceny")
            
            # Skontroluj či existuje PLY súbor
            ply_files = list(self.model_path.glob("*.ply"))
            if ply_files:
                logger.info("[OK] PLY model vytvoreny: {}".format(ply_files[0].name))
                return True
            
            return False
            
        except Exception as e:
            logger.error("[ERR] Chyba pri exporte: {}".format(e))
            return False
    
    def process_project(self) -> bool:
        """Spracovanie projektu - full pipeline"""
        logger.info("\n{}".format("="*70))
        logger.info("[START] Spracovavam projekt: {}".format(self.project_id))
        logger.info("{}".format("="*70))
        
        # 1. Skontroluj obrázky
        if not self.check_images():
            return False
        
        # 2. Skontroluj existujúci model
        if self.check_existing_model():
            logger.info("[SKIP] Model uz existuje, preskakujem")
            return True
        
        # 3. Príprava
        self.prepare_directories()
        
        # 4. Training
        if not self.train_nerf():
            logger.error("[ERR] Training neuspesny")
            return False
        
        # 5. Export
        if not self.export_pointcloud():
            logger.error("[ERR] Export neuspesny")
            return False
        
        logger.info("[OK] Projekt uspesne spracovany: {}\n".format(self.project_id))
        return True


def scan_and_process_projects():
    """Skenuj všetky projekty a spracuj tie bez modelov"""
    
    if not PROJECTS_PATH.exists():
        logger.error("[ERR] PROJECTS_PATH neexistuje: {}".format(PROJECTS_PATH))
        return
    
    logger.info("\n{}".format("="*70))
    logger.info("[INFO] Skenujem projekty v: {}".format(PROJECTS_PATH))
    logger.info("{}".format("="*70) + "\n")
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Prejdeme všetky user_id priečinky
    for user_dir in sorted(PROJECTS_PATH.iterdir()):
        if not user_dir.is_dir():
            continue
        
        user_id = user_dir.name
        logger.info("[USER] {}".format(user_id))
        
        # Prejdeme všetky projekt priečinky
        for project_dir in sorted(user_dir.iterdir()):
            if not project_dir.is_dir():
                continue
            
            project_id = project_dir.name
            
            try:
                # Spracovanie projektu
                trainer = NerfstudioTrainer(project_dir, project_id, user_id)
                
                if trainer.process_project():
                    processed_count += 1
                else:
                    error_count += 1
                    
            except KeyboardInterrupt:
                logger.warning("[STOP] Prerusene uzivatelom")
                sys.exit(0)
            except Exception as e:
                logger.error("[ERR] Neoakavana chyba: {}".format(e))
                error_count += 1
    
    # Súhrn
    logger.info("\n{}".format("="*70))
    logger.info("[SUMMARY] VYSLEDKY:")
    logger.info("[OK] Spracovane: {}".format(processed_count))
    logger.info("[SKIP] Preskocene: {}".format(skipped_count))
    logger.info("[ERR] Chyby: {}".format(error_count))
    logger.info("{}".format("="*70) + "\n")


def generate_single_project(project_id: str, user_id: str):
    """Generuj model pre konkrétny projekt (volané z API)"""
    
    project_path = PROJECTS_PATH / user_id / project_id
    
    if not project_path.exists():
        logger.error("[ERR] Projekt neexistuje: {}".format(project_path))
        return False
    
    try:
        trainer = NerfstudioTrainer(project_path, project_id, user_id)
        return trainer.process_project()
    except Exception as e:
        logger.error("[ERR] Chyba: {}".format(e))
        return False


if __name__ == "__main__":
    """
    Spustenie:
    - Bez argumentov: python generate_3d_models_win.py
      -> Prejde všetky projekty
    
    - S argumentmi: python generate_3d_models_win.py <user_id> <project_id>
      -> Generuje model pre konkrétny projekt
    """
    
    if len(sys.argv) == 3:
        # Spracovanie konkrétneho projektu
        user_id = sys.argv[1]
        project_id = sys.argv[2]
        logger.info("[INFO] Generujem model pre projekt: {}/{}".format(user_id, project_id))
        generate_single_project(project_id, user_id)
    else:
        # Spracovanie všetkých projektov
        scan_and_process_projects()
