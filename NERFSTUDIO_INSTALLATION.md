# 🚀 3D Model Generation - Complete Installation & Deployment Guide

Tento dokument pokrýva kompletné nastavenie a nasadenie automatického generovania 3D modelov pomocou Nerfstudio.

## 📋 Obsah

1. [Požiadavky](#požiadavky)
2. [Príprava](#príprava)
3. [Inštalácia Nerfstudio](#inštalácia-nerfstudio)
4. [Konfigurácia Back-endu](#konfigurácia-back-endu)
5. [Spustenie](#spustenie)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 📋 Požiadavky

### Hardware
- **Minimum:** 8GB RAM, CPU s 4+ jadrami
- **Odporúčané:** GPU (NVIDIA CUDA), 16GB+ RAM
- **Disku:** 50GB voľného miesta (na projects a outputs)

### Software
- Python 3.10+
- Conda (pre Nerfstudio)
- Git
- Docker + Docker Compose (optional)

### Operačný systém
- ✅ Linux (Ubuntu 22.04+)
- ✅ macOS (12.0+)
- ✅ Windows 10/11 (s WSL2)

---

## 🔧 Príprava

### 1. Klon Nerfstudio Repository

```bash
# Stiahni Nerfstudio
git clone https://github.com/nerfstudio-project/nerfstudio.git
cd nerfstudio

# Vytvor conda prostredie
conda create --name nerfstudio -y python=3.10
conda activate nerfstudio

# Inštalácia Nerfstudio
pip install -e .
```

### 2. Klon tohto projektu

```bash
git clone https://github.com/your-org/3d-rekon-project.git
cd 3d-rekon-project
```

### 3. Konfigurácia .env

```bash
cd Back-end
cp .env.example .env

# Vyplň nasledovné v .env:
# DATABASE_URL=postgresql://...
# SUPABASE_URL=...
# PROJECTS_PATH=/path/to/projects  # DÔLEŽITÉ!
```

---

## 📦 Inštalácia Nerfstudio

### Linux / macOS

```bash
cd nerfstudio
conda activate nerfstudio

# Inštalácia s GPU podporou (CUDA)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Inštalácia Nerfstudio
pip install nerfstudio

# Verifikácia
ns-train --version
```

### Windows (WSL2)

```bash
# Aktivuj WSL2
wsl --install

# V WSL2 termináli:
conda create --name nerfstudio -y python=3.10
conda activate nerfstudio

# Postupuj ako Linux vyššie
```

### Docker

```bash
# Nerfstudio worker je dostupný ako Docker image
cd Back-end
docker build -f Dockerfile.nerfstudio -t nerfstudio-worker:latest .
```

---

## 🔧 Konfigurácia Back-endu

### 1. Inštalácia Python Dependencies

```bash
cd Back-end
pip install -r requirements.txt
```

### 2. Príprava Štruktúry Projektov

Musíš mať nasledovnú štruktúru:

```
PROJECTS_PATH/
├── user_id_1/
│   ├── project_id_1/
│   │   ├── images/
│   │   │   ├── photo_001.jpg
│   │   │   ├── photo_002.jpg
│   │   │   └── ...
│   │   └── 3Dmodel/
│   │       └── (prázdny, bude vygenerovaný)
│   └── project_id_2/
│       └── ...
└── user_id_2/
    └── ...
```

### 3. Setup Wizard

```bash
cd Back-end
python setup_nerfstudio.py
```

Toto skontroluje:
- ✅ Nerfstudio dostupnosť
- ✅ Python dependencies
- ✅ .env konfigurácia
- ✅ Štruktúra projektov

---

## 🚀 Spustenie

### Možnosť 1: Quick Start (Odporúčané pre začiatok)

```bash
cd Back-end

# Windows
.\quickstart.ps1

# Linux/macOS
bash quickstart.sh
```

Ponúka interaktívny výber:
1. Všetky projekty bez modelov
2. Konkrétny projekt
3. Batch async worker
4. Testy

### Možnosť 2: Priame spustenie - Všetky projekty

```bash
cd Back-end
conda activate nerfstudio
python generate_3d_models.py
```

**Čo robí:**
- Skenuje všetky projekty v `PROJECTS_PATH`
- Skontroluje či existuje 3D model
- Pre projekty bez modelov:
  - Skontroluje obrázky (min. 5)
  - Spustí Nerfstudio training
  - Exportuje model ako PLY
  - Uloží do `3Dmodel/pointcloud.ply`

### Možnosť 3: Konkrétny projekt

```bash
cd Back-end
python generate_3d_models.py <user_id> <project_id>
```

Príklad:
```bash
python generate_3d_models.py 9d7d572c-7b40-4eed-bd3a-cf64f6de3fe4 10ac4e35-6779-4a5b-93de-82792c02df22
```

### Možnosť 4: API Endpoints (pri bežiacom serveri)

```bash
# Backend server musí bežať na http://localhost:8000

# Spustenie pre konkrétny projekt (asyncne)
curl -X POST http://localhost:8000/api/projects/<user_id>/<project_id>/generate-3d-model \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Hromadné spustenie všetkých projektov
curl -X POST http://localhost:8000/api/projects/batch/generate-all-models \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## 🐳 Deployment

### Docker Compose (Recommended)

```bash
cd Back-end

# Spustenie s Nerfstudio workerom
docker-compose -f docker-compose.nerfstudio.yml up -d

# Monitoring
docker-compose -f docker-compose.nerfstudio.yml logs -f nerfstudio-worker

# Zastavenie
docker-compose -f docker-compose.nerfstudio.yml down
```

### Production Setup

#### 1. Systemd Service (Linux)

```bash
# Vytvor /etc/systemd/system/nerfstudio-worker.service

[Unit]
Description=3D Model Generation Worker (Nerfstudio)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/3d-rekon/Back-end
Environment="PATH=/opt/conda/envs/nerfstudio/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/opt/conda/envs/nerfstudio/bin/python /opt/3d-rekon/Back-end/generate_3d_models.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Povolenie a spustenie
sudo systemctl daemon-reload
sudo systemctl enable nerfstudio-worker
sudo systemctl start nerfstudio-worker
sudo systemctl status nerfstudio-worker
```

#### 2. Cron Job (Night-time processing)

```bash
# crontab -e

# Spustenie ogni noc o 2:00 AM
0 2 * * * cd /opt/3d-rekon/Back-end && /opt/conda/envs/nerfstudio/bin/python generate_3d_models.py >> /var/log/nerfstudio.log 2>&1
```

#### 3. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitorovanie

### Logs

```bash
# Live logy
tail -f Back-end/nerfstudio_training.log

# Posledných 100 riadkov
tail -100 Back-end/nerfstudio_training.log

# Filtrovanie chýb
grep "ERROR" Back-end/nerfstudio_training.log
```

### Status Check

```bash
# API health check
curl http://localhost:8000/health

# Model status pre projekt
curl http://localhost:8000/api/projects/<project_id>/3d-model
```

### Performance Monitoring

```bash
# CPU/Memory usage (Linux)
top -p $(pidof python)

# GPU usage (NVIDIA)
nvidia-smi -l 1  # Refresh každú 1 sekundu
```

---

## 🎯 Optimalizácia

### Konfigurácia Trainingu

V `generate_3d_models.py`:

```python
NERFSTUDIO_CONFIG = {
    "method": "nerfacto",                # rýchly, kvalitný
    "output_format": "pointcloud",       # PLY format
    "max_num_iterations": 30000,         # Počet iterácií
    "save_interval": 1000,               # Ukladanie intervalu
}
```

### Varovanie Itinerácií

| Iterácie | Čas (GPU) | Kvalita | Použitie |
|----------|-----------|---------|----------|
| 10,000   | 20 min    | Nízka   | Demo     |
| 30,000   | 1 hodina  | Dobrá   | Odporúčané |
| 50,000   | 1.5 hod   | Vysoká  | Detail |

### Veľkosť Output

| Bodov | Veľkosť |
|-------|---------|
| 500k  | ~50 MB  |
| 1M    | ~100 MB |
| 2M    | ~200 MB |

---

## 🐛 Troubleshooting

### "ns-train: command not found"

```bash
# Skontroluj conda env
conda activate nerfstudio
which ns-train

# Inštaluj Nerfstudio znova
pip install -e /path/to/nerfstudio
```

### CUDA/GPU Error

```bash
# Overte CUDA dostupnosť
python -c "import torch; print(torch.cuda.is_available())"

# Spustenie na CPU (pomalšie ale funguje)
# V generate_3d_models.py zmeniť:
"--machine-type", "cpu"
```

### Out of Memory

```bash
# Zmenšiť počet bodov v pointcloud
"--num-points", "500000"  # Namiesto 1000000

# Alebo zmenšiť resolution obrázkov
# Predspracovať obrázky: 1280×720 → 640×480
```

### Rozmazaný Model

- Zvýšiť počet iterácií (40000-50000)
- Lepšie obrázky (bez motion blur)
- Skúsiť `nerfacto-big` namiesto `nerfacto`
- Viac fotografií z rôznych uhlov

### Database Error

```bash
# Skontroluj .env
cat Back-end/.env | grep DATABASE_URL

# Test databázového pripojenia
python -c "from generate_3d_models import *; print('OK')"
```

---

## ✅ Deployment Checklist

- [ ] Python 3.10+ nainštalovaný
- [ ] Nerfstudio nainštalovaný a testovaný
- [ ] Conda environment aktivovaný
- [ ] .env skonfigurovaný
- [ ] PROJECTS_PATH existuje a má správnu štruktúru
- [ ] Back-end dependencies nainštalované
- [ ] Setup wizard bez chýb
- [ ] Test na konkrétnom projekte
- [ ] Backend API beží na localhost:8000
- [ ] Batch API endpoint testovaný
- [ ] Systemd service skonfigurovaný (production)
- [ ] Cron job nastavený (production)
- [ ] Monitoring nastavený
- [ ] Backups nakonfigurované

---

## 📚 Ďalšie Zdroje

- [Nerfstudio Dokumentácia](https://docs.nerf.studio/)
- [NeRF Paper](https://arxiv.org/abs/2003.08934)
- [ns-viewer](https://viewer.nerf.studio/)
- [PLY Format](http://paulbourke.net/dataformats/ply/)

---

## 🆘 Podpora

Ak má problém:

1. Skontroluj `nerfstudio_training.log`
2. Skontroluj `setup_nerfstudio.py` výstup
3. Pozri [Troubleshooting](#troubleshooting) sekciu
4. Zisti Git Issues

---

**Posledná aktualizácia:** 2026-05-14  
**Verzia:** 1.0  
**Stav:** ✅ Production Ready
