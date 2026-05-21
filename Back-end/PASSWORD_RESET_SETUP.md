# 🔐 Implementácia Systému na Obnovenie Hesla - ZHRNUTIE

## ✅ Čo bolo vytvorené

### 1. **password_reset.py** - Jadro Logiky
Obsahuje:
- `send_password_reset_email()` - Odoslanie HTML emailu cez Gmail SMTP
- `create_reset_token()` - Generovanie 6-cifernného kódu + uloženie
- `verify_reset_code()` - Overovanie validity kódu + expirátie
- `reset_password_with_code()` - Obnovenie hesla s verifikáciou
- `cleanup_expired_tokens()` - Vymazanie starých tokenov

### 2. **main.py** - API Endpointy
Pridané endpointy:
- `POST /api/auth/forgot-password` - Požiadať o reset
- `POST /api/auth/verify-reset-code` - Overieť kód
- `POST /api/auth/reset-password` - Obnoviť heslo

### 3. **PASSWORD_RESET_GUIDE.md** - Kompletná Dokumentácia
- Nastavenie Gmail
- SQL vytvorenie tabuľky
- API dokumentácia
- Frontend príklady
- Debugging guide

---

## 🚀 RÝCHLY START (5 MINÚT)

### Krok 1: Nastavenie Gmail

1. Prejdite na https://myaccount.google.com/apppasswords
2. Vyberte **Mail** a **Windows Computer**
3. Skopírujte vygenerované heslo (16 znakov bez medzier)

### Krok 2: Aktualizujte .env

```env
GMAIL_EMAIL=vasa-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
RESET_CODE_EXPIRY_MINUTES=30
```

### Krok 3: Vytvorte Tabuľku v Supabase

Prejdite do Supabase SQL Editor a spustite:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_tokens(reset_code);
```

### Krok 4: Restart Backend

```bash
python main.py
```

---

## 📝 TESTING - Skúste API

### V PowerShell/Terminal:

```bash
# 1. POŽIADAŤ O RESET
curl -X POST http://localhost:8000/api/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"vaseemail@gmail.com\"}'

# 📧 Okamžite dostanete email s 6-ciferným kódom!
# Skopírujte si ho

# 2. OVERIŤ KÓD
curl -X POST http://localhost:8000/api/auth/verify-reset-code `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"vaseemail@gmail.com\",\"reset_code\":\"123456\"}'

# 3. OBNOVIŤ HESLO
curl -X POST http://localhost:8000/api/auth/reset-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"vaseemail@gmail.com\",\"reset_code\":\"123456\",\"new_password\":\"nove_heslo_123\"}'
```

---

## 📱 Frontend Integrácia - React/Expo Príklad

### Components/ForgotPassword.tsx

```typescript
import { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Požiadať o reset
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Chyba', 'Zadajte email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Úspešne', 'Email s kódom bol poslal');
        setStep('code');
      } else {
        Alert.alert('Chyba', data.detail || 'Nepodarilo sa poslať email');
      }
    } catch (error) {
      Alert.alert('Chyba', 'Problém s pripojením');
    } finally {
      setLoading(false);
    }
  };

  // 2. Overieť kód
  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      Alert.alert('Chyba', 'Zadajte 6-ciferný kód');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_code: resetCode })
      });

      const data = await response.json();

      if (data.valid) {
        Alert.alert('OK', 'Kód je správny, zadajte nové heslo');
        setStep('password');
      } else {
        Alert.alert('Chyba', data.message);
      }
    } catch (error) {
      Alert.alert('Chyba', 'Problém s pripojením');
    } finally {
      setLoading(false);
    }
  };

  // 3. Obnoviť heslo
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Chyba', 'Heslo musí mať aspoň 6 znakov');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reset_code: resetCode,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Úspešne', 'Heslo bolo obnovené! Prihláste sa s novým heslom.');
        // Presmeruj na login
        setStep('email');
        setEmail('');
        setResetCode('');
        setNewPassword('');
      } else {
        Alert.alert('Chyba', data.message);
      }
    } catch (error) {
      Alert.alert('Chyba', 'Problém s pripojením');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, justifyContent: 'center', flex: 1 }}>
      {step === 'email' && (
        <>
          <Text style={{ fontSize: 18, marginBottom: 15, fontWeight: 'bold' }}>
            Obnovenie Hesla
          </Text>
          <TextInput
            placeholder="Zadajte váš email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            keyboardType="email-address"
          />
          <Button
            title={loading ? 'Čakám...' : 'Poslať kód na email'}
            onPress={handleForgotPassword}
            disabled={loading}
          />
        </>
      )}

      {step === 'code' && (
        <>
          <Text style={{ fontSize: 18, marginBottom: 15, fontWeight: 'bold' }}>
            Zadajte Kód z Emailu
          </Text>
          <TextInput
            placeholder="6-ciferný kód"
            value={resetCode}
            onChangeText={setResetCode}
            editable={!loading}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            maxLength={6}
            keyboardType="numeric"
          />
          <Button
            title={loading ? 'Čakám...' : 'Ďalej'}
            onPress={handleVerifyCode}
            disabled={loading}
          />
        </>
      )}

      {step === 'password' && (
        <>
          <Text style={{ fontSize: 18, marginBottom: 15, fontWeight: 'bold' }}>
            Nové Heslo
          </Text>
          <TextInput
            placeholder="Nové heslo (min. 6 znakov)"
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!loading}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            secureTextEntry={true}
          />
          <Button
            title={loading ? 'Čakám...' : 'Obnoviť Heslo'}
            onPress={handleResetPassword}
            disabled={loading}
          />
        </>
      )}
    </View>
  );
}
```

---

## 🔍 LOGY V BACKENDE

Keď testujete, v termináli vidíte:

```
🔑 FORGOT PASSWORD ENDPOINT
   email: user@gmail.com
✅ Reset token vytvorený pre user@gmail.com
✅ Email poslal na user@gmail.com
🔑 VERIFY RESET CODE ENDPOINT
   email: user@gmail.com
   code: 123456
✅ Reset kód je platný
🔑 RESET PASSWORD ENDPOINT
   email: user@gmail.com
   code: 123456
✅ Heslo bolo obnovené pre user@gmail.com
```

---

## 🐛 ČASTÉ PROBLÉMY

| Problem | Riešenie |
|---------|----------|
| **"SMTP Auth failed"** | Skontroluj app password na https://myaccount.google.com/apppasswords |
| **Email sa neposiela** | Overaj, že máš 2FA zapnutú v Gmaili |
| **"Kód neplatný"** | Kód platí len 30 minút, skús nový |
| **"Tabuľka neexistuje"** | Spusti SQL skript v Supabase |

---

## 📊 DATABÁZA - Tabuľka password_reset_tokens

```
id (BIGINT) - Primary key
email (VARCHAR) - Email užívateľa
reset_code (VARCHAR) - 6-ciferný kód
used (BOOLEAN) - Či bol kód už použitý
created_at (TIMESTAMP) - Čas vytvorenia
expires_at (TIMESTAMP) - Kedy kód vyprší
```

---

## ✨ Výhody Implementácie

✅ **Bezpečnosť:**
- Náhodné 6-ciferné kódy
- Expirácija tokenov
- One-time use
- HTTPS ready

✅ **Jednoduché Použitie:**
- 3 jednoduché API endpointy
- Jasný flow
- Frontend príklady

✅ **Produkčné:**
- Logy a debugging
- Error handling
- Email HTML template
- Supabase integrácia

---

## 🎉 HOTOVO!

Váš password reset systém je plne funkčný a pripravený na produkciu.

Pre detaily viď: **PASSWORD_RESET_GUIDE.md**
