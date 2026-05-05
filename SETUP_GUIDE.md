# Setup Guide - Full Stack Setup

Komplétny setup pre spustenie Frontend a Backend aplikácie.

## Požiadavky

- **Node.js** v18+ (https://nodejs.org/)
- **Python** v3.9+ (https://www.python.org/)
- **PostgreSQL** (https://www.postgresql.org/)
- **Expo CLI** (npm install -g expo-cli)

---

## 1. Databáza Setup (PostgreSQL)

### 1.1 Inštaluj PostgreSQL

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Spusti inštalátor a zapamätaj si heslo pre `postgres` používateľa

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 1.2 Vytvor databázu

```bash
# Otvor PostgreSQL psql
psql -U postgres

# V psql konzole vytvor databázu
CREATE DATABASE rekon_db;

# Výstup: CREATE DATABASE
# Skončи: \q
```

---

## 2. Backend Setup (Python + FastAPI)

### 2.1 Naviguj do Backend adresára

```bash
cd Back-end
```

### 2.2 Nainštaluj Python dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Nastav .env

```bash
# Skopíruj a uprav .env súbor
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rekon_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 2.4 Inicializuj databázu

```bash
python init_db.py
```

**Výstup:**
```
Vytváranie databázových tabuliek...
✓ Databáza inicializovaná!
```

### 2.5 Spusti Backend server

```bash
python main.py
```

**Výstup:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Backend je teraz dostupný na: **http://localhost:8000**

API dokumentácia: **http://localhost:8000/docs**

---

## 3. Frontend Setup (Expo + React Native)

### 3.1 Otvor nový Terminal a naviguj do Frontend

```bash
cd Front-and
```

### 3.2 Nainštaluj Node dependencies

```bash
npm install
```

### 3.3 Skontroluj .env

```bash
# Skontroluj či existuje .env s backendmi URL
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3.4 Inštaluj AsyncStorage pre uchovávanie tokenov

```bash
npm install @react-native-async-storage/async-storage
```

### 3.5 Spusti Frontend server

```bash
npx expo start
```

**Výstup:**
```
Starting Expo server...
› MetroBundle ready at [URL]
```

### 3.6 Run aplikáciu

Vyber jednu možnosť:

- **iOS Simulator:** Stlač `i`
- **Android Emulator:** Stlač `a`
- **Web:** Stlač `w`
- **Mobile (Expo Go):** Skenovať QR kód pomocou Expo Go aplikácie

---

## 4. Testovanie Flow

### 4.1 Registrácia

1. V aplikácii klikni **"Register"**
2. Vyplň:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `test123456`
   - Password again: `test123456`
3. Klikni **"Register"**

### 4.2 Login

1. Vyplň:
   - Username: `testuser`
   - Password: `test123456`
2. Klikni **"Login"**

### 4.3 Vytvorenie Projektu

1. Na home stránke klikni **"New project"**
2. Vyplň:
   - Project name: `Moj projekt`
   - Description: `Popis projektu`
3. Klikni **"Upload files"** a vyber obrázky
4. Klikni **"Generate"**

Projekt sa vytvorí, obrázky sa nahrajú a projekt sa zobrazí na home stránke.

---

## 5. Demo - API Endpoints

Môžeš testovať API v **http://localhost:8000/docs** (Swagger UI)

### Registrácia

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "username": "testuser",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### Vytvorenie Projektu

```bash
curl -X POST "http://localhost:8000/api/projects/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Moj projekt",
    "description": "Popis"
  }'
```

### Načítanie Projektov

```bash
curl -X GET "http://localhost:8000/api/projects/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. Troubleshooting

### Backend problém: "DatabaseURL is not valid"

1. Skontroluj `.env` v `Back-end/` adresári
2. Overť že PostgreSQL je spustený: `psql -U postgres`
3. Overť DATABASE_URL: `postgresql://postgres:password@localhost:5432/rekon_db`

### Backend problém: "connection refused"

```bash
# Skontroluj či je PostgreSQL service spustená
psql -U postgres

# macOS
brew services list | grep postgres

# Linux
sudo systemctl status postgresql

# Windows - skontroluj Services
```

### Frontend problém: "Cannot find module '@react-native-async-storage/async-storage'"

```bash
cd Front-and
npm install @react-native-async-storage/async-storage
```

### Frontend problém: "Backend URL not reachable"

1. Skontroluj že backend je spustený: `http://localhost:8000`
2. Skontroluj `.env` v `Front-and/`: `EXPO_PUBLIC_BACKEND_URL=http://localhost:8000`
3. Ak používaš fyzické zariadenie, zameniť `localhost` s IP adresou počítača:
   ```
   EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
   ```

### Obrázky sa nenahrávajú

1. Skontroluj že priečinok `Back-end/projects/` existuje
2. Skontroluj že obrázok je v správnom formáte (JPEG, PNG, WebP)
3. Skontroluj backend logy pre detaily

---

## 7. Produkčný Deploy

### Backend

```bash
# Build Docker image
docker build -t rekon-backend .

# Run container
docker run -e DATABASE_URL=... -p 8000:8000 rekon-backend
```

### Frontend

```bash
# Build APK (Android)
eas build --platform android

# Build IPA (iOS)
eas build --platform ios

# Build web
npm run build
```

---

## 8. Ďalšie Zdroje

- **FastAPI Dokumentácia:** https://fastapi.tiangolo.com/
- **Expo Dokumentácia:** https://docs.expo.dev/
- **PostgreSQL Dokumentácia:** https://www.postgresql.org/docs/
- **React Native:** https://reactnative.dev/

---

## Kontakt

Pre otázky a problémy skontaktuj vývojársky tím.
