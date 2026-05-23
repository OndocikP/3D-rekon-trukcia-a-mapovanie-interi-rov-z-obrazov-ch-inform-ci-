# ⚡ KROK ZA KROKOM - PRÍKAZY NA KOPÍROVANIE

Jednoduchý sprievodca s príkazmi, ktoré si môžeš kopírovať priamo do terminálu.

---

## 🎯 RÝCHLY POSTUP (3 MINÚTY)

Ak máš všetko nainštalované (Python, Node.js, Git), skopíruj tieto príkazy:

### 1. Stiahni kód (Terminal 1)

```bash
git clone https://github.com/your-username/3D-rekon.git
cd 3D-rekon
```

### 2. Backend (Terminal 1)

```bash
cd Back-end
python -m venv venv
```

**Na Windows:**
```bash
venv\Scripts\activate
```

**Na macOS/Linux:**
```bash
source venv/bin/activate
```

Potom:
```bash
pip install -r requirements.txt
python init_db.py
python main.py
```

✅ Backend beží na: **http://localhost:8000**

### 3. Frontend (Terminal 2 - NOVÝ TERMINAL!)

```bash
cd Front-and
npm install
npx expo start
```

Stlač `w` na spustenie v prehliadači.

✅ Frontend beží na: **http://localhost:8081**

---

## 📋 DETAILNÝ SPRIEVODCA

### PRE WINDOWS

#### Krok 1: Otvor PowerShell alebo Command Prompt

Klikni pravým na Desktop → "Open PowerShell here" alebo "Otvoriť príkazový riadok"

#### Krok 2: Navigácia a stiahnutie kódu

```powershell
# Naviguj do Documents
cd Documents

# Naklonuj repozitár
git clone https://github.com/your-username/3D-rekon.git

# Vstúp do adresára
cd 3D-rekon

# Skontroluj že si na správnom mieste
dir
# Mal by si vidieť: Back-end/  Front-and/  README.md  atď.
```

#### Krok 3: Backend - Terminal 1

```powershell
# Naviguj do Back-end
cd Back-end

# Vytvor virtuálne prostredie
python -m venv venv

# Aktivuj venv
venv\Scripts\activate

# Nainštaluj balíčky
pip install -r requirements.txt

# Inicializuj databázu
python init_db.py

# Spusti Backend
python main.py
```

**Výstup:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**⚠️ NESPÚŠŤAJ ďalšie príkazy v tomto terminále!**

#### Krok 4: Frontend - Terminal 2

Otvor **NOVÝ PowerShell** (Alt+Tab alebo otvor novú záložku)

```powershell
# Naviguj do Front-and (z root adresára)
cd Front-and

# Nainštaluj Node balíčky
npm install

# Spusti Frontend
npx expo start
```

**Výstup:**
```
> expo start
› Press 'i' │ android │ web │ OR scan QR code
```

#### Krok 5: Spustenie v prehliadači

Stlač `w` v terminále:

```
w - open in web
```

Prehliadač sa otvore s aplikáciou na **http://localhost:8081**

---

### PRE macOS

#### Krok 1: Otvor Terminal

CMD + SPACE → Napíš "Terminal" → Enter

#### Krok 2: Navigácia a stiahnutie kódu

```bash
# Naviguj do Documents
cd ~/Documents

# Naklonuj repozitár
git clone https://github.com/your-username/3D-rekon.git

# Vstúp do adresára
cd 3D-rekon

# Skontroluj
ls
# Mal by si vidieť: Back-end/  Front-and/  README.md  atď.
```

#### Krok 3: Backend - Terminal 1

```bash
# Naviguj do Back-end
cd Back-end

# Vytvor virtuálne prostredie
python3 -m venv venv

# Aktivuj venv
source venv/bin/activate

# Nainštaluj balíčky
pip install -r requirements.txt

# Inicializuj databázu
python3 init_db.py

# Spusti Backend
python3 main.py
```

**Výstup:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Krok 4: Frontend - Terminal 2

Otvor **NOVÝ Terminal** (CMD+N)

```bash
# Naviguj do Front-end (z root adresára)
cd Front-and

# Nainštaluj Node balíčky
npm install

# Spusti Frontend
npx expo start
```

#### Krok 5: Spustenie v prehliadači

Stlač `w`:

```
w - open in web
```

---

### PRE Linux (Ubuntu/Debian)

#### Krok 1: Otvor Terminal

CTRL + ALT + T

#### Krok 2: Navigácia a stiahnutie kódu

```bash
# Naviguj do Documents (alebo hocikam)
cd ~/Documents

# Naklonuj repozitár
git clone https://github.com/your-username/3D-rekon.git

# Vstúp do adresára
cd 3D-rekon

# Skontroluj
ls
```

#### Krok 3: Backend - Terminal 1

```bash
# Naviguj do Back-end
cd Back-end

# Vytvor virtuálne prostredie
python3 -m venv venv

# Aktivuj venv
source venv/bin/activate

# Nainštaluj balíčky
pip install -r requirements.txt

# Inicializuj databázu
python3 init_db.py

# Spusti Backend
python3 main.py
```

#### Krok 4: Frontend - Terminal 2

```bash
# NOVÝ terminal (CTRL+ALT+T)

# Naviguj do Front-end
cd Front-and

# Nainštaluj Node balíčky
npm install

# Spusti Frontend
npx expo start
```

#### Krok 5: Spustenie v prehliadači

Stlač `w`

---

## 🔄 RESTARTY A OPAKOVANÉ SPUSTENIE

### Normálne spustenie (nabudúce)

Keď už máš všetko nainštalované a chceš spustiť aplikáciu znova:

#### Backend - Terminal 1

```bash
cd Back-end
source venv/bin/activate  # macOS/Linux
# alebo
venv\Scripts\activate      # Windows

python main.py            # macOS/Linux
# alebo
python main.py           # Windows (rovnaký príkaz)
```

#### Frontend - Terminal 2

```bash
cd Front-and
npx expo start
```

Stlač `w`

---

## 🆘 PROBLÉM? SKÚS TIETO PRÍKAZY

### Backend sa nespúšťa

```bash
# Skontroluj či si v Back-end adresári
pwd  # macOS/Linux
# alebo
cd   # Windows - vidíš cestu?

# Skontroluj venv je aktivovaný
# Windows: Vidíš (venv) na začiatku riadka?
# Ak nie:
venv\Scripts\activate

# Skontroluj Python verzia
python --version
# Musí byť 3.9+

# Nainštaluj balíčky znova
pip install -r requirements.txt

# Skúť znova
python main.py
```

### Frontend sa nepripája

```bash
# Overenie portu
# Windows:
netstat -ano | findstr :8000

# macOS/Linux:
lsof -i :8000

# Ak je obsadený, zabij proces:
# Windows:
taskkill /PID <PID_CISLO> /F

# macOS/Linux:
kill -9 <PID_CISLO>
```

### Chyba "venv not found"

```bash
# Znova vytvor venv
cd Back-end
python -m venv venv

# Aktivuj
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Nainštaluj balíčky
pip install -r requirements.txt
```

### Port 8081 je obsadený

```bash
# Expo si automaticky nájde iný port
# Alebo vymaž cache:
npx expo start --clear
```

---

## 🧹 VYČISTENIE A RESET

### Vymaž venv a spustí úplný reset

```bash
# Backend
cd Back-end

# Windows:
rmdir /s venv
python -m venv venv
venv\Scripts\activate

# macOS/Linux:
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Nainštaluj balíčky
pip install -r requirements.txt

# Inicializuj DB znova
python init_db.py
```

### Vymaž node_modules a nainštaluj znova

```bash
# Frontend
cd Front-and

# Windows/macOS/Linux:
rm -rf node_modules
npm install
```

---

## ✅ KONEČNÝ CHECKLIST

Pred tým ako povieš "Hotovo!":

```bash
# Terminal 1: Backend
# Vidíš: INFO:     Uvicorn running on http://0.0.0.0:8000

# Terminal 2: Frontend
# Vidíš: Expo menu s voľbami (w, i, a, j, atď.)

# Web prehliadač: http://localhost:8081
# Vidíš: Prihlasovaciu obrazovku aplikácie

# http://localhost:8000/docs
# Vidíš: Swagger UI s API endpointmi
```

---

## 📱 SKRYTÁ MENU V EXPO

Keď si v `npx expo start`:

| Kľúč | Akcia |
|------|-------|
| `w` | Web prehliadač |
| `i` | iOS Simulator (iba macOS) |
| `a` | Android Emulator |
| `j` | Debugger |
| `r` | Reload app |
| `m` | Toggle menu |
| `q` | Quit |

---

## 🚀 DALŠIE PRÍKAZY

### Aktualizácia kódu z Git

```bash
# V root adresári
git pull origin main
```

### Kontrola Git stavu

```bash
git status
git log --oneline  # Posledné commity
```

### Commit a push zmien

```bash
git add .
git commit -m "Popis zmeny"
git push origin main
```

### Spustenie testov (Backend)

```bash
cd Back-end
python -m pytest
```

### Kontrola TypeScript (Frontend)

```bash
cd Front-and
npx tsc --noEmit
```

---

## 💡 TIPS & TRICKS

### Hot Reload (Frontend)

Keď zmeníš kód, Frontend sa automaticky reloadne. Ak nie:

```bash
# V Expo menu stlač: r
```

### Vymaž cache (Backend)

```bash
cd Back-end
find . -type d -name __pycache__ -exec rm -r {} +
```

### CLI Nástroj (Backend)

```bash
cd Back-end
python cli.py
```

Možnosti:
1. Zobraziť používateľov a projekty
2. Automaticky detekovať objekty
0. Výstup

### Debug Expo v Dev Tools

```bash
# V Expo menu: j (Debugger)
# Otvorí Chrome DevTools
```

---

## 🎓 ĎALŠIE KROKY

Keď máš aplikáciu spustenú:

1. **Testujem registráciu**: Vytvor nový účet
2. **Prihlásim sa**: Použij nový účet
3. **Vytvorím projekt**: Vytvor nový projekt s názvom
4. **Nahrajem obrázky**: Nahraj niekoľko obrázkov
5. **Vidím 3D model**: Mal by si vidieť generovaný 3D model

---

## 📞 POMOC

- **Backend** sa nespúšťa? → Pozri "SYSTEMOVA_PRIRUCKA.md"
- **Frontend** sa nespúšťa? → Pozri "SYSTEMOVA_PRIRUCKA.md"
- **Chýba mi softvér?** → Pozri "TECHNICKY_PREHLED.md"
- **API Dokumentácia**: http://localhost:8000/docs

---

## 🎉 HOTOVO!

Ak vidíš:
- ✅ Backend na http://localhost:8000
- ✅ Frontend na http://localhost:8081
- ✅ Môžeš sa prihlásiť
- ✅ Vidíš aplikáciu

**Gratulujem! Aplikácia beží!** 🚀

---

**Poznámka**: Všetky príkazy sú testované a funkčné. Ak narazíš na chybu, skontroluj si SYSTEMOVA_PRIRUCKA.md alebo TECHNICKY_PREHLED.md.
