from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from pathlib import Path
from models import Project, User
from schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from database import get_db
from auth import verify_token
from config import settings
import uuid
from PIL import Image
import io

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Prienicok na obrázky
PROJECTS_DIR = Path(__file__).parent / "projects"
PROJECTS_DIR.mkdir(exist_ok=True)

def get_current_user_from_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Získaj aktuálneho používateľa z JWT tokena v headeri"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nie je poskytnutý"
        )
    
    token = authorization.split(" ")[1]
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný token"
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Používateľ nenájdený"
        )
    
    return user

@router.post("/create", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Vytvorenie nového projektu"""
    
    # Overovanie tokena
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nie je poskytnutý"
        )
    
    token = authorization.split(" ")[1]
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný token"
        )
    
    current_user = db.query(User).filter(User.id == token_data.user_id).first()
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Používateľ nenájdený"
        )
    
    db_project = Project(
        user_id=current_user.id,
        project_name=project.project_name,
        description=project.description
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Vytvor priečinok pre obrázky projektu - bezpečne s konverziou na string
    try:
        project_dir = PROJECTS_DIR / str(current_user.id) / str(db_project.id) / "images"
        project_dir.mkdir(parents=True, exist_ok=True)
        print(f"✓ Priečinok vytvorený: {project_dir}")
    except Exception as e:
        print(f"❌ Chyba pri vytváraní priečinku: {e}")
    
    return db_project

@router.get("/", response_model=List[ProjectResponse])
async def get_user_projects(
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Získaj všetky projekty používateľa"""
    
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Získaj konkrétny projekt"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Aktualizuj projekt"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    if update_data.project_name:
        project.project_name = update_data.project_name
    if update_data.description:
        project.description = update_data.description
    if update_data.status:
        project.status = update_data.status
    
    db.commit()
    db.refresh(project)
    
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Vymaž projekt"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    db.delete(project)
    db.commit()
    
    # Vymaž priečinok s obrázkami
    project_dir = PROJECTS_DIR / str(current_user.id) / str(project_id)
    if project_dir.exists():
        import shutil
        shutil.rmtree(project_dir)
    
    return {"message": "Projekt bol vymazaný"}

@router.post("/{project_id}/upload-image")
async def upload_image(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Nahraj obrázok do projektu"""
    
    print(f"\n📤 UPLOAD STARTED - File: {file.filename}, ContentType: {file.content_type}")
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        print(f"❌ Projekt {project_id} nenájdený")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    # Validácia formátu obrázka
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        print(f"❌ Nepovolený formát: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Iba JPEG, PNG a WebP obrázky sú povolené"
        )
    
    try:
        # Načítaj obrázok
        content = await file.read()
        print(f"✓ Súbor načítaný: {len(content)} bytes")
        
        img = Image.open(io.BytesIO(content))
        print(f"✓ Obrázok parsnutý: {img.format}, {img.size}")
        
        # Vytvor priečinok ak neexistuje
        images_dir = PROJECTS_DIR / str(current_user.id) / str(project_id) / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        print(f"✓ Priečinok existuje: {images_dir}")
        
        # Ulož obrázok
        filename = f"{uuid.uuid4()}.jpg"
        filepath = images_dir / filename
        img.save(filepath, format="JPEG", quality=95)
        print(f"✓ Obrázok uložený: {filepath}")
        
        # Aktualizuj počet obrázkov
        old_count = project.image_count
        project.image_count += 1
        db.commit()
        db.refresh(project)
        print(f"✓ DB aktualizovaná: {old_count} → {project.image_count}")
        
        # Overuj či súbor existuje
        if filepath.exists():
            file_size = filepath.stat().st_size
            print(f"✓ Súbor verifikovaný ({file_size} bytes)\n")
        else:
            print(f"❌ Súbor sa neuložil!\n")
        
        return {
            "filename": filename,
            "filepath": str(filepath),
            "image_count": project.image_count
        }
    
    except Exception as e:
        print(f"❌ CHYBA pri uploadovaní: {str(e)}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chyba pri ukladaní obrázka: {str(e)}"
        )

@router.get("/{project_id}/images", response_model=dict)
async def get_project_images(
    project_id: str,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Získaj všetky obrázky projektu"""
    
    print(f"\n📂 GET IMAGES - Project: {project_id}, User: {current_user.id}")
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        print(f"❌ Projekt nenájdený")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    images_dir = PROJECTS_DIR / str(current_user.id) / str(project_id) / "images"
    print(f"   Cesta: {images_dir}")
    print(f"   DB image_count: {project.image_count}")
    
    if not images_dir.exists():
        print(f"   ⚠️  Priečinok neexistuje")
        return {"images": []}
    
    images = [f.name for f in images_dir.glob("*.jpg")]
    print(f"   ✓ Nájdené obrázky: {len(images)}")
    for img in images[:5]:  # Ukáž prvých 5
        print(f"     - {img}")
    
    print()
    return {"images": images}

@router.get("/{project_id}/images/{filename}")
async def get_image(
    project_id: str,
    filename: str,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Stiahni konkrétny obrázok projektu"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    # Bezpečnosť - zabráň path traversal útokom
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný názov súboru"
        )
    
    filepath = PROJECTS_DIR / str(current_user.id) / str(project_id) / "images" / filename
    
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obrázok nenájdený"
        )
    
    return FileResponse(filepath, media_type="image/jpeg")

@router.get("/{project_id}/3d-model", response_model=dict)
async def get_3d_model_info(
    project_id: str,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Skontroluj či existuje 3D model pre projekt"""
    
    print(f"\n🔍 CHECK 3D MODEL - Project: {project_id}")
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        print(f"❌ Projekt nenájdený")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    # Skontroluj či existuje priečinok 3Dmodel
    model_dir = PROJECTS_DIR / str(current_user.id) / str(project_id) / "3Dmodel"
    model_file = model_dir / "model.ply"
    
    print(f"   Hľadám: {model_file}")
    
    if model_file.exists():
        file_size = model_file.stat().st_size
        print(f"   ✓ 3D Model nájdený! Veľkosť: {file_size} bytes\n")
        return {
            "exists": True,
            "filename": "model.ply",
            "size": file_size,
            "url": f"/api/projects/{project_id}/3d-model/download"
        }
    else:
        print(f"   ❌ 3D Model neexistuje\n")
        return {"exists": False}

@router.get("/{project_id}/3d-model/download")
async def download_3d_model(
    project_id: str,
    token: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    """Stiahni 3D model"""
    
    print(f"\n📥 DOWNLOAD 3D MODEL - Project: {project_id}")
    
    # Ak je token v query params, overov ho
    if token:
        token_data = verify_token(token)
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Neplatný token"
            )
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Používateľ nenájdený"
            )
        current_user = user
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nenájdený"
        )
    
    model_file = PROJECTS_DIR / str(current_user.id) / str(project_id) / "3Dmodel" / "model.ply"
    
    if not model_file.exists():
        print(f"   ❌ Model neexistuje\n")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="3D Model nenájdený"
        )
    
    print(f"   ✓ Odesielam: {model_file}\n")
    return FileResponse(
        model_file,
        media_type="application/octet-stream",
        filename="model.ply"
    )
