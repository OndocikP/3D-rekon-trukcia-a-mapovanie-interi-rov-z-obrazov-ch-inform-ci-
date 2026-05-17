"""
Setup wizard pre Nerfstudio integrácniu
- Overí či je Nerfstudio nainštalovaný
- Skontroluje dependencies
- Ponúka konfiguráciu
"""

import subprocess
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

def check_nerfstudio():
    """Skontroluj či je Nerfstudio nainštalovaný"""
    print("\n🔍 Kontrola Nerfstudio...")
    try:
        result = subprocess.run(
            ["ns-train", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"✅ Nerfstudio nainštalovaný: {result.stdout.strip()}")
            return True
        else:
            print("❌ Nerfstudio nieje dostupný")
            print("\n📦 Inštalácia:")
            print("   conda activate nerfstudio")
            return False
    except Exception as e:
        print(f"❌ Chyba pri kontrole: {e}")
        return False

def check_python_deps():
    """Skontroluj Python dependencies"""
    print("\n🔍 Kontrola Python dependencies...")
    
    required = ["fastapi", "uvicorn", "pydantic", "dotenv", "supabase"]
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg.replace("-", "_"))
            print(f"  ✅ {pkg}")
        except ImportError:
            print(f"  ❌ {pkg}")
            missing.append(pkg)
    
    if missing:
        print(f"\n⚠️ Chýbajú balíčky: {', '.join(missing)}")
        print("\n📦 Inštalácia:")
        print(f"   pip install {' '.join(missing)}")
        return False
    
    return True

def check_env():
    """Skontroluj .env konfiguráciu"""
    print("\n🔍 Kontrola .env...")
    
    load_dotenv()
    
    required_vars = [
        "PROJECTS_PATH",
        "DATABASE_URL",
        "SUPABASE_URL",
        "BACKEND_URL"
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}")
        else:
            print(f"  ❌ {var}")
            missing.append(var)
    
    if missing:
        print(f"\n⚠️ Chýbajúce premenné: {', '.join(missing)}")
        return False
    
    # Skontroluj či PROJECTS_PATH existuje
    projects_path = Path(os.getenv("PROJECTS_PATH"))
    if projects_path.exists():
        print(f"\n✅ PROJECTS_PATH existuje: {projects_path}")
        return True
    else:
        print(f"\n⚠️ PROJECTS_PATH neexistuje: {projects_path}")
        return False

def check_projects_structure():
    """Skontroluj štruktúru projektov"""
    print("\n🔍 Kontrola štruktúry projektov...")
    
    projects_path = Path(os.getenv("PROJECTS_PATH"))
    if not projects_path.exists():
        print(f"  ❌ PROJECTS_PATH neexistuje")
        return 0
    
    project_count = 0
    images_count = 0
    models_count = 0
    
    for user_dir in projects_path.iterdir():
        if not user_dir.is_dir():
            continue
        
        for project_dir in user_dir.iterdir():
            if not project_dir.is_dir():
                continue
            
            project_count += 1
            
            # Skontroluj images
            images_path = project_dir / "images"
            if images_path.exists():
                images = list(images_path.glob("*"))
                images_count += len(images)
            
            # Skontroluj model
            model_path = project_dir / "3Dmodel"
            if model_path.exists():
                ply_files = list(model_path.glob("*.ply"))
                if ply_files:
                    models_count += len(ply_files)
    
    print(f"  📦 Projektov: {project_count}")
    print(f"  🖼️  Obrázkov: {images_count}")
    print(f"  🎯 3D Modelov: {models_count}")
    
    return project_count

def test_training():
    """Test training na malej vzorke"""
    print("\n🧪 Test Nerfstudio trainingu...")
    print("   ⏳ Toto môže trvať niekoľko minút...")
    
    # Vytvor test priečinok
    test_dir = Path(__file__).parent / "nerfstudio_test"
    test_data = test_dir / "images"
    test_data.mkdir(parents=True, exist_ok=True)
    
    # TODO: Stiahni sample obrázky
    # Zatiaľ len skontroluj či sa príkaz spustí
    
    try:
        result = subprocess.run(
            ["ns-train", "nerfacto", "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("  ✅ Nerfstudio je funkčný")
            return True
        else:
            print("  ❌ Nerfstudio error")
            return False
    except Exception as e:
        print(f"  ❌ Chyba: {e}")
        return False

def main():
    """Spustenie setup wizardu"""
    
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║           🚀 NERFSTUDIO INTEGRATION SETUP WIZARD                           ║
║                                                                            ║
║  Táto aplikácia skontroluje a skonfiguruje automatické generovanie       ║
║  3D modelov z fotografií pomocou Nerfstudio.                             ║
╚════════════════════════════════════════════════════════════════════════════╝
    """)
    
    all_ok = True
    
    # 1. Nerfstudio
    if not check_nerfstudio():
        all_ok = False
    
    # 2. Python dependencies
    if not check_python_deps():
        all_ok = False
    
    # 3. .env
    if not check_env():
        all_ok = False
    
    # 4. Štruktúra
    projects = check_projects_structure()
    
    # 5. Test (optional)
    if all_ok:
        print("\n❓ Chceš otestovať Nerfstudio training? (y/n)")
        if input().lower() == 'y':
            test_training()
    
    # Súhrn
    print("\n" + "="*80)
    if all_ok:
        print("✅ VŠETKO JE PRIPRAVENÉ!")
        print("\n🚀 Ďalšie kroky:")
        print("   1. Spustenie všetkých projektov:")
        print("      python generate_3d_models.py")
        print("\n   2. Spustenie konkrétneho projektu:")
        print("      python generate_3d_models.py <user_id> <project_id>")
        print("\n   3. API endpoint (pri bežiacom serveri):")
        print("      POST /api/projects/batch/generate-all-models")
        print("\n📖 Pozri: README_NERFSTUDIO.md")
    else:
        print("❌ PROSÍM VYRIEŠIŤ CHYBY VYŠŠIE")
        print("\n📖 Pozri: README_NERFSTUDIO.md")
    print("="*80)
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
