#!/usr/bin/env python3
"""
Backend Development Server
Spustí Backend bez Dockera - Cross-platform (Windows, macOS, Linux)
"""

import subprocess
import sys
import os
import platform
from pathlib import Path

def main():
    print("\n🚀 3D Rekon Backend - Development Server")
    print("=" * 50)
    
    # Skontroluj Python
    print(f"✅ Python: {sys.version.split()[0]}")
    
    # Naviguj do Back-end
    backend_dir = Path(__file__).parent / "Back-end"
    if not backend_dir.exists():
        print(f"❌ Back-end adresár nenajdený: {backend_dir}")
        sys.exit(1)
    
    os.chdir(backend_dir)
    
    # Vytvor virtual environment ak neexistuje
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("📦 Vytváram Virtual Environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    
    # Aktivuj virtual environment a inštaluj dependencies
    print("✨ Aktivujem Virtual Environment...")
    
    # Skontroluj či .env existuje
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("⚠️  .env súbor neexistuje!")
        print("Prosím vytvor .env v Back-end adresári s Supabase konfiguráciou")
        sys.exit(1)
    
    # Nainštaluj dependencies
    print("📥 Inštalujem dependencies...")
    if platform.system() == "Windows":
        pip_exe = venv_dir / "Scripts" / "pip"
        python_exe = venv_dir / "Scripts" / "python"
    else:
        pip_exe = venv_dir / "bin" / "pip"
        python_exe = venv_dir / "bin" / "python"
    
    subprocess.run([str(pip_exe), "install", "-r", "requirements.txt", "-q"], check=True)
    
    # Inicializuj databázu
    print("🗄️  Inicializujem databázu...")
    subprocess.run([str(python_exe), "init_db.py"], check=True)
    
    # Spusti Backend
    print("")
    print("✅ Backend sa spúšťa na http://localhost:8000")
    print("📚 API dokumentácia: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C pre zastavenie...")
    print("")
    
    subprocess.run([str(python_exe), "main.py"], check=False)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Backend zastavený")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Chyba: {e}")
        sys.exit(1)
