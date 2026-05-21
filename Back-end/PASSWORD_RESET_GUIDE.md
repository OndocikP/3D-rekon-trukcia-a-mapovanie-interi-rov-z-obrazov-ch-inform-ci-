# 🔐 Systém na Obnovenie Hesla

Kompletný systém na bezpečné obnovenie hesla s odosielaním emailov cez Gmail.

## 📋 Popis

Systém umožňuje:
- Požiadať o obnovenie hesla zadaním emailu
- Odoslanie 6-cifernného reset kódu na Gmail
- Verifikáciu reset kódu
- Obnovenie hesla s platným kodom

## 🛠️ Nastavenie

### 1. Nastavenie Environment Premenných (.env)

```env
# Gmail konfigurácia
GMAIL_EMAIL=vase-gmail@gmail.com
GMAIL_PASSWORD=vase-app-password

# Čas platnosti reset kódu (v minútach)
RESET_CODE_EXPIRY_MINUTES=30

# Supabase (už máte)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Gmail App Password (DÔLEŽITÉ!)

Gmail **neumožňuje** priame použitie hesla. Musíte použiť **App Password**:

1. Prejdite na: https://myaccount.google.com/apppasswords
2. Zvoľte **Mail** a **Windows Computer** (alebo iné zariadenie)
3. Google vygeneruje 16-znakové heslo
4. Toto heslo použite ako `GMAIL_PASSWORD` v `.env`

> ⚠️ **Poznámka:** Musíte mať zapnú 2-faktorovú autentifikáciu!

### 3. Databáza - Vytvorenie Tabuľky

Spustite v Supabase SQL Editor:

```sql
-- Tabuľka na uloženie reset tokenov
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index pre rýchlejšie dotazy
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_tokens(reset_code);

-- Políčko pre ukládanie reset tokenov v tabuľke users (voliteľné)
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_requested_at TIMESTAMP WITH TIME ZONE;
```

## 🚀 API Endpointy

### 1. Požiadať o Obnovenie Hesla

**POST** `/api/auth/forgot-password`

```json
{
  "email": "user@gmail.com"
}
```

**Odpoveď:**
```json
{
  "success": true,
  "message": "Email s kódom na obnovenie hesla bol poslal"
}
```

---

### 2. Overieť Reset Kód

**POST** `/api/auth/verify-reset-code`

```json
{
  "email": "user@gmail.com",
  "reset_code": "123456"
}
```

**Odpoveď:**
```json
{
  "valid": true,
  "message": "Kód je platný, môžeš obnoviť heslo"
}
```

---

### 3. Obnoviť Heslo

**POST** `/api/auth/reset-password`

```json
{
  "email": "user@gmail.com",
  "reset_code": "123456",
  "new_password": "nove_heslo_123"
}
```

**Odpoveď:**
```json
{
  "success": true,
  "message": "Heslo bolo úspešne obnovené"
}
```

## 📱 Frontend Integrácia

Príklad v React/TypeScript:

```typescript
// 1. Požiadať o reset
const requestPasswordReset = async (email: string) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await response.json();
};

// 2. Overieť kód
const verifyResetCode = async (email: string, code: string) => {
  const response = await fetch('/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reset_code: code })
  });
  return await response.json();
};

// 3. Obnoviť heslo
const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      reset_code: code,
      new_password: newPassword
    })
  });
  return await response.json();
};
```

### Príklad UI Flow:

```typescript
const [email, setEmail] = useState('');
const [resetCode, setResetCode] = useState('');
const [newPassword, setNewPassword] = useState('');
const [step, setStep] = useState<'email' | 'code' | 'password'>('email');

const handleForgotPassword = async () => {
  await requestPasswordReset(email);
  setStep('code');
};

const handleVerifyCode = async () => {
  const result = await verifyResetCode(email, resetCode);
  if (result.valid) {
    setStep('password');
  }
};

const handleResetPassword = async () => {
  const result = await resetPassword(email, resetCode, newPassword);
  if (result.success) {
    alert('Heslo bolo obnovené! Prihláste sa s novým heslom.');
    setStep('email');
  }
};

return (
  <div>
    {step === 'email' && (
      <>
        <input
          type="email"
          placeholder="Zadajte váš email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleForgotPassword}>Požiadať o reset</button>
      </>
    )}

    {step === 'code' && (
      <>
        <input
          type="text"
          placeholder="Zadajte 6-ciferný kód z emailu"
          value={resetCode}
          onChange={(e) => setResetCode(e.target.value)}
          maxLength={6}
        />
        <button onClick={handleVerifyCode}>Overiť kód</button>
      </>
    )}

    {step === 'password' && (
      <>
        <input
          type="password"
          placeholder="Zadajte nové heslo"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleResetPassword}>Obnoviť heslo</button>
      </>
    )}
  </div>
);
```

## 🔒 Bezpečnosť

✅ **Implementované bezpečnostné opatrenia:**

- **6-ciferný náhodný kód** - generovaný pomocou `secrets` modulu
- **Expiration time** - kód platí len 30 minút (nastaviteľné)
- **One-time use** - kód sa dá použiť iba raz
- **Email verifikácia** - kód sa pošle len na registrovaný email
- **HTTPS** - všetky emailové links by mali byť HTTPS
- **Hashed passwords** - heslo sa ukladá hashované v Supabase

## 🐛 Debugging

### Kontrola logov

Backend vypisuje detailné logy:
```
🔑 FORGOT PASSWORD ENDPOINT
   email: user@gmail.com
✅ Reset email poslal na user@gmail.com
```

### Česte Problémy

**❌ "Chyba autentifikácie pri odosielaní emailu"**
- Skontroluj GMAIL_EMAIL a GMAIL_PASSWORD v .env
- Overaj, že máš App Password (nie normálne heslo)
- Zisti, či máš zapnutú 2-faktorovú autentifikáciu

**❌ "Kód neplatný alebo už bol použitý"**
- Skontroluj, či je kód správny
- Overaj, že kód nie je starší ako 30 minút

**❌ "Užívateľ so zadaným emailom neexistuje"**
- Overaj, že email je správne registrovaný v systéme

## 📦 Súbory

- `password_reset.py` - Logika password resetuovania
- `main.py` - API endpointy a integrácia
- `requirements.txt` - Potrebné knižnice

## 🔄 Čistenie Starých Tokenov

Staré tokeny sa majú vymazať. Môžete spustiť periodickú úlohu:

```python
from password_reset import cleanup_expired_tokens
import schedule
import time

# Spusti cleanup každú hodinu
schedule.every(1).hours.do(cleanup_expired_tokens)

while True:
    schedule.run_pending()
    time.sleep(60)
```

Alebo v Supabase ako CRON job.

## ✅ Testovanie

Testovať endpointy s `curl`:

```bash
# 1. Požiadať o reset
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'

# 2. Overieť kód (zadajte kód z emailu)
curl -X POST http://localhost:8000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","reset_code":"123456"}'

# 3. Obnoviť heslo
curl -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","reset_code":"123456","new_password":"nove_heslo_123"}'
```

---

**Hotovo! 🎉 Váš systém na obnovenie hesla je pripravený.**
