#!/usr/bin/env python3
"""
Setup helper script - Skontroluj či sú všetky dependencies nainštalované
"""

import subprocess
import sys
from pathlib import Path

def check_python_version():
    """Skontroluj Python verziu"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python {version.major}.{version.minor} - potrebuješ 3.9+")
        return False
    print(f"✅ Python {version.major}.{version.minor}")
    return True

def check_node_version():
    """Skontroluj Node.js verziu"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"✅ Node.js: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ Node.js nie je nainštalovaný")
        return False

def check_supabase():
    """Skontroluj Supabase konfiguráciu"""
    env_path = Path(__file__).parent / "Back-end" / ".env"
    if not env_path.exists():
        print("❌ .env súbor v Back-end neexistuje")
        return False
    
    with open(env_path, "r") as f:
        env_content = f.read()
        if "DATABASE_URL" in env_content and "supabase.co" in env_content:
            print("✅ Supabase nastavená")
            return True
        else:
            print("❌ DATABASE_URL nie je nastavená na Supabase")
            return False

def main():
    print("🔍 System Check")
    print("=" * 50)
    
    checks = [
        ("Python", check_python_version),
        ("Node.js", check_node_version),
        ("Supabase", check_supabase),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {name}: {e}")
            results.append(False)
    
    print("=" * 50)
    if all(results):
        print("✅ Všetko OK! Môžeš spustiť: run_backend.bat (Windows) alebo run_backend.sh (macOS/Linux)")
    else:
        print("⚠️  Niektoré checks zlyhali. Pozri vyššie.")
        sys.exit(1)

if __name__ == "__main__":
    main()
