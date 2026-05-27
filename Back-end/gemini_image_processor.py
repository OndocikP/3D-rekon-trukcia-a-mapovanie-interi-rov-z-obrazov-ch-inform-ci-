#!/usr/bin/env python3
"""
Gemini AI Image Processor - Volá Gemini API s obrázkami a promptom
Generuje nový obrázok alebo odpoveď na základe vstupných obrázkov
"""

import sys
import json
import os
from pathlib import Path
import base64
from typing import List, Optional
import urllib.request

# Pokus sa importovať dotenv
try:
    from dotenv import load_dotenv
    HAS_DOTENV = True
except ImportError:
    HAS_DOTENV = False

# Pokus sa importovať google generativeai
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    print("⚠️  google-generativeai not installed")
    print("   Inštalácia: pip install google-generativeai")

# Načítaj .env súbor ak existuje
if HAS_DOTENV:
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(str(env_path))


def encode_image_to_base64(image_path: str) -> str:
    """
    Konvertuje obrázok na base64 string
    """
    with open(image_path, 'rb') as image_file:
        return base64.standard_b64encode(image_file.read()).decode('utf-8')


def load_image_as_base64(image_path: str) -> tuple:
    """
    Načíta obrázok a vráti base64 + MIME type
    """
    image_path = Path(image_path)
    
    if not image_path.exists():
        raise FileNotFoundError(f"Obrázok nenájdený: {image_path}")
    
    # Zisti MIME type
    ext = image_path.suffix.lower()
    mime_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    
    mime_type = mime_types.get(ext, 'image/jpeg')
    
    # Načítaj a enkóduj
    base64_str = encode_image_to_base64(str(image_path))
    
    print(f"   ✅ Načítaný obrázok: {image_path.name} ({mime_type})")
    
    return base64_str, mime_type


def setup_gemini_api(api_key: Optional[str] = None) -> None:
    """
    Nastaví Gemini API s API key
    """
    if not HAS_GENAI:
        raise ImportError("google-generativeai nie je nainštalované")
    
    # Skúsi načítať API key z rôznych zdrojov
    if not api_key:
        # 1. Z environment variable (z .env alebo systému)
        api_key = os.getenv('GEMINI_API_KEY')
        
        # 2. Z config súboru (pre kompatibilitu)
        if not api_key:
            config_path = Path(__file__).parent / 'gemini_config.json'
            if config_path.exists():
                try:
                    with open(config_path, 'r') as f:
                        config = json.load(f)
                        api_key = config.get('api_key')
                        if api_key:
                            print(f"   📄 API key načítaný z: {config_path}")
                except Exception as e:
                    print(f"   ⚠️  Chyba pri čítaní config súboru: {e}")
    
    if not api_key:
        raise ValueError(
            "❌ GEMINI_API_KEY nenájdený!\n"
            "   Riešenia:\n"
            "   1. Nastav GEMINI_API_KEY v .env súbore (odporúčané)\n"
            "   2. Nastav environment variable: set GEMINI_API_KEY=<tvoj_key>\n"
            "   3. Vytvor gemini_config.json s poľom 'api_key'\n"
            "   4. Podaj api_key ako parameter funkcii\n"
            "   \n"
            "   Ako získať API key:\n"
            "   https://makersuite.google.com/app/apikey\n"
            "   \n"
            "   UPOZORNENIE - Free tier quota:\n"
            "   - gemini-1.5-flash: 60 request/min, 30k token/min\n"
            "   - gemini-2.0-flash: Very limited free tier (može byť vyčerpaný)\n"
            "   Ak je quota exhausted, počkaj 60 sekúnd alebo prejdi na paid plan."
        )
    
    genai.configure(api_key=api_key)
    print(f"   ✅ Gemini API nakonfigurovaný")


def process_images_with_gemini(
    image_paths: List[str],
    prompt: str,
    model: str = "gemini-1.5-flash",
    output_path: Optional[str] = None
) -> dict:
    """
    Pošle obrázky a prompt do Gemini a vráti odpoveď
    
    Args:
        image_paths: Zoznam ciest k obrázkom
        prompt: Text prompu
        model: Názov Gemini modelu
        output_path: Cesta pre uloženie výsledku (voliteľné)
    
    Returns:
        dict s výsledkami
    """
    if not HAS_GENAI:
        raise ImportError("google-generativeai nie je nainštalované")
    
    print(f"\n" + "="*70)
    print(f"🤖 SPRACOVANIE OBRÁZKOV CEZGEMINI AI")
    print(f"="*70)
    print(f"   🖼️  Počet obrázkov: {len(image_paths)}")
    print(f"   📝 Prompt: {prompt[:100]}...")
    print(f"   🧠 Model: {model}\n")
    
    # Nastavy Gemini
    setup_gemini_api()
    
    # Načítaj obrázky
    print(f"   📥 Načítavam obrázky:")
    images_data = []
    for img_path in image_paths:
        try:
            base64_str, mime_type = load_image_as_base64(img_path)
            images_data.append({
                'path': img_path,
                'base64': base64_str,
                'mime_type': mime_type
            })
        except Exception as e:
            print(f"   ❌ Chyba pri načítaní obrázku {img_path}: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    if not images_data:
        return {
            'status': 'error',
            'error': 'Žiadne obrázky neboli načítané'
        }
    
    try:
        # Vytvor generatívny model
        print(f"\n   🔗 Volám Gemini API...")
        model_obj = genai.GenerativeModel(model)
        
        # Priprav content s obrázkami a promptom
        content = [prompt]
        
        # Pridaj obrázky
        for img_data in images_data:
            content.append({
                'inline_data': {
                    'mime_type': img_data['mime_type'],
                    'data': img_data['base64']
                }
            })
        
        # Spusti generovanie
        response = model_obj.generate_content(content)
        
        # Extrahujem odpoveď
        result_text = response.text if hasattr(response, 'text') else str(response)
        
        print(f"   ✅ Odpoveď od Gemini:")
        print(f"   {result_text[:200]}...")
        
        result = {
            'status': 'success',
            'model': model,
            'response': result_text,
            'images_processed': len(images_data),
            'prompt': prompt
        }
        
        # Ulož výsledok ak je zadaná cesta
        if output_path:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"   💾 Výsledok uložený: {output_file}")
            result['output_file'] = str(output_file)
        
        print(f"\n" + "="*70)
        print(f"✅ SPRACOVANIE HOTOVÉ!")
        print(f"="*70)
        
        return result
        
    except Exception as e:
        print(f"   ❌ Chyba pri volaní Gemini: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'status': 'error',
            'error': str(e),
            'error_type': type(e).__name__
        }


def create_config_template():
    """
    Vytvorí šablónu config súboru
    """
    config_path = Path(__file__).parent / 'gemini_config.json'
    
    if config_path.exists():
        print(f"✅ Config súbor už existuje: {config_path}")
        return
    
    template = {
        "api_key": "YOUR_GEMINI_API_KEY_HERE",
        "model": "gemini-2.0-flash",
        "description": "Gemini AI Configuration - Nahraď api_key svojím kľúčom"
    }
    
    with open(config_path, 'w') as f:
        json.dump(template, f, indent=2)
    
    print(f"✅ Vytvorený config šablóna: {config_path}")
    print(f"   📝 Prosím, nahraď 'YOUR_GEMINI_API_KEY_HERE' svojim skutočným API kľúčom")


def main():
    """
    Hlavná funkcia - príjma JSON argument s parametrami
    """
    if len(sys.argv) < 2:
        print("❌ Použitie: python gemini_image_processor.py <json_params>")
        print("\nPríklad JSON:")
        print(json.dumps({
            "image_paths": ["image1.png", "image2.png"],
            "prompt": "Analzuj tieto obrázky",
            "output_path": "results/output.json",
            "api_key": "optional_api_key"
        }, indent=2))
        sys.exit(1)
    
    try:
        # Parsuj JSON argument
        json_arg = sys.argv[1]
        params = json.loads(json_arg)
        
        image_paths = params.get('image_paths', [])
        prompt = params.get('prompt', 'Analyzuj tento obrázok')
        output_path = params.get('output_path')
        api_key = params.get('api_key')
        model = params.get('model', 'gemini-2.0-flash')
        
        if not image_paths:
            print("❌ Chyba: Aspoň jeden obrázok je povinný!")
            sys.exit(1)
        
        # Spusti spracovanie
        result = process_images_with_gemini(
            image_paths=image_paths,
            prompt=prompt,
            model=model,
            output_path=output_path
        )
        
        # Vytlač výsledky
        print(f"\n📊 VÝSLEDKY:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if result.get('status') == 'error':
            sys.exit(1)
        
    except json.JSONDecodeError as e:
        print(f"❌ Chyba pri parsovaní JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Chyba: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # Skontroluj či je to len požiadavka na config
    if len(sys.argv) > 1 and sys.argv[1] == '--create-config':
        create_config_template()
    else:
        main()
