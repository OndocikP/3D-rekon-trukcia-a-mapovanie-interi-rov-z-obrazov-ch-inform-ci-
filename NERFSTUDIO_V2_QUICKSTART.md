# 🚀 Nerfstudio Viewer V2 - Quick Start

## 30-sekundový setup

### Krok 1: Spustite Nerfstudio

```bash
# Terminal 1: Nerfstudio Server
cd C:\Users\papo1\nerfstudio\nerfstudio
conda activate nerfstudio

# S obázkami
ns-train nerfacto \
  --data D:\GitHub\3D-rekon-trukcia-...\Back-end\files\9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4\10ac4e35-6779-4a5b-93de-82792c02df22 \
  --output-dir D:\nerfstudio-output\test \
  --pipeline.model.predict-normals True
```

**Alebo s už natrénovaným modelom:**

```bash
ns-viewer --load-config D:\nerfstudio-output\test\nerfacto\2024-05-23_120000\config.yml
```

### Krok 2: Spustite Aplikáciu

```bash
# Terminal 2: React App
cd Front-and
npm run web
# alebo
npm start
```

### Krok 3: Otvorte V2 Viewer

Prejdite na:
```
http://localhost:8085/project-V2/5a7
```

## ✅ Čo by ste mali vidieť

1. **Nerfstudio UI** - Loading screen
2. **3D Model** - Interaktívny viewer
3. **Tlačidlá** - Download, Back to V1, Main

## 🔧 Porty

| Servis | Port | URL |
|--------|------|-----|
| React App | 8085 | http://localhost:8085 |
| Nerfstudio HTTP | 7007 | http://localhost:7007 |
| Nerfstudio WebSocket | 7008 | ws://localhost:7008 |

## ⚠️ Čo Robiť Ak Nefunguje

### Chyba: "Server nie je dostupný"

✅ **Riešenie:**
```bash
# Skúste URL priamo v prehliadači
http://localhost:7007

# Ak sa nedá otvoriť, server nie je spustený
# Spustite príkaz z Kroku 1
```

### Chyba: "Port je obsadený"

```bash
# Windows - Nájdite proces
netstat -ano | findstr :7007

# Zabite proces
taskkill /PID <PID> /F

# alebo použite iný port
ns-train nerfacto ... --viewer.http-port 7009
```

### Aplikácia sa nenačítava

```bash
# Skúste vymazať node_modules a npm cache
cd Front-and
rm -r node_modules
npm install
npm run web
```

## 📊 Monitorovanie

### Konzola Logov

```javascript
// Frontend Logy
console.log('[NERFSTUDIO V2] ...')

// Backend Logy
print('[NERFSTUDIO] ...')
```

### Nerfstudio Debug

```bash
# Verbose logging
ns-train nerfacto --data ... -vv

# Specific verbosity
ns-viewer --load-config ... --debug
```

## 🎯 Testovacia Sekvencia

```
1. Spustite Nerfstudio server
   ↓
2. Počkajte ~1-2 minúty na training
   ↓
3. Otvorte http://localhost:7007 v prehliadači
   ↓ (Mali by ste vidieť Nerfstudio viewer)
   ↓
4. Spustite React App
   ↓
5. Otvorte http://localhost:8085/project-V2/5a7
   ↓ (Mali by ste vidieť to isté ako v kroku 3)
   ↓
6. ✅ Hotovo!
```

## 📝 Ďalšie Príkazy

### Spustenie bez autoplay

```bash
ns-train nerfacto ... --viewer.default-render-tab-idx 0
```

### Zvýšenie kvality renderingu

```bash
ns-train nerfacto ... \
  --pipeline.model.num-coarse-samples 64 \
  --pipeline.model.num-importance-samples 128
```

### Uloženie konfigurácie

```bash
# Config sa automaticky uloží v:
# <output-dir>/nerfacto/YYYY-MM-DD_HHMMSS/config.yml
```

## 🔗 Užitočné Odkazy

- [Nerfstudio Docs](https://docs.nerf.studio/)
- [Viewer Quickstart](https://docs.nerf.studio/quickstart/viewer_quickstart.html)
- [NERFSTUDIO_VIEWER_V2.md](./NERFSTUDIO_VIEWER_V2.md) - Úplná dokumentácia

## 💡 Tipy a Triky

### 1. Viacero Treningov Paralelne

```bash
# Terminal 1: Training 1
ns-train nerfacto --data images1 --viewer.http-port 7007

# Terminal 2: Training 2
ns-train nerfacto --data images2 --viewer.http-port 7009

# Potom v aplikácii změnte hardcoded port v NerfstudioViewer.tsx
```

### 2. Zdieľaný Viewer URL

```bash
ns-train nerfacto ... --viewer.make-share-url True
# Vygeneruje verejný URL pre zdieľanie
```

### 3. Kamera Spálenie

V Nerfstudio UI:
1. Kliknite "Camera"
2. Vytvorte Spline
3. Export Video

### 4. Výkon Optimizácia

```bash
# Menší model
ns-train nerfacto ... --pipeline.num-nerf-samples 1024

# Rýchlejší training
ns-train nerfacto ... --max-num-iterations 5000
```

## 📞 Support

Ak narazíte na problémy:

1. Skúste QUICK START od začiatku
2. Skontrolujte Porty (7007, 7008, 8085)
3. Čítajte Logy v Konzole
4. Pozrite si [NERFSTUDIO_VIEWER_V2.md](./NERFSTUDIO_VIEWER_V2.md)
5. Pozrite si [Nerfstudio Issues](https://github.com/nerfstudio-project/nerfstudio/issues)

---

**Verzia:** 1.0  
**Posledný Update:** 2026-05-23  
**Status:** ✅ Ready to Use
