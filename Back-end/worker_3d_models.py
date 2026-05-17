"""
Worker - spúšťa 3D model generation v background/worker procese
Vhodný pre asyncné spracovanie bez blokovania API
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from generate_3d_models import NerfstudioTrainer, logger

# Načítaj .env
load_dotenv()
PROJECTS_PATH = Path(os.getenv('PROJECTS_PATH', './projects'))


async def process_project_async(user_id: str, project_id: str):
    """Asyncné spracovanie projektu"""
    
    project_path = PROJECTS_PATH / user_id / project_id
    
    if not project_path.exists():
        logger.error(f"❌ Projekt neexistuje: {project_path}")
        return False
    
    try:
        logger.info(f"🔄 Worker spracováva: {user_id}/{project_id}")
        
        trainer = NerfstudioTrainer(project_path, project_id, user_id)
        result = trainer.process_project()
        
        logger.info(f"✅ Worker dokončil: {user_id}/{project_id} - Výsledok: {result}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Worker chyba: {e}")
        return False


async def main():
    """Spustenie worker procesa"""
    
    if len(sys.argv) < 3:
        logger.error("Použitie: python worker_3d_models.py <user_id> <project_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    project_id = sys.argv[2]
    
    await process_project_async(user_id, project_id)


if __name__ == "__main__":
    asyncio.run(main())
