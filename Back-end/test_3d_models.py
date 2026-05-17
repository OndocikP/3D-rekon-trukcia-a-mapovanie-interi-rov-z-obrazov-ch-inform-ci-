"""
Testy pre 3D model generation
"""

import pytest
from pathlib import Path
import tempfile
import shutil
from generate_3d_models import NerfstudioTrainer
from model_utils import validate_ply, get_ply_stats

class TestNerfstudioTrainer:
    """Testy pre NerfstudioTrainer triedu"""
    
    @pytest.fixture
    def temp_project(self):
        """Vytvor temp projekt"""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_path = Path(tmpdir) / "test_project"
            project_path.mkdir()
            
            # Vytvor images priečinok
            images_path = project_path / "images"
            images_path.mkdir()
            
            # Vytvor dummy obrázky
            for i in range(5):
                img_path = images_path / f"test_{i}.jpg"
                img_path.write_bytes(b"dummy image data")
            
            yield project_path
    
    def test_check_images_exist(self, temp_project):
        """Test: Skontroluj že images sú nájdené"""
        trainer = NerfstudioTrainer(temp_project, "test_project", "test_user")
        assert trainer.check_images() == True
    
    def test_check_images_missing(self, temp_project):
        """Test: Skontroluj že chyba ak obrázky chýbajú"""
        # Vymaž images
        shutil.rmtree(temp_project / "images")
        
        trainer = NerfstudioTrainer(temp_project, "test_project", "test_user")
        assert trainer.check_images() == False
    
    def test_check_images_too_few(self, temp_project):
        """Test: Skontroluj že chyba ak málo obrázkov"""
        # Vymaž všetky okrem jedného
        images_path = temp_project / "images"
        for img in list(images_path.glob("*"))[1:]:
            img.unlink()
        
        trainer = NerfstudioTrainer(temp_project, "test_project", "test_user")
        assert trainer.check_images() == False
    
    def test_prepare_directories(self, temp_project):
        """Test: Priečinky sú vytvorené"""
        trainer = NerfstudioTrainer(temp_project, "test_project", "test_user")
        trainer.prepare_directories()
        
        assert trainer.model_path.exists()
        assert trainer.output_path.exists()

class TestModelUtils:
    """Testy pre model utility funkcie"""
    
    @pytest.fixture
    def dummy_ply(self):
        """Vytvor dummy PLY súbor"""
        with tempfile.NamedTemporaryFile(suffix=".ply", delete=False) as f:
            # Minimálny PLY header
            ply_content = b"""ply
format ascii 1.0
element vertex 3
property float x
property float y
property float z
end_header
0 0 0
1 0 0
0 1 0
"""
            f.write(ply_content)
            temp_path = Path(f.name)
        
        yield temp_path
        
        # Cleanup
        temp_path.unlink(missing_ok=True)
    
    def test_validate_ply_valid(self, dummy_ply):
        """Test: Validuj správny PLY"""
        valid, msg = validate_ply(dummy_ply)
        assert valid == True
        assert "Valid" in msg
    
    def test_validate_ply_missing(self):
        """Test: Validuj neexistujúci PLY"""
        valid, msg = validate_ply(Path("/nonexistent/file.ply"))
        assert valid == False
        assert "not found" in msg.lower()
    
    def test_get_ply_stats(self, dummy_ply):
        """Test: Nacítaj PLY štatistiku"""
        stats = get_ply_stats(dummy_ply)
        
        assert "vertices" in stats
        assert stats["vertices"] == 3
        assert "size_mb" in stats
        assert "filename" in stats

if __name__ == "__main__":
    # Spustenie testov
    pytest.main([__file__, "-v", "--tb=short"])
