"""
Skript na inicializáciu databázy PostgreSQL

Pred spustením potrebuješ:
1. Mať nainštalovaný PostgreSQL
2. Vytvoriť databázu: createdb rekon_db
3. Nastaviť .env s DATABASE_URL=postgresql://user:password@localhost:5432/rekon_db
"""

from database import Base, engine, SessionLocal
from models import User, Project, UserRole
from auth import get_password_hash

if __name__ == "__main__":
    print("Vytváranie databázových tabuliek...")
    Base.metadata.create_all(bind=engine)
    print("✓ Databáza inicializovaná!")
    
    # Vytvor admin užívateľa
    db = SessionLocal()
    
    # Skontroluj či admin User už existuje
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if not existing_admin:
        print("\n👤 Vytváram admin užívateľa...")
        admin_user = User(
            username="admin",
            email="admin@mapero.sk",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.admin
        )
        db.add(admin_user)
        db.commit()
        print("✓ Admin užívateľ vytvorený!")
        print("   Login: admin / admin123")
    else:
        print("✓ Admin užívateľ už existuje")
    
    db.close()

