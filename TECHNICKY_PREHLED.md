# 🔧 TECHNICKÝ PREHĽAD - SYSTÉMOVÉ POŽIADAVKY

Detailný technický prehľad všetkých komponentov, portov, a služieb.

---

## 📊 SYSTÉMOVÁ ARCHITEKTÚRA

```
┌─────────────────────────────────────────────────────────────────────┐
│                     APLIKÁCIA - 3D REKONŠTRUKCIA                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│   FRONTEND               │         │   BACKEND                │
│   React Native + Expo    │◄───────►│   FastAPI (Python)       │
│   Port: 8081             │  HTTP   │   Port: 8000             │
│   TypeScript             │         │   PostgreSQL Driver      │
│   Three.js (3D)          │         │   SQLAlchemy ORM         │
└──────────────────────────┘         └──────────────────────────┘
          │                                   │
          │                                   │
          └───────────────────┬───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   SUPABASE CLOUD  │
                    │   PostgreSQL DB   │
                    │   Authentication  │
                    │   File Storage    │
                    └───────────────────┘
```

---

## 🖥️ MINIMÁLNE SYSTÉMOVÉ POŽIADAVKY

| Komponent | Požiadavka | Poznámka |
|-----------|-----------|----------|
| **Procesor** | Intel/AMD 2 GHz+ | Multi-core (4+ CPU) |
| **RAM** | 4 GB minimálne | 8 GB odporúčané |
| **Disk** | 10 GB voľného miesta | Pre projekty a modely |
| **Sieť** | Internetové pripojenie | Pre Supabase |
| **OS** | Windows 7+, macOS 10.12+, Linux | Akýkoľvek moderný OS |

---

## 📦 SOFTVÉR - POŽIADAVKY

### Povinné

| Softvér | Verzia | Účel | Stahnúť |
|---------|--------|------|--------|
| **Git** | 2.25+ | Klonovaní kódu | https://git-scm.com |
| **Python** | 3.9+ | Backend, Worker procesy | https://www.python.org |
| **Node.js** | 18+ | Frontend build system | https://nodejs.org |
| **npm** | 8+ | Frontend balíčky | Súčasť Node.js |

### Voliteľné

| Softvér | Verzia | Účel |
|---------|--------|------|
| **VSCode** | Najnovšia | Editor (odporúčam) |
| **Docker** | 20.10+ | Deployment (production) |
| **PostgreSQL** | 13+ | Lokálna databáza |
| **Postman** | Najnovšia | Testovanie API |

---

## 🔌 PORTY A SLUŽBY

### Lokálne Porty

| Port | Služba | URL | Status | Popis |
|------|--------|-----|--------|-------|
| **8000** | Backend API | http://localhost:8000 | 🟢 Aktívny | FastAPI server |
| **8001** | Backend API (alt) | http://localhost:8001 | 🔴 Volný | Rezerva pre Backend |
| **8081** | Frontend Web | http://localhost:8081 | 🟢 Aktívny | React Native Web |
| **8082** | Frontend (alt) | http://localhost:8082 | 🔴 Volný | Rezerva pre Frontend |
| **19000** | Expo Dev | http://localhost:19000 | 🟢 Aktívny | Expo Metro bundler |
| **19001** | Expo Dev (alt) | http://localhost:19001 | 🔴 Volný | Expo Dev server |
| **5432** | PostgreSQL | localhost:5432 | 🔴 Výt. | Lokálna DB (nepoužívame) |

### Cloud Služby

| Služba | URL | Popis |
|--------|-----|-------|
| **Supabase** | https://supabase.co | PostgreSQL Cloud + Auth |
| **API** | https://your-db.supabase.co | Cloud DB endpoint |

---

## 🗂️ PROJEKTOVÁ ŠTRUKTÚRA

```
3D-rekon/
│
├── Back-end/                        # Python FastAPI Backend
│   ├── main.py                      # Hlavný vstupný bod (port 8000)
│   ├── requirements.txt             # Python balíčky
│   ├── .env                         # Konfigurácia (DATABASE_URL, atď.)
│   ├── init_db.py                   # Inicializácia databázy
│   ├── models.py                    # SQLAlchemy modely
│   ├── schemas.py                   # Pydantic schémy (validácia)
│   ├── database.py                  # DB pripojenie
│   ├── auth.py                      # JWT autentifikácia
│   ├── routers/                     # API endpointy
│   │   ├── auth.py                  # /api/auth/* endpointy
│   │   ├── projects.py              # /api/projects/* endpointy
│   │   └── uploads.py               # /api/upload/* endpointy
│   ├── projects/                    # Úložisko obrázkov
│   │   └── {user_id}/
│   │       └── {project_id}/
│   │           ├── images/          # Nahrané obrázky
│   │           └── models/          # 3D modely
│   └── nerfstudio-output/           # Output z generácie 3D
│
├── Front-and/                       # React Native Frontend (Expo)
│   ├── App.tsx                      # Root komponent
│   ├── app.json                     # Expo konfigurácia
│   ├── package.json                 # Node.js balíčky
│   ├── .env.local                   # Konfigurácia (API URL, atď.)
│   ├── tsconfig.json                # TypeScript konfigurácia
│   ├── app/                         # Screens a navigácia
│   │   ├── login.tsx                # Prihlasovacia obrazovka
│   │   ├── register.tsx             # Registračná obrazovka
│   │   ├── main.tsx                 # Hlavná obrazovka (projekty)
│   │   └── project/                 # Detail projektu
│   │       └── [id].tsx             # Dynamická ruta
│   ├── src/
│   │   ├── api/                     # API klient
│   │   │   └── client.ts            # HTTP klient s base URL
│   │   ├── components/              # Reusable komponenty
│   │   │   ├── ThreeDViewer.web.tsx # 3D viewer (Three.js)
│   │   │   └── MediaViewer.web.tsx  # Zobrazenie obrázkov
│   │   ├── context/                 # React Context
│   │   │   └── AuthContext.tsx      # Spravovanie auth state
│   │   ├── screens/                 # Screen komponenty
│   │   ├── theme/                   # Farby a témy
│   │   └── utils/                   # Utility funkcie
│   └── assets/
│       └── images/                  # App assets
│
└── Dokumentácia
    ├── README.md                    # Prehľad projektu
    ├── SETUP_GUIDE.md               # Setup pokyny
    ├── DEVELOPMENT_SETUP.md         # Dev nastavenie
    ├── ARCHITECTURE.md              # Architekúra
    ├── SYSTEM_FLOW.md               # Proces toku
    ├── QUICK_START.md               # Rýchly start
    └── SYSTEMOVA_PRIRUCKA.md        # TÁTO PRÍRUČKA
```

---

## 🐍 BACKEND - DETAILY

### Technologický Stack

```
FastAPI (Python web framework)
  ├── Uvicorn (ASGI server)
  ├── Pydantic (validácia údajov)
  ├── SQLAlchemy (ORM)
  ├── psycopg2 (PostgreSQL driver)
  ├── python-jose (JWT tokeny)
  ├── passlib (hashovanie hesiel)
  └── python-dotenv (.env config)
```

### REST API Endpointy

#### Autentifikácia

```
POST   /api/auth/register          # Registrácia
POST   /api/auth/login             # Prihlásenie
POST   /api/auth/forgot-password   # Obnovenie hesla
GET    /api/auth/me                # Aktuálny užívateľ
GET    /health                     # Health check
GET    /docs                       # Swagger UI dokumentácia
```

#### Projekty

```
POST   /api/projects/create/{user_id}          # Vytvor projekt
GET    /api/projects/                          # Všetky projekty
GET    /api/projects/{project_id}              # Detail projektu
POST   /api/projects/{project_id}/upload-image # Nahraj obrázok
GET    /api/projects/{project_id}/info         # Info o projekte
GET    /api/projects/{project_id}/3d-model     # 3D model
```

### Databázové Tabuľky

#### `users`
```sql
id (UUID)                 -- Primary key
username (VARCHAR)        -- Unique
email (VARCHAR)           -- Unique
hashed_password (VARCHAR) -- bcrypt hash
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `projects`
```sql
id (UUID)              -- Primary key
user_id (UUID)         -- FK -> users.id
name (VARCHAR)         -- Projekt názov
description (TEXT)     -- Popis
status (VARCHAR)       -- pending/generating/generated/failed
photos_count (INT)     -- Počet obrázkov
objects_count (INT)    -- Počet detegovaných objektov
images_path (VARCHAR)  -- Cesta na disk
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Python Environment

```bash
# Virtual Environment (venv)
Back-end/venv/
  ├── Scripts/          # Aktivačné skripty
  ├── Lib/              # Nainštalované balíčky
  └── pyvenv.cfg        # Config

# Aktivácia:
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
```

---

## 📱 FRONTEND - DETAILY

### Technologický Stack

```
React Native (UI framework)
  ├── Expo (dev platform)
  ├── TypeScript (type checking)
  ├── React Router (navigácia)
  ├── Three.js (3D grafika)
  ├── AsyncStorage (local storage)
  ├── @react-native-async-storage (persistence)
  └── Axios (HTTP client)
```

### Project Štruktúra - App Navigácia

```
Login/Register
    ↓
Main (Project List)
    ↓ (select project)
    ↓
Project Detail (3D Viewer)
    ↓ (create new)
    ↓
New Project (Form + Upload)
```

### Screen Komponenty

| Screen | Súbor | Popis |
|--------|-------|-------|
| Login | `app/login.tsx` | Prihlásenie |
| Register | `app/register.tsx` | Registrácia |
| Main | `app/main.tsx` | Zoznam projektov |
| Project Detail | `app/project/[id].tsx` | Detail a 3D viewer |
| New Project | `app/project/new.tsx` | Tvorba projektu |

### Kľúčové Komponenty

| Komponent | Súbor | Popis |
|-----------|-------|-------|
| AuthContext | `src/context/AuthContext.tsx` | Správa auth state |
| API Client | `src/api/client.ts` | HTTP client |
| ThreeDViewer | `src/components/ThreeDViewer.web.tsx` | 3D viewer s Three.js |
| MediaViewer | `src/components/MediaViewer.web.tsx` | Zobrazenie obrázkov |

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 🌍 SUPABASE CLOUD

### Pripojenie

| Setting | Hodnota |
|---------|---------|
| **URL** | https://xdcvqsocpnxqibmtngmd.supabase.co |
| **Database** | postgresql |
| **Port** | 5432 |
| **User** | postgres |
| **Authentication** | JWT tokeny |

### Services

- **PostgreSQL Database** - Tabuľky: users, projects, atď.
- **Real-time** - Subscriptions (voliteľne)
- **Auth** - JWT + Email/Password
- **Storage** - File uploads (voliteľne)

---

## 📊 POŽIADAVKY NA PAMÄŤ

| Komponent | RAM | Poznámka |
|-----------|-----|----------|
| **Backend (Python)** | 200-500 MB | FastAPI + DB conn |
| **Frontend (Node)** | 300-800 MB | Dev server + bundler |
| **Browser** | 200-500 MB | Frontend app |
| **Totálne** | 700 MB - 1.8 GB | Minimum pre vývoj |

---

## 🔒 BEZPEČNOSŤ

### Environment Premenné

Nikdy nedeliš `.env` súbory verejne!

```env
# .env - KEEP PRIVATE!
DATABASE_URL=postgresql://...    # Databáza heslo
SUPABASE_KEY=...                 # API key
SECRET_KEY=...                   # JWT tajný kľúč
```

### JWT Autentifikácia

- **Token typ**: HS256 (HMAC-SHA256)
- **Expiracia**: 30 minút (nastaviteľné)
- **Refresh**: Nový login
- **Uloženie**: Frontend AsyncStorage

### Password Hashing

- **Algoritmus**: bcrypt
- **Rounds**: 12
- **Nikdy** nedeliť plain-text hesla

---

## 📈 PERFORMANCE

### Backend Response Times

| Endpoint | Čas | Poznámka |
|----------|-----|----------|
| `/health` | < 10 ms | Ping |
| `/api/auth/login` | 50-200 ms | DB query + hash |
| `/api/projects/` | 100-300 ms | DB query |
| `/api/projects/{id}/upload-image` | 500 ms - 5s | File write |
| `/api/projects/{id}/3d-model` | 1-5s | Large file |

### Frontend Build Times

| Proces | Čas |
|--------|-----|
| `npm install` | 2-5 minút |
| `npx expo start` | 5-15 sekúnd |
| Bundle reload | 2-5 sekúnd |
| Hot reload | < 1 sekunda |

---

## 🧪 TESTING

### Backend Testing

```bash
# Vykonanie testov
python -m pytest

# S verbosnou výstupom
pytest -v

# Len špecifický test
pytest tests/test_auth.py -v
```

### Frontend Testing

```bash
# Lint kontrola
npm run lint

# TypeScript check
npx tsc --noEmit

# Expo prebuild
expo prebuild --clean
```

---

## 📝 KONFIGURAČNÉ SÚBORY

### Backend - `Back-end/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:password@supabase-url:5432/postgres

# Supabase
SUPABASE_URL=https://xdcvqsocpnxqibmtngmd.supabase.co
SUPABASE_KEY=your_supabase_key

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8081
FRONTEND_URL_EXPO=exp://localhost:8081
```

### Frontend - `Front-and/.env.local`

```env
# Backend API
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xdcvqsocpnxqibmtngmd.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### Frontend - `Front-and/app.json`

```json
{
  "expo": {
    "name": "3D Rekon",
    "slug": "rekon-3d",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "plugins": ["expo-router"]
  }
}
```

---

## 🚀 DEPLOYMENT

### Local Development

```bash
# Terminal 1: Backend
cd Back-end
source venv/bin/activate
python main.py

# Terminal 2: Frontend
cd Front-and
npx expo start
```

### Production (Docker)

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Services:
# - Backend (port 80)
# - Frontend (port 443)
# - Nginx (reverse proxy)
# - Supabase (external)
```

---

## 📞 CHECKLIST - SYSTÉMOVÉ POŽIADAVKY

- [ ] Python 3.9+
- [ ] Node.js 18+
- [ ] Git 2.25+
- [ ] 4 GB RAM minimum
- [ ] 10 GB voľného miesta
- [ ] Internetové pripojenie
- [ ] Port 8000 dostupný (Backend)
- [ ] Port 8081 dostupný (Frontend)
- [ ] Supabase account
- [ ] Editor (VSCode)

---

## 🎯 SUMÁR

| Aspekt | Detaily |
|--------|---------|
| **Backend Port** | 8000 (FastAPI) |
| **Frontend Port** | 8081 (React Native) |
| **Database** | Supabase PostgreSQL |
| **Auth** | JWT Tokens |
| **Languages** | Python, TypeScript, JavaScript |
| **Frameworks** | FastAPI, React Native, Expo |
| **Storage** | Local disk + Supabase |
| **Requirements** | Python 3.9+, Node 18+, Git |
| **Minimum RAM** | 4 GB |
| **Disk** | 10 GB |

---

✅ **Systém je pripravený na spustenie!**
