# Automatické Generovanie 3D Modelov - Nerfstudio

Tento systém automaticky generuje 3D modely z fotografií pomocou **Nerfstudio** a zobrazuje ich pomocou **ns-viewer**.

## 📋 Príprava

### 1. Inštalácia Nerfstudio

```bash
# Stiahni Nerfstudio
https://docs.nerf.studio/

# Aktivuj conda prostredie
conda activate nerfstudio

# Prejdi do adresára
cd nerfstudio
```

### 2. Inštalácia závislostí v Back-ende

```bash
cd Back-end
pip install -r requirements.txt
```

## 🚀 Spustenie

### Spôsob 1: Automatické generovanie všetkých projektov

```bash
cd Back-end
python generate_3d_models.py
```

**Čo robí:**
- Prejde všetky projekty v `PROJECTS_PATH`
- Skontroluje či majú obrázky
- Ak nemajú 3D model, spustí Nerfstudio training
- Exportuje model ako PLY súbor do `3Dmodel/` priečinka

### Spôsob 2: Konkrétny projekt

```bash
cd Back-end
python generate_3d_models.py <user_id> <project_id>
```

Príklad:
```bash
python generate_3d_models.py 9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4 10ac4e35-6779-4a5b-93de-82792c02df22
```

### Spôsob 3: Cez API (pri bežiacom serveri)

#### Jednotlivý projekt (asynchronne)

```bash
curl -X POST http://localhost:8000/api/projects/<user_id>/<project_id>/generate-3d-model \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"async_mode": true}'
```

#### Všetky projekty (batch)

```bash
curl -X POST http://localhost:8000/api/projects/batch/generate-all-models \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json"
```

## 📂 Štruktúra Projektov

```
PROJECTS_PATH/
├── user_id_1/
│   ├── project_id_1/
│   │   ├── images/
│   │   │   ├── photo_001.jpg
│   │   │   ├── photo_002.jpg
│   │   │   └── ... (aspoň 5 obrázkov)
│   │   ├── 3Dmodel/
│   │   │   ├── pointcloud.ply  ✅ Generovaný model
│   │   │   └── outputs/        (intermediárne súbory)
│   │   └── outputs/            (Nerfstudio training výstup)
│   │
│   └── project_id_2/
│       └── ...
└── user_id_2/
    └── ...
```

## 🎯 Požiadavky na Obrázky

- **Počet:** Aspoň 5 obrázkov
- **Rozlíšenie:** 1280×720 alebo vyššie
- **Format:** JPG, JPEG, PNG
- **Kvalita:** Jasné, ostrené fotografie bez rozmazania
- **Pokrytie:** Fotografie z rôznych uhlov interiéru

## ⚙️ Konfigurácia Nerfstudio

Upraviť v `generate_3d_models.py`:

```python
NERFSTUDIO_CONFIG = {
    "method": "nerfacto",           # Metóda (nerfacto = rýchly + kvalitný)
    "output_format": "pointcloud",  # PLY format
    "max_num_iterations": 30000,    # Počet iterácií (viac = dlhšie ale lepšie)
    "save_interval": 1000,          # Ukladanie po každých N iterácií
}
```

### Varianty metód:

- **nerfacto** (odporúčané): Rýchly a kvalitný
- **nerfacto-big**: Pomalší ale lepšia kvalita
- **vanilla-nerf**: Klasický NeRF (najpomalší)

## 🖥️ Výkon

- **CPU:** ~2-4 hodiny na projekt (podľa počtu obrázkov)
- **GPU (CUDA):** ~30 minút - 1 hodina
- **Výstupná veľkosť:** ~50-200 MB PLY súbor

### Zmena na GPU training (ak máš NVIDIA GPU)

V `generate_3d_models.py` zmeniť:
```python
"--machine-type", "gpu",  # alebo "auto"
```

## 📊 Sledovanie Procesu

### Logy

```bash
# Logy z generácie
tail -f nerfstudio_training.log
```

### Výstup

Každý projekt má priečinok `outputs/` s:
- `nerfacto/TIMESTAMP/config.yml` - Konfigurácia tréningu
- `nerfacto/TIMESTAMP/nerfstudio_models/` - Tréningové dáta
- `3Dmodel/pointcloud.ply` - Finálny model

## 🎨 Zobrazenie Modelov v ns-viewer

### Frontend

Model sa automaticky načítava v ns-viewer komponente:

```tsx
<ThreeDViewer modelUrl="/api/projects/{projectId}/3d-model/content" />
```

### Standalone ns-viewer

```bash
ns-viewer --load-config <project>/outputs/nerfacto/*/config.yml
```

## 🐛 Riešenie Problémov

### "No images found"
- Skontroluj či sú obrázky v `images/` priečinku
- Musia byť: jpg, jpeg, alebo png

### Training veľmi pomalý
- Skús menší počet obrázkov (max 100-150)
- Zmenši resolution obrázkov
- Zmeniť na GPU training

### PLY nie je vygenerovaný
- Skontroluj logy: `nerfstudio_training.log`
- Overíť či training skončil úspešne (skontroluj `outputs/` priečinok)

### Rozmazaný model pri pohybe kamery
- Zvýšiť počet iterácií
- Lepšie obrázky (bez motion blur)
- Skúsiť inú metódu: `nerfacto-big`

## 🔄 Automatizácia

### Windows Task Scheduler

```batch
@echo off
REM Run nightly at 2 AM
cd D:\GitHub\3D-rekon-...\Back-end
python generate_3d_models.py
```

### Linux Cron

```bash
# Daily at 2 AM
0 2 * * * cd /path/to/Back-end && python generate_3d_models.py
```

### Python Scheduler (API integrovaný)

```python
import schedule
import time

def nightly_generation():
    # Volaj API endpoint
    requests.post("http://localhost:8000/api/projects/batch/generate-all-models", 
                  headers={"Authorization": f"Bearer {token}"})

schedule.every().day.at("02:00").do(nightly_generation)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 📝 API Endpointy

### POST `/api/projects/{user_id}/{project_id}/generate-3d-model`
Spustenie generácie pre konkrétny projekt.

**Query parametre:**
- `async_mode` (bool): Asyncné spustenie v pozadí (default: false)

**Odpoveď (async):**
```json
{
  "status": "generation_started",
  "message": "3D model generation started in background",
  "project_id": "...",
  "user_id": "...",
  "async": true
}
```

### POST `/api/projects/batch/generate-all-models`
Hromadná generácia pre všetky projekty bez modelov.

**Query parametre:**
- `force` (bool): Vygeneruj aj existujúce modely znova

**Odpoveď:**
```json
{
  "status": "batch_generation_started",
  "message": "Batch 3D model generation started in background",
  "force": false
}
```

## ✅ Checklist

- [ ] Nerfstudio nainštalovaný a aktivovaný
- [ ] Back-end dependencies nainštalované
- [ ] PROJECTS_PATH správne nastavená v .env
- [ ] Obrázky v `images/` priečinkoch
- [ ] Aspoň 5 obrázkov na projekt
- [ ] Spustenie testom: `python generate_3d_models.py <user_id> <project_id>`
- [ ] Model úspešne vygenerovaný v `3Dmodel/pointcloud.ply`
- [ ] Frontend zobrazuje model cez ns-viewer

---

**Podpora:** Čítaj logy v `nerfstudio_training.log` pre detaily o chybách.
