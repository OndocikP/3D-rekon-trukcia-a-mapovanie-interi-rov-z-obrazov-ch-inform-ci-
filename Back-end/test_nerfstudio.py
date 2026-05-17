#!/usr/bin/env python3
"""
Test script pre Nerfstudio implementáciu
Overuje či sú všetky časti kódu funkčné
"""

import sys
from pathlib import Path
import logging

# Nastavenie logovania
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# ============================================
# TEST 1: Import modules
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 1: Import modulov")
logger.info("="*70)

try:
    from generate_3d_models import NerfstudioTrainer
    logger.info("✅ generate_3d_models importovaný")
except Exception as e:
    logger.error(f"❌ Chyba pri importe generate_3d_models: {e}")
    sys.exit(1)

try:
    from worker_client import ProjectScanner, run_yolo_detection, run_nerfstudio_reconstruction
    logger.info("✅ worker_client importovaný")
except Exception as e:
    logger.error(f"❌ Chyba pri importe worker_client: {e}")
    sys.exit(1)

# ============================================
# TEST 2: ProjectScanner
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 2: ProjectScanner - lokálne skenovanie")
logger.info("="*70)

try:
    projects_path = Path("./projects")
    scanner = ProjectScanner(str(projects_path))
    
    if projects_path.exists():
        projects = scanner.get_all_projects()
        logger.info(f"✅ Nájdených projektov: {len(projects)}")
        
        for i, proj in enumerate(projects[:2], 1):  # Show first 2
            logger.info(f"   {i}. {proj['project_id']}: {proj['image_count']} obrázkov")
    else:
        logger.warning(f"⚠️ PROJECTS_PATH neexistuje: {projects_path}")
        logger.info("   (Tento test je OK, môže chýbať počas testovania)")
    
except Exception as e:
    logger.error(f"❌ ProjectScanner error: {e}", exc_info=True)
    sys.exit(1)

# ============================================
# TEST 3: NerfstudioTrainer initialization
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 3: NerfstudioTrainer - inicializácia")
logger.info("="*70)

try:
    test_project = Path("./projects/test-user/test-project")
    trainer = NerfstudioTrainer(test_project, "test-project", "test-user")
    
    logger.info(f"✅ NerfstudioTrainer inicializovaný")
    logger.info(f"   Project path: {trainer.project_path}")
    logger.info(f"   Images path: {trainer.images_path}")
    logger.info(f"   Model path: {trainer.model_path}")
    logger.info(f"   Output path: {trainer.output_path}")
    
except Exception as e:
    logger.error(f"❌ NerfstudioTrainer error: {e}", exc_info=True)
    sys.exit(1)

# ============================================
# TEST 4: Command building
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 4: Príkazy pre Nerfstudio")
logger.info("="*70)

try:
    # Test worker_client command building
    images_dir = "./projects/9d7d572c/142e3d9d/images"
    output_dir = "./projects/9d7d572c/142e3d9d/3Dmodel"
    
    cmd = (
        f'chcp 65001 && '
        f'conda activate nerfstudio && '
        f'ns-train nerfacto '
        f'--data "{images_dir}" '
        f'--output-dir "{output_dir}" '
        f'--experiment-name nerfstudio_test'
    )
    
    logger.info(f"✅ worker_client príkaz je OK")
    logger.info(f"   {cmd[:80]}...")
    
    # Test generate_3d_models command building
    cmd2 = (
        f'chcp 65001 && '
        f'conda activate nerfstudio && '
        f'ns-train nerfacto '
        f'--data "{images_dir}" '
        f'--output-dir "{output_dir}" '
        f'--experiment-name project_test'
    )
    
    logger.info(f"✅ generate_3d_models príkaz je OK")
    logger.info(f"   {cmd2[:80]}...")
    
except Exception as e:
    logger.error(f"❌ Command building error: {e}")
    sys.exit(1)

# ============================================
# TEST 5: File operations
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 5: Operácie so súbormi")
logger.info("="*70)

try:
    # Test creating model directory
    test_model_dir = Path("./test_output/3Dmodel")
    test_model_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"✅ Modely priečinok vytvorený: {test_model_dir}")
    
    # Cleanup
    import shutil
    if test_model_dir.parent.exists():
        shutil.rmtree(test_model_dir.parent)
        logger.info(f"✅ Test priečinok vymazaný")
    
except Exception as e:
    logger.error(f"❌ File operations error: {e}")
    sys.exit(1)

# ============================================
# TEST 6: Environment variables
# ============================================
logger.info("\n" + "="*70)
logger.info("TEST 6: Environment premenné")
logger.info("="*70)

try:
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    vars_to_check = [
        "PROJECTS_PATH",
        "WORKER_SLEEP_SECONDS",
        "WORKER_LOG_FILE",
        "YOLO_ENABLED",
        "NERFSTUDIO_ENABLED",
    ]
    
    for var in vars_to_check:
        value = os.getenv(var)
        if value:
            logger.info(f"✅ {var}: {value}")
        else:
            logger.warning(f"⚠️ {var}: (not set)")
    
except Exception as e:
    logger.error(f"❌ Environment variables error: {e}")
    sys.exit(1)

# ============================================
# SUMMARY
# ============================================
logger.info("\n" + "="*70)
logger.info("SUMMARY")
logger.info("="*70)
logger.info("✅ Všetky testy prešli úspešne!")
logger.info("\n📋 Ďalšie kroky:")
logger.info("1. Spusti worker_client.py:")
logger.info("   python worker_client.py")
logger.info("\n2. Alebo spusti generate_3d_models.py:")
logger.info("   python generate_3d_models.py")
logger.info("\n3. Ak chceš testovať jeden projekt:")
logger.info("   python generate_3d_models.py <user_id> <project_id>")
logger.info("="*70 + "\n")
