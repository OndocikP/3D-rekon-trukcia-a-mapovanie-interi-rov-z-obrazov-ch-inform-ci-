# 3D Rekonštrukcia a Mapovanie Interiérov

Komplétna aplikácia pre 3D rekonštrukciu a mapovanie interiérov miestností z obrazových informácií.

## Projektová Štruktúra

```
project/
├── Front-and/                      # React Native Frontend (Expo)
│   ├── app/                        # Navigácia a routy (Expo Router)
│   │   ├── _layout.tsx             # Root layout s autentifikáciou
│   │   ├── login.tsx               # Prihlásenie
│   │   ├── register.tsx            # Registrácia
│   │   ├── forgotPassword.tsx       # Obnovenie hesla
│   │   ├── main.tsx                # Hlavná obrazovka s projektami
│   │   ├── generate.tsx            # Generovanie projektov
│   │   ├── settings.tsx            # Nastavenia
│   │   ├── admin.tsx               # Admin panel
│   │   ├── admin-user/[id].tsx      # Detail používateľa (admin)
│   │   ├── (tabs)/                 # Tab navigácia
│   │   └── project/                # Project detail screen
│   ├── src/
│   │   ├── api/                    # API klient na komunikáciu s backendmi
│   │   ├── context/                # React Context (AuthContext)
│   │   ├── screens/                # Obrazovky komponentov
│   │   ├── components/             # Reusable komponenty
│   │   ├── theme/                  # Témy a farby
│   │   └── utils/                  # Utility funkcie
│   ├── .env                        # Frontend konfigurácia
│   ├── package.json                # NPM dependencies
│   └── tsconfig.json               # TypeScript konfigurácia
│
├── Back-end/                       # Python FastAPI Backend
│   ├── main.py                     # API server (FastAPI)
│   ├── main-generator.py           # 3D model generator (Nerfstudio)
│   ├── nerfstudio_handler.py       # Nerfstudio processing
│   ├── supabase_comunication.py    # Supabase DB komunikácia
│   ├── password_reset.py           # Reset hesla
│   ├── projects/                   # Priečinok na projekty (user_id/project_id/images)
│   ├── .env                        # Backend konfigurácia
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Docker image
│   ├── README.md                   # Backend dokumentácia
│   └── yolov8l.pt                  # YOLO model (objektová detekcia)
│
└── docker-compose.yml              # Docker Compose pre celý projekt
```

## Funkcionality

### ✅ Autentifikácia
- [x] Registrácia nového používateľa
- [x] Prihlásenie cez Supabase RPC
- [x] Obnovenie hesla (email kód)
- [x] Bezpečné ukladanie hesiel (bcrypt)
- [x] Admin panel s manažmentom používateľov

### ✅ Správa Projektov
- [x] Vytvorenie nového projektu
- [x] Zoznam projektov používateľa
- [x] Nahrávanie obrázkov do projektu
- [x] Zaznamenávanie stavu projektu (pending, generating, generated, failed)
- [x] Detekcia objektov v obrazoch (YOLO)

### ✅ 3D Model Generovanie
- [x] Nerfstudio spracovanie obrázkov
- [x] NeRF rekonštrukcia (3D model)
- [x] Generovanie PLY modelov
- [x] 3D Viewer v mobile aplikácii (Three.js)

### ✅ Backend API
- [x] RESTful API s FastAPI
- [x] Supabase PostgreSQL databáza
- [x] Supabase RPC funkcie
- [x] CORS povolenie pre frontend
- [x] JWT autentifikácia

### ✅ Frontend
- [x] React Native s Expo (iOS, Android, Web)
- [x] Expo Router navigácia
- [x] Autentifikačný flow
- [x] Upload obrázkov
- [x] 3D model viewer

## Rýchly Start

1. **[Prečítaj si Back-end/README.md](Back-end/README.md)** a **Front-and/README.md** pre detailný setup

Stručne:

```bash
# Backend API Server (localhost:8000)
cd Back-end
pip install -r requirements.txt
python -m main

# Backend 3D Model Generator (v inom terminále)
cd Back-end
python -m main-generator

# Frontend (v ďalšom terminále)
cd Front-and
npm install
npx expo start

# Mobilná aplikácia (Android/iOS)
npx expo start --android
npx expo start --ios

# Web aplikácia
npm run web
```

## Databázová Štruktúra

Backend komunikuje s **Supabase** (PostgreSQL v cloude):

### Tabuľka: users
```sql
- id (UUID, primary key)
- username (unique, required)
- email (unique, required)
- hashed_password (required)
- role (enum: user, admin)
- created_at (datetime)
- updated_at (datetime)
```

### Tabuľka: projects
```sql
- id (UUID, primary key)
- owner_id (FK -> users.id, required)
- name (required)
- description (optional)
- status (enum: pending, generating, generated, failed)
- objects (text: detekované objekty)
- image_count (integer)
- created_at (datetime)
- updated_at (datetime)
```

### Tabuľka: project_images
```sql
- id (UUID, primary key)
- project_id (FK -> projects.id)
- url (text: URL na obrázok)
- uploaded_at (datetime)
```

## API Dokumentácia

Backend API je dokumentovaný s Swagger UI na:
```
http://localhost:8000/docs
```

### Hlavné Endpointy

**Autentifikácia:**
- `POST /api/auth/register` - Registrácia
- `POST /api/auth/login` - Prihlásenie
- `POST /api/auth/forgot-password` - Obnovenie hesla
- `GET /api/auth/me` - Aktuálny používateľ

**Projekty:**
- `POST /api/projects/create` - Vytvor projekt
- `GET /api/projects/` - Načítaj všetky projekty
- `GET /api/projects/{id}` - Načítaj projekt
- `PUT /api/projects/{id}` - Aktualizuj projekt
- `DELETE /api/projects/{id}` - Vymaž projekt
- `POST /api/projects/{id}/upload-image` - Nahraj obrázok
- `GET /api/projects/{id}/images` - Načítaj obrázky

## Technologické Stack

### Frontend
- **Framework**: React Native s Expo
- **Jazyky**: TypeScript
- **State Management**: React Context
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Storage**: AsyncStorage (JWT tokeny)
- **3D Rendering**: Three.js (PLY model viewer)

### Backend
- **Framework**: FastAPI (Python)
- **Databáza**: Supabase PostgreSQL (cloud)
- **RPC Funkcie**: Supabase RPC pre autentifikáciu
- **Auth**: JWT tokeny + bcrypt
- **Validation**: Pydantic
- **3D Processing**: Nerfstudio (NeRF reconstruction)
- **Object Detection**: YOLOv8 (objektová detekcia)

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Process Manager**: Uvicorn
- **File Storage**: Supabase Storage
- **Database**: Supabase PostgreSQL

## Bezpečnosť

- JWT tokeny s expiracia (30 minút)
- Bcrypt hashing pre heslá
- CORS povolenie len pre frontend
- Input validácia cez Pydantic
- SQL injection prevention cez ORM

## Budúce Rozšírenia

- [ ] Email notifikácie pre zmeny statusu projektov
- [ ] Sharing projektov s inými používateľmi
- [ ] Webhooks na frontend pri zmene statusu (Socket.io)
- [ ] Real-time progress tracking počas generovania
- [ ] Mobile-optimalizovaný 3D viewer s rotáciou
- [ ] Batch processing viacerých projektov
- [ ] API rate limiting
- [ ] Database backups (automated)
- [ ] Advanced project analytics
- [ ] Dark mode pre admin panel

## Troubleshooting

### Frontend problémy:
- **"Port 8081 already in use"** → `npx expo start --port 8085` alebo zastaviť iný proces
- **Module not found** → `npm install` a `npm cache clean --force`
- **AsyncStorage undefined** → Inštalovať: `npm install @react-native-async-storage/async-storage`

### Backend problémy:
- **"Address already in use:8000"** → `lsof -i :8000` a zastaviť proces
- **Supabase connection failed** → Skontrolovať `.env` file (SUPABASE_URL, SUPABASE_KEY)
- **YOLO model not found** → Skontrolovať či `yolov8l.pt` existuje v `Back-end/`

Viac detailov nájdeš v [Back-end/README.md](Back-end/README.md)

## Licencia

Interný projekt

## Kontakt

Pre otázky prosím kontaktuj vývojársky tím.

---

**Posledná aktualizácia**: Máj 2026  
**Verzia**: 2.0.0 - Vyčistený a minimálny setup
