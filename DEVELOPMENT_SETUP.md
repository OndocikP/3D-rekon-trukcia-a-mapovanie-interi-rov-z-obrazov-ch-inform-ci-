# Development Setup - Backend bez Dockera + Supabase

Zjednodušené nastavenie bez Dockera. Backend beží ako čistý Python proces.

## 📋 Požiadavky

- **Python 3.9+** (https://www.python.org/)
- **Node.js v18+** (pre Frontend)
- **Supabase Project** (https://supabase.com/) - Externá databáza

---

## 🚀 Backend Setup (Python)

### 1. Naviguj do Backend adresára

```bash
cd Back-end
```

### 2. Nastav .env

Skopíruj súbor `.env` z root adresára. Mali by si mať:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_SUPABASE_URL:5432/postgres
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SECRET_KEY

SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8081
```

### 3. Spusti Backend

Vrať sa do root adresára a spusti:

```bash
python run_backend.py
```

**Výstup:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Backend je teraz dostupný na: **http://localhost:8000**
API dokumentácia: **http://localhost:8000/docs**

---

## 🖥️ Frontend Setup (React Native + Expo)

### 1. Otvor nový terminal a naviguj do Frontend

```bash
cd Front-and
```

### 2. Nainštaluj Dependencies

```bash
npm install
```

### 3. Skontroluj .env.local

Mal by si mať:
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_API_URL=http://localhost:8000/api

EXPO_PUBLIC_SUPABASE_URL=https://xdcvqsocpnxqibmtngmd.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_QaOYZTQpqGSo5J99iUQKTQ_LW99ZYGW
```

### 4. Spusti Frontend

```bash
npx expo start
```

V terminále sa zobrazia možnosti:
- `i` - Spustiť iOS simulator (macOS iba)
- `a` - Spustiť Android emulator
- `w` - Spustiť Web version
- `j` - Spustiť Debugger

---

## 🔧 CLI Príkazy

### Backend CLI - Správa databázy

```bash
cd Back-end
python cli.py
```

Možnosti:
1. Zobraziť používateľov a projekty
2. Automaticky detekovať objekty (YOLO)
0. Výstup

---

## 📦 Production Setup s Docker

Ak chceš nasadiť na produkciu s Dockerom:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

(Iba Backend + Nginx, bez databázy)

---

## 🐛 Troubleshooting

### Backend sa neukazuje
```bash
# Skontroluj či je SUPABASE dostupný
python -c "from database import engine; print(engine)"

# Skúť inicializovať databázu znova
python init_db.py
```

### Frontend sa nepripája na Backend
- Skontroluj či backend beží na `http://localhost:8000`
- Skontroluj `.env.local` - správne `EXPO_PUBLIC_API_URL`
- Skontroluj CORS v `Back-end/main.py`

### Chyba s PostgreSQL
Supabase URL je **externá**, takže nepotrebuje lokálny PostgreSQL. Ak vidíš chybu, skontroluj:
- Správne `DATABASE_URL` v `.env`
- Internetové pripojenie

---

## 📝 Poznámky

- Backend beží ako Python proces (bez Dockera)
- Databáza je na Supabase (externá)
- Frontend sa automaticky pripája k backendu cez HTTP
- Všetky dáta sú synchronized s Supabase Cloud
