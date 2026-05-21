# 🔐 PASSWORD RESET SYSTEM - KOMPLETNÝ POPIS

## 📦 Čo Bolo Vytvorené

Vytvořila som **kompletný produkčný systém na obnovení hesla** s odosielaním emailov.

### Súbory:
1. **`password_reset.py`** - Logika a funkcie (243 línií)
2. **`main.py`** - 3 nové API endpointy (115 línií)
3. **`PASSWORD_RESET_GUIDE.md`** - Detailná dokumentácia
4. **`PASSWORD_RESET_SETUP.md`** - Rýchly start + príklady
5. **`password_reset_setup.sql`** - SQL skript na databázu

---

## 🎯 FUNKČNOSŤ

### 3 API Endpointy:

#### 1️⃣ Požiadať o Obnovenie Hesla
```
POST /api/auth/forgot-password
{
  "email": "user@gmail.com"
}
→ 📧 Automaticky sa pošle email s 6-ciferným kódom
```

#### 2️⃣ Overieť Reset Kód  
```
POST /api/auth/verify-reset-code
{
  "email": "user@gmail.com",
  "reset_code": "123456"
}
→ ✅ Vracia ci je kód platný
```

#### 3️⃣ Obnoviť Heslo
```
POST /api/auth/reset-password
{
  "email": "user@gmail.com",
  "reset_code": "123456",
  "new_password": "nove_heslo_123"
}
→ ✅ Heslo bolo obnovené
```

---

## 🛠️ NASTAVENIE (10 MINÚT)

### 1. Gmail App Password
- Prejdi na: https://myaccount.google.com/apppasswords
- Vyberi **Mail** → **Windows Computer**
- Skopíruj 16-znakové heslo

### 2. Aktualizuj `.env`
```env
GMAIL_EMAIL=tvoj-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
RESET_CODE_EXPIRY_MINUTES=30
```

### 3. Vytvor Databázovú Tabuľku
Spusti `password_reset_setup.sql` v Supabase SQL Editor

### 4. Restart Backend
```bash
python main.py
```

---

## ✨ FUNKCIE

### ✅ Zabezpečenie
- 🔐 Náhodný 6-ciferný kód (bezpečný)
- ⏱️ Expirácija tokenov (30 minút)
- 🔒 Kód sa dá použiť iba raz
- 🛡️ Email verifikácia

### ✅ Backend
- 📧 HTML email s pekným designom
- 💾 Uloženie v Supabase
- 📊 Detailné logy
- ⚠️ Error handling
- 🧹 Vymazanie starých tokenov

### ✅ Frontend Pripravený
- React/TypeScript príklady
- React Native / Expo príklady
- Kompletný UI flow
- Copy-paste code

---

## 📝 PRÍKLAD - TESTING

### PowerShell:
```powershell
# 1. Požiadať o reset
curl -X POST http://localhost:8000/api/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@gmail.com\"}'

# 2. Overieť kód (z emailu)
curl -X POST http://localhost:8000/api/auth/verify-reset-code `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@gmail.com\",\"reset_code\":\"123456\"}'

# 3. Obnoviť heslo
curl -X POST http://localhost:8000/api/auth/reset-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@gmail.com\",\"reset_code\":\"123456\",\"new_password\":\"nove_123\"}'
```

---

## 📱 FRONTEND INTEGRÁCIA

V `Front-and/app/forgotPassword.tsx` alebo podobne:

```typescript
// 1. Požiadať o reset
const handleForgotPassword = async (email: string) => {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  // Email s kódom sa pošle!
};

// 2. Overieť kód
const handleVerifyCode = async (email: string, code: string) => {
  const res = await fetch('/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reset_code: code })
  });
};

// 3. Obnoviť heslo
const handleResetPassword = async (email: string, code: string, pwd: string) => {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      reset_code: code, 
      new_password: pwd 
    })
  });
};
```

---

## 🗂️ DATABÁZA

### Tabuľka: `password_reset_tokens`

| Pole | Typ | Popis |
|------|-----|-------|
| id | BIGSERIAL | Primary key |
| email | VARCHAR | Email užívateľa |
| reset_code | VARCHAR | 6-ciferný kód |
| used | BOOLEAN | Či bol kód použitý |
| created_at | TIMESTAMP | Čas vytvorenia |
| expires_at | TIMESTAMP | Expirácija (30 min) |

---

## 🔍 DEBUGOVANIE

### Logy v Backende:
```
🔑 FORGOT PASSWORD ENDPOINT
   email: user@gmail.com
✅ Reset email poslal na user@gmail.com

🔑 VERIFY RESET CODE ENDPOINT
✅ Reset kód je platný

🔑 RESET PASSWORD ENDPOINT
✅ Heslo bolo obnovené
```

### Časté Chyby:
| Chyba | Riešenie |
|-------|----------|
| "SMTP Auth failed" | Skontroluj app password |
| "Email sa neposiela" | Zapni 2FA v Gmaili |
| "Kód neplatný" | Kód platí len 30 min |
| "Table not found" | Spusti password_reset_setup.sql |

---

## 📚 DOKUMENTÁCIA

- **PASSWORD_RESET_GUIDE.md** - Podrobný návod
- **PASSWORD_RESET_SETUP.md** - Rýchly start + príklady
- **password_reset_setup.sql** - SQL databáza
- **password_reset.py** - Zdrojový kód logiky
- **main.py** - API endpointy

---

## ✅ KONTROLNÝ ZOZNAM

- ✅ Import v main.py
- ✅ Schémy Pydantic
- ✅ 3 API endpointy
- ✅ Email odosielanie cez Gmail
- ✅ Supabase integrácia
- ✅ Reset kód generovanie
- ✅ Verifikácia kódu
- ✅ Obnovenie hesla
- ✅ Error handling
- ✅ Detailné logy
- ✅ Dokumentácia
- ✅ SQL skript
- ✅ Frontend príklady

---

## 🚀 NASADENIE NA PRODUKCIU

### Kontroly:
```bash
# 1. Overaj EMAIL settings
echo $GMAIL_EMAIL
echo $GMAIL_PASSWORD  # Mal by byť app password!

# 2. Skontroluj .env
cat .env | grep GMAIL

# 3. Testuj endpoint
curl http://localhost:8000/health  # ✅ healthy?

# 4. Restartuj backend
python main.py
```

---

## 💡 TIPS

1. **Testuuj s vlastným emailom** - Najlepšie s Gmail
2. **App Password** - VŽDY použi app password, nie normálne heslo
3. **2FA** - Zapni v Gmaili, bez 2FA to nebude fungovať
4. **Logy** - Backend vypisuje detailné logy, skúmaj ich
5. **Email Design** - HTML template si môžeš upraviť

---

## 📞 PODPORA

### Problémy?

1. Skontroluj `.env` - GMAIL_EMAIL a GMAIL_PASSWORD
2. Prečítaj logy - Backend vypisuje všetko
3. Skúste testovanie s curl
4. Skontroluj SQL tabuľku v Supabase

---

## 🎉 HOTOVO!

Tvoj systém na obnovenie hesla je **plne funkčný a pripravený**.

Viac detailov v dokumentácii: 📖 **PASSWORD_RESET_GUIDE.md**
