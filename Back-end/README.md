# 3D Rekon Backend

Backend API pre 3D rekonštrukciu a mapovanie interiérov z obrazových informácií.

## Technológie

- **Framework**: FastAPI (Python)
- **Databáza**: PostgreSQL
- **Autentifikácia**: JWT tokeny
- **ORM**: SQLAlchemy

## Nastavenie a Spustenie

### 1. Nainštaluj PostgreSQL

Ak nemáš PostgreSQL nainštalovaný:
- **Windows**: https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### 2. Vytvor databázu

```bash
# Otvor PostgreSQL psql
psql -U postgres

# V psql konzole vytvor databázu
CREATE DATABASE rekon_db;
```

### 3. Nastav .env súbor

Skopíruj `.env` a uprav CONNECTION STRING:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/rekon_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Inštaluj Python dependencies

```bash
pip install -r requirements.txt
```

### 5. Inicializuj databázu

```bash
python init_db.py
```

Výstup: `✓ Databáza inicializovaná!`

### 6. Spusti backend server

```bash
python main.py
```

Server bude dostupný na: **http://localhost:8000**

API dokumentácia: **http://localhost:8000/docs** (Swagger UI)

## API Endpointy

### Autentifikácia

- `POST /api/auth/register` - Registrácia používateľa
- `POST /api/auth/login` - Prihlásenie používateľa
- `POST /api/auth/forgot-password` - Žiadosť o obnovenie hesla
- `GET /api/auth/me` - Získaj aktuálneho používateľa

### Projekty

- `POST /api/projects/create` - Vytvor nový projekt
- `GET /api/projects/` - Získaj všetky projekty
- `GET /api/projects/{project_id}` - Získaj konkrétny projekt
- `PUT /api/projects/{project_id}` - Aktualizuj projekt
- `DELETE /api/projects/{project_id}` - Vymaž projekt
- `POST /api/projects/{project_id}/upload-image` - Nahraj obrázok
- `GET /api/projects/{project_id}/images` - Získaj obrázky projektu

## Štruktúra Projektu

```
Back-end/
├── main.py                 # FastAPI aplikácia
├── config.py              # Konfigurácia
├── database.py            # Databázové pripojenie
├── models.py              # SQLAlchemy modely
├── schemas.py             # Pydantic validačné schémy
├── auth.py                # Autentifikačné funkcie
├── routers/
│   ├── auth.py            # Auth endpointy
│   └── projects.py        # Project endpointy
├── projects/              # Priečinok na obrázky projektov
│   └── {user_id}/{project_id}/images/
├── requirements.txt       # Python dependencies
├── .env                   # Konfigurácia prostredí
├── init_db.py            # Skript na inicializáciu DB
└── README.md             # Táto dokumentácia
```

## Komunikácia medzi Frontend a Backend

### 1. Registrácia a Login

Frontend pošle požiadavku:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

Backend vráti JWT token:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### 2. Vytvorenie Projektu

Frontend pošle request s JWT tokenom:
```bash
POST /api/projects/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "project_name": "Moj projekt",
  "description": "Popis projektu"
}
```

### 3. Nahrávanie Obrázkov

```bash
POST /api/projects/{project_id}/upload-image
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

[file: image.jpg]
```

Backend uloží obrázok na:
```
Back-end/projects/{user_id}/{project_id}/images/{filename}.jpg
```

## Troubleshooting

### Chyba: "DatabaseURL is not valid"

Skontroluj `.env`:
```
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/rekon_db
```

### Chyba: "connection refused"

PostgreSQL nie je spustený. Skontroluj či je PostgreSQL service aktívna:
```bash
# Windows
pg_isready -h localhost

# macOS/Linux
sudo service postgresql status
```

### Chyba pri upload obrázka

Skontroluj či trieda obrázka je povolená (JPEG, PNG, WebP).

## Budúce Rozšírenia

- [ ] Email notifikácie pre забúta hesla
- [ ] 3D model generovanie
- [ ] Sharing projektov s inými používateľmi
- [ ] Webhooks na frontend pri zmene statusu
- [ ] CI/CD pipeline

## Kontakt

Created for 3D Rekon project
