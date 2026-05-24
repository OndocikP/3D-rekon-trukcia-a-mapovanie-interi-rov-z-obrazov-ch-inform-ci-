# Nerfstudio Viewer V2 Integration

## Popis

V2 viewer projektu teraz integruje **Nerfstudio Viewer** na zobrazenie NeRF modelov v reálnom čase.

## Ako to funguje

1. **Aplikácia** → otvorí iframe/WebView na `http://localhost:7007`
2. **Nerfstudio Server** → beží lokálne a načítava NeRF model
3. **Browser** → zobrazuje interaktívny 3D viewer

## Spustenie Nerfstudio Servera

### Predpoklady

- Nerfstudio nainštalované
- Natrénovaný NeRF model alebo obrázky na trénovanie

### Priama integrácia s training skriptom

Nerfstudio viewer sa **automaticky spúšťa** počas tréningu:

```bash
cd <nerfstudio-path>
conda activate nerfstudio
ns-train nerfacto \
  --data <path-to-images> \
  --output-dir <output-path> \
  --pipeline.model.predict-normals True
```

Viewer sa automaticky spustí na portu **7007** a **7008** (WebSocket).

### Spustenie Vieweru bez Tréningu

Ak máte už natrénovaný model:

```bash
cd <nerfstudio-path>
conda activate nerfstudio
ns-viewer --load-config <path-to-config>/config.yml
```

### Priame spustenie na správnom porte

```bash
ns-viewer --load-config <path-to-config> \
  --viewer.websocket-port 7008 \
  --viewer.http-port 7007
```

## Konfigurácia

### Frontend (React Native)

NerfstudioViewer komponentu je už zaintegovaná v:
- **[Front-and/app/project-V2/[id].tsx](Front-and/app/project-V2/[id].tsx)** - Automaticky sa používa namiesto MediaVieweru

### Backend (Python)

Projekt ID sa **automaticky** extrauje z URL:
```
/project-V2/5a7  →  projektId = "5a7"
```

## Vývojová Prostredí

### Lokálny Vývoj

1. **Spustite Nerfstudio server:**
```bash
cd /path/to/nerfstudio
ns-train nerfacto --data /path/to/images
```

2. **Spustite React aplikáciu:**
```bash
cd Front-end
npm start
# alebo pre web
npm run web
```

3. **Prejdite na stránku:**
```
http://localhost:8085/project-V2/5a7
```

### Produkcia

Na produkcii budete potrebovať:
- Spustený Nerfstudio server na produkcii
- Proxy/reverse proxy na `/viewer` path na aplikačnom serveri

## Dostupné Tlačidlá v V2

- **Download** - Stiahne 3D model v ZIP
- **Back to V1** - Vráti sa na pôvodnú verziu
- **Main** - Návrat na domovskú stránku

## Fikúlnosti a Obmedzenia

### ✅ Čo Funguje

- Interaktívny 3D viewer z Nerfstudio
- Real-time rendering
- Automatická rotácia
- Zoom a Pan
- Kamera kontrola

### ⚠️ Obmedzenia

- Server musí bežať na `localhost:7007`
- Iba webová verzia (nie mobile app)
- Vyžaduje aktívne Nerfstudio spustenie
- WebSocket na porte 7008

### 🔄 Fallback

Ak Nerfstudio server nie je dostupný:
- Zobrazí sa chybová správa
- Možnosť opätovného pokusu
- Tlačidlo "Skúsiť znova"

## Troubleshooting

### Server nie je dostupný

```
❌ Error: Server nie je dostupný
```

**Riešenie:**
```bash
# Skontrolujte, či je Nerfstudio spustený
ps aux | grep ns-train
ps aux | grep ns-viewer

# Skúste reštartovať server
cd <nerfstudio-path>
ns-train nerfacto --data <path-to-images>
```

### CORS chyby

Ak vidíte CORS chyby, editujte Nerfstudio config:
```python
# Ak je potrebné, môžete upraviť CORS v Nerfstudio source
```

### Port je obsadený

```bash
# Nájdite proces na porte 7007
lsof -i :7007

# Zabite proces a reštartujte
kill -9 <PID>
```

## API Integracia

### Automatické Prepojenie

Viewer automaticky prečítava:
- `projectId` z URL (`/project-V2/:id`)
- `token` z AuthContext
- Información z Supabase

### Nová URL Štruktúra

```
/project/:id          → Pôvodný V1 viewer
/project-V2/:id       → Nový V2 Nerfstudio viewer
/project/project_it   → Info stránka V1
/project-V2/project_it → Info stránka V2
```

## Ďalšie Možnosti Rozšírenia

- [ ] Export videa priamo z Vieweru
- [ ] Kamera trajektórie
- [ ] Rendering nastavenia (rozlíšenie, FPS)
- [ ] Zdieľaný URL (Nerfstudio feature)
- [ ] Multi-view porovnanie
- [ ] Animované kamere cesty

## Referencie

- [Nerfstudio Dokumentácia](https://docs.nerf.studio/)
- [Nerfstudio Viewer Quickstart](https://docs.nerf.studio/quickstart/viewer_quickstart.html)
- [WebSocket API](https://docs.nerf.studio/developer_guides/viewer/index.html)

---

**Vytvorené:** 2026-05-23  
**Verzia:** 1.0  
**Status:** Vývojová
