# 🚀 Quick Start Guide

Najrýchlejší spôsob ako spustiť aplikáciu.

## 📋 Požiadavky

- **Python 3.9+**
- **Node.js 18+**
- **Git** (na klonovaní repozitára)
- **Supabase Account** (cloudová databáza) - JE UŽ NASTAVENÁ ✅

---

## 🎯 3 Kroky na Spustenie

### 1️⃣ Backend (Python)

```bash
python run_backend.py
```

(Funguje na Windows, macOS, Linux)

✅ Backend beží na: **http://localhost:8000**

---

### 2️⃣ Frontend (React Native)

V **novom terminále**:

```bash
cd Front-and
npm install
npx expo start
```

Voľby:
- `i` → iOS Simulator (macOS)
- `a` → Android Emulator
- `w` → Web Browser
- `j` → Debugger

---

## ✨ Hotovo! 

Aplikácia je spustená:
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:8081 (web) alebo emulator

---

## 📚 Viac Informácií

Detailný setup: [`DEVELOPMENT_SETUP.md`](DEVELOPMENT_SETUP.md)
Backend dokumentácia: [`Back-end/README.md`](Back-end/README.md)

---

## 🔧 Užitočné Príkazy

### Backend CLI (správa databázy)

```bash
cd Back-end
python cli.py
```

Menu:
1. Zobraziť používateľov a projekty
2. Automaticky detekovať objekty (YOLO)
0. Výstup

### Testovanie API

```bash
curl http://localhost:8000/health
# {"status": "healthy"}
```

---

## 🐛 Problém? 

Skontroluj:
1. ✅ Backend beží (`python main.py`)
2. ✅ Frontend má správny `.env.local`
3. ✅ Internetové pripojenie (Supabase)
4. ✅ Porty: 8000 (backend), 8081 (frontend)

Viac troubleshooting: [`DEVELOPMENT_SETUP.md#troubleshooting`](DEVELOPMENT_SETUP.md#-troubleshooting)
