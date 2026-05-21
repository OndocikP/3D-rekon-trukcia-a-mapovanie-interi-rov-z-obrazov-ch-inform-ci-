# 🏗️ SYSTÉM FLOW - 3D REKONŠTRUKCIA Z OBRÁZKOV

## 📋 Prehľad architektúry

```
FRONTEND (React Native/Expo)
       ↓
BACKEND API (FastAPI - main.py)
       ↓
SUPABASE (databáza, autentifikácia)
       ↓
WORKER PROCESS (get_oldest_pending_project.py)
       ↓
NERFSTUDIO (3D model generation)
```

---

## 🎯 KROK PO KROKU PROCES

### **1️⃣ FRONTEND - Vytvorenie projektu a nahrávanie obrázkov**

**Súbor:** `Front-and/app/project/new.tsx`

```
UŽÍVATEĽ INTERAKCIA:
1. Užívateľ zadá: 
   - Meno projektu (napríklad: "Obývačka")
   - Popis (voliteľne)
   - Vyberie fotky z galerie (max 12 obrázkov)

2. Klikne "Vytvor projekt" → volá API:
   
   POST /api/projects/create/{user_id}
   {
     "name": "Obývačka",
     "description": "Interiér s nábytkom"
   }
   Header: Authorization: Bearer {token}

3. Backend vráti:
   {
     "id": "142e3d9d-5bf4...",
     "name": "Obývačka",
     "status": "pending",
     "images_path": ".../projects/user_id/project_id/images"
   }

4. Frontend nahrá obrázky postupne:
   
   FOR EACH obrázok:
     POST /api/projects/{project_id}/upload-image
     {
       "file": <binary>
     }
     Header: Authorization: Bearer {token}

5. Backend pre každý obrázok:
   ✓ Uloží do: projects/user_id/project_id/images/
   ✓ Spočíta všetky obrázky
   ✓ Aktualizuje Supabase: photos_count += 1

6. Keď sú všetky obrázky nahrané:
   ✓ Frontend presmeruje na detail projektu: /project/{project_id}
   ✓ Projekt sa teraz nachádza v Supabase s statusom "pending"
```

---

### **2️⃣ BACKEND API - Spracovanie requestov**

**Súbor:** `Back-end/main.py`

```
BACKEND ENDPOINTY:

A) POST /api/projects/create/{user_id}
   ├─ Kontrola tokenu
   ├─ RPC volanie: create_project() v Supabase
   ├─ Vytvorenie priečinkkovej štruktúry:
   │  └─ projects/
   │     └─ {user_id}/
   │        └─ {project_id}/
   │           └─ images/  ← sem sa ukladajú fotky
   └─ Vrátenie project details

B) POST /api/projects/{project_id}/upload-image
   ├─ Kontrola tokenu
   ├─ Nájdenie priečinka images pre projekt
   ├─ Uloženie binárneho súboru:
   │  └─ projects/user_id/project_id/images/{filename}
   ├─ Spočítanie všetkých obrázkov v priečinku
   ├─ UPDATE Supabase: projects.photos_count
   └─ Vrátenie metadát obrázku

C) GET /api/projects/{project_id}/info
   ├─ Načítanie info z Supabase
   ├─ Vrátenie: id, name, status, photos_count, objects, created_at
   └─ Frontend zobrazí na detaily stránke

D) GET /api/projects/{project_id}/3d-model
   ├─ Vyhľadávanie PLY súboru v: projects/user_id/project_id/3Dmodel/
   ├─ Ak existuje → vrátenie ako FileResponse
   └─ Frontend zobrazi 3D model viewer
```

**SUPABASE TABUĽKA (projects):**
```
id              UUID (primary key)
owner_id        UUID (user ID)
name            TEXT
description     TEXT
status          TEXT (pending/processing/training/generated/error)
photos_count    INT (počet nahraných obrázkov)
objects         TEXT (detekované objekty: "Bed 1-3, Chair 1-5")
created_at      TIMESTAMP
updated_at      TIMESTAMP
try             INT (počet pokusov pri chybe)
```

---

### **3️⃣ WORKER PROCESS - Generovanie 3D modelov**

**Súbor:** `Back-end/get_oldest_pending_project.py`

```
WORKER LOOP (spúšťa sa periodicky, napríklad každých 5 minút):

1. NÁJDI PROJEKT NA SPRACOVANIE:
   ├─ Query Supabase: SELECT * WHERE status = "pending" ORDER BY created_at
   ├─ Vyberie NAJSTARŠÍ projekt so statusom "pending"
   └─ Získa: project_id, owner_id, cesta k obrázkom

2. DETEKCIA OBJEKTOV (YOLO):
   ├─ Spustí: ultralytics YOLO v8l model
   ├─ Spracuje všetky obrázky v batch-och:
   │  └─ projects/user_id/project_id/images/
   ├─ Detekuje objekty (Bed, Chair, Table, atď.)
   ├─ Filtruje: len objekty s min 2 výskytmi
   ├─ Formátuje: "Bed 1-3, Chair 1-5, Table 1-2"
   ├─ UPDATE Supabase: projects.objects = "Bed 1-3, Chair 1-5"
   └─ Zobrazenie: "Nájdené 45 objektov, 8 unikátnych tried"

3. 3D MODEL GENERATION (NERFSTUDIO) - 3 KROKY:

   STEP 1: ns-process-data
   ├─ Input:  projects/user_id/project_id/images/
   ├─ Proces: Spracovanie obrázkov (COLMAP - SfM)
   ├─ Output: projects/user_id/project_id/processed/step1/
   │          (transforms.json, images.json, etc.)
   ├─ Čas:    ~30 minút
   └─ Status: UPDATE "processing"

   STEP 2: ns-train nerfacto (s normálami)
   ├─ Input:  processed/step1/
   ├─ Proces: Tréňovanie NeRF modelu s predict-normals=True
   ├─ Output: processed/step2/nerfacto/
   │          ├─ config.yml        ← kľúčový súbor
   │          ├─ step-000029999.ckpt ← trained weights
   │          └─ events/           ← training logs
   ├─ Čas:    ~60 minút
   ├─ Čítanie: Proces hľadá "Training Finished" v output
   ├─ Akcia:  Keď sa nájde → terminate proces
   └─ Status: UPDATE "training"

   STEP 3: ns-export pointcloud (s Open3D normálami)
   ├─ Input:  config.yml z Step 2
   ├─ Proces: Hľadá config.yml rekurzívne v step2 priečinku
   │          (ak nie je na štandardnej ceste)
   ├─ Vypočet: Generuje PointCloud z NeRF modelu
   ├─ Normals: Počíta sa pomocou --normal-method=open3d
   ├─ Output: projects/user_id/project_id/3Dmodel/
   │          └─ model.ply ← finálny 3D model!
   ├─ Čas:    ~5-10 minút
   └─ Status: UPDATE "generated"

4. AKTUALIZÁCIA DATABÁZY:
   ├─ Ak SUCCESS:
   │  ├─ UPDATE projects SET status = "generated"
   │  └─ Model je teraz dostupný
   ├─ Ak CHYBA:
   │  ├─ INCREMENT projects.try (pokus++)
   │  ├─ UPDATE status = "pending" (skúsi znova)
   │  ├─ Logovanie chyby
   │  └─ Ak try > max_attempts → status = "error"

5. REPEAT:
   └─ Worker pokračuje v hľadaní ďalších "pending" projektov
```

---

## 🔄 KOMPLEXNÝ PRÍKLAD - Užívateľ nahráva fotky

```
ČASOVÁ OS:

T=0min:
┌─ Frontend (USER)
├─ "Vytvor projekt: Kitchen"
├─ Vyberie 20 obrázkov
└─ Klikne GENERATE

T=0:30min:
└─ Backend (main.py)
   ├─ ✅ Projekt vytvorený (ID: abc123, status: pending)
   ├─ ✅ 20 obrázkov uploadnutých
   └─ 🔄 Projekt čaká na spracovanie

T=5min (Worker spúšťa sa):
├─ get_oldest_pending_project.py
├─ 🔍 Hľadá: SELECT * FROM projects WHERE status='pending'
├─ 📌 Nájde: Kitchen projekt (najstarší pending)
└─ 🚀 Počína spracovanie

T=5:10min:
├─ 🤖 YOLO detekcia
├─ 👀 Skenuje 20 obrázkov
├─ 📊 Nájde: Bed (5x), Chair (3x), Table (4x), Light (2x)
├─ 💾 UPDATE Supabase: objects = "Bed 1-5, Chair 1-3, Light 1-2, Table 1-4"
└─ ✅ YOLO hotovo

T=5:15min - T=35:15min:
├─ 🏗️ NERFSTUDIO STEP 1 (ns-process-data - 30 min)
├─ Input:  projects/user/abc123/images/ (20 obrázkov)
├─ Proces: COLMAP - vytvorenie 3D bodov
├─ Output: projects/user/abc123/processed/step1/
├─ 📈 Progress: Loading, matching, triangulating...
└─ ✅ Step 1 hotovo

T=35:20min - T=95:20min:
├─ 🧠 NERFSTUDIO STEP 2 (ns-train - 60 min)
├─ Input:  processed/step1/ (SfM dáta)
├─ Proces: NeRF model training s normálami
├─ 📊 Loss: 0.045 → 0.023 → 0.018...
├─ 🔄 Iterácia: epoch 1 → 100... → 1000... → 29999
├─ ⏰ Worker monitor: Čítá output riadok po riadku
├─ 🎯 Hľadá: "Training Finished"
├─ ✅ Nájde na iterácii 29999 (Step 2 ~50 min)
├─ 🛑 TERMINATE proces (graceful shutdown)
├─ OUTPUT: config.yml, checkpoints, nerfstudio_models/
└─ ✅ Step 2 hotovo

T=95:30min - T=100:30min:
├─ 💾 NERFSTUDIO STEP 3 (ns-export - 10 min)
├─ 🔍 Hľadá: config.yml v processed/step2/
├─ 📄 Nájde: processed/step2/nerfacto/2026-05-19_173620/config.yml
├─ 🔧 Export: PointCloud z NeRF
├─ 📐 Normals: Open3D výpočet (lebo model nemá predict-normals)
├─ 💾 Vygeneruje: projects/user/abc123/3Dmodel/model.ply
└─ ✅ Step 3 hotovo

T=100:35min:
├─ ✅ Update Supabase: status = "generated"
├─ 📍 Cesta k modelu: 3Dmodel/model.ply
└─ Frontend automaticky obnoví detail a zobrazí 3D model!

T=100:40min:
└─ Frontend (USER)
   ├─ Vidí: "Model úspešne vygenerovaný!"
   ├─ 👁️ Zobrazí: 3D viewer s Kitchen priestorom
   └─ 📊 Info: Detekované objekty: Bed, Chair, Table, Light
```

---

## 🔧 PRIEČINKOVÁ ŠTRUKTÚRA

```
projects/
├─ {user_id}/
│  └─ {project_id}/
│     ├─ images/                    ← Nahraté fotky
│     │  ├─ image-1.jpg
│     │  ├─ image-2.jpg
│     │  └─ ...
│     ├─ processed/
│     │  ├─ step1/                  ← ns-process-data output (SfM)
│     │  │  ├─ transforms.json
│     │  │  ├─ images.json
│     │  │  └─ colmap_model/
│     │  └─ step2/                  ← ns-train output (NeRF model)
│     │     ├─ nerfacto/
│     │     │  ├─ 2026-05-19_173620/
│     │     │  │  ├─ config.yml     ← KĽÚČOVÝ SÚBOR
│     │     │  │  ├─ nerfstudio_models/
│     │     │  │  │  └─ step-00029999.ckpt
│     │     │  │  └─ events/
│     │     │  └─ config.yml        ← ALT LOKÁCIA
│     │     └─ events/
│     └─ 3Dmodel/                   ← ns-export output
│        └─ model.ply               ← FINÁLNY 3D MODEL!
```

---

## 📡 API INTEGRÁCIA

### **Frontend volá Backend:**
```javascript
// 1. Vytvorenie projektu
POST /api/projects/create/{user_id}
{
  name: "Kitchen",
  description: "Kitchen interior"
}

// 2. Upload obrázkov (for each image)
POST /api/projects/{project_id}/upload-image
FormData: { file: <blob> }

// 3. Kontrola statusu
GET /api/projects/{project_id}/info
Response: { status: "processing", objects: "..." }

// 4. Stiahnutie 3D modelu
GET /api/projects/{project_id}/3d-model
Response: <PLY file binary>
```

### **Worker volá Supabase:**
```sql
-- Načítaj najstarší pending projekt
SELECT * FROM projects 
WHERE status = 'pending' 
ORDER BY created_at ASC 
LIMIT 1

-- Aktualizuj objekty
UPDATE projects 
SET objects = 'Bed 1-5, Chair 1-3' 
WHERE id = {project_id}

-- Aktualizuj status
UPDATE projects 
SET status = 'generated' 
WHERE id = {project_id}
```

---

## ⚠️ CHYBOVÉ SCENÁRE

```
SCENÁR 1: config.yml nie je nájdený
├─ Problém: ns-export hľadá config.yml na pevnej ceste
├─ Riešenie: find_config_yml() - hľadá rekurzívne v step2/
├─ Sort: Podľa modifikačného času (najnovší prvý)
└─ Result: Automaticky nájde config.yml kde kľvek

SCENÁR 2: Model nemá normals
├─ Problém: ns-export zlyha na "normals not found"
├─ Riešenie: --normal-method=open3d počíta normals z pointcloudu
├─ Čas: +5-10 minút na export
└─ Result: Model.ply s vypočítanými normálami

SCENÁR 3: Недостаточно памяти pri YOLO
├─ Problém: Spracovanie všetkých obrázkov naraz → Out of Memory
├─ Riešenie: Batch processing - max 15 obrázkov naraz
├─ Skip: Ak batch zlyha → continue s nasledujúcim
└─ Result: I keď jeden batch zlyha, ostatné sú spracované

SCENÁR 4: Training zlyha (hardware problém)
├─ Problem: ns-train proces zlyha pred "Training Finished"
├─ Riešenie: increment_project_try(project_id, try++)
├─ Retry: Projekt sa vráti na status "pending"
├─ Max: Ak try > 3 → status = "error"
└─ Result: Manuálna kontrola loggov, prípadne retry
```

---

## 🎯 KĽÚČOVÉ KOMPONENTY

| Komponent | Úloha | Čas |
|-----------|-------|-----|
| **main.py** | FastAPI backend, API endpointy | ~0ms |
| **get_oldest_pending_project.py** | Worker loop, orchestrácia | ~1s |
| **Yolo** | Detekcia objektov | ~5-10 min |
| **ns-process-data** | Spracovanie obrázkov (COLMAP) | ~30 min |
| **ns-train** | Tréňovanie NeRF modelu | ~60 min |
| **ns-export** | Export na PLY model | ~10 min |
| **Supabase** | Databáza, autentifikácia | ~100ms |
| **Frontend** | React Native UI, upload | ~1-5 min |

**CELKOVÝ ČAS:** ~110 minút (1 hodina 50 minút)

