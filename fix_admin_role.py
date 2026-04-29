"""Fix admin user role in database"""
from sqlalchemy import create_engine, text
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres123@localhost:5432/rekon_db"
)

# Create engine
engine = create_engine(DATABASE_URL)

# Execute SQL to check and fix admin role
with engine.connect() as conn:
    # Check current admin
    print("Checking current admin user...")
    result = conn.execute(text("SELECT id, username, role FROM users WHERE username = 'admin'"))
    row = result.fetchone()
    
    if row:
        print(f"Admin user found: {row[1]}, Current role: {row[2]}")
        
        # Update role to 'admin' if not already
        print("Setting role to 'admin'...")
        conn.execute(text("UPDATE users SET role = 'admin' WHERE username = 'admin'"))
        conn.commit()
        
        # Verify
        result = conn.execute(text("SELECT id, username, role FROM users WHERE username = 'admin'"))
        row = result.fetchone()
        print(f"✓ Admin role updated: {row[1]}, New role: {row[2]}")
    else:
        print("✗ Admin user not found!")
    
    # Also list all users for debugging
    print("\nAll users in database:")
    result = conn.execute(text("SELECT username, role FROM users"))
    for row in result:
        print(f"  - {row[0]}: {row[1]}")
