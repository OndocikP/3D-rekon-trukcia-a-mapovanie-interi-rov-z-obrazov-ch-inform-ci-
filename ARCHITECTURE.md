# 3D Rekon - Architekúra

## 🏗️ Prehľad systému

```
┌─────────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   FRONTEND          │         │    BACKEND       │         │  SUPABASE CLOUD  │
│  React Native       │◄────────►│    FastAPI       │◄────────►│  PostgreSQL      │
│  Expo + TS          │  HTTP    │    Python        │   SQL    │  Authentication  │
│  localhost:8081     │          │  localhost:8000  │          │  File Storage    │
└─────────────────────┘         └──────────────────┘         └──────────────────┘
          │                              │
          │                              ▼
          │                     ┌──────────────────┐
          │                     │  LOCAL STORAGE   │
          │                     │  Projects Path   │
          │                     │  /images         │
          │                     │  /3Dmodel        │
          │                     └──────────────────┘
          │
          └─────────────────────► Images + 3D Models
```

---

## 📱 FRONTEND (React Native + Expo)

### Technológie
- **Framework**: React Native s Expo (TypeScript)
- **Port**: `localhost:8081`
- **Ciele**: Zobrazenie projektov, nahrávania obrázkov, 3D modelov

### Hlavné obrazovky

#### 1. **Login/Register** (`app/login.tsx`, `app/register.tsx`)
- Prihlasovanie cez Supabase RPC funkcie
- Uloženie tokenu v `AsyncStorage`
- Redirect na hlavný screen

#### 2. **Main** (`app/main.tsx`)
- Zoznam projektov užívateľa
- Každý projekt ako `ProjectCard` komponent
- Klik → detaily projektu

#### 3. **Project Detail** (`app/project/[id].tsx`)
- **Zobrazenie**:
  1. Názov projektu (z backend API)
  2. 3D model viewer (Three.js)
  3. Info karta (Popis + Počet objektov)
- **API volania**:
  - `GET /api/projects/{project_id}/info` → Údaje projektu
  - `GET /api/projects/{project_id}/3d-model/content` → PLY model

#### 4. **Project New** (`app/project/new.tsx`)
- Formulár na vytvorenie nového projektu
- **API volanie**:
  - `POST /api/projects/create/{user_id}` → Vytvor projekt
- **Body**: `{name, description}`

### Kľúčové komponenty

#### `ThreeDViewer.web.tsx` - 3D Model Viewer
```typescript
// Načítaj PLY súbor z backendu
const response = await fetch(`/api/projects/{project_id}/3d-model/content`);
const arrayBuffer = await response.arrayBuffer();

// Parsuj PLY formát
parsePly(arrayBuffer) → {vertices, faces, colors}

// Vykresli s Three.js
const geometry = new BufferGeometry();
geometry.setAttribute('position', positions);
geometry.setAttribute('color', colors);
const mesh = new Mesh(geometry, material);
scene.add(mesh);
```

#### `AuthContext.tsx` - Správa prihlásenia
```typescript
- `user` → Aktuálny užívateľ
- `token` → JWT token z Supabase
- `login()` → Prihlásenie
- `logout()` → Odhlásenie
```

#### `client.ts` - API klient
```typescript
// Base URL na backend
const API_URL = 'http://localhost:8000/api'

// Helper na všetky requesty
apiClient.get(), apiClient.post() → Automatické headery
```

---

## 🐍 BACKEND (FastAPI + Supabase)

### Technológie
- **Framework**: FastAPI (Python 3.12)
- **Port**: `localhost:8000`
- **Database**: Supabase Cloud (PostgreSQL RPC funkcie)
- **File Storage**: Lokálny filesystem (`PROJECTS_PATH`)

### Hlavné endpointy

#### **Authentication**
```
POST /api/auth/login
  Body: {username, password}
  → {access_token, user: {id, username, email, role}}

POST /api/auth/register
  Body: {username, email, password}
  → {access_token, user: {...}}
```

#### **Projects**
```
GET /api/projects/{user_id}
  → [{id, project_name, status, description, image_count, objects}]

POST /api/projects/create/{user_id}
  Header: Authorization: Bearer <token>
  Body: {name, description}
  → {id, name, status, owner_id, images_path}
  ✓ Vytvorí priečinkkovú štruktúru: PROJECTS_PATH/user_id/project_id/

GET /api/projects/{project_id}/info
  → {id, project_name, status, description, image_count, objects}
```

#### **Image Upload**
```
POST /api/projects/{project_id}/upload-image
  Header: Authorization: Bearer <token>
  Body: File (multipart/form-data)
  → Uloží do: PROJECTS_PATH/user_id/project_id/images/
  → Aktualizuje photos_count v Supabase
  → {filename, photos_count}
```

#### **3D Model**
```
GET /api/projects/{project_id}/3d-model
  → {exists: bool, filename, size}

GET /api/projects/{project_id}/3d-model/content
  → Raw PLY binárny obsah (application/octet-stream)
  → Súbor umiestnený v: PROJECTS_PATH/user_id/project_id/3Dmodel/
```

#### **Admin** (Admin endpointy)
```
GET /api/admin/users
GET /api/admin/stats
GET /api/admin/users/{user_id}
GET /api/admin/tables
```

### Štruktúra projektu

```
Back-end/
├── main.py              ← Všetky endpointy
├── requirements.txt     ← Dependencies (fastapi, supabase, python-dotenv)
├── .env                 ← Supabase credentials (IGNOROVANÉ git-om!)
├── Dockerfile           ← Docker image
├── projects/            ← Lokálne uložisko projektov
│   ├── {user_id}/
│   │   └── {project_id}/
│   │       ├── images/          ← Nahraté obrázky
│   │       └── 3Dmodel/         ← PLY model
│   └── ...
```

### Tok vytvorenia projektu

```
1. Frontend: POST /api/projects/create/{user_id}
   ↓
2. Backend: Volá Supabase RPC create_project()
   ↓
3. Backend: Vytvorí priečinkkovú štruktúru
   - PROJECTS_PATH/user_id/project_id/images/
   - PROJECTS_PATH/user_id/project_id/3Dmodel/
   ↓
4. Frontend: Dostane project_id a images_path
   ↓
5. Frontend: Môže nahrať obrázky POST /api/projects/{project_id}/upload-image
```

---

## 🔄 Komuníkácia Frontend ↔ Backend

### 1. Prihlásenie
```
Frontend → POST /api/auth/login {username, password}
Backend  → Supabase RPC login_user()
Backend  ← Response {user_id, role}
Frontend ← {access_token, user}
Frontend → Uloženie tokenu v AsyncStorage
```

### 2. Načítanie projektov
```
Frontend → GET /api/projects/{user_id}
Backend  → Supabase RPC load_project_user_id()
Backend  ← Zoznam projektov
Frontend ← [{id, project_name, ...}]
Frontend → Zobrazenie projektov ako karty
```

### 3. Vytvorenie projektu
```
Frontend → POST /api/projects/create/{user_id}
           Header: Authorization
           Body: {name, description}
Backend  → Supabase RPC create_project()
Backend  → Vytvára priečinkky
Backend  ← project_id
Frontend ← {id, name, status, images_path}
Frontend → Redirect na detail projektu
```

### 4. Načítanie 3D modelu
```
Frontend → GET /api/projects/{project_id}/3d-model/content
Backend  → Hľadá .ply súbor v 3Dmodel/ priečinku
Backend  ← Binárny obsah
Frontend ← PLY data (application/octet-stream)
Frontend → Parsuje PLY → Three.js mesh
Frontend → Vykreslí v scene
```

---

## 📦 Závislosti

### Backend (`requirements.txt`)
```
fastapi             ← Web framework
uvicorn             ← Server
supabase            ← Database client
python-dotenv       ← .env file loader
```

### Frontend (`package.json`)
```
react-native        ← UI framework
expo                ← Build system
typescript          ← Type safety
axios / fetch       ← HTTP client
three              ← 3D graphics (CDN)
```

---

## 🔐 Bezpečnosť

### Environment Variables (`.env` - NIKDY v git!)
```
SUPABASE_URL=https://...
SUPABASE_KEY=sb_secret_...
DATABASE_URL=postgresql://...
PROJECTS_PATH=/path/to/projects
```

### Token flow
```
Frontend: Uloženie tokenu v AsyncStorage
Backend: Príjme token v Authorization headeri
Backend: Token sa nevaliduje (placeholder)
Frontend: Odoslane v headeri pri každom requeste
```

---

## 🚀 Spustenie

### Backend
```bash
cd Back-end
python -m pip install -r requirements.txt
python main.py
# Beží na http://localhost:8000
```

### Frontend
```bash
cd Front-end
npm install
npx expo start
# Beží na http://localhost:8081
```

---

## 📊 Dátový model

### Supabase tabuľky (PostgreSQL)
```sql
users {
  id: UUID (PRIMARY)
  username: VARCHAR
  email: VARCHAR
  password_hash: VARCHAR
  role: VARCHAR (user/admin)
  created_at: TIMESTAMP
}

projects {
  id: UUID (PRIMARY)
  owner_id: UUID (FOREIGN)
  name: VARCHAR
  description: TEXT
  status: VARCHAR (pending/active/completed)
  photos_count: INTEGER
  objects: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

---

## ✅ Pracovný workflow

1. **Používateľ sa prihláša** → token v AsyncStorage
2. **Vidí zoznam projektov** → GET `/api/projects/{user_id}`
3. **Klik na projekt** → Detaily + 3D model
4. **Vytvorí nový projekt** → POST `/api/projects/create/{user_id}`
5. **Nahrá obrázky** → POST `/api/projects/{project_id}/upload-image`
6. **Vidí 3D model** → GET `/api/projects/{project_id}/3d-model/content`

---

## 🛠️ Debugovanie

### Backend konzola
```
✅ Supabase pripojené
🔍 CREATE PROJECT ENDPOINT
   user_id: ...
   name: ...
📡 Calling Supabase RPC...
✅ Projekt úspešně vytvorený: /path/to/project
```

### Frontend Network tab (DevTools)
```
POST /api/projects/create/{user_id} → 200 OK
GET /api/projects/{project_id}/info → 200 OK
GET /api/projects/{project_id}/3d-model/content → 200 OK
```

---

## 📝 Poznámky

- **PLY formát**: ASCII/binary, s vertexami a farbami
- **Port 8000**: Backend (FastAPI/Uvicorn)
- **Port 8081**: Frontend (Expo)
- **Supabase**: Cloud PostgreSQL + RPC funkcie
- **3D model**: Uložený lokálne, vrátený ako binary
