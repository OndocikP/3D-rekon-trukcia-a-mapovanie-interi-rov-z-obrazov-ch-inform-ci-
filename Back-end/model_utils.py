"""
Utility funkcie na prácu s 3D modelmi
- Kompresia PLY súborov
- Konverziya do iných formátov
- Validácia
"""

import os
from pathlib import Path
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

def get_ply_stats(ply_path: Path) -> dict:
    """Načítaj štatistiku PLY súboru"""
    try:
        if not ply_path.exists():
            return {"error": "File not found"}
        
        size_mb = ply_path.stat().st_size / (1024 * 1024)
        
        # Načítaj header
        with open(ply_path, 'rb') as f:
            header = []
            while True:
                line = f.readline().decode('utf-8', errors='ignore').strip()
                header.append(line)
                if line == "end_header":
                    break
        
        # Extrahuj počet bodov
        vertex_count = 0
        for line in header:
            if line.startswith("element vertex"):
                vertex_count = int(line.split()[-1])
                break
        
        return {
            "filename": ply_path.name,
            "size_mb": round(size_mb, 2),
            "vertices": vertex_count,
            "header_lines": len(header)
        }
    except Exception as e:
        logger.error(f"Error getting PLY stats: {e}")
        return {"error": str(e)}

def validate_ply(ply_path: Path) -> Tuple[bool, str]:
    """Validuj PLY súbor"""
    try:
        if not ply_path.exists():
            return False, "File not found"
        
        if not ply_path.name.endswith('.ply'):
            return False, "Not a PLY file"
        
        # Skontroluj header
        with open(ply_path, 'rb') as f:
            magic = f.readline().decode('utf-8', errors='ignore').strip()
            if magic != "ply":
                return False, "Invalid PLY magic number"
            
            # Čítaj ďalej
            header_found = False
            for _ in range(1000):
                line = f.readline().decode('utf-8', errors='ignore').strip()
                if line == "end_header":
                    header_found = True
                    break
                if not line and not header_found:
                    return False, "Header truncated"
            
            if not header_found:
                return False, "No end_header found"
            
            # Skontroluj či sú dáta
            if not f.read(1):
                return False, "No vertex data"
        
        return True, "Valid PLY file"
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return False, str(e)

def compress_ply(ply_path: Path, compression_level: int = 9) -> Optional[Path]:
    """
    Kompresuj PLY súbor (ZIP)
    - compression_level: 1-9 (1=rýchla, 9=max kompresia)
    """
    try:
        import zipfile
        
        if not ply_path.exists():
            logger.error("PLY file not found")
            return None
        
        zip_path = ply_path.with_suffix('.zip')
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=compression_level) as zf:
            zf.write(ply_path, arcname=ply_path.name)
        
        original_size = ply_path.stat().st_size / (1024 * 1024)
        compressed_size = zip_path.stat().st_size / (1024 * 1024)
        ratio = (1 - compressed_size / original_size) * 100
        
        logger.info(f"✅ PLY kompresovaný: {original_size:.2f}MB → {compressed_size:.2f}MB ({ratio:.1f}%)")
        
        return zip_path
    except Exception as e:
        logger.error(f"Compression error: {e}")
        return None

def ply_to_obj(ply_path: Path) -> Optional[Path]:
    """Konverzia PLY → OBJ format"""
    try:
        import trimesh
        
        if not ply_path.exists():
            logger.error("PLY file not found")
            return None
        
        # Načítaj PLY
        mesh = trimesh.load(str(ply_path))
        
        # Ulož ako OBJ
        obj_path = ply_path.with_suffix('.obj')
        mesh.export(str(obj_path))
        
        logger.info(f"✅ Konvertované na OBJ: {obj_path}")
        return obj_path
    except ImportError:
        logger.error("trimesh not installed. Install: pip install trimesh")
        return None
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return None

def ply_to_gltf(ply_path: Path) -> Optional[Path]:
    """Konverzia PLY → glTF format (Web)"""
    try:
        import trimesh
        
        if not ply_path.exists():
            logger.error("PLY file not found")
            return None
        
        # Načítaj PLY
        mesh = trimesh.load(str(ply_path))
        
        # Ulož ako glTF
        gltf_path = ply_path.with_suffix('.glb')
        mesh.export(str(gltf_path))
        
        logger.info(f"✅ Konvertované na glTF: {gltf_path}")
        return gltf_path
    except ImportError:
        logger.error("trimesh not installed. Install: pip install trimesh")
        return None
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return None

def get_project_model_info(project_path: Path) -> dict:
    """Načítaj informácie o modeli projektu"""
    model_path = project_path / "3Dmodel"
    
    info = {
        "exists": model_path.exists(),
        "models": [],
        "total_size_mb": 0
    }
    
    if not model_path.exists():
        return info
    
    # Nájdi všetky modely
    for ply_file in model_path.glob("*.ply"):
        stats = get_ply_stats(ply_file)
        info["models"].append(stats)
        info["total_size_mb"] += stats.get("size_mb", 0)
    
    return info

def cleanup_old_outputs(project_path: Path, keep_latest: int = 1) -> int:
    """Vymaž staré output priečinky (ponechaj len N najnovších)"""
    outputs_path = project_path / "outputs"
    
    if not outputs_path.exists():
        return 0
    
    deleted = 0
    
    # Nájdi všetky model_type priečinky
    for model_type_dir in outputs_path.iterdir():
        if not model_type_dir.is_dir():
            continue
        
        # Seraď podľa času úpravy
        timestamp_dirs = sorted(
            [d for d in model_type_dir.iterdir() if d.is_dir()],
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        # Vymaž staré
        for old_dir in timestamp_dirs[keep_latest:]:
            try:
                import shutil
                shutil.rmtree(old_dir)
                deleted += 1
                logger.info(f"✅ Vymazaný: {old_dir}")
            except Exception as e:
                logger.error(f"Delete error: {e}")
    
    return deleted

if __name__ == "__main__":
    # Test
    logging.basicConfig(level=logging.INFO)
    
    # Príklad: Skontroluj model
    test_ply = Path("./projects/user_id/project_id/3Dmodel/pointcloud.ply")
    
    if test_ply.exists():
        print(f"\n📊 PLY Štatistika:")
        stats = get_ply_stats(test_ply)
        print(stats)
        
        print(f"\n✅ Validácia:")
        valid, msg = validate_ply(test_ply)
        print(f"   {valid}: {msg}")
    else:
        print("Test PLY nenájdený")
