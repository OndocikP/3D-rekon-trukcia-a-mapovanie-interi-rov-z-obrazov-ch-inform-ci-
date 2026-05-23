# 📚 DOKUMENTÁCIA V SLOVENČINE - PREHĽAD

Kompletný prehľad všetkých dostupných dokumentov a sprievodcov.

---

## 🎯 RÝCHLY ZAČIATOK

Ak chceš **HNEĎ ZAČAŤ**, pozri:

1. **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)** ← Príkazy na kopírovanie
   - Všetky príkazy, ktoré si môžeš skopírovať priamo do terminálu
   - Detailný sprievodca pre Windows, macOS, Linux

2. **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** ← Hlavný sprievodca
   - Kompletný sprievodca od A po Z
   - Ako stiahnem kód, ako nainštalujem, ako spustím
   - Troubleshooting a riešenie problémov

---

## 📖 VŠETKY DOSTUPNÉ DOKUMENTY

### 🚀 PRE ZAČIATOČNÍKOV

| Dokument | Popis | Pre koho |
|----------|-------|---------|
| **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)** | Príkazy na kopírovanie bez písania | Všetci |
| **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** | Detailný sprievodca 6 krokov | Všetci |
| **[FAQ.md](FAQ.md)** | Často kladené otázky | Všetci |

### 🔧 PRE TECHNICKÝCH UŽÍVATEĽOV

| Dokument | Popis | Pre koho |
|----------|-------|---------|
| **[TECHNICKY_PREHLED.md](TECHNICKY_PREHLED.md)** | Technické detaily, porty, požiadavky | Vývojári |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Architektúra systému | Vývojári |
| **[SYSTEM_FLOW.md](SYSTEM_FLOW.md)** | Ako funguje systém (proces toku) | Vývojári |
| **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** | Development setup (bez Dockera) | Vývojári |

### 📋 ĎALŠIE DOKUMENTY (V ANGLIČTINE)

| Dokument | Popis |
|----------|-------|
| `QUICK_START.md` | Rýchly start (3 kroky) |
| `SETUP_GUIDE.md` | Setup guide |
| `3D_VIEWER_SETUP.md` | Nastavenie 3D viewera |
| `DEPLOYMENT.md` | Nasadzovanie do produkcie |
| `PRODUCTION_SECURITY.md` | Bezpečnosť v produkции |
| `DEBUGGING_GUIDE.md` | Debugging pokyny |
| `NERFSTUDIO_INSTALLATION.md` | Inštalácia NERFSTUDIO |
| `NERFSTUDIO_SUMMARY.md` | Zhrnutie NERFSTUDIO |

---

## 🎓 STEPWISE SPRIEVODCA

Ak sa cítiš stratený, nasleduj poradie:

### 1. ROZHODNUTIE - Čo chceš robiť?

**Chcem RÝCHLO spustiť aplikáciu** ⚡
→ Pozri: **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)**

**Chcem PODROBNÝ sprievodca** 📖
→ Pozri: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)**

**Chcem TECHNICKÉ detaily** 🔧
→ Pozri: **[TECHNICKY_PREHLED.md](TECHNICKY_PREHLED.md)**

**Mám OTÁZKU** ❓
→ Pozri: **[FAQ.md](FAQ.md)**

### 2. INŠTALÁCIA

1. Nainštaluj Python, Node.js, Git
2. Stiahni kód: `git clone ...`
3. Nainštaluj Backend balíčky: `pip install -r requirements.txt`
4. Nainštaluj Frontend balíčky: `npm install`

Detaily: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** alebo príkazy: **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)**

### 3. SPUSTENIE

**Terminal 1:** `python main.py` (Backend)
**Terminal 2:** `npx expo start` (Frontend)

Detaily: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** → Krok 4 & 6

### 4. TESTOVANIE

Pozri aplikáciu na: **http://localhost:8081**
API dokumentácia na: **http://localhost:8000/docs**

### 5. NASLEDUJÚCE KROKY

- Registrácia v aplikácii
- Vytvorenie projektu
- Nahrávanie obrázkov
- Generovanie 3D modelu

---

## 🗂️ ŠTRUKTÚRA DOKUMENTÁCIE

```
3D-rekon/
├── 📚 DOKUMENTÁCIA (SK)
│   ├── SYSTEMOVA_PRIRUCKA.md          ← Hlavný sprievodca
│   ├── TECHNICKY_PREHLED.md           ← Technické detaily
│   ├── PRIKAZYA_NA_KOPIROVANIE.md     ← Príkazy na kopírovanie
│   ├── FAQ.md                         ← Často kladené otázky
│   └── README_SK.md                   ← TENTO SÚBOR
│
├── 📚 DOKUMENTÁCIA (EN)
│   ├── QUICK_START.md
│   ├── SETUP_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── SYSTEM_FLOW.md
│   ├── DEVELOPMENT_SETUP.md
│   ├── DEPLOYMENT.md
│   └── ďalšie...
│
├── Back-end/                          ← Python FastAPI
│   ├── main.py                        ← Spustenie Backend
│   ├── requirements.txt               ← Python balíčky
│   └── README.md
│
└── Front-and/                         ← React Native + Expo
    ├── App.tsx                        ← Root komponent
    ├── package.json                   ← Node.js balíčky
    └── README.md
```

---

## 🎯 PODĽA TU SITUÁCIE

### Situácia 1: "Som nový a nič o tom neviem"

**Riešenie:**
1. Najskôr si prečítaj: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** → Kapitola "POŽIADAVKY"
2. Potom: **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)** → Skopíruj príkazy
3. Ak máš otázku: **[FAQ.md](FAQ.md)**

### Situácia 2: "Znám Python a chcem začať vyvíjať"

**Riešenie:**
1. Pozri: **[TECHNICKY_PREHLED.md](TECHNICKY_PREHLED.md)** → Celý dokument
2. Backend setup: **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)**
3. API: http://localhost:8000/docs

### Situácia 3: "Mám chybu a neviem čo s tým"

**Riešenie:**
1. Skontroluj: **[FAQ.md](FAQ.md)** → Troubleshooting sekcia
2. Pozri: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)** → Riešenie problémov
3. Ak stále nejde: [Kontakt](#pomoc)

### Situácia 4: "Chcem nasadiť do produkcie"

**Riešenie:**
1. Pozri: `DEPLOYMENT.md` (EN)
2. Bezpečnosť: `PRODUCTION_SECURITY.md` (EN)
3. Docker: `docker-compose.prod.yml`

---

## ✅ CHECKLIST NA SPUSTENIE

### Kroky

- [ ] **Krok 1**: Python 3.9+, Node.js 18+, Git nainštalovaní
- [ ] **Krok 2**: Kód stiahnutý (`git clone`)
- [ ] **Krok 3**: Backend balíčky nainštalované (`pip install -r requirements.txt`)
- [ ] **Krok 4**: Frontend balíčky nainštalované (`npm install`)
- [ ] **Krok 5**: Backend spustený (`python main.py`)
- [ ] **Krok 6**: Frontend spustený (`npx expo start`)
- [ ] **Krok 7**: Frontend v prehliadači (http://localhost:8081)
- [ ] **Krok 8**: Registrácia/Prihlásenie
- [ ] **Krok 9**: Vytvorenie projektu
- [ ] **Krok 10**: Nahrávanie obrázkov

---

## 📱 KRÁTKY PREHĽAD

### Čo je v projekte?

```
Frontend (React Native + Expo)    Backend (Python + FastAPI)    Database (Supabase)
        │                                 │                              │
        │  http://localhost:8081         │  http://localhost:8000        │
        │  - Prihlásenie                 │  - Autentifikácia            │ - Users
        │  - Projekty                    │  - API endpointy             │ - Projects
        │  - 3D Viewer                   │  - File handling             │ - Images
        │  - Upload                      │  - DB operácie               │ - Settings
        └────────────────────────────────┴──────────────────────────────┘
                            Všetko spolu na 1 PC
```

### Porty a URL

| Komponent | Port | URL |
|-----------|------|-----|
| Backend | 8000 | http://localhost:8000 |
| Frontend | 8081 | http://localhost:8081 |
| API Docs | 8000 | http://localhost:8000/docs |

---

## 🎬 VIDEONÁVOD (ODPORÚČANÝ PORIADOK)

1. **Úvod**: Čítaj `README.md`
2. **Požiadavky**: Čítaj `TECHNICKY_PREHLED.md`
3. **Setup**: Čítaj `SYSTEMOVA_PRIRUCKA.md` alebo skopíruj z `PRIKAZYA_NA_KOPIROVANIE.md`
4. **Spustenie**: `python main.py` + `npx expo start`
5. **Testovanie**: http://localhost:8081
6. **Vývoj**: Pozri `DEVELOPMENT_SETUP.md` alebo `ARCHITECTURE.md`

---

## 🆘 POMOC

### Ak niečo nefunguje:

1. **Skontroluj FAQ**: [FAQ.md](FAQ.md)
2. **Skontroluj príkazy**: [PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)
3. **Prečítaj si hlavný sprievodca**: [SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)
4. **Technické detaily**: [TECHNICKY_PREHLED.md](TECHNICKY_PREHLED.md)
5. **API dokumentácia**: http://localhost:8000/docs

---

## 🌐 UŽITOČNÉ LINKS

- **Python**: https://www.python.org/
- **Node.js**: https://nodejs.org/
- **Git**: https://git-scm.com/
- **Supabase**: https://supabase.com/
- **VSCode**: https://code.visualstudio.com/
- **React Native**: https://reactnative.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Three.js**: https://threejs.org/
- **Expo**: https://expo.io/

---

## 📞 KONTAKT

Ak máš otázku alebo narazil si na chybu:

1. **FAQ.md** - Časti "Riešenie problémov"
2. **SYSTEMOVA_PRIRUCKA.md** - Troubleshooting kapitola
3. **GitHub Issues** - Ak je to bug

---

## 🎓 ĎALŠIE VZDELÁVANIE

Po spustení aplikácie sa môžeš naučiť:

1. **Backend vývoj**: Pozri `Back-end/README.md`
2. **Frontend vývoj**: Pozri `Front-and/README.md`
3. **3D grafika**: Pozri `3D_VIEWER_SETUP.md`
4. **API**: http://localhost:8000/docs
5. **Databáza**: Supabase dokumentácia

---

## ✨ HOTOVO!

Teraz vieš kde sú všetky dokumenty. 

**Začni tu:**
- Rýchlo: **[PRIKAZYA_NA_KOPIROVANIE.md](PRIKAZYA_NA_KOPIROVANIE.md)**
- Detailne: **[SYSTEMOVA_PRIRUCKA.md](SYSTEMOVA_PRIRUCKA.md)**
- Otázky: **[FAQ.md](FAQ.md)**

---

**Poznámka**: Všetky dokumenty sú v slovenčine. Anglické verzie sú dostupné aj.

😊 **Vítaj v projekte!**
