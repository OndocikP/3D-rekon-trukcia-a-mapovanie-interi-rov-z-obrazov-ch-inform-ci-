# 3D Rekonštrukcia a Mapovanie Interiérov

Komplétna aplikácia pre 3D rekonštrukciu a mapovanie interiérov miestností z obrazových informácií.

## Projektová Štruktúra

```
project/
├── Front-and/                # React Native Frontend (Expo)
│   ├── app/                 # Navigácia a routy
│   ├── src/
│   │   ├── api/             # API klient na komunikáciu s backendmi
│   │   ├── context/         # React Context (AuthContext)
│   │   ├── screens/         # Aplikačné obrazovky
│   │   ├── components/      # Reusable komponenty
│   │   └── theme/           # Témy a farby
│   ├── .env                 # Frontend konfigurácia
│   └── package.json
│
├── Back-end/                # Python FastAPI Backend
│   ├── main.py              # FastAPI aplikácia
│   ├── models.py            # SQLAlchemy databázové modely
│   ├── schemas.py           # Pydantic validačné schémy
│   ├── database.py          # Databázové pripojenie
│   ├── auth.py              # Autentifikačné funkcie
│   ├── routers/
│   │   ├── auth.py          # Auth endpointy (login, register)
│   │   └── projects.py      # Project endpointy
│   ├── projects/            # Priečinok na obrázky (user_id/project_id/images)
│   ├── .env                 # Backend konfigurácia
│   ├── requirements.txt     # Python dependencies
│   ├── init_db.py           # Skript na inicializáciu DB
│   └── README.md            # Backend dokumentácia
│
├── SETUP_GUIDE.md           # Komplétný setup guide
└── README.md               # Tento súbor
```

## Funkcionality

### ✅ Autentifikácia
- [x] Registrácia nového používateľa
- [x] Prihlásenie s JWT tokenmi
- [x] Zabudnuté heslo (prepare na email)
- [x] Bezpečné ukladanie hesiel (bcrypt)

### ✅ Správa Projektov
- [x] Vytvorenie nového projektu
- [x] Zoznam projektov používateľa
- [x] Nahrávanie obrázkov do projektu
- [x] Zaznamenávanie stavu projektu (pending, generating, generated, failed)

### ✅ Backend API
- [x] RESTful API s FastAPI
- [x] PostgreSQL databáza
- [x] SQLAlchemy ORM
- [x] CORS povolenie pre frontend
- [x] JWT autentifikácia

### ✅ Frontend
- [x] React Native s Expo
- [x] Moderna a responzívna UI
- [x] Color theme customization
- [x] Image picker a upload

## Rýchly Start

1. **[Prečítaj si SETUP_GUIDE.md](SETUP_GUIDE.md)** pre detailný setup

Stručne:

```bash
# Backend
cd Back-end
pip install -r requirements.txt
python init_db.py
python main.py

# Frontend (v novom terminále)
cd Front-and
npm install
npx expo start
```

## Databázová Štruktúra

### Tabuľka: users
```sql
- id (UUID, primary key)
- username (unique, required)
- email (unique, required)
- hashed_password (required)
- created_at (datetime)
- updated_at (datetime)
```

### Tabuľka: projects
```sql
- id (UUID, primary key)
- user_id (FK -> users.id, required)
- project_name (required)
- status (enum: pending, generating, generated, failed)
- description (optional)
- image_count (integer)
- created_at (datetime)
- updated_at (datetime)
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
- **Storage**: AsyncStorage (JWT)

### Backend
- **Framework**: FastAPI (Python)
- **Databáza**: PostgreSQL
- **ORM**: SQLAlchemy
- **Auth**: JWT + bcrypt
- **Validation**: Pydantic

### DevOps
- **Containerization**: Docker
- **Process Manager**: Uvicorn

## Bezpečnosť

- JWT tokeny s expiracia (30 minút)
- Bcrypt hashing pre heslá
- CORS povolenie len pre frontend
- Input validácia cez Pydantic
- SQL injection prevention cez ORM

## Budúce Rozšírenia

- [ ] Email notifikácie pre забúté hesla
- [ ] 3D model generovanie z obrázkov
- [ ] Sharing projektov s inými používateľmi
- [ ] Webhooks na frontend pri zmene statusu
- [ ] Real-time progress tracking
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Database backups

## Troubleshooting

Pozri sa na **[SETUP_GUIDE.md - Troubleshooting](SETUP_GUIDE.md#6-troubleshooting)** sekciu.

## Licencia

Interný projekt

## Kontakt

Pre otázky prosím kontaktuj vývojársky tím.

---

**Posledná aktualizácia**: Apríl 2024  
**Verzia**: 1.0.0
