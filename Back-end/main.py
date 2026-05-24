"""
Minimálny Backend - Proxy API k Supabase
Iba endpointy + file storage
"""

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import subprocess
import threading
import zipfile
import io

# Password reset import
from password_reset import (
    send_password_reset_email,
    create_reset_token,
    verify_reset_code,
    reset_password_with_code
)

# Nerfstudio viewer import
from nerfstudio_handler import (
    start_viewer,
    kill_viewer,
    find_config_yml
)

# Načítaj .env
load_dotenv()

# Supabase import
try:
    from supabase import create_client
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    print("✅ Supabase pripojené")
except Exception as e:
    print(f"❌ Supabase chyba: {e}")
    supabase = None

# FastAPI app
app = FastAPI(title="3D Rekon Backend - Minimal")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Súbory
FILES_DIR = Path(__file__).parent / "projects"
FILES_DIR.mkdir(exist_ok=True)

# ============================================
# SCHÉMY
# ============================================

class LoginRequest(BaseModel):
    username: str = None
    email: str = None
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None

class AuthResponse(BaseModel):
    user_id: str
    role: str
    token: Optional[str] = None

# ============================================
# PASSWORD RESET SCHÉMY
# ============================================

class ForgotPasswordRequest(BaseModel):
    email: str
    """Email adresa na obnovenie hesla"""

class VerifyResetCodeRequest(BaseModel):
    email: str
    reset_code: str
    """6-ciferný kód poslany na email"""

class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str
    """Nové heslo"""

class ResetPasswordResponse(BaseModel):
    success: bool
    message: str

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

# ============================================
# AUTHENTICATION
# ============================================

@app.post("/api/auth/login", response_model=dict)
async def login(request: LoginRequest):
    """Login používateľa - volá Supabase funkciu"""
    try:
        response = supabase.rpc(
            'login_user',
            {'p_username': request.username, 'p_password': request.password}
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = response.data[0]
        return {
            "access_token": "placeholder-jwt-token",
            "token_type": "bearer",
            "user": {
                "id": str(user['id']),
                "username": user.get('username', ''),
                "email": user.get('email', ''),
                "role": user.get('role', 'user'),
                "created_at": str(user.get('created_at', ''))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/register", response_model=dict)
async def register(request: RegisterRequest):
    """Registrácia - volá Supabase funkciu"""
    try:
        response = supabase.rpc(
            'register_user',
            {
                'p_username': request.username,
                'p_email': request.email,
                'p_password': request.password
            }
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Registration failed")
        
        user_id = response.data[0]
        return {
            "access_token": "placeholder-jwt-token",
            "token_type": "bearer",
            "user": {
                "id": str(user_id),
                "username": request.username,
                "email": request.email,
                "role": "user",
                "created_at": ""
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# PASSWORD RESET ENDPOINTS
# ============================================

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Požiadať o obnovenie hesla
    Pošle reset kód na email
    """
    try:
        print(f"\n🔑 FORGOT PASSWORD ENDPOINT")
        print(f"   email: {request.email}")
        
        # Skontroluj či užívateľ existuje
        user_response = supabase.table("users") \
            .select("id, username") \
            .eq("email", request.email) \
            .execute()
        
        if not user_response.data or len(user_response.data) == 0:
            print(f"⚠️ Užívateľ s emailom {request.email} neexistuje")
            # Z bezpečnostných dôvodov nehovoríme či email existuje alebo nie
            return {
                "success": True,
                "message": "Ak existuje účet s týmto emailom, obdržíš email s inštrukciami"
            }
        
        user = user_response.data[0]
        username = user.get('username', 'Užívateľ')
        
        # Vytvor reset token
        reset_code = create_reset_token(request.email)
        
        # Pošli email
        email_sent = send_password_reset_email(
            email=request.email,
            reset_code=reset_code,
            username=username
        )
        
        if not email_sent:
            print(f"❌ Chyba pri odosielaní emailu")
            raise HTTPException(
                status_code=500,
                detail="Chyba pri odosielaní emailu. Skús neskôr."
            )
        
        print(f"✅ Reset email poslal na {request.email}")
        return {
            "success": True,
            "message": "Email s kódom na obnovenie hesla bol poslal"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/verify-reset-code")
async def verify_reset_code_endpoint(request: VerifyResetCodeRequest):
    """
    Overuj reset kód
    """
    try:
        print(f"\n🔑 VERIFY RESET CODE ENDPOINT")
        print(f"   email: {request.email}")
        print(f"   code: {request.reset_code}")
        
        verification = verify_reset_code(request.email, request.reset_code)
        
        if not verification['valid']:
            print(f"❌ {verification['message']}")
            raise HTTPException(
                status_code=400,
                detail=verification['message']
            )
        
        print(f"✅ Reset kód je platný")
        return {
            "valid": True,
            "message": "Kód je platný, môžeš obnoviť heslo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest):
    """
    Obnoviť heslo s reset kódom
    """
    try:
        print(f"\n🔑 RESET PASSWORD ENDPOINT")
        print(f"   email: {request.email}")
        print(f"   code: {request.reset_code}")
        
        # Validuj vstup
        if not request.new_password or len(request.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Heslo musí mať aspoň 6 znakov"
            )
        
        # Obnoviť heslo
        result = reset_password_with_code(
            email=request.email,
            reset_code=request.reset_code,
            new_password=request.new_password
        )
        
        if not result['success']:
            print(f"❌ {result['message']}")
            raise HTTPException(
                status_code=400,
                detail=result['message']
            )
        
        print(f"✅ Heslo bolo obnovené pre {request.email}")
        return {
            "success": True,
            "message": result['message']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# PROJECTS
# ============================================

@app.get("/api/projects/{user_id}")
async def get_projects(user_id: str):
    """Načítaj všetky projekty pre daného užívateľa"""
    try:
        response = supabase.rpc(
            'load_project_user_id',
            {'p_user_id': user_id}
        ).execute()
        
        if not response.data:
            return []
        
        projects = response.data
        return [
            {
                "id": str(p['id']),
                "project_name": p.get('name', ''),
                "status": p.get('status', 'pending'),
                "description": p.get('description', ''),
                "image_count": p.get('photos_count', 0),
                "objects": p.get('objects', ''),
                "created_at": str(p.get('created_at', '')),
                "updated_at": str(p.get('updated_at', ''))
            }
            for p in projects
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/projects/create/{user_id}")
async def create_project(user_id: str, request: CreateProjectRequest, authorization: Optional[str] = Header(None)):
    """Vytvor nový projekt a priečinkkovú štruktúru"""
    try:
        print(f"\n🔍 CREATE PROJECT ENDPOINT")
        print(f"   user_id: {user_id}")
        print(f"   name: {request.name}")
        print(f"   description: {request.description}")
        print(f"   token: {authorization[:20] if authorization else 'NONE'}...")
        
        if not authorization:
            print("❌ No token provided")
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Volaj Supabase funkciu na vytvorenie projektu
        print("📡 Calling Supabase RPC...")
        response = supabase.rpc(
            'create_project',
            {
                'p_owner_id': user_id,
                'p_name': request.name,
                'p_description': request.description or ''
            }
        ).execute()
        
        print(f"✅ Supabase response: {response.data}")
        
        if not response.data:
            print("❌ No data from Supabase")
            raise HTTPException(status_code=400, detail="Failed to create project")
        
        project = response.data[0]
        project_id = str(project['id'])
        
        # Vytvor priečinkovú štruktúru: PROJECTS_PATH/user_id/project_id/images
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        project_dir = Path(projects_path) / user_id / project_id / 'images'
        project_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✅ Projekt úspešne vytvorený: {project_dir}")
        
        return {
            "id": project_id,
            "name": project.get('name', ''),
            "owner_id": project.get('owner_id', ''),
            "status": project.get('status', 'pending'),
            "description": project.get('description', ''),
            "image_count": project.get('photos_count', 0),
            "created_at": str(project.get('created_at', '')),
            "images_path": str(project_dir)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}/info")
async def get_project_info(project_id: str):
    """Načítaj konkrétny projekt info z Supabase"""
    try:
        print(f"\n📋 GET PROJECT INFO ENDPOINT")
        print(f"   project_id: {project_id}")
        
        # Načítaj projekt priamo z Supabase
        response = supabase.table('projects').select('id, name, status, description, photos_count, objects, created_at, updated_at').eq('id', project_id).execute()
        
        if not response.data or len(response.data) == 0:
            print(f"❌ Project not found: {project_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        p = response.data[0]
        print(f"✅ Project found: {p.get('name')}")
        
        return {
            "id": str(p['id']),
            "project_name": p.get('name', ''),
            "status": p.get('status', 'pending'),
            "description": p.get('description', ''),
            "image_count": p.get('photos_count', 0),
            "objects": p.get('objects', ''),
            "created_at": str(p.get('created_at', '')),
            "updated_at": str(p.get('updated_at', ''))
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, authorization: Optional[str] = Header(None)):
    """Zmaž projekt z Supabase a zmaž priečinkkovú štruktúru"""
    try:
        print(f"\n🗑️  DELETE PROJECT ENDPOINT")
        print(f"   project_id: {project_id}")
        
        if not authorization:
            print("❌ No token provided")
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Skontroluj či projekt existuje
        response = supabase.table('projects').select('id, owner_id').eq('id', project_id).execute()
        
        if not response.data or len(response.data) == 0:
            print(f"❌ Project not found: {project_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = response.data[0]
        owner_id = project.get('owner_id')
        
        print(f"✅ Project found, owner_id: {owner_id}")
        
        # Zmaž projekt z Supabase
        print("📡 Deleting from Supabase...")
        delete_response = supabase.table('projects').delete().eq('id', project_id).execute()
        print(f"✅ Supabase delete response: {delete_response}")
        
        # Zmaž priečinkkovú štruktúru z disku
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        project_dir = Path(projects_path) / owner_id / project_id
        
        if project_dir.exists():
            print(f"📁 Deleting directory: {project_dir}")
            import shutil
            shutil.rmtree(project_dir)
            print(f"✅ Directory deleted successfully")
        
        return {
            "success": True,
            "message": f"Project {project_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# IMAGE UPLOAD
# ============================================

@app.post("/api/projects/{project_id}/upload-image")
async def upload_project_image(
    project_id: str,
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload obrázku do projektu a aktualizácia photos_count"""
    try:
        print(f"\n📸 UPLOAD IMAGE ENDPOINT")
        print(f"   project_id: {project_id}")
        print(f"   filename: {file.filename}")
        print(f"   token: {authorization[:20] if authorization else 'NONE'}...")
        
        if not authorization:
            print("❌ No token provided")
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Ulož obrázok do PROJECTS_PATH/user_id/project_id/images/
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        
        # Musíme nájsť všetky user_id priečinky a nájsť ten s project_id
        projects_root = Path(projects_path)
        image_path = None
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    project_dir = user_dir / project_id / 'images'
                    if project_dir.exists():
                        image_path = project_dir
                        break
        
        if not image_path:
            print(f"❌ Project directory not found for project_id: {project_id}")
            raise HTTPException(status_code=404, detail="Project directory not found")
        
        # Ulož obrázok
        file_path = image_path / file.filename
        with open(file_path, "wb") as f:
            contents = await file.read()
            f.write(contents)
        
        print(f"✅ Obrázok uložený: {file_path}")
        
        # Spočítaj všetky obrázky v priečinku
        image_files = list(image_path.glob('*'))
        photos_count = len(image_files)
        print(f"📊 Počet obrázkov: {photos_count}")
        
        # Aktualizuj photos_count v Supabase
        try:
            update_response = supabase.table('projects').update(
                {'photos_count': photos_count}
            ).eq('id', project_id).execute()
            
            print(f"✅ Supabase aktualizovaný: photos_count = {photos_count}")
        except Exception as db_error:
            print(f"⚠️ Upozornenie: Nepodarilo sa aktualizovať Supabase: {db_error}")
        
        return {
            "filename": file.filename,
            "path": str(file_path),
            "url": f"/api/projects/{project_id}/{file.filename}",
            "photos_count": photos_count
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# 3D MODEL
# ============================================

@app.get("/api/projects/{project_id}/3d-model")
async def check_3d_model(project_id: str):
    """Skontroluj či existuje 3D model pre projekt"""
    try:
        print(f"\n🎯 CHECK 3D MODEL ENDPOINT")
        print(f"   project_id: {project_id}")
        
        # Nájsť model v priečinku PROJECTS_PATH/user_id/project_id/3Dmodel/
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        projects_root = Path(projects_path)
        
        model_path = None
        model_file = None
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    model_dir = user_dir / project_id / '3Dmodel'
                    if model_dir.exists():
                        # Hľadaj .ply súbor
                        for file in model_dir.glob('*.ply'):
                            model_path = file
                            model_file = file.name
                            break
                        if model_path:
                            break
        
        if model_path:
            print(f"✅ Model nájdený: {model_path}")
            return {
                "exists": True,
                "filename": model_file,
                "size": model_path.stat().st_size
            }
        else:
            print(f"⚠️ Model not found for project_id: {project_id}")
            return {
                "exists": False
            }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}/3d-model/content")
async def get_3d_model_content(project_id: str):
    """Načítaj obsah 3D modelu (PLY formát) pre projekt"""
    try:
        print(f"\n🎯 GET 3D MODEL CONTENT ENDPOINT")
        print(f"   project_id: {project_id}")
        
        # Nájsť model v priečinku PROJECTS_PATH/user_id/project_id/3Dmodel/
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        projects_root = Path(projects_path)
        
        model_path = None
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    model_dir = user_dir / project_id / '3Dmodel'
                    if model_dir.exists():
                        # Hľadaj .ply súbor
                        for file in model_dir.glob('*.ply'):
                            model_path = file
                            break
                        if model_path:
                            break
        
        if not model_path:
            print(f"❌ Model not found for project_id: {project_id}")
            raise HTTPException(status_code=404, detail="3D model not found")
        
        print(f"✅ Model nájdený: {model_path}")
        
        # Načítaj PLY obsah - binárny format
        try:
            with open(model_path, 'rb') as f:
                model_content = f.read()
            
            print(f"✅ Model obsah prečítaný ({len(model_content)} bytes)")
            
            # Vráť raw PLY obsah ako bytes
            return Response(
                content=model_content,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"inline; filename={model_path.name}"}
            )
        except Exception as read_error:
            print(f"❌ Error reading model: {read_error}")
            raise HTTPException(status_code=400, detail=f"Error reading model: {str(read_error)}")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{user_id}/{project_id}/3d-model/download-all")
async def download_3d_model_all(user_id: str, project_id: str):
    """Stiahni všetky súbory z 3Dmodel priečinka ako ZIP"""
    try:
        print(f"\n📦 DOWNLOAD 3D MODEL ZIP ENDPOINT")
        print(f"   user_id: {user_id}")
        print(f"   project_id: {project_id}")
        
        # Načítaj projekt meno z DB
        project_name = project_id
        try:
            project_response = supabase.table('projects').select('name').eq('id', project_id).single().execute()
            if project_response.data and project_response.data.get('name'):
                project_name = project_response.data['name']
                print(f"✅ Project name z DB: {project_name}")
        except Exception as db_error:
            print(f"⚠️  Nepodarilo sa načítať meno projektu z DB, používam ID: {db_error}")
        
        # Skontroluj cestu: PROJECTS_PATH/user_id/project_id/3Dmodel
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        model_dir = Path(projects_path) / user_id / project_id / '3Dmodel'
        
        if not model_dir.exists():
            print(f"❌ 3Dmodel priečinok not found: {model_dir}")
            raise HTTPException(status_code=404, detail=f"3Dmodel folder not found for user {user_id}, project {project_id}")
        
        # Skontroluj či priečinok obsahuje súbory
        files_list = list(model_dir.glob('*'))
        if not files_list:
            print(f"⚠️ 3Dmodel priečinok je prázdny: {model_dir}")
            raise HTTPException(status_code=404, detail="No files in 3Dmodel folder")
        
        print(f"✅ Nájdených {len(files_list)} súborov v {model_dir}")
        for f in files_list:
            print(f"   - {f.name}")
        
        # Vytvor ZIP v pamäti
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in files_list:
                if file_path.is_file():
                    arcname = file_path.name  # Názov v ZIP bez cesty
                    zip_file.write(file_path, arcname=arcname)
                    print(f"   ✓ {file_path.name} pridaný do ZIP")
        
        zip_buffer.seek(0)
        zip_size = zip_buffer.getbuffer().nbytes
        print(f"✅ ZIP vytvorený ({zip_size} bytes)")
        
        # Vytvor bezpečný názov súboru bez medzier a špeciálnych znakov
        safe_filename = (
            project_name
            .replace(' ', '_')  # Medzery -> podčiarky
            .replace('/', '_')  # Lomítka -> podčiarky
            .replace('\\', '_')  # Spätné lomítka -> podčiarky
            .replace(':', '_')  # Dvojbodky -> podčiarky
            .replace('*', '_')  # Hviezdičky -> podčiarky
            .replace('?', '_')  # Otazníky -> podčiarky
            .replace('"', '_')  # Úvodzovky -> podčiarky
            .replace('<', '_')  # Menšie -> podčiarky
            .replace('>', '_')  # Väčšie -> podčiarky
            .replace('|', '_')  # Potrubie -> podčiarky
            [:50]  # Max 50 znakov
        )
        safe_filename = f"{safe_filename}_3dmodel.zip"
        
        print(f"📁 ZIP názov: {safe_filename}")
        
        # Vráť ZIP ako download
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={safe_filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}/media")
async def get_project_media(project_id: str):
    """Zíkaj všetky dostupné médiá (videá MP4 a 3D modely PLY) pre projekt"""
    try:
        print(f"\n🎯 GET PROJECT MEDIA ENDPOINT")
        print(f"   project_id: {project_id}")
        
        # Nájsť médiá v priečinku PROJECTS_PATH/user_id/project_id/3Dmodel/
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        projects_root = Path(projects_path)
        
        videos = []
        models = []
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    media_dir = user_dir / project_id / '3Dmodel'
                    if media_dir.exists():
                        # Hľadaj MP4 videá
                        for file in media_dir.glob('*.mp4'):
                            videos.append({
                                "filename": file.name,
                                "type": "video",
                                "size": file.stat().st_size
                            })
                        # Hľadaj PLY modely
                        for file in media_dir.glob('*.ply'):
                            models.append({
                                "filename": file.name,
                                "type": "model",
                                "size": file.stat().st_size
                            })
                        break
        
        print(f"✅ Nájdené videá: {len(videos)}, modely: {len(models)}")
        
        return {
            "videos": videos,
            "models": models,
            "has_media": len(videos) > 0 or len(models) > 0,
            "priority": "video" if videos else ("model" if models else None)
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}/media/{media_type}/{filename}")
async def get_project_media_file(project_id: str, media_type: str, filename: str, token: str = Query(None)):
    """Stiahni médiá súbor (video alebo model)"""
    try:
        print(f"\n🎯 GET PROJECT MEDIA FILE ENDPOINT")
        print(f"   project_id: {project_id}, media_type: {media_type}, filename: {filename}")
        print(f"   token provided: {bool(token)}")
        
        # Bezpečnostná kontrola - filename nesmie obsahovať ..
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        # Podporované formáty
        if media_type == "video":
            extension = ".mp4"
        elif media_type == "model":
            extension = ".ply"
        else:
            raise HTTPException(status_code=400, detail="Invalid media type")
        
        if not filename.endswith(extension):
            raise HTTPException(status_code=400, detail=f"Invalid file extension for {media_type}")
        
        # Nájsť súbor v priečinku PROJECTS_PATH/user_id/project_id/3Dmodel/
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'routers' / 'projects')
        projects_root = Path(projects_path)
        
        file_path = None
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    media_dir = user_dir / project_id / '3Dmodel'
                    if media_dir.exists():
                        potential_file = media_dir / filename
                        if potential_file.exists() and potential_file.is_file():
                            file_path = potential_file
                            break
        
        if not file_path:
            print(f"❌ Media file not found: {filename}")
            raise HTTPException(status_code=404, detail="Media file not found")
        
        print(f"✅ Media súbor nájdený: {file_path}")
        
        # Vráť súbor
        if media_type == "video":
            file_size = file_path.stat().st_size
            print(f"📹 Returning video file, size: {file_size} bytes")
            return FileResponse(
                file_path,
                media_type="video/mp4",
                headers={
                    "Content-Disposition": f"inline; filename={filename}",
                    "Cache-Control": "public, max-age=31536000",
                    "Content-Length": str(file_size),
                    "Accept-Ranges": "bytes"
                }
            )
        else:  # model
            # Načítaj PLY obsah - binárny format
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            return Response(
                content=file_content,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"inline; filename={filename}"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# 3D MODEL GENERATION
# ============================================

@app.post("/api/projects/{user_id}/{project_id}/generate-3d-model")
async def trigger_3d_model_generation(
    user_id: str,
    project_id: str,
    authorization: Optional[str] = Header(None),
    async_mode: bool = Query(False, description="Spustí training asyncne v pozadí")
):
    """
    Spustenie generácie 3D modelu pomocou Nerfstudio
    - async_mode=True: Spustí v worker procese v pozadí (rýchlo sa vráti)
    - async_mode=False: Spustí synchronne (čaká na výsledok)
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        print(f"\n🚀 GENERATE 3D MODEL ENDPOINT")
        print(f"   user_id: {user_id}")
        print(f"   project_id: {project_id}")
        print(f"   async_mode: {async_mode}")
        
        # Skontroluj či projekt existuje
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'projects')
        project_path = Path(projects_path) / user_id / project_id
        
        if not project_path.exists():
            raise HTTPException(status_code=404, detail="Project not found")
        
        images_path = project_path / "images"
        if not images_path.exists() or not list(images_path.glob("*")):
            raise HTTPException(status_code=400, detail="No images in project")
        
        # Ak je asyncne, spustí v background worker
        if async_mode:
            print("⏳ Spúšťam async worker...")
            
            def run_worker():
                try:
                    result = subprocess.run(
                        ["python", "worker_3d_models.py", user_id, project_id],
                        cwd=Path(__file__).parent,
                        capture_output=True,
                        text=True
                    )
                    print(f"✅ Worker dokončený: {result.stdout}")
                    if result.returncode != 0:
                        print(f"❌ Worker error: {result.stderr}")
                except Exception as e:
                    print(f"❌ Worker exception: {e}")
            
            # Spustí worker v separátnom vlákne
            worker_thread = threading.Thread(target=run_worker, daemon=True)
            worker_thread.start()
            
            return {
                "status": "generation_started",
                "message": "3D model generation started in background",
                "project_id": project_id,
                "user_id": user_id,
                "async": True
            }
        
        # Synchronné spustenie (dlhší čas čakania)
        else:
            print("⏳ Spúšťam synchronný training...")
            
            try:
                from generate_3d_models import NerfstudioTrainer
                
                trainer = NerfstudioTrainer(project_path, project_id, user_id)
                result = trainer.process_project()
                
                if result:
                    return {
                        "status": "success",
                        "message": "3D model generated successfully",
                        "project_id": project_id,
                        "user_id": user_id
                    }
                else:
                    raise HTTPException(status_code=400, detail="Model generation failed")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                raise HTTPException(status_code=400, detail=f"Generation error: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/batch/generate-all-models")
async def generate_all_3d_models(
    authorization: Optional[str] = Header(None),
    force: bool = Query(False, description="Vygeneruj aj existujúce modely znova")
):
    """
    Hromadné generovanie 3D modelov pre všetky projekty bez modelov
    - Spustí sa v async worker procese
    - force=True: Vygeneruje aj existujúce modely znova
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        print(f"\n🚀 BATCH GENERATE 3D MODELS ENDPOINT")
        print(f"   force: {force}")
        
        def run_batch_worker():
            try:
                args = ["python", "generate_3d_models.py"]
                if force:
                    args.append("--force")
                
                result = subprocess.run(
                    args,
                    cwd=Path(__file__).parent,
                    capture_output=True,
                    text=True
                )
                print(f"✅ Batch worker dokončený:\n{result.stdout}")
                if result.returncode != 0:
                    print(f"❌ Batch worker error:\n{result.stderr}")
            except Exception as e:
                print(f"❌ Batch worker exception: {e}")
        
        # Spustí batch worker v separátnom vlákne
        batch_thread = threading.Thread(target=run_batch_worker, daemon=True)
        batch_thread.start()
        
        return {
            "status": "batch_generation_started",
            "message": "Batch 3D model generation started in background",
            "force": force
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NERFSTUDIO VIEWER
# ============================================

@app.post("/api/projects/{project_id}/viewer/start")
async def start_nerfstudio_viewer(
    project_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Spustenie Nerfstudio vieweru pre projekt
    - Zastaví viewer ak beží pre iný projekt
    - Spustí nový viewer pre tento projekt
    
    Frontend volá tento endpoint z http://localhost:8085/project-V2/{id}
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        print(f"\n📺 VIEWER START ENDPOINT")
        print(f"   project_id: {project_id}")
        
        # Nájdi projekt a jeho config
        projects_path = os.getenv('PROJECTS_PATH', Path(__file__).parent / 'projects')
        projects_root = Path(projects_path)
        
        config_path = None
        project_found = False
        
        if projects_root.exists():
            for user_dir in projects_root.iterdir():
                if user_dir.is_dir():
                    project_dir = user_dir / project_id
                    if project_dir.exists():
                        project_found = True
                        
                        # Hľadaj config.yml v processed/step2/nerfacto/
                        processed_dir = project_dir / "processed" / "step2" / "nerfacto"
                        if processed_dir.exists():
                            config_file = processed_dir / "config.yml"
                            if config_file.exists():
                                config_path = config_file
                                break
                        
                        # Ak nie, hľadaj rekurzívne
                        if not config_path:
                            try:
                                step2_dir = project_dir / "processed" / "step2"
                                if step2_dir.exists():
                                    config_path = find_config_yml(step2_dir)
                                    break
                            except:
                                pass
        
        if not project_found:
            print(f"❌ Projekt nenájdený: {project_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not config_path:
            print(f"❌ Config.yml nenájdený pre projekt: {project_id}")
            raise HTTPException(status_code=400, detail="Config.yml not found - model may not be trained yet")
        
        print(f"✅ Config nájdený: {config_path}")
        
        # Spusti viewer
        viewer_started = start_viewer(project_id, config_path)
        
        if viewer_started:
            return {
                "success": True,
                "message": "Viewer started successfully",
                "project_id": project_id,
                "config_path": str(config_path),
                "viewer_url": f"http://localhost:7007"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to start viewer")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/{project_id}/viewer/stop")
async def stop_nerfstudio_viewer(
    project_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Zastavenie Nerfstudio vieweru
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        print(f"\n📺 VIEWER STOP ENDPOINT")
        print(f"   project_id: {project_id}")
        
        viewer_stopped = kill_viewer()
        
        return {
            "success": viewer_stopped,
            "message": "Viewer stopped" if viewer_stopped else "No viewer running"
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN
# ============================================

@app.get("/api/admin/users")
async def get_all_users(authorization: Optional[str] = Header(None)):
    """Načítaj všetkých užívateľov (Admin endpoint)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        response = supabase.rpc('load_all_users').execute()
        
        if not response.data:
            return []
        
        users = response.data
        return [
            {
                "id": str(u['id']),
                "username": u.get('username', ''),
                "email": u.get('email', ''),
                "role": u.get('role', 'user'),
                "created_at": str(u.get('created_at', ''))
            }
            for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(authorization: Optional[str] = Header(None)):
    """Načítaj štatistiku (Admin endpoint)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Počet užívateľov
        users_res = supabase.table('users').select('id', count='exact').execute()
        total_users = len(users_res.data) if users_res.data else 0
        
        # Počet projektov
        projects_res = supabase.table('projects').select('id, status', count='exact').execute()
        total_projects = len(projects_res.data) if projects_res.data else 0
        
        # Projekty podľa statusu
        projects_by_status = {}
        if projects_res.data:
            for p in projects_res.data:
                status = p.get('status', 'pending')
                projects_by_status[status] = projects_by_status.get(status, 0) + 1
        
        return {
            "total_users": total_users,
            "total_projects": total_projects,
            "projects_by_status": projects_by_status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/users/{user_id}")
async def get_user_detail(user_id: str, authorization: Optional[str] = Header(None)):
    """Načítaj detaily užívateľa a jeho projekty (Admin endpoint)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Načítaj užívateľa
        user_response = supabase.table('users').select('id, username, email, created_at').eq('id', user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_response.data[0]
        
        # Načítaj projekty užívateľa
        projects_response = supabase.table('projects').select('id, name as project_name, status, description, photos_count as image_count, created_at, updated_at').eq('owner_id', user_id).execute()
        projects = projects_response.data if projects_response.data else []
        
        return {
            "id": str(user['id']),
            "username": user.get('username', ''),
            "email": user.get('email', ''),
            "created_at": str(user.get('created_at', '')),
            "projects_count": len(projects),
            "projects": [
                {
                    "id": str(p['id']),
                    "project_name": p.get('project_name', ''),
                    "status": p.get('status', 'pending'),
                    "description": p.get('description', ''),
                    "image_count": p.get('image_count', 0),
                    "created_at": str(p.get('created_at', '')),
                    "updated_at": str(p.get('updated_at', ''))
                }
                for p in projects
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/tables")
async def get_tables(authorization: Optional[str] = Header(None)):
    """Načítaj zoznam všetkých tabuliek (Admin endpoint)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Zoznam tabuliek dostupných na backendu
        tables = [
            {"name": "users", "count": 0},
            {"name": "projects", "count": 0},
        ]
        
        # Počet riadkov v každej tabuľke
        for table in tables:
            try:
                res = supabase.table(table['name']).select('id', count='exact').execute()
                table['count'] = len(res.data) if res.data else 0
            except:
                table['count'] = 0
        
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/admin/tables/{table_name}")
async def get_table_data(table_name: str, authorization: Optional[str] = Header(None)):
    """Načítaj údaje z tabuľky (Admin endpoint)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Povol iba bezpečné tabuľky
        allowed_tables = ["users", "projects"]
        if table_name not in allowed_tables:
            raise HTTPException(status_code=403, detail="Table not allowed")
        
        response = supabase.table(table_name).select('*').limit(100).execute()
        return {"table": table_name, "data": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# FILES
# ============================================

@app.post("/api/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = None,
    authorization: Optional[str] = Header(None)
):
    """Upload súboru"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Vytvoriť priečinok
        project_dir = FILES_DIR / project_id
        project_dir.mkdir(exist_ok=True)
        
        # Ulož súbor
        file_path = project_dir / file.filename
        with open(file_path, "wb") as f:
            contents = await file.read()
            f.write(contents)
        
        return {
            "filename": file.filename,
            "url": f"/api/files/{project_id}/{file.filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files/{project_id}/{filename}")
async def get_file(project_id: str, filename: str):
    """Download súboru"""
    try:
        file_path = FILES_DIR / project_id / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# WORKER SERVER ENDPOINTS
# ============================================

@app.post("/api/worker/login")
async def worker_login(request: LoginRequest):
    """Prihlásenie admin usera ako worker (Server 2)"""
    try:
        response = supabase.rpc(
            'login_user',
            {'p_username': request.username, 'p_password': request.password}
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = response.data[0]
        
        # Skontroluj či je admin
        if user.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Only admin can access worker endpoints")
        
        return {
            "access_token": "placeholder-jwt-token",
            "token_type": "bearer",
            "user": {
                "id": str(user['id']),
                "username": user.get('username', ''),
                "email": user.get('email', ''),
                "role": user.get('role', ''),
                "created_at": str(user.get('created_at', ''))
            },
            "user_id": str(user['id'])
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/api/worker/projects/pending")
async def get_pending_projects(authorization: Optional[str] = Header(None)):
    """Načítaj pending projekty pre worker (RPC)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Volaj RPC funkciu na načítanie pending alebo empty projects
        response = supabase.rpc('load_pending_or_empty_projects').execute()
        
        if not response.data:
            return []
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/worker/projects/{project_id}/images/list")
async def list_project_images(
    project_id: str,
    owner_id: str = Query(...),
    authorization: Optional[str] = Header(None)
):
    """Zoznam fotiek projektu"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Skontroluj či projekt existuje
        response = supabase.table('projects').select('*').eq('id', project_id).eq('owner_id', owner_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Zoznam obrázkov z priečinka
        project_dir = FILES_DIR / owner_id / project_id / "images"
        images = []
        
        if project_dir.exists():
            for file in project_dir.glob("*"):
                if file.is_file() and file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                    images.append(file.name)
        
        return {"images": sorted(images)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/worker/projects/{project_id}/images/download/{filename}")
async def download_project_image(
    project_id: str,
    filename: str,
    owner_id: str = Query(...),
    authorization: Optional[str] = Header(None)
):
    """Download fotky projektu"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        file_path = FILES_DIR / owner_id / project_id / "images" / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        return FileResponse(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/worker/projects/{project_id}/update-objects")
async def update_project_objects(
    project_id: str,
    data: dict,
    authorization: Optional[str] = Header(None)
):
    """Aktualizuj objekty (YOLO výsledky)"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        objects = data.get("objects", "")
        
        # Aktualizuj projekt
        response = supabase.table('projects').update({"objects": objects}).eq('id', project_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Objects updated", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/worker/projects/{project_id}/upload-3d-model")
async def upload_3d_model(
    project_id: str,
    file: UploadFile = File(...),
    owner_id: str = Query(...),
    authorization: Optional[str] = Header(None)
):
    """Upload 3D modelu"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Vytvoriť priečinok
        model_dir = FILES_DIR / owner_id / project_id
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Ulož súbor
        file_path = model_dir / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Aktualizuj projekt na "generated" status
        supabase.table('projects').update({"status": "generated"}).eq('id', project_id).execute()
        
        return {
            "message": "3D model uploaded",
            "filename": file.filename,
            "project_id": project_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# DOCS
# ============================================

@app.get("/docs", include_in_schema=False)
async def docs():
    """API dokumentácia"""
    return {"message": "API docs dostupné na /docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
