#!/usr/bin/env python3
"""
Script na seed databázy - vytvorí testovacieho používateľa
Spusti: python seed_db.py
"""

import sys
import os
import uuid
from datetime import datetime

# Nastav cesty na import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Back-end'))

from auth import get_password_hash
from config import settings
from database import SessionLocal
from models import User

def seed_users():
    """Vytvor testovacích používateľov"""
    db = SessionLocal()
    
    try:
        # Skontroluj či admin už existuje
        from auth import get_user_by_username
        existing = get_user_by_username(db, "testuser")
        
        if existing:
            print("✓ Používateľ 'testuser' už existuje")
            return
        
        # Vytvor nového používateľa
        hashed_password = get_password_hash("test123456")
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            hashed_password=hashed_password,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✓ Používateľ vytvorený:")
        print(f"  Username: testuser")
        print(f"  Email: test@example.com")
        print(f"  Password: test123456")
        print(f"  ID: {user.id}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Database Seeding")
    print("=" * 50)
    seed_users()
    print("=" * 50)
