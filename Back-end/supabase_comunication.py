#!/usr/bin/env python3
"""
Supabase komunikácia - centralizovaný handler pre všetky Supabase operácie
"""

import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Import Supabase client
try:
    from supabase import create_client
except ImportError:
    print("❌ supabase knižnica nie je nainštalovaná")
    print("   Inštaluj: pip install supabase")
    exit(1)


def get_supabase_client():
    """Vytvor Supabase klienta"""
    try:
        from supabase import create_client
        
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        # Debug output
        print(f"   🔧 SUPABASE_URL: {url[:30]}..." if url else "   ❌ SUPABASE_URL nie je nastavený!")
        print(f"   🔧 SUPABASE_KEY: {key[:20]}..." if key else "   ❌ SUPABASE_KEY nie je nastavený!")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL alebo SUPABASE_KEY nie sú nastavené v .env")
        
        supabase = create_client(url, key)
        print("   ✅ Supabase pripojené")
        return supabase
        
    except Exception as e:
        print(f"   ❌ Supabase chyba: {e}")
        import traceback
        traceback.print_exc()
        raise


def get_oldest_pending_project():
    """
    Nájdi najstarší projekt so statusom 'pending' alebo 'procesing' alebo 'training'
    a try < 3
    
    Returns:
        dict: Projekt dáta (id, owner_id, name, status, created_at, objects, try)
        None: Ak nebol žiadny projekt nájdený
    """
    try:
        supabase = get_supabase_client()
        
        # Hľadaj projekty so statusom: pending, procesing alebo training (nie generated alebo podoris)
        response = supabase.table("projects") \
            .select("*") \
            .eq("status", "pending") \
            .lt("try", 3) \
            .order("created_at", desc=False) \
            .limit(1) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Ak nie je pending, hľadaj procesing
        response = supabase.table("projects") \
            .select("*") \
            .eq("status", "procesing") \
            .lt("try", 3) \
            .order("created_at", desc=False) \
            .limit(1) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Ak nie je procesing, hľadaj training
        response = supabase.table("projects") \
            .select("*") \
            .eq("status", "training") \
            .lt("try", 3) \
            .order("created_at", desc=False) \
            .limit(1) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]

        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Ak nie je procesing, hľadaj training
        response = supabase.table("projects") \
            .select("*") \
            .eq("status", "Generated") \
            .lt("try", 3) \
            .order("created_at", desc=False) \
            .limit(1) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        return None
            
    except Exception as e:
        print(f"❌ Chyba pri dotaze get_oldest_pending_project: {e}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Chyba pri dotaze get_oldest_pending_project: {e}")


def get_all_projects(limit: int = 10):
    """
    Nájdi všetky projekty (na zobrazenie)
    
    Args:
        limit: Maximálny počet projektov
        
    Returns:
        list: Zoznam projektov
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("projects") \
            .select("id, owner_id, name, status, created_at") \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        raise Exception(f"Chyba pri dotaze get_all_projects: {e}")


def update_project(project_id: str, data: dict) -> bool:
    """
    Aktualizuj projekt v Supabase
    
    Args:
        project_id: ID projektu
        data: Dict s poľami na aktualizáciu
               Príklad: {"status": "Generated", "objects": "Bed 1-3, Chair 1-5"}
    
    Returns:
        bool: True ak úspešne, False ak chyba
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("projects") \
            .update(data) \
            .eq("id", project_id) \
            .execute()
        
        return True
        
    except Exception as e:
        print(f"❌ Chyba pri update_project: {e}")
        return False


def update_project_status(project_id: str, status: str) -> bool:
    """Aktualizuj len status projektu"""
    return update_project(project_id, {"status": status})


def update_project_objects(project_id: str, objects: str) -> bool:
    """Aktualizuj len objekty projektu"""
    return update_project(project_id, {"objects": objects})


def update_project_try(project_id: str, try_count: int) -> bool:
    """Aktualizuj len počet pokusov"""
    return update_project(project_id, {"try": try_count})


def increment_project_try(project_id: str, project_try: int = 0) -> bool:
    """Inkrementuj počet pokusov o 1"""
    new_try = (project_try or 0) + 1
    return update_project_try(project_id, new_try)

