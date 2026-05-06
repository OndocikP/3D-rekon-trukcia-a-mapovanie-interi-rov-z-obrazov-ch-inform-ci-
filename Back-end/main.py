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
FILES_DIR = Path(__file__).parent / "files"
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
        project_dir = FILES_DIR / owner_id / project_id
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
        
        file_path = FILES_DIR / owner_id / project_id / filename
        
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
