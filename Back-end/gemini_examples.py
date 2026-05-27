#!/usr/bin/env python3
"""
Jednoduchý príklad - ako volať Gemini Image Processor
"""

import json
import subprocess
from pathlib import Path

# Príklad 1: Spracovanie floor plan obrázkov
def example_floor_plan_analysis():
    """
    Analyzuje floor plan obrázky cez Gemini
    """
    print("📝 Príklad 1: Analýza Floor Plan obrázkov\n")
    
    # Predpokladaj že máš floor plan obrázky
    project_dir = Path("projects/your_user_id/your_project_id/3Dmodel/floor_plan_views")
    
    # Priprav parametre
    params = {
        "image_paths": [
            str(project_dir / "floor_plan_top.png"),
            str(project_dir / "floor_plan_front.png")
        ],
        "prompt": "Analyze these floor plan views and describe the room layout, dimensions, and features you can see.",
        "output_path": str(project_dir / "gemini_analysis.json"),
        "model": "gemini-2.0-flash"
    }
    
    print(f"Parametre:\n{json.dumps(params, indent=2)}\n")
    
    # Volaj gemini_image_processor.py
    cmd = [
        "python",
        "gemini_image_processor.py",
        json.dumps(params)
    ]
    
    print(f"Príkaz: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Stderr:", result.stderr)
    except Exception as e:
        print(f"Chyba: {e}")


# Príklad 2: Jednoduchá analýza jedného obrázku
def example_single_image():
    """
    Analyzuje jeden obrázok
    """
    print("\n📝 Príklad 2: Analýza jedného obrázku\n")
    
    params = {
        "image_paths": ["sample_image.png"],
        "prompt": "Describe what you see in this image in detail.",
        "output_path": "results/analysis.json"
    }
    
    print(f"Parametre:\n{json.dumps(params, indent=2)}\n")
    
    cmd = [
        "python",
        "gemini_image_processor.py",
        json.dumps(params)
    ]
    
    print(f"Príkaz: {' '.join(cmd)}\n")


# Príklad 3: Vlastný prompt s floor plan
def example_custom_prompt():
    """
    Vlastný prompt pre špeciálnu analýzu
    """
    print("\n📝 Príklad 3: Vlastný prompt\n")
    
    params = {
        "image_paths": ["floor_plan_top.png"],
        "prompt": """Analyze this floor plan image and provide:
1. Room dimensions estimate
2. Objects and furniture detected
3. Spatial features (doors, windows, etc.)
4. Suggestions for improvement
Return as structured text.""",
        "output_path": "results/detailed_analysis.json"
    }
    
    print(f"Parametre:\n{json.dumps(params, indent=2)}\n")


def main():
    """
    Pokaž všetky príklady
    """
    print("="*70)
    print("🤖 GEMINI IMAGE PROCESSOR - PRÍKLADY POUŽITIA")
    print("="*70)
    print()
    
    example_floor_plan_analysis()
    example_single_image()
    example_custom_prompt()
    
    print("\n" + "="*70)
    print("💡 INŠTRUKCIE:")
    print("="*70)
    print("""
1. INŠTALÁCIA:
   pip install google-generativeai

2. NASTAVENIE API KEY:
   - Jdi na: https://makersuite.google.com/app/apikey
   - Skopíruj svoj API key
   - Vytvor config: python gemini_image_processor.py --create-config
   - Vlož API key do gemini_config.json

3. SPUSTENIE:
   python gemini_image_processor.py '{"image_paths": ["img.png"], "prompt": "Analyze this"}'

4. ALEBO CEZ ENVIRONMENT:
   set GEMINI_API_KEY=your_key
   python gemini_image_processor.py '{"image_paths": ["img.png"], "prompt": "Analyze"}'

5. MOŽNOSTI PROMPT:
   - Analýza obrázkov
   - Opis scén
   - Detekcia objektov
   - Čítanie textu
   - A mnoho ďalšieho!
    """)


if __name__ == "__main__":
    main()
