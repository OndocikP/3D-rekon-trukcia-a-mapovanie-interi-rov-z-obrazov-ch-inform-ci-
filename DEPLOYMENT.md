# 🚀 Production Deployment Guide

## Bezpečnosť siete - Port konfigurácia

### ✅ LOCAL Development (`docker-compose.yml`)
Všetky porty dostupné:
- Frontend: `0.0.0.0:3000`
- Backend: `0.0.0.0:8000`
- Postgres: `0.0.0.0:5432`
- pgAdmin: `0.0.0.0:5050`

**Spustenie:**
```bash
docker-compose up -d
```

---

### 🔒 PRODUCTION Deployment (`docker-compose.prod.yml`)

**Port konfigurácia:**
| Služba | Port | Dostupnosť | Poznámka |
|--------|------|-----------|----------|
| **Frontend** | `8081` | ✅ VEREJNE (0.0.0.0) | Dostupný z internetu |
| **Backend** | `8000` | 🔒 LOKAL (127.0.0.1) | Iba interná sieť |
| **Postgres** | `5432` | 🔒 LOKAL (127.0.0.1) | Iba interná sieť |
| **pgAdmin** | `5050` | 🔒 LOKAL (127.0.0.1) | Iba pre admina |

**Čo to znamená:**
- Užívateľ vidí: `http://vasa-ip:8081` (Frontend)
- Vnútri siete: Frontend → Backend na `http://backend:8000`
- Postgres prístupný len z containeru alebo z lokal PC
- pgAdmin dostupný len z lokal PC na `http://127.0.0.1:5050`

---

## 🔧 Inštalácia na produkciu

### 1️⃣ Príprava servera
```bash
# SSH do vášho servera
ssh user@your-server.com

# Klonujte repo
git clone https://github.com/your-repo/3d-rekon.git
cd 3d-rekon
```

### 2️⃣ Setup environment súborov
```bash
# Kopíruj template
cp .env.example .env.prod

# Edituj s bezpečnými heslami
nano .env.prod
```

**⚠️ ZMENIŤ TIETO HESLA:**
```env
DB_PASSWORD=SILNE_HESLO_ESTE_32_ZNAKOV
SECRET_KEY=random-secret-key-dlhy-32-znakov-minimum
PGADMIN_PASSWORD=SILNE_HESLO_ADMIN
```

### 3️⃣ Spustenie na produkciu
```bash
# Spustit s produkčným config
docker-compose -f docker-compose.prod.yml up -d

# Kontrola zdravia
docker-compose -f docker-compose.prod.yml ps
```

**Očakávaný output:**
```
CONTAINER ID   STATUS           PORTS
rekon_postgres  Up (healthy)    127.0.0.1:5432->5432/tcp
rekon_backend   Up (running)    127.0.0.1:8000->8000/tcp
rekon_pgadmin   Up (running)    127.0.0.1:5050->80/tcp
rekon_frontend  Up (running)    0.0.0.0:8081->3000/tcp
```

---

## 📱 Prístup k aplikácii

### Užívateľ
```
Webová aplikácia:
http://your-server-ip:8081
```

### Admin (lokálny pristup)
```
pgAdmin:
http://localhost:5050
Username: admin@rekon.local
Password: [z .env.prod]
```

---

## 🔐 Bezpečnosť - Firewall nastavenie

### Debian/Ubuntu (UFW)
```bash
# Dovoli len Frontend z vonku
sudo ufw allow 8081/tcp

# Zablokoj Backend z vonku
sudo ufw deny 8000/tcp

# Zablokoj Postgres
sudo ufw deny 5432/tcp

# Zablokoj pgAdmin
sudo ufw deny 5050/tcp

# Povoluj SSH
sudo ufw allow 22/tcp

# Aktivuj firewall
sudo ufw enable
```

### CentOS/RHEL (firewalld)
```bash
# Frontend - verejný
sudo firewall-cmd --permanent --add-port=8081/tcp

# Backend - zablokovaný (už je len 127.0.0.1)
# Postgres - zablokovaný
# pgAdmin - zablokovaný

sudo firewall-cmd --reload
```

---

## 📊 Monitoring & Logs

### Kontrola statusu
```bash
# Všetky kontajnery
docker-compose -f docker-compose.prod.yml ps

# Logy backendu
docker-compose -f docker-compose.prod.yml logs -f backend

# Logy frontendu
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart služby
```bash
# Restart konkrétneho servisu
docker-compose -f docker-compose.prod.yml restart backend

# Graceful shutdown a restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔄 Updates a maintenance

### Update aplikácie
```bash
# Pull nový kód
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache

# Spustit s novými imagami
docker-compose -f docker-compose.prod.yml up -d
```

### Backup databázy
```bash
# Zálohuj Postgres
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres rekon_db > backup_$(date +%Y%m%d).sql

# Obnov z zálohy
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres rekon_db < backup_20260428.sql
```

---

## ⚙️ Advanced - Nginx Reverse Proxy (opcionálne)

Ak chcete HTTPS a ďalšie security features:

```nginx
# /etc/nginx/sites-available/rekon
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Potom:
```bash
sudo systemctl restart nginx
# Presmerova HTTP na HTTPS s Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

---

## ✅ Checklist pred produkciou

- [ ] Zmenili ste všetky hesla v `.env.prod`?
- [ ] Máte firewall pravidlá?
- [ ] Backend port (8000) je zablokovaný z vonku?
- [ ] Frontend port (8081) je dostupný?
- [ ] pgAdmin (5050) je dostupný len na localhost?
- [ ] Tesovali ste login do aplikácie?
- [ ] Tesovali ste 3D model loading?
- [ ] Máte backup stratégiu?
- [ ] Máte monitoring/alerting?

---

## 🆘 Troubleshooting

### Frontend sa nevytvára
```bash
# Manuálne build
docker build -f Front-and/Dockerfile -t rekon_frontend:latest Front-and/
```

### Backend sa nemôže pripojiť k Postgres
```bash
# Skontroluj connection string
docker-compose -f docker-compose.prod.yml logs postgres

# Restartni Postgres
docker-compose -f docker-compose.prod.yml restart postgres
```

### Port 8081 nie je dostupný
```bash
# Skontroluj či beží frontend
docker-compose -f docker-compose.prod.yml ps frontend

# Skontroluj firewall
sudo netstat -tulpn | grep 8081
```

---

**👨‍💻 Support**: Pri problémoch sa pozrite na logy alebo kontaktujte dev tím.
