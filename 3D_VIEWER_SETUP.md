# 3D Model Viewer - Implementácia a Testovanie

## ✅ Čo Bolo Urobené

### Backend (`Back-end/routers/projects.py`)

1. **Endpoint: `GET /api/projects/{project_id}/3d-model`**
   - Skontroluje či existuje `model.ply` v priečinku `3Dmodel`
   - Vracia:
     ```json
     { "exists": true, "filename": "model.ply", "size": 123456, "url": "/api/projects/{id}/3d-model/download" }
     ```

2. **Endpoint: `GET /api/projects/{project_id}/3d-model/download`**
   - Stiahne PLY model
   - Akceptuje token v query params: `?token={token}`
   - Vracia binárny PLY súbor

### Frontend (`Front-and/`)

1. **Komponent: `src/components/ThreeDViewer.tsx`**
   - WebView komponent s three.js
   - Načítava PLY súbor z backendu
   - Funkcionalita:
     - 🖱️ Otáčanie: Ľavé tlačidlo myši + pohyb
     - 🔍 Zväčšovanie: Koliesko myši
     - ↔️ Posúvanie: Pravé tlačidlo + pohyb
     - Auto-rotácia
     - Osvetlenie

2. **API Funkcií: `src/api/client.ts`**
   - `check3DModel()` - Skontroluj či existuje model
   - `get3DModelUrl()` - Vrá URL na stiahnutie

3. **Komponent: `app/project/[id].tsx`**
   - Ak existuje model → Zobrazuj ThreeDViewer
   - Ak neexistuje model → Zobrazuj fotku

## 📁 Štruktúra Súborov

```
Back-end/routers/projects/
├── {user_id}/
│   └── {project_id}/
│       ├── images/
│       │   ├── photo1.jpg
│       │   ├── photo2.jpg
│       │   └── photo3.jpg
│       └── 3Dmodel/          ← 3D Model tu!
│           └── model.ply     ← Sem nahraj model.ply
```

**Príklad plnej cesty:**
```
Back-end/routers/projects/5f82da58-b51c-4fc9-8475-b94ede0fceaf/88102370-d1a0-4321-ab38-0790df9b92cb/3Dmodel/model.ply
```

## 🧪 Ako Testovať

### 1. Spustenie

```bash
# Docker je už spustený
docker-compose up -d
```

### 2. Prihlásenie sa v Apke

- Otvri app na mobil/web
- Prihlás sa ako `admin` / `admin123`

### 3. Otvri Projekt s Modelom

```
http://localhost:8081/project/88102370-d1a0-4321-ab38-0790df9b92cb
```

Alebo cez app UI:
1. Klikni na projekt
2. Aplikácia skontroluje 3D model
3. Ak existuje → Zobrazí sa 3D Viewer
4. Ak neexistuje → Zobrazí sa fotka

### 4. Interakcia s 3D Modelom

- **Otáčaj**: Stlač ľavé tlačidlo myši a pohybuj
- **Zväčšuj**: Otáčaj koliesko myši
- **Posúvaj kamerou**: Pravé tlačidlo myši + pohyb

## 🔍 DEBUG - Backend Logy

```bash
# Sleduj backend logy
docker logs rekon_backend -f
```

Hľadaj logy:
```
🔍 CHECK 3D MODEL - Project: 88102370-d1a0-...
   Cesta: /app/routers/projects/.../3Dmodel
   DB image_count: 2
   ✓ Nájdené obrázky: 2
   ✓ 3D Model nájdený! Veľkosť: 523456 bytes

📥 DOWNLOAD 3D MODEL - Project: 88102370-d1a0-...
   ✓ Odesielam: /app/routers/projects/.../model.ply
```

## 🔐 Bezpečnosť

- Token je šifrovaný v requestoch
- Model je dostupný iba pre majiteľa projektu
- Path traversal útoky sú chránené

## 📊 API Responses

### Check Model (GET /api/projects/{id}/3d-model)

**🟢 Keď existuje:**
```json
{
  "exists": true,
  "filename": "model.ply",
  "size": 523456,
  "url": "/api/projects/88102370-d1a0-4321-ab38-0790df9b92cb/3d-model/download"
}
```

**🔴 Keď neexistuje:**
```json
{
  "exists": false
}
```

### Download Model (GET /api/projects/{id}/3d-model/download?token={token})

- Status: `200 OK`
- Content-Type: `application/octet-stream`
- Body: Binárne dáta PLY súboru

## ⚙️ Konfigurácia

Všetky cesty sú relatívne k:
```
PROJECTS_DIR = Path(__file__).parent / "projects"  # Back-end/routers/projects
```

Zmena by si bola možná v `Back-end/routers/projects.py` v line 20.

## 🚀 Ďalšie Rozšírenia

- [ ] Vymažeme 3D model z projektu
- [ ] Multiple 3D models per project
- [ ] 3D model preview bez authentication
- [ ] Konverzia iných formátov (OBJ, STL, GLTF)
- [ ] Progres uploadovania модела
- [ ] Kompresie PLY súborov

## 🐛 Troubleshooting

| Problém | Riešenie |
|---------|---------|
| "3D Model nenájdený" | Skontroluj cestu: `Back-end/routers/projects/{user_id}/{project_id}/3Dmodel/model.ply` |
| "Not Found" pri download | Projekt neexistuje alebo nie si owner |
| Biely screen v WebView | Skontroluj Console v DevTools, hľadaj chyby |
| Model sa neotáča | Skontroluj 3D viewer logy v console |

## 📝 Kód v GitHub

```typescript
// Kontrola 3D modelu
const response = await apiClient.check3DModel(projectId, token);
if (response.data?.exists) {
  // Zobraz ThreeDViewer
}
```

```typescript
// Komponenta
<ThreeDViewer
  modelUrl={apiClient.get3DModelUrl(id, token)}
  token={token}
  width={500}
  height={500}
/>
```
