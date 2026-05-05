# 🔒 Production Security & Deployment Summary

**Dátum**: 28.4.2026  
**Status**: ✅ PRODUCTION READY

---

## 📋 Implementované zmeny

### 1️⃣ Docker Compose - Production Config (`docker-compose.prod.yml`)

**Port bezpečnosť:**
```yaml
# ✅ VEREJNE - Frontend dostupný z internetu
frontend:
  ports:
    - "8081:3000"

# 🔒 LOKAL - Backend dostupný len z lokal PC
backend:
  ports:
    - "127.0.0.1:8000:8000"

# 🔒 LOKAL - Databáza dostupná len z lokal PC
postgres:
  ports:
    - "127.0.0.1:5432:5432"

# 🔒 LOKAL - pgAdmin dostupný len z lokal PC
pgadmin:
  ports:
    - "127.0.0.1:5050:80"
```

**Výhody:**
- Iba port 8081 viditeľný z internetu
- Backend, DB, pgAdmin sú chránené na lokálnej sieti
- Frontend komunikuje s Backendom cez internal Docker network
- Maximálna bezpečnosť s minimálnym exposure

---

### 2️⃣ Environment Variables (`.env.prod`, `.env.example`)

```bash
# ✅ Template súbor - bezpečne uložiť v GIT
.env.example

# 🔒 Production hesla - NIKDY do GIT (v .gitignore)
.env.prod
```

**Obsah (.env.prod):**
```env
DB_PASSWORD=SILNE_HESLO_32_ZNAKOV
SECRET_KEY=random-secret-SILNE-HESLO
PGADMIN_PASSWORD=SILNE_HESLO_ADMIN
```

---

### 3️⃣ Frontend Dockerfile (`Front-and/Dockerfile`)

- Multi-stage build (builder + runtime)
- Alpine Linux (malá veľkosť)
- Node.js server na port 3000
- Health check zabudovaný
- Produkčný build z zdrojového kódu

---

### 4️⃣ Updated `.gitignore`

**Nové:**
```
.env          # Žiadne hesla v GIT
.env.local
.env.prod
.env.production

**/*.key      # SSH keys / certs
**/*.pem
secrets/
```

---

### 5️⃣ Deployment Guide (`DEPLOYMENT.md`)

Kompletný návod na:
- ✅ Local development setup
- ✅ Production deployment
- ✅ Firewall nastavenie
- ✅ Monitoring & Logs
- ✅ Backup stratégia
- ✅ Nginx reverse proxy
- ✅ Troubleshooting

---

## 🚀 Quick Start - Production

### Na vašom serveri:

```bash
# 1. Klonuj repo
git clone https://github.com/your/repo.git
cd repo

# 2. Nastaví env file
cp .env.example .env.prod
nano .env.prod  # ZMENIŤ VŠETKY HESLA!

# 3. Spustí produkciu
docker-compose -f docker-compose.prod.yml up -d

# 4. Skontroluj status
docker-compose -f docker-compose.prod.yml ps

# 5. Prístup
# Užívateľ: http://your-server-ip:8081
```

---

## 🔐 Bezpečnosť - Network Diagram

```
                    INTERNET
                       ↑
                       │ (Port 8081)
                       │
                    [Firewall]
                    └─────────┘
                       │
                    [Frontend]  ← Užívateľ sa pripája
                    Port 8081
                       │
        ┌──────────────┘  (Internal Docker Network)
        │
    [Backend]        ← Nedostupný z internetu
    127.0.0.1:8000   ← Iba lokal/Docker
        │
    [Postgres]       ← Nedostupný z internetu
    127.0.0.1:5432   ← Iba lokal/Docker
        │
    [pgAdmin]        ← Nedostupný z internetu
    127.0.0.1:5050   ← Iba admin na lokal
```

---

## ✅ Checklist - Pred nasadením

- [ ] `.env.prod` súbor vytvorený s NOVÝMI heslami
- [ ] Všetky hesla zmenené z default hodnôt
- [ ] Backend port 8000 NIE je viditeľný z internetu
- [ ] Frontend port 8081 JE viditeľný z internetu
- [ ] Firewall pravidlá nastavené (ak používate UFW/firewalld)
- [ ] `git status` neukazuje `.env.prod` (mal by byť v .gitignore)
- [ ] Docker images sú vychod (docker build)
- [ ] Health checks prechádzajú
- [ ] Login do aplikácie funguje
- [ ] 3D modely sa načítavajú

---

## 🆘 Common Issues

### Frontend sa nevytvára
```bash
docker build -f Front-and/Dockerfile -t rekon_frontend Front-and/
```

### Backend nedostupný z frontendu
```bash
# Skontroluj network
docker network ls
docker network inspect rekon_default
```

### pgAdmin: "Nie je možné sa pripojiť"
```bash
# pgAdmin je dostupný len na lokal
ssh user@server
localhost:5050
```

---

## 📊 Porovnanie - Local vs Production

| Aspekt | Local | Production |
|--------|-------|------------|
| Frontend Port | `0.0.0.0:3000` | `0.0.0.0:8081` |
| Backend Port | `0.0.0.0:8000` | `127.0.0.1:8000` 🔒 |
| Postgres | `0.0.0.0:5432` | `127.0.0.1:5432` 🔒 |
| pgAdmin | `0.0.0.0:5050` | `127.0.0.1:5050` 🔒 |
| Hesla | Default | Silné - z .env.prod |
| Config | docker-compose.yml | docker-compose.prod.yml |

---

## 📝 Súbory na kontrolu

✅ Vytvorené/Aktualizované:
- `docker-compose.prod.yml` - Production config
- `.env.example` - Template pre env vars
- `.env.prod` - Production hesla (v .gitignore)
- `Front-and/Dockerfile` - Frontend build
- `DEPLOYMENT.md` - Kompletný deployment guide
- `.gitignore` - Aktualizovaný (hesla chránené)

---

## 🎯 Ďalšie kroky (opcionálne)

1. **HTTPS** - Nastaví Nginx + Let's Encrypt SSL
2. **Monitoring** - Prometheus + Grafana
3. **Logging** - ELK Stack (Elasticsearch, Logstash, Kibana)
4. **Auto-scaling** - Kubernetes setup
5. **CI/CD** - GitHub Actions pre automatic deployment

---

**Status**: 🟢 **PRODUCTION READY**  
Aplikácia je bezpečná a pripravená na nasadenie!
