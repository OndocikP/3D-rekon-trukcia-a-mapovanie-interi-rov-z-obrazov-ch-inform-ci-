# ❓ FAQ - ČASTO KLADENÉ OTÁZKY

Odpovede na časté otázky pri spúšťaní aplikácie.

---

## INŠTALÁCIA

### Q: Kde si stiahnem Python?
**A:** https://www.python.org/downloads/
- Vyber verziu 3.9 alebo novšiu
- **DÔLEŽITÉ**: Pri inštalácii zaškrtni "Add Python to PATH"
- Po inštalácii overi: `python --version`

### Q: Kde si stiahnem Node.js?
**A:** https://nodejs.org/
- Odporúčam LTS verziu (napr. v18 alebo novšia)
- Po inštalácii overi: `npm --version`

### Q: Kde si stiahnem Git?
**A:** https://git-scm.com/
- Vyber pre svoj OS (Windows/macOS/Linux)
- Po inštalácii overi: `git --version`

### Q: Stahni som Python, ale príkaz `python` nefunguje
**A:** Skúš:
```bash
python3 --version
```
Ak to funguje, máš Python nainštalovaný ako `python3`.
Alebo: Pri reinštalácii zaškrtni "Add Python to PATH"

---

## STIAHNUTIE KÓDU

### Q: Čo je "Git clone"?
**A:** Git clone je príkaz na stiahnutie kódu z internetu:
```bash
git clone https://github.com/your-username/3D-rekon.git
```
Tento príkaz si stiahne celý projekt do tvojho počítača.

### Q: Kam sa stiahne kód?
**A:** Do adresára, kde si spustil príkaz `git clone`.
Napr. ak si v `C:\Users\Jano\Documents`, projekt sa vytvorí tam:
```
C:\Users\Jano\Documents\3D-rekon\
```

### Q: Ako viem, že som v správnom adresári?
**A:** Spusti príkaz a skontroluješ výstup:

**Windows (PowerShell):**
```powershell
dir
# Mal by si vidieť: Back-end/  Front-and/  README.md  atď.
```

**macOS/Linux:**
```bash
ls
# Mal by si vidieť: Back-end/  Front-and/  README.md  atď.
```

---

## BACKEND

### Q: Čo je ".env"?
**A:** `.env` je súbor s tajnými údajmi (hesla, API keys, atď.)
- Nikdy ho nedeliš verejne!
- Obsahuje: `DATABASE_URL`, `SECRET_KEY`, atď.
- V projekte je **UŽ NASTAVENÝ**

### Q: Čo je "venv"?
**A:** Virtuálne prostredie Python. Izoláciou balíčkov pre projekt.
Vytvoríš ho:
```bash
python -m venv venv
```
Aktivuješ ho:
- **Windows**: `venv\Scripts\activate`
- **macOS/Linux**: `source venv/bin/activate`

### Q: Aký je rozdiel medzi `python` a `python3`?
**A:** 
- Na **Windows** zvyčajne: `python`
- Na **macOS/Linux** zvyčajne: `python3`
- Skúsy obe, ktorá funguje

### Q: Backend sa spúšťa, ale je pomalý?
**A:** Prvé spustenie je pomalé kvôli inicializácii DB.
Nabudúce spustenia budú rýchlejšie.

### Q: Ako viem, že Backend beží?
**A:** Vidíš v terminále:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```
A ak otvoríš: http://localhost:8000/docs

### Q: Čo robiť ak Backend "zamrzne"?
**A:** Stlač `CTRL+C` v terminále a spusti znova:
```bash
python main.py
```

---

## FRONTEND

### Q: Čo je "npm install"?
**A:** Príkaz na stiahnutie všetkých Node.js balíčkov.
```bash
npm install
```
Stiahne všetko čo si potrebuje aplikácia (React, Expo, Three.js, atď.)

### Q: Ako dlho trvá `npm install`?
**A:** 2-10 minút. Závisí od:
- Rýchlosti internetu
- Počtu balíčkov
- Výkonu počítača

### Q: Ako viem, že npm instalácia je hotová?
**A:** Príkazový riadok sa vráti bez chýb a znova vidíš prompt.

### Q: Čo je "npx expo start"?
**A:** Príkaz na spustenie dev serveru.
```bash
npx expo start
```
Spúšťa aplikáciu v "dev mode" s hot reload.

### Q: V Expo menu som a nerozumiem voľbám
**A:** 
- `w` - Web prehliadač (odporúčam)
- `i` - iPhone Simulator (iba macOS)
- `a` - Android Emulator (treba Android SDK)
- `r` - Reload app
- `q` - Quit (vypni Expo)

### Q: Frontend sa nespúšťa v prehliadači
**A:** Skúš:
```bash
npx expo start --clear
```
Alebo stlač `w` znova v Expo menu.

### Q: Vidím chybu "Cannot reach http://localhost:8000"
**A:** Frontend sa nemôže pripojiť na Backend:
1. Skontroluj či Backend beží (Terminal 1)
2. Skontroluj `.env.local` v `Front-and/`
3. Skúš stlačiť `r` v Expo na reload

---

## PORTY

### Q: Čo je "port"?
**A:** Číslo na počítači ktoré určuje "adresu" aplikácie.
- Backend: **port 8000** = http://localhost:8000
- Frontend: **port 8081** = http://localhost:8081

### Q: Ako viem či je port obsadený?
**A:** 
**Windows (PowerShell):**
```powershell
netstat -ano | findstr :8000
```

**macOS/Linux (Terminal):**
```bash
lsof -i :8000
```

### Q: Port je obsadený, čo robiť?
**A:** Zabij proces:

**Windows:**
```powershell
# Nájdi PID číslo z výstupu vyššie
taskkill /PID <PID_CISLO> /F
```

**macOS/Linux:**
```bash
# Nájdi PID číslo z výstupu vyššie
kill -9 <PID_CISLO>
```

---

## DATABÁZA

### Q: Kde je moja databáza?
**A:** V **Supabase cloude** (na internete).
- Nie je na tvojom počítači
- Prístupová URL: https://supabase.co
- Prihlášť sa pomocou údajov v `.env`

### Q: Ako si stiahnem dáta z databázy?
**A:** Príkazom v Backend terminále:
```bash
cd Back-end
python cli.py
```
Výberaš voľbu 1 na zobrazenie údajov.

### Q: Ako si vymažem všetky dáta?
**A:** ⚠️ **Buď OPATRNÝ!** V Backend terminále:
```bash
python init_db.py
```
Toto **VYMAŽE VŠETKY ÚDAJE** a vytvorí čisté tabuľky!

### Q: Čo je "Supabase"?
**A:** 
- Cloud databáza (PostgreSQL)
- Firebase alternatíva
- Autentifikácia (prihlásenie/registrácia)
- File storage
- V tomto projekte je **UŽ NASTAVENÁ**

---

## AUTENTIFIKÁCIA

### Q: Ako sa prihlásim do aplikácie?
**A:** 
1. Otvor Frontend na http://localhost:8081
2. Klikni "Register" → vytvor nový účet
3. Alebo klikni "Login" ak máš už účet
4. Prihlás sa

### Q: Zabudol som heslo
**A:** 
1. V Login obrazovke klikni "Forgot Password"
2. Zadaj email
3. Skontroluj email na reset link

### Q: Kde sa ukladajú moje heslo?
**A:** 
- **Nikde** na disku u teba (ani plain-text)
- Hashovane v Supabase databáze
- Chránené bcrypt algoritmom

---

## 3D MODELY A OBRÁZKY

### Q: Ako nahrám obrázky?
**A:**
1. Vytvor nový projekt: "New Project"
2. Zadaj názov a popis
3. Klikni "Select Images"
4. Vyber fotky (max 12)
5. Klikni "Upload"

### Q: Kde sa ukladajú moje obrázky?
**A:** V Backend adresári:
```
Back-end/projects/{user_id}/{project_id}/images/
```

### Q: Ako sa generuje 3D model?
**A:** 
1. Backend očakáva obrázky
2. Worker proces spúšťa NERFSTUDIO
3. NERFSTUDIO generuje 3D model (PLY formát)
4. Model sa zobrazí v aplikácii

**Poznámka**: 3D generácia je pomalá (môže trvať hodiny)

### Q: Kedy sa 3D model vygeneruje?
**A:** 
- Status sa mení: pending → generating → generated
- Možno to trvať 30 minút až hodiny
- Závisí od počtu obrázkov a výkonu CPU

---

## CHYBY A RIEŠENIA

### Q: Vidím chybu "NameError: name 'xyz' is not defined"
**A:** Chyba v Python kóde.
1. Skontroluj či si v správnom adresári
2. Skontroluj Python verzia: `python --version`
3. Nainštaluj balíčky znova: `pip install -r requirements.txt`

### Q: Vidím chybu "SyntaxError"
**A:** Chyba v Python syntaxi (pravdepodobne nejaké zmenešť v súbore).
1. Skontroluj ci som nemenil Backend súbory
2. Ak áno, vrať zmeny: `git checkout Back-end/`

### Q: Vidím chybu "CORS error"
**A:** Frontend sa nemôže pripojiť na Backend z iného pôvodu.
1. Skontroluj Backend je spustený
2. Skontroluj `.env.local` v `Front-and/`
3. Skúš: `npx expo start --clear`

### Q: Vidím "TypeError: Cannot read property"
**A:** JavaScript chyba vo Fronte.
1. Otvor Browser DevTools: `F12`
2. Pozri Console na detaily
3. Skúš: `npx expo start --clear`

---

## PERFORMANCE

### Q: Aplikácia je pomalá
**A:** Normálne počas vývoja:
- Backend: Prvé spustenie je pomalé
- Frontend: Bundling trvá 10-30 sekúnd
- DB: Supabase je v cloude (internet latency)

### Q: Ako prigraznú aplikáciu?
**A:** V produkčnom nasadení (Docker, nginx, atď.)
Pozri: `DEPLOYMENT.md` a `PRODUCTION_SECURITY.md`

---

## SIEŤOVÉ SPOJENIA

### Q: Potrebujem internet?
**A:** **ÁNO**, pre:
- Supabase (databáza)
- npm install (stiahnutie balíčkov)
- git clone (stiahnutie kódu)

Backend a Frontend fungujú na localhost (bez internetu), ale DB je v cloude.

### Q: Čo ak nič nepôjde?
**A:** 
1. Skontroluj internetové pripojenie
2. Skontroluj Supabase status: https://status.supabase.io
3. Skontroluj či máš správne `.env` údaje

---

## ZARAĎOVANIE

### Q: Ako si sadnuť prihlasovacie údaje v `.env`?
**A:** Urob nasledovné:
1. Otvor `.env` súbor v editore (VSCode)
2. Nájdi `DATABASE_URL=`
3. Nahraď TODO údajmi z Supabase
4. Ulož súbor (Ctrl+S)

### Q: Ako resetnem aplikáciu?
**A:** 
```bash
# Backend - vymaž venv
cd Back-end
rm -rf venv  # macOS/Linux
# alebo
rmdir /s venv  # Windows

# Vytvri nový venv
python -m venv venv

# Frontend - vymaž node_modules
cd Front-and
rm -rf node_modules

# Znova nainštaluj
npm install

# Znova init Backend
cd Back-end
python init_db.py
```

### Q: Ako si aktualizujem kód?
**A:** 
```bash
# V root adresári
git pull origin main

# Ak máš nástroj:
cd Back-end
pip install -r requirements.txt  # Ak sa menili balíčky

cd Front-and
npm install  # Ak sa menili balíčky
```

---

## ZASTAVENIE A SPUSTENIE

### Q: Ako zatvorím aplikáciu?
**A:** 
- **Terminal 1 (Backend)**: Stlač `CTRL+C`
- **Terminal 2 (Frontend)**: Stlač `q` alebo `CTRL+C`
- **Prehliadač**: Zatvor záložku

### Q: Ako znova spustím?
**A:** Pozri "PRIKAZYA_NA_KOPIROVANIE.md" → "Normálne spustenie"

---

## VIAC POMOCI

| Problém | Súbor |
|---------|-------|
| Všeobecný setup | `SYSTEMOVA_PRIRUCKA.md` |
| Príkazy na kopírovanie | `PRIKAZYA_NA_KOPIROVANIE.md` |
| Technické detaily | `TECHNICKY_PREHLED.md` |
| API dokumentácia | http://localhost:8000/docs |
| Architecture | `ARCHITECTURE.md` |
| System Flow | `SYSTEM_FLOW.md` |

---

## 🆘 NIČ Z TOHO NEFUNGUJE!

Prosím, nasleduj poriadok:

1. ✅ Maj nainštalovaný **Python 3.9+**
2. ✅ Maj nainštalovaný **Node.js 18+**
3. ✅ Maj nainštalovaný **Git**
4. ✅ Si v správnom adresári? (`ls` alebo `dir`)
5. ✅ Backend beží? (Terminal 1)
6. ✅ Frontend beží? (Terminal 2)
7. ✅ Internetové pripojenie je OK?

Ak ešte nebeží:
1. Prečítaj si **SYSTEMOVA_PRIRUCKA.md**
2. Skúš príkazy z **PRIKAZYA_NA_KOPIROVANIE.md**
3. Skontroluj **TECHNICKY_PREHLED.md**

---

**Poznámka**: Táto FAQ sa môže aktualizovať! Ak máš ďalší otázku, daj mi vedieť.

😊 **Sme tu, aby sme ti pomohli!**
