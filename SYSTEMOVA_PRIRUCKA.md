# 📚 SYSTÉMOVÁ PRÍRUČKA - 3D Rekonštrukcia Interiérov

Komplétny sprievodca na stiahnutie kódu, inštaláciu všetkých požiadaviek a spustenie aplikácie.

---

## 📋 OBSAH

1. [Požiadavky](#požiadavky)
2. [Krok 1: Stiahnutie kódu](#krok-1-stiahnutie-kódu)
3. [Krok 2: Konfigurácia](#krok-2-konfigurácia)
4. [Krok 3: Inštalácia Backendu](#krok-3-inštalácia-backendu)
5. [Krok 4: Spustenie Backendu](#krok-4-spustenie-backendu)
6. [Krok 5: Inštalácia Frontendu](#krok-5-inštalácia-frontendu)
7. [Krok 6: Spustenie Frontendu](#krok-6-spustenie-frontendu)
8. [Verifikácia](#verifikácia)
9. [Riešenie problémov](#-riešenie-problémov)

---

## 🖥️ POŽIADAVKY

Pred začatím sa uisti, že máš nainštalované nasledujúce nástroje:

### 1. **Git** (na klonovaní repozitára)
- **Windows/macOS/Linux**: https://git-scm.com/

Overenie:
```bash
git --version
```

### 2. **Python 3.9+**
- **Stiahni**: https://www.python.org/downloads/
- **DÔLEŽITÉ**: Pri inštalácii na Windows **zaškrtni "Add Python to PATH"**

Overenie:
```bash
python --version
# Alebo:
python3 --version
```

### 3. **Node.js 18+** (pre Frontend)
- **Stiahni**: https://nodejs.org/ (odporúčam LTS verziu)

Overenie:
```bash
node --version
npm --version
```

### 4. **Supabase Account** ✅ (JUŽ NASTAVENÝ)
- Databáza a autentifikácia sú už skonfigurované
- Frontend aj Backend majú `.env` súbory s prihlasovacími údajmi

### 5. **Editor** (VSCode)
- **Odporúčam**: https://code.visualstudio.com/

---

## 🚀 KROK 1: STIAHNUTIE KÓDU

### Na Windows:

1. Otvor **Command Prompt** alebo **PowerShell**

2. Naviguj do adresára, kde chceš projekt mať:
```bash
cd C:\Users\TvojeMeno\Documents
```

3. Naklonuj repozitár:
```bash
git clone https://github.com/your-username/3D-rekon.git
cd 3D-rekon
```

### Na macOS/Linux:

1. Otvor **Terminal**

2. Naviguj do adresára:
```bash
cd ~/Documents
```

3. Naklonuj repozitár:
```bash
git clone https://github.com/your-username/3D-rekon.git
cd 3D-rekon
```

### Overenie:
```bash
dir          # Windows
# alebo
ls           # macOS/Linux

# Mal by si vidieť:
# Back-end/  Front-and/  README.md  SETUP_GUIDE.md  atď.
```

---

## 🔧 KROK 2: KONFIGURÁCIA

### Backend - .env súbor

V koreňovom adresári projekt existuje `.env` súbor s nastaveniami:

**Súbor**: `Back-end/.env`

```env
# DATABÁZA (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_SUPABASE_URL:5432/postgres

# Supabase API
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SECRET_KEY

# JWT autentifikácia
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Aplikačné URL
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8081
FRONTEND_URL_EXPO=exp://localhost:8081
```

**⚠️ DÔLEŽITÉ**: Súbor `.env` je **UŽ NASTAVENÝ**! Nemeň ho ak nie si si istý.

### Frontend - .env.local súbor

**Súbor**: `Front-and/.env.local`

```env
# Backend API
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xdcvqsocpnxqibmtngmd.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_QaOYZTQpqGSo5J99iUQKTQ_LW99ZYGW
```

**⚠️ DÔLEŽITÉ**: Aj tento súbor je **JIŽ NASTAVENÝ**!

---

## 💻 KROK 3: INŠTALÁCIA BACKENDU

### 3.1 Otvor Terminal a naviguj do Back-end adresára

**Na Windows (PowerShell/CMD):**
```bash
cd Back-end
```

**Na macOS/Linux:**
```bash
cd Back-end
```

### 3.2 Vytvor virtuálne prostredie Python (ODPORÚČANÉ)

Virtuálne prostredie izoláciou Python balíčkov pre projekt.

**Na Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Na macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Overenie: V terminále by si mal vidieť `(venv)` na začiatku riadka.

### 3.3 Nainštaluj Python balíčky

```bash
pip install -r requirements.txt
```

**Čo sa inštaluje:**
- `fastapi` - Backend framework
- `uvicorn` - ASGI server
- `sqlalchemy` - Databázový ORM
- `python-dotenv` - Načítavanie .env súborov
- `pydantic` - Validácia údajov
- `postgresql` - Ovládač PostgreSQL
- atď.

**Trvanie**: 2-5 minút (závisí od internetu)

### 3.4 Inicializuj databázu

```bash
python init_db.py
```

**Výstup by mal byť niečo podobné:**
```
✓ Databáza inicializovaná!
✓ Tabuľky vytvorené!
```

---

## 🔌 KROK 4: SPUSTENIE BACKENDU

### 4.1 Spusti Backend server

V terminále (v `Back-end` adresári, s aktivovaným `venv`):

```bash
python main.py
```

**Očakávaný výstup:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 4.2 Overenie

Otvor webový prehliadač a navštív:
- **http://localhost:8000** - Základný endpoint
- **http://localhost:8000/docs** - Swagger API dokumentácia
- **http://localhost:8000/health** - Health check

Ak vidíš Swagger UI s API endpointmi → Backend beží správne! ✅

### ⚠️ DÔLEŽITÉ

- **NESPÚŠŤAJ ďalší príkaz** v tomto terminále
- Backend musí zostať spustený počas vývoja
- Otvor **NOVÝ TERMINAL** na spustenie Frontendu

---

## 📦 KROK 5: INŠTALÁCIA FRONTENDU

### 5.1 OTVOR NOVÝ TERMINAL

Nech Backend beží v prvom terminále!

V novom terminále naviguj do `Front-end` adresára:

```bash
cd Front-and
```

### 5.2 Nainštaluj Node.js balíčky

```bash
npm install
```

**Čo sa inštaluje:**
- `react-native` - Mobile framework
- `expo` - Development framework
- `typescript` - Typovaný JavaScript
- `@react-navigation` - Navigácia
- `three` - 3D grafika
- atď.

**Trvanie**: 3-10 minút

### 5.3 Overenie inštalácie

```bash
npx expo --version
```

Mal by si vidieť verziu Expo. Ak vidíš chybu, spúšť:
```bash
npm install -g expo-cli
```

---

## 📱 KROK 6: SPUSTENIE FRONTENDU

V novom terminále (v `Front-and` adresári):

```bash
npx expo start
```

**Očakávaný výstup:**
```
> expo start

› Metro waiting on exp://localhost:19000
› Scan this QR to open your app in Expo Go
...
```

### 6.1 Spustenie v prehliadači (ODPORÚČAM)

V terminále vidíš menu:

```
 › Press 'i' │ android │ web │ OR scan QR code
```

Stlač `w` na spustenie v **Web prehliadači**:

```
w - open in web
```

Frontend sa otvore v prehliadači na **http://localhost:8081**

### 6.2 Iné možnosti spustenia

| Tlačítko | Popis |
|----------|-------|
| `w` | Web prehliadač |
| `i` | iOS Simulator (iba macOS) |
| `a` | Android Emulator |
| `j` | Debugger |
| `r` | Reloaduj |
| `q` | Výstup |

---

## ✅ VERIFIKÁCIA

### Backend ✅

```bash
# V prvom terminále (Backend)
INFO:     Application startup complete
```

Otvor: **http://localhost:8000/docs**

Mal by si vidieť všetky API endpointy.

### Frontend ✅

```bash
# V druhom terminále (Frontend)
expo start
```

Ak si stlačil `w`, otvára sa prehliadač s aplikáciou.

### Obe aplikácie spolu ✅

1. Frontend na **http://localhost:8081**
2. Backend na **http://localhost:8000**
3. Registrácia alebo Prihlásenie → Mal by si mať prístup do aplikácie
4. Vytvor nový projekt → Mali by si tam byť obrázky a 3D modely

---

## 🏗️ PREHĽAD ARCHITEKTÚRY

```
┌─────────────────────────────────────────────────────────────┐
│                 TVOJ POČÍTAČ                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TERMINAL 1:          TERMINAL 2:                           │
│  Backend              Frontend                              │
│  (localhost:8000)     (localhost:8081)                      │
│       ▲                    ▲                                 │
│       │ HTTP               │ HTTP                            │
│       └────────────────────┘                                │
│            │                                                │
│            ▼                                                │
│       ┌──────────────┐                                      │
│       │  SUPABASE    │                                      │
│       │ PostgreSQL   │                                      │
│       │ Cloud        │                                      │
│       └──────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 RIEŠENIE PROBLÉMOV

### ❌ Backend sa nespúšťa

**Chyba**: `ModuleNotFoundError: No module named 'fastapi'`

**Riešenie**:
```bash
# Uisti sa že si v Back-end adresári
cd Back-end

# Aktivuj venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Nainštaluj znova
pip install -r requirements.txt
```

---

### ❌ Frontend sa nepripája na Backend

**Chyba**: `Cannot reach http://localhost:8000`

**Riešenie**:
1. Uisti sa že Backend beží v prvom terminále
2. Skontroluj `.env.local` v `Front-and` adresári:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```
3. Vymaž cache Expo:
```bash
npm start -- --clear
```

---

### ❌ "Port 8000 je už použitý"

**Chyba**: `Address already in use`

**Riešenie**:

**Na Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Na macOS/Linux:**
```bash
lsof -ti:8000 | xargs kill -9
```

Potom spusti Backend znova:
```bash
python main.py
```

---

### ❌ "Port 8081 je už použitý"

**Riešenie**:
```bash
# Expo si automaticky nájde iný port
# Alebo vymaž cache:
npm start -- --clear
```

---

### ❌ Databáza sa nepripája

**Chyba**: `FATAL: Ident authentication failed`

**Riešenie**:
1. Skontroluj `.env` v `Back-end` adresári
2. Overenie `DATABASE_URL` je správny
3. Skontroluj internetové pripojenie (Supabase je v cloude!)

```bash
# Test pripojenia
python -c "import psycopg2; print('OK')"
```

---

### ❌ "npm: command not found"

**Riešenie**:
- Node.js nie je nainštalovaný
- Alebo nie je v PATH
- Stiahni Node.js: https://nodejs.org/

---

### ❌ "python: command not found" (na macOS)

**Riešenie**:
```bash
# Použi python3 namiesto python
python3 main.py

# Alebo vytvor alias:
alias python=python3
```

---

## 📝 UŽITOČNÉ PRÍKAZY

### Backend

```bash
# Spustenie Backendu
cd Back-end
python main.py

# Inicializácia DB
python init_db.py

# CLI nástroj (správa údajov)
python cli.py

# Testy
python -m pytest
```

### Frontend

```bash
# Spustenie Frontendu
cd Front-and
npx expo start

# Web
npx expo start --web

# Vymaž cache
npm start -- --clear

# Spustenie na Android emulátore
npx expo start --android

# Spustenie na iOS (iba macOS)
npx expo start --ios
```

### Git príkazy

```bash
# Aktualizácia kódu z repozitára
git pull origin main

# Kontrola stavu
git status

# Commit zmien
git add .
git commit -m "Popis zmeny"
git push origin main
```

---

## 🎯 ČOLIST KONTROLY - PRE ZAČIATOČNÍKA

- [ ] ✅ Nainštalovaný Git
- [ ] ✅ Nainštalovaný Python 3.9+
- [ ] ✅ Nainštalovaný Node.js 18+
- [ ] ✅ Stiahnutý kód (`git clone`)
- [ ] ✅ Vytvorené Python venv (`python -m venv venv`)
- [ ] ✅ Aktivované venv
- [ ] ✅ Nainštalované Backend balíčky (`pip install -r requirements.txt`)
- [ ] ✅ Inicializovaná databáza (`python init_db.py`)
- [ ] ✅ Spustený Backend (`python main.py`)
- [ ] ✅ Backend beží na http://localhost:8000
- [ ] ✅ Nainštalované Frontend balíčky (`npm install`)
- [ ] ✅ Spustený Frontend (`npx expo start`)
- [ ] ✅ Frontend beží na http://localhost:8081
- [ ] ✅ Môžem sa prihlásiť do aplikácie
- [ ] ✅ Môžem vytvoriť nový projekt
- [ ] ✅ Môžem nahrať obrázky

---

## 🎓 ĎALŠIE ZDROJE

- **API Dokumentácia**: http://localhost:8000/docs
- **Backend README**: `Back-end/README.md`
- **Frontend README**: `Front-and/README.md`
- **Architecture**: `ARCHITECTURE.md`
- **System Flow**: `SYSTEM_FLOW.md`
- **Development Setup**: `DEVELOPMENT_SETUP.md`

---

## 📞 POMOC

Ak narazíš na problém:

1. **Skontroluj Troubleshooting** výššie ☝️
2. **Prečítaj si príslušnú README**: `Back-end/README.md` alebo `Front-and/README.md`
3. **Skontroluj .env súbory**: Sú správne skonfigurované?
4. **Overi si požiadavky**: Máš Python 3.9+? Node.js 18+?

---

## ✨ HOTOVO!

Teraz máš:
- ✅ Backend na `http://localhost:8000`
- ✅ Frontend na `http://localhost:8081`
- ✅ Supabase databázu
- ✅ Funkčnú aplikáciu na 3D rekonštrukciu interiérov

**Vítaj v projekte!** 🎉
