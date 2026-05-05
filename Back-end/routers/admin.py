from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
from models import User, Project
from schemas import UserResponse, ProjectResponse
from typing import List, Dict, Any
from auth import verify_token

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Dependency na overenie admin prístupu
def get_current_admin_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Overí, či je používateľ prihlásený a má admin rolu"""
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header nie je poskytnutý"
        )
    
    # Extrahovať token z "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný Authorization header format"
        )
    
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný token"
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Používateľ nenájdený"
        )
    
    # Skontroluj, či je admin
    if user.role.value != "admin" and str(user.role) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemáš práva na prístup do admin panelu"
        )
    
    return user

# ============================================
# DATABÁZOVÉ ENDPOINTS
# ============================================

@router.get("/tables")
async def get_tables(db: Session = Depends(get_db)):
    """Zoznam všech tabuliek v databáze"""
    inspector = inspect(db.get_bind())
    tables = inspector.get_table_names()
    
    result = []
    for table_name in tables:
        columns = inspector.get_columns(table_name)
        result.append({
            "name": table_name,
            "columns": [col["name"] for col in columns]
        })
    
    return result

@router.get("/tables/{table_name}")
async def get_table_data(table_name: str, db: Session = Depends(get_db)):
    """Dáta z konkrétnej tabuľky"""
    try:
        # Validuj názov tabuľky
        inspector = inspect(db.get_bind())
        if table_name not in inspector.get_table_names():
            return {"error": f"Tabuľka '{table_name}' neexistuje"}
        
        # Zisti stĺpce
        columns = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns]
        
        # Načítaj dáta
        result = db.execute(text(f"SELECT * FROM {table_name}"))
        rows = result.fetchall()
        
        data = []
        for row in rows:
            data.append(dict(zip(column_names, row)))
        
        return {
            "table": table_name,
            "columns": column_names,
            "rows": data,
            "count": len(data)
        }
    
    except Exception as e:
        return {"error": str(e)}

@router.delete("/tables/{table_name}/{row_id}")
async def delete_row(table_name: str, row_id: int, db: Session = Depends(get_db)):
    """Maž riadok z tabuľky"""
    try:
        db.execute(text(f"DELETE FROM {table_name} WHERE id = {row_id}"))
        db.commit()
        return {"success": True, "message": f"Riadok {row_id} bol vymazaný"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# ============================================
# ADMIN - UŽÍVATELIA A PROJEKTY
# ============================================

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Zoznam všetkých užívateľov s počtom ich projektov"""
    users = db.query(User).all()
    return users

@router.get("/users/{user_id}")
async def get_user_with_projects(user_id: str, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Detaily konkrétneho užívateľa s jeho projektami"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Užívateľ nenájdený")
    
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at,
        "projects_count": len(projects),
        "projects": [
            {
                "id": p.id,
                "project_name": p.project_name,
                "status": p.status,
                "description": p.description,
                "image_count": p.image_count,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in projects
        ]
    }

@router.get("/stats")
async def get_admin_stats(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Štatistika pre admin dashboard"""
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    
    # Projekty podľa statusu
    statuses = {}
    for project in db.query(Project).all():
        status = str(project.status)
        statuses[status] = statuses.get(status, 0) + 1
    
    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "projects_by_status": statuses
    }
