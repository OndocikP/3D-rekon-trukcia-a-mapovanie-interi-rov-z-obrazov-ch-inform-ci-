#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, '/app')

from database import SessionLocal
from models import User
from auth import get_password_hash

# Pripoj sa k databáze
db = SessionLocal()

# Nájdi patrika
user = db.query(User).filter(User.username == "patrik").first()

if user:
    # Nastav nové heslo
    user.hashed_password = get_password_hash("heslo1")
    db.commit()
    print(f"✅ Heslo pre patrika aktualizované")
    print(f"Hash: {user.hashed_password}")
else:
    print("❌ Patrik sa nenašiel")

db.close()
