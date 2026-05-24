# Nerfstudio Viewer V2 - Implementácia Zhrnutie

## ✅ Čo Bolo Vytvorené

### 1. Frontend Komponenty

#### 📄 [src/components/NerfstudioViewer.tsx](../Front-and/src/components/NerfstudioViewer.tsx)
- Základní komponenta pre Nerfstudio viewer
- Detekcia platformy (Web vs Mobile)
- Testovanie Connection k Nerfstudio serveru
- Error handling a loading stavy

#### 📄 [src/components/NerfstudioViewer.web.tsx](../Front-and/src/components/NerfstudioViewer.web.tsx)
- Webová verzia s iframe
- Automatické refrešovanie pri nedostupnosti serveru
- Tlačidlo "Skúsiť znova"
- Sandbox bezpečnosť

### 2. Stránky

#### 📄 [app/project-V2/[id].tsx](../Front-and/app/project-V2/[id].tsx)
- Nový V2 viewer s Nerfstudio integracijou
- Zamení MediaViewer za NerfstudioViewer
- Zachová všetky funkcie (Download, Back to V1, Main)
- "V2" značka v hlavičke

#### 📄 [app/project/[id].tsx](../Front-and/app/project/[id].tsx)
- Pridané tlačidlo "Viewer V2"
- Presmerovanie na `/project-V2/{id}`

#### 📄 [app/project-V2/project_it.tsx](../Front-and/app/project-V2/project_it.tsx)
- Informačná stránka pre V2
- Popis V2 vylepšení

#### 📄 [app/project/project_it.tsx](../Front-and/app/project/project_it.tsx)
- Informačná stránka V1
- Tutoriál a pomocník

### 3. Dokumentácia

#### 📄 [NERFSTUDIO_VIEWER_V2.md](./NERFSTUDIO_VIEWER_V2.md)
- Úplná technická dokumentácia
- Nastavenie a konfigurácia
- Troubleshooting

#### 📄 [NERFSTUDIO_V2_QUICKSTART.md](./NERFSTUDIO_V2_QUICKSTART.md)
- Rýchly start v 30 sekúndach
- Príkazové linky
- Testovacia sekvencia

## 🔄 Ako To Funguje

```
┌─────────────────────────────────────┐
│   React App (8085)                  │
│   /project-V2/[id]                  │
└──────────────┬──────────────────────┘
               │
               ├─ NerfstudioViewer Component
               │  
               ├─ Testuje Connection
               │  
               └─ Načítava HTTP iframe
                  
                  ┌───────────────────────────────┐
                  │  Nerfstudio Server (7007)     │
                  │  http://localhost:7007        │
                  │                               │
                  │  - Výstup: iframe HTML       │
                  │  - WebSocket: ws://7008      │
                  └───────────────────────────────┘
```

## 📍 URL Štruktúra

```
http://localhost:8085/project/5a7
├─ V1 Viewer (s MediaViewer - 3D PLY model)
├─ Tlačidlo: "Viewer V2" → /project-V2/5a7
└─ Tlačidlá: Edit, Download, Main

http://localhost:8085/project-V2/5a7
├─ V2 Viewer (s NerfstudioViewer - NeRF)
├─ Tlačidlo: "Back to V1" → /project/5a7
└─ Tlačidlá: Download, Main

http://localhost:8085/project/project_it
└─ Info V1

http://localhost:8085/project-V2/project_it
└─ Info V2
```

## 🚀 Spustenie

### 1. Backend - Nerfstudio Server

```bash
cd Back-end
py main-generator.py
# alebo
ns-train nerfacto --data <images> --output-dir <output>
```

Server sa **automaticky** spustí na portu **7007** s WebSocket na **7008**.

### 2. Frontend - React App

```bash
cd Front-and
npm run web
```

Otvorte v prehliadači: `http://localhost:8085/project-V2/5a7`

## 🔌 Porty

| Port | Servis | URL |
|------|--------|-----|
| 8085 | React App | http://localhost:8085 |
| 7007 | Nerfstudio HTTP | http://localhost:7007 |
| 7008 | Nerfstudio WebSocket | ws://localhost:7008 |

## 📊 Porovnanie V1 vs V2

| Feature | V1 (MediaViewer) | V2 (NerfstudioViewer) |
|---------|------------------|----------------------|
| Zobrazenie | PLY Point Cloud | NeRF Ray-tracing |
| Interaktivita | OrbitControls | Nerfstudio UI |
| Real-time | ✓ (okamžité) | ✓ (live) |
| Kvalita | Statická | Dynamická |
| Kontrola | 3D Camera | Plný UI |
| Mobile | ✓ | ⚠️ (iframe fallback) |
| Server | Nie potrebný | Potrebný (7007) |

## 🔧 Konfigurácia

### Zmena Portu

V súbore `NerfstudioViewer.web.tsx`:

```typescript
const NERFSTUDIO_URL = 'http://localhost:7007';  // ← Zmeniť na 7009 ak je potrebné
const NERFSTUDIO_WS_URL = 'ws://localhost:7008';  // ← WebSocket port
```

### Produkcná Nasadenie

Na produkcii budete potrebovať:

1. **Reverse Proxy** - Presmerovanie `/nerfstudio-viewer` → `http://localhost:7007`
2. **Docker Setup** - Nerfstudio v kontajneri
3. **SSL/TLS** - Pre HTTPS

Príklad Nginx:
```nginx
location /nerfstudio-viewer/ {
    proxy_pass http://localhost:7007/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## 🐛 Debug Mód

### Frontend

```typescript
// V NerfstudioViewer.tsx/web.tsx
console.log(`[NERFSTUDIO V2] Debug log...`);
```

### Backend

```python
# V main.py alebo main-generator.py
print("[NERFSTUDIO] Debug log...")
```

## 📈 Performance

### Optimizácie

1. **Iframe Caching** - Viewer sa cachuje po prvom načítaní
2. **Connection Test** - Pred fetchingom sa testuje server
3. **Lazy Loading** - Viewer sa načítava iba ak je viditeľný
4. **Error Handling** - Fallback ak je server nedostupný

### Monitorovanie

```bash
# Nerfstudio performance
ns-train nerfacto ... -vv  # Verbose output
```

## 🔐 Bezpečnosť

- ✅ Iframe Sandbox
- ✅ CORS Policy
- ✅ Token Auth (Supabase)
- ✅ Lokálny Server (nie verejný)

## 🎓 Ďalšie Učenie

- [Nerfstudio API](https://docs.nerf.studio/reference/api/index.html)
- [WebSocket Integration](https://docs.nerf.studio/developer_guides/viewer/index.html)
- [React Native Web](https://necolas.github.io/react-native-web/)

## 📝 Súbory Zmenené/Vytvorené

```
✅ CREATED:
  - src/components/NerfstudioViewer.tsx
  - src/components/NerfstudioViewer.web.tsx
  - app/project-V2/[id].tsx
  - app/project-V2/project_it.tsx
  - app/project/project_it.tsx
  - NERFSTUDIO_VIEWER_V2.md
  - NERFSTUDIO_V2_QUICKSTART.md

✏️ MODIFIED:
  - app/project/[id].tsx (pridané tlačidlo "Viewer V2")
```

## ✨ Budúce Rozšírenia

- [ ] Export videa priamo z V2
- [ ] Kamera trajektórie editor
- [ ] Porovnanie V1 a V2 side-by-side
- [ ] Export 3D modelov v rôznych formátoch
- [ ] Kolaboratívne prehliadanie
- [ ] A.I. objekto detekcia

---

**Verzia:** 1.0  
**Status:** ✅ Hotovo a Testované  
**Dátum:** 2026-05-23
