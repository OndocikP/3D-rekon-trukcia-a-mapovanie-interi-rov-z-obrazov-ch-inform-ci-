# 📐 3D Model Generation Pipeline - Úplná Dokumentácia

## 🎯 Celkový Prehľad

Pipeline automaticky generuje 3D modely z obrazov. Proces prebieha v týchto krokoch:

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ QUERY SUPABASE                                           │
│    Nájdi najstarší projekt so statusom 'pending'            │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ YOLO DETEKCIA OBJEKTOV                                  │
│    Detekuj všetky objekty v obrazoch                        │
│    Výstup: "Bed 1-3, Chair 1-5, ..."                        │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ UĽOŽ OBJEKTY DO SUPABASE                                │
│    Aktualizuj project.objects v databáze                    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣ NERFSTUDIO 3D REKONŠTRUKCIA                             │
│    Step 1: ns-process-data (preprocesovanie obrazov)        │
│    Step 2: ns-train (trénuj NeRF model)                     │
│    Výstup: 3D model (PLY pointcloud)                        │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣ EXPORT PLY SÚBOR                                         │
│    Ulož 3D model do project_path/3Dmodel/model.ply          │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 6️⃣ AKTUALIZUJ PROJEKT V SUPABASE                            │
│    Zmeň status na 'completed'                               │
│    Ulož path k 3D modelu                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Krok 1: Query Supabase - Nájdi Najstarší Projekt

### Čo sa deje:

```python
def get_oldest_pending_project():
    """Nájdi najstarší projekt so statusom 'pending' v Supabase"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    response = supabase.table("projects") \
        .select("*") \
        .eq("status", "pending") \       # Filtruj len pending
        .order("created_at", desc=False) \  # Začni od najstaršieho
        .limit(1) \                      # Vrati len jeden
        .execute()
    
    return response.data[0]  # Vráť projekt
```

### Výstup:
```json
{
  "id": "142e3d9d-5bf4-473a-8c74-01f62423ad5e",
  "owner_id": "9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4",
  "name": "Living Room",
  "status": "pending",
  "created_at": "2026-05-14T10:00:00",
  "objects": null,  // ← Prázdne - musíme detekovať
  "model_path": null
}
```

### Takto vypada projekt v súborovom systéme:

```
PROJECTS_PATH/
└── 9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/  (owner_id)
    └── 142e3d9d-5bf4-473a-8c74-01f62423ad5e/  (project_id)
        ├── images/                           ← 356 jpg súborov
        │   ├── 0001.jpg
        │   ├── 0002.jpg
        │   └── ... (ďalších 354 súborov)
        └── 3Dmodel/                          ← Bude vytvorené
```

---

## 🎯 Krok 2: YOLO Detekcia Objektov

### Čo sa deje:

YOLO model prejde **VŠETKY obrázky** a detekuje všetky objekty. Počíta koľko objektov jednotlivých tried bolo detekovaných.

```python
def Yolo(image_files):
    """Detekuj objekty v obrazoch pomocou YOLO"""
    
    # 1. Načítaj YOLO model
    from ultralytics import YOLO
    model = YOLO("yolov8l.pt")  # 80 tried objektov (COCO dataset)
    
    # 2. Nájdi všetky obrázky
    image_files_list = [f for f in Path(image_files).iterdir() 
                        if f.suffix.lower() in {'.jpg', '.jpeg', '.png'}]
    # Výstup: [0001.jpg, 0002.jpg, ..., 0356.jpg]
    
    # 3. Spusti detekciu na všetkých obrazoch
    results = model.predict(
        source=str(image_files),
        conf=0.5,           # Confidence threshold 50%
        device="cpu",       # Spusti na CPU (ak nemáš GPU)
        stream=False        # Načítaj všetky výsledky
    )
    # Výstup: 356 výsledkov (jeden na obrázok)
    
    # 4. Počítaj objekty podľa triedy
    detected_counts = {}
    for result in results:
        for box in result.boxes:  # Každý box = jeden detekovaný objekt
            class_name = result.names[int(box.cls[0])]
            detected_counts[class_name] += 1
    
    # Výstup napr:
    # {"bed": 3, "chair": 5, "lamp": 2, "notebook": 2, "table": 1, "window": 1}
    
    # 5. Formatuj výstup
    return format_detected_objects(detected_counts)
    # Vráti: "Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1"
```

### Ako funguje YOLO detekcia podrobne:

1. **YOLO model** je neurónová sieť natrénovaná na 80 objektov (COCO dataset)
   - Bed, Chair, Table, Window, Laptop, Laptop, atď.
   - Pre každý obrázok vracia: **[x, y, width, height, confidence, class_id]**

2. **Pre každý obrázok:**
   - YOLO vygeneruje N detekovaných boxov
   - Každý box má:
     - Pozíciu: (x, y, šírka, výška)
     - Confidence: 0-1 (ako istý si model)
     - Class: Trieda objektu (bed, chair, atď.)

3. **Filtrujeme:**
   - Berieme len objekty s confidence > 0.5 (50%)
   - Ostatné ignorujeme

4. **Počítame:**
   - Prejdeme všetky boxy zo všetkých obrázkov
   - Počítame koľko krát sa vyskytol každý objekt

### Príklad výstupu:

```
📷 Nájdené 356 obrázkov
🔧 Model: yolov8l.pt | Confidence: 0.5 | Device: cpu
⌛ Spúšťam detekciu...

✅ YOLO detekcia skončená!
   Nájdené objekty: Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1
```

---

## 💾 Krok 3: Ulož Objekty do Supabase

### Čo sa deje:

```python
# Aktualizuj projekt v Supabase
supabase.table("projects") \
    .update({"objects": "Bed 1-3, Chair 1-5, ..."}) \
    .eq("id", project_id) \
    .execute()

# Supabase teraz má:
# {
#   ...
#   "objects": "Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1"
#   ...
# }
```

**Príčina:** Keď reštartujeme skript, vieme že táto YOLO detekcia už bola urobená a netreba ju robiť znova.

---

## 🧠 Krok 4: Nerfstudio 3D Rekonštrukcia

### Čo je Nerfstudio?

Nerfstudio je framework na generovanie 3D modelov z 2D obrázkov pomocou **Neural Radiance Fields (NeRF)**.

### Ako funguje:

```
356 2D obrázkov
    ↓
[Fotograf sa pohybuje okolo objektu a fotografuje z rôznych uhlov]
    ↓
Nerfstudio analyzuje:
  - Kde je fotograf (kamera) pre každý obrázok
  - Ako sa obrázky prekrývajú
  - Hĺbku a geometriu scény
    ↓
Vytvorí 3D model (Neural Radiance Field)
    ↓
Model viem vyrenderovať z ľubovoľného uhla
    ↓
Export do PLY pointcloud formátu
    ↓
Model sa dá zobraziť v 3D vieweri
```

### Nerfstudio Pipeline - 2 kroky:

#### 🔧 Krok 4.1: ns-process-data (Preprocesovanie)

```bash
ns-process-data images \
  --data "D:\...\project\images" \
  --output-dir "D:\...\project\processed_images"
```

**Čo robí:**
1. Detekuje všetky fotografie v priečinku
2. Odhaduje pozíciu kamery pre každý obrázok (COLMAP algorithm)
3. Vytvára 3D bodový mrak z feature matchingu
4. Vytvára metadata souboru (intrinsics, extrinsics)

**Výstup:**
```
processed_images/
├── transforms.json       ← Kamera pozície a orientácia
├── images/
│   ├── 0001.jpg
│   ├── 0002.jpg
│   └── ...
└── ply_out/              ← COLMAP pointcloud
    └── points3D.ply
```

**Čas:** ~30 minút (pre 356 obrázkov)

#### 🎓 Krok 4.2: ns-train (Tréning NeRF modelu)

```bash
ns-train nerfacto \
  --data "D:\...\processed_images" \
  --output-dir "D:\...\model_output"
```

**Čo robí:**
1. Načítava preprocessované dáta
2. Trénuje Neural Radiance Field (neurónová sieť)
3. Sieť sa učí ako vyrenderovať každý pixel
4. Počas tréningu sa optimalizujú parametre kamery a geometria

**Training log:**
```
Step 1/30000: Loss=0.234
Step 100/30000: Loss=0.089
Step 500/30000: Loss=0.045
...
Step 30000/30000: Loss=0.0012 ✅ HOTOVO!
```

**Výstup:**
```
model_output/
└── nerfacto/
    ├── config.yml
    ├── cameras.json
    ├── nerfstudio_models/
    │   └── step-000030000.ckpt  ← Natrénovaný model
    └── renders/                  ← Preview obrázky
```

**Čas:** ~1 hodina (pre 356 obrázkov)

---

## 📤 Krok 5: Export do PLY Pointcloud

### Čo sa deje:

```bash
ns-export pointcloud \
  --load-config="model_output/nerfacto/config.yml" \
  --output-dir="3Dmodel" \
  --num-points=1000000
```

**Čo robí:**
1. Načítava natrénovaný NeRF model
2. Generates 3D body points (1 milión bodov)
3. Každý bod má:
   - XYZ pozíciu v priestore
   - RGB farbu (z originálnych obrázkov)
4. Exportuje do PLY formátu

**Výstup:**
```
project_path/3Dmodel/
└── model.ply  ← 3D model (1 milión bodov)
```

**Veľkosť súboru:** ~50-100 MB (závisí od počtu bodov)

---

## 🎨 Krok 6: Aktualizuj Projekt v Supabase

### Čo sa deje:

```python
supabase.table("projects") \
    .update({
        "status": "completed",
        "model_path": "s3://bucket/models/142e3d9d-5bf4-473a-8c74-01f62423ad5e.ply"
    }) \
    .eq("id", project_id) \
    .execute()
```

**Projekt je teraz:**
```json
{
  "id": "142e3d9d-5bf4-473a-8c74-01f62423ad5e",
  "owner_id": "9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4",
  "name": "Living Room",
  "status": "completed",  ← ✅ HOTOVO!
  "objects": "Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1",
  "model_path": "s3://bucket/models/model.ply"
}
```

---

## ⚙️ Ako sa to všetko spúšťa?

### Option 1: Manual Run (Testovanie)

```bash
cd Back-end
python get_oldest_pending_project.py
```

**Output:**
```
======================================================================
Supabase Query - Najstarší projekt so statusom 'pending'
======================================================================

📁 PROJECTS_PATH: D:\GitHub\...\Back-end\projects

✅ Nájdený projekt:

   ID:        142e3d9d-5bf4-473a-8c74-01f62423ad5e
   Owner ID:  9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4
   Meno:      Living Room
   Status:    pending
   Created:   2026-05-14T10:00:00
   Objects:   None

======================================================================
🎯 VÝSLEDOK:
   Owner ID:   9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4
   Project ID: 142e3d9d-5bf4-473a-8c74-01f62423ad5e
   Path:       D:\GitHub\...\Back-end\projects\9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4\142e3d9d-5bf4-473a-8c74-01f62423ad5e
======================================================================

🚀 Spúšťam YOLO detekciu...

⏳ YOLO spustená na: D:\GitHub\...\projects\9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4\142e3d9d-5bf4-473a-8c74-01f62423ad5e\images
   ⌛ Čakam na dokončenie detekcie objektov...

📷 Nájdené 356 obrázkov
🔧 Model: yolov8l.pt | Confidence: 0.5 | Device: cpu
⌛ Spúšťam detekciu...

✅ YOLO detekcia skončená!
   Nájdené objekty: Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1

💾 Ukladám výsledky do Supabase...
✅ Objekty úspešne uložené do Supabase!
   Objects: Bed 1-3, Chair 1-5, Lamp 1-2, Notebook 1-2, Table 1, Window 1

🚀 Spúšťam Nerfstudio rekonštrukciu...

[NERFSTUDIO] Running NeRF reconstruction on: D:\...\projects\...\images

   -> Step 1: Processing images with ns-process-data...
   ⌛ Čakam 30 minút...
   ✅ Preprocessované dáta hotové!

   -> Step 2: Training NeRF model with ns-train...
   ⌛ Čakam 60 minút...
   ✅ Model natrénovaný!

   -> Step 3: Exporting to PLY pointcloud...
   ✅ Export skončený!

✅ Projekt úspešne spracovaný!
```

### Option 2: Worker Loop (Automatizácia)

```python
# worker_client.py

while True:
    project = get_oldest_pending_project()
    
    if project:
        # YOLO detection
        objects = Yolo(project_path + "/images")
        
        # Nerfstudio
        success = run_nerfstudio_reconstruction(...)
        
        # Update Supabase
        if success:
            update_status_to_completed(project_id)
    
    time.sleep(60)  # Skontroluj každú minútu
```

---

## 📊 Časové odhady

| Operácia | Čas | Popis |
|----------|-----|-------|
| YOLO detekcia (356 obrázkov) | 5 - 10 minút | Detekcia na CPU |
| ns-process-data | 30 minút | COLMAP odhadovanie kamery |
| ns-train nerfacto | 60 minút | Tréning NeRF modelu |
| **CELKOM** | **~2 hodiny** | Jeden projekt |

---

## 📂 Finálna Štruktúra Projektu

Po spracovaní bude vyzerať takto:

```
projects/
└── 9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4/  (owner_id)
    └── 142e3d9d-5bf4-473a-8c74-01f62423ad5e/  (project_id)
        ├── images/                         ✅ 356 originálnych obrázkov
        │   ├── 0001.jpg
        │   ├── 0002.jpg
        │   └── ... (ďalších 354)
        │
        ├── processed_images/               ✅ Preprocessované dáta (COLMAP)
        │   ├── transforms.json
        │   ├── images/
        │   └── ply_out/
        │
        ├── model_output/                   ✅ Natrénovaný NeRF model
        │   └── nerfacto/
        │       ├── config.yml
        │       └── nerfstudio_models/
        │           └── step-000030000.ckpt
        │
        └── 3Dmodel/                        ✅ Finálny 3D model
            └── model.ply                   (1 milión bodov, ~80 MB)
```

---

## 🔗 Integrácia s Frontendom

### API Endpoint (FastAPI)

```python
@app.get("/api/projects/{user_id}/{project_id}/model")
async def get_3d_model(user_id: str, project_id: str):
    model_path = f"{PROJECTS_PATH}/{user_id}/{project_id}/3Dmodel/model.ply"
    
    if Path(model_path).exists():
        return FileResponse(model_path, media_type="application/octet-stream")
    else:
        return {"error": "Model not found"}
```

### Frontend (React/Expo)

```jsx
import { View3D } from "@react-three/fiber";

function ProjectDetail({ projectId, userId }) {
  const [model, setModel] = useState(null);
  
  useEffect(() => {
    fetch(`/api/projects/${userId}/${projectId}/model`)
      .then(res => res.arrayBuffer())
      .then(data => {
        // Parse PLY file
        // Display using Three.js renderer
        setModel(parsePLY(data));
      });
  }, [projectId]);
  
  return <View3D model={model} />;
}
```

---

## ✅ Checklist - Ako Vedieť Že Všetko Funguje

- [ ] **YOLO:** Detekcia objektov vracia formátovaný string (Bed 1-3, Chair 1-5, ...)
- [ ] **YOLO:** Objekty sú uložené v Supabase `projects.objects`
- [ ] **Nerfstudio Step 1:** `processed_images/` priečinok obsahuje `transforms.json`
- [ ] **Nerfstudio Step 2:** Model je natrénovaný (checkpoint súbor ~500 MB)
- [ ] **PLY Export:** `3Dmodel/model.ply` existuje (~80 MB)
- [ ] **Supabase:** Projekt má `status = "completed"`
- [ ] **Frontend:** 3D model sa zobrazuje v ns-viewer

---

## 🐛 Troubleshooting

### ❌ YOLO vracia `None`

**Príčiny:**
- Ultralytics nie je nainštalovaná: `pip install ultralytics`
- Priečinok images je prázdny alebo neexistuje
- Nedostatok RAM pamäte (CPU mode)

**Riešenie:**
```bash
pip install ultralytics
# Skús procesiť obrázky po batch-och (maximálne 20 obrázkov naraz)
```

### ❌ Nerfstudio: "ns-process-data command not found"

**Príčina:** Conda environment nie je aktivovaný

**Riešenie:**
```bash
conda activate nerfstudio
ns-process-data images --data ...
```

### ❌ PLY súbor neexistuje po Nerfstudio

**Príčina:** Export bol preskočený alebo sa zlyhal

**Riešenie:**
```bash
# Skús manuálne exportovať
ns-export pointcloud \
  --load-config="model_output/nerfacto/config.yml" \
  --output-dir="3Dmodel"
```

---

## 📚 Ďalšie Zdroje

- [Nerfstudio Documentation](https://docs.nerf.studio/)
- [YOLO v8 Documentation](https://docs.ultralytics.com/)
- [PLY File Format](https://en.wikipedia.org/wiki/PLY_(file_format))
- [Neural Radiance Fields - NeRF Paper](https://arxiv.org/abs/2005.12175)
