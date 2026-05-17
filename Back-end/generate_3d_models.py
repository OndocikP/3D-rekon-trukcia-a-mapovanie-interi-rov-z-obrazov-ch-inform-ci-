"""
Automatické generovanie 3D modelov pomocou Nerfstudio
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

# Nastavenie logovania
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
    "method": "nerfacto",  # Rýchly a kvalitný model
    "output_format": "pointcloud",  # PLY format pre ns-viewer
    "max_num_iterations": 30000,  # Default iterácie (môžeš zmeniť)
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
            logger.warning(f"❌ Obrázky neexistujú: {self.images_path}")
            return False
        
        # Count images without duplicates (Windows glob is case-insensitive)
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = set()
        for file in self.images_path.iterdir():
            if file.is_file() and file.suffix.lower() in image_extensions:
                image_files.add(file.name)
        
        image_count = len(image_files)
        if image_count < 5:
            logger.warning(f"⚠️ Málo obrázkov ({image_count}). Potrebujem aspoň 5.")
            return False
        
        logger.info(f"✅ Nájdené {image_count} obrázkov")
        return True
    
    def check_existing_model(self) -> bool:
        """Skontroluj či existuje hotový 3D model"""
        if not self.model_path.exists():
            return False
        
        ply_files = list(self.model_path.glob("*.ply"))
        if ply_files:
            logger.info(f"✅ Model už existuje: {ply_files[0].name}")
            return True
        
        return False
    
    def prepare_directories(self):
        """Príprava priečinkov pre training"""
        self.model_path.mkdir(parents=True, exist_ok=True)
        self.output_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Priečinky pripravené: {self.model_path}")
    
    def train_nerf(self) -> bool:
        """Spustenie Nerfstudio trainingu"""
        try:
            logger.info(f"🚀 Spúšťam Nerfstudio training...")
            logger.info(f"   Projekt: {self.project_id}")
            logger.info(f"   Obrázky: {self.images_path}")
            logger.info(f"   Výstup: {self.output_path}")
            
            # Processed images directory
            processed_dir = self.output_path / "processed_images"
            
            # Suppress Nerfstudio warnings that are not fatal
            env = {
                **os.environ,
                'PYTHONIOENCODING': 'utf-8',
                'PYTHONWARNINGS': 'ignore::FutureWarning,ignore::RuntimeWarning',
            }
            
            # ============================================
            # STEP 1: Process images with ns-process-data
            # ============================================
            logger.info(f"   📷 Step 1: Processing images...")
            
            cmd_process = (
                f'chcp 65001 && '
                f'conda activate nerfstudio && '
                f'ns-process-data images '
                f'--data "{self.images_path}" '
                f'--output-dir "{processed_dir}"'
            )
            
            logger.info(f"🔧 Process: {cmd_process[:80]}...")
            
            result = subprocess.run(
                ['cmd', '/c', cmd_process],
                capture_output=True,
                text=True,
                env=env,
                timeout=1800  # 30 minute timeout for processing
            )
            
            if result.returncode != 0:
                stderr_lines = result.stderr.split('\n')
                real_errors = [
                    line for line in stderr_lines
                    if line and not any(warning in line for warning in [
                        'RuntimeWarning', 'FutureWarning', 'torch.compile',
                        'torch.cuda.amp', 'DeprecationWarning'
                    ])
                ]
                
                if real_errors:
                    logger.error(f"❌ Image processing error: {real_errors[0][:200]}")
                    return False
            
            logger.info(f"✅ Images processed successfully")
            
            # ============================================
            # STEP 2: Train NeRF model with ns-train
            # ============================================
            logger.info(f"   🧠 Step 2: Training NeRF model...")
            
            cmd_train = (
                f'chcp 65001 && '
                f'conda activate nerfstudio && '
                f'ns-train {NERFSTUDIO_CONFIG["method"]} '
                f'--data "{processed_dir}" '
                f'--output-dir "{self.output_path}" '
                f'--experiment-name project_{self.project_id[:8]}'
            )
            
            logger.info(f"🔧 Train: {cmd_train[:80]}...")
            
            result = subprocess.run(
                ['cmd', '/c', cmd_train],
                capture_output=True,
                text=True,
                env=env,
                timeout=3600  # 1 hour timeout
            )
            
            if result.returncode != 0:
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
                    logger.error(f"❌ Training error: {real_errors[0][:200]}")
                    return False
                else:
                    logger.info(f"✅ Training completed (with non-fatal warnings)")
                    return True
            
            logger.info(f"✅ Training dokončený")
            return True
            
        except subprocess.TimeoutExpired:
            logger.error(f"❌ Training timeout")
            return False
        except Exception as e:
            logger.error(f"❌ Chyba pri trainingu: {e}", exc_info=True)
            return False
    
    def export_pointcloud(self) -> bool:
        """Exportovanie modelu ako PLY pointcloud"""
        try:
            # Nájdi najnovší config.yml v outputs
            configs = list(self.output_path.glob(f"{NERFSTUDIO_CONFIG['method']}/*/config.yml"))
            
            if not configs:
                logger.error(f"❌ Config.yml nebol nájdený")
                return False
            
            latest_config = sorted(configs)[-1]
            logger.info(f"📝 Používam config: {latest_config}")
            
            # Príkaz na export
            cmd = [
                "ns-export",
                "pointcloud",
                "--load-config", str(latest_config),
                "--output-dir", str(self.model_path),
                "--num-points", "1000000",  # Počet bodov v pointcloud
            ]
            
            logger.info(f"🔧 Export príkaz: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(self.project_path)
            )
            
            if result.returncode != 0:
                logger.error(f"❌ Export error: {result.stderr}")
                return False
            
            logger.info(f"✅ Export dokončený")
            
            # Skontroluj či existuje PLY súbor
            ply_files = list(self.model_path.glob("*.ply"))
            if ply_files:
                logger.info(f"✅ PLY model vytvorený: {ply_files[0].name}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Chyba pri exporte: {e}")
            return False
    
    def process_project(self) -> bool:
        """Spracovanie projektu - full pipeline"""
        logger.info(f"\n{'='*60}")
        logger.info(f"📦 Spracovávam projekt: {self.project_id}")
        logger.info(f"{'='*60}")
        
        # 1. Skontroluj obrázky
        if not self.check_images():
            return False
        
        # 2. Skontroluj existujúci model
        if self.check_existing_model():
            logger.info(f"⏭️  Model už existuje, preskakujem")
            return True
        
        # 3. Príprava
        self.prepare_directories()
        
        # 4. Training
        if not self.train_nerf():
            logger.error(f"❌ Training neuspešný")
            return False
        
        # 5. Export
        if not self.export_pointcloud():
            logger.error(f"❌ Export neuspešný")
            return False
        
        logger.info(f"✅ Projekt úspešne spracovaný: {self.project_id}\n")
        return True


def scan_and_process_projects():
    """Skenuj všetky projekty a spracuj tie bez modelov"""
    
    if not PROJECTS_PATH.exists():
        logger.error(f"❌ PROJECTS_PATH neexistuje: {PROJECTS_PATH}")
        return
    
    logger.info(f"\n{'='*60}")
    logger.info(f"🔍 Skenujem projekty v: {PROJECTS_PATH}")
    logger.info(f"{'='*60}\n")
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Prejdeme všetky user_id priečinky
    for user_dir in sorted(PROJECTS_PATH.iterdir()):
        if not user_dir.is_dir():
            continue
        
        user_id = user_dir.name
        logger.info(f"\n👤 Používateľ: {user_id}")
        
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
                logger.warning("⚠️ Prerušené používateľom")
                sys.exit(0)
            except Exception as e:
                logger.error(f"❌ Neočakávaná chyba: {e}")
                error_count += 1
    
    # Súhrn
    logger.info(f"\n{'='*60}")
    logger.info(f"📊 SÚHRN:")
    logger.info(f"   ✅ Spracované: {processed_count}")
    logger.info(f"   ⏭️  Preskočené: {skipped_count}")
    logger.info(f"   ❌ Chyby: {error_count}")
    logger.info(f"{'='*60}\n")


def generate_single_project(project_id: str, user_id: str):
    """Generuj model pre konkrétny projekt (volané z API)"""
    
    project_path = PROJECTS_PATH / user_id / project_id
    
    if not project_path.exists():
        logger.error(f"❌ Projekt neexistuje: {project_path}")
        return False
    
    try:
        trainer = NerfstudioTrainer(project_path, project_id, user_id)
        return trainer.process_project()
    except Exception as e:
        logger.error(f"❌ Chyba: {e}")
        return False


if __name__ == "__main__":
    """
    Spustenie:
    - Bez argumentov: python generate_3d_models.py
      -> Prejde všetky projekty
    
    - S argumentmi: python generate_3d_models.py <user_id> <project_id>
      -> Generuje model pre konkrétny projekt
    """
    
    if len(sys.argv) == 3:
        # Spracovanie konkrétneho projektu
        user_id = sys.argv[1]
        project_id = sys.argv[2]
        logger.info(f"🎯 Generujem model pre projekt: {user_id}/{project_id}")
        generate_single_project(project_id, user_id)
    else:
        # Spracovanie všetkich projektov
        scan_and_process_projects()
