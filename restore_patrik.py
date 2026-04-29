"""Restore deleted user patrik with his projects"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Import models and utilities
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Back-end'))

from models import User, Project, UserRole
from database import Base, engine, SessionLocal
from auth import get_password_hash

# Create session
db = SessionLocal()

try:
    # Check if patrik already exists
    patrik = db.query(User).filter(User.username == "patrik").first()
    if patrik:
        print(f"✓ User 'patrik' already exists with ID: {patrik.id}")
    else:
        # Create patrik user with the UUID from previous session
        patrik_id = "05ca4a21-6d10-4ccc-8309-ebf98a1fd97b"
        patrik = User(
            id=patrik_id,
            username="patrik",
            email="patrik@example.com",
            hashed_password=get_password_hash("heslo1"),
            role=UserRole.user  # patrik is a regular user, not admin
        )
        db.add(patrik)
        db.commit()
        print(f"✓ User 'patrik' created with ID: {patrik_id}")
        print(f"   Login: patrik / heslo1")
    
    # Restore patrik's 2 projects
    projects_to_restore = [
        {
            "id": "2a88b81e-0a2b-4981-a183-b625dc81e652",
            "project_name": "Project 1",
            "status": "generated",
            "description": "Restored project",
            "image_count": 10
        },
        {
            "id": "5f82da58-b51c-4fc9-8475-b94ede0fceaf",
            "project_name": "Project 2", 
            "status": "generated",
            "description": "Restored project",
            "image_count": 15
        }
    ]
    
    for proj_data in projects_to_restore:
        existing = db.query(Project).filter(Project.id == proj_data["id"]).first()
        if existing:
            print(f"✓ Project '{proj_data['project_name']}' already exists")
        else:
            project = Project(
                id=proj_data["id"],
                user_id=patrik.id,
                project_name=proj_data["project_name"],
                status=proj_data["status"],
                description=proj_data["description"],
                image_count=proj_data["image_count"]
            )
            db.add(project)
            db.commit()
            print(f"✓ Project '{proj_data['project_name']}' created with ID: {proj_data['id']}")
    
    print("\n✓ All data restored successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    db.rollback()
finally:
    db.close()
