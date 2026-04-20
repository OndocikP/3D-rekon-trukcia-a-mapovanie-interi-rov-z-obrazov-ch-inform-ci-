# Debug Guide - Verifikácia Upload Fotiek

## 1. Frontend - Co sa ma desat?

**Pri vytváraní projektu (`app/project/new.tsx`):**

✓ Vyberie fotky  
✓ Vytvorí projekt (projekt sa ulozi do DB)  
✓ Nahrajúť fotky jednu po jednej  
✓ Loguje progress kazdej fotky  

**Console logy budú**: 
```
[1/3] Navrávam obrázok...
✓ Obrázok 1 úspešne nahraný: {uuid}.jpg
[2/3] Navrávam obrázok...
✓ Obrázok 2 úspešne nahraný: {uuid}.jpg
[3/3] Navrávam obrázok...
✓ Obrázok 3 úspešne nahraný: {uuid}.jpg
✓ Priebeh: 3 OK, 0 FAILED z 3 obrázkov
```

## 2. Backend - Co sa ma destat?

**Endpoint `POST /api/projects/create`:**
```log
✓ Priečinok vytvorený: Back-end/routers/projects/{user_id}/{project_id}/images
```

**Endpoint `POST /api/projects/{project_id}/upload-image`:**
```log
📤 UPLOAD STARTED - File: image-1.jpg, ContentType: image/jpeg
✓ Súbor načítaný: 85432 bytes
✓ Obrázok parsnutý: JPEG, (3000, 2000)
✓ Priečinok existuje: d:\path\to\images
✓ Obrázok uložený: d:\path\to\images\{uuid}.jpg
✓ DB aktualizovaná: 0 → 1
✓ Súbor verifikovaný (85432 bytes)
```

**Endpoint `GET /api/projects/{project_id}/images`:**
```log
📂 GET IMAGES - Project: {project_id}, User: {user_id}
   Cesta: d:\path\to\images
   DB image_count: 3
   ✓ Nájdené obrázky: 3
     - {uuid1}.jpg
     - {uuid2}.jpg
     - {uuid3}.jpg
```

## 3. Kontrola Súborov

### Backend - Kde sa ukladaj fotky?

```
Back-end/routers/projects/
├── {user_id}/
│   └── {project_id}/
│       └── images/
│           ├── {uuid1}.jpg
│           ├── {uuid2}.jpg
│           └── {uuid3}.jpg
```

### Skontroluj v Powershell:

```powershell
# Zisti či su fotky fyzicky ulozené
Get-ChildItem -Recurse "Back-end\routers\projects" | Where-Object {$_.Extension -eq ".jpg"}

# Skontroluj velkost priečinka
Get-ChildItem -Path "Back-end\routers\projects" -Recurse | Measure-Object -Sum Length
```

## 4. Databáza - Skontroluj image_count

```sql
SELECT 
  id,
  project_name,
  image_count,
  user_id,
  created_at
FROM projects
ORDER BY created_at DESC;
```

## 5. Moiny Scenare - Kde moze byt Problem?

| Scenar | Príznaky | Riešenie |
|--------|---------|---------|
| Upload zlyháva | Alert: "Čiastočný úspech 0/3" | Pozri frontend console |
| Fotky sa neukladajú | Alert: "OK" ale súbory neexistujú | Pozri backend logs |
| image_count sa zvyšuje ale fotky neexistujú | DB OK, images neexistujú | Chyba v path-u alebo permissions |
| Fotky sa nevytvárajú vôbec | image_count = 0 | Backend crash? Loguj exceptions |
| Frontend nevidí fotky po refresh | image_count > 0 ale GET vracia [] | Cesta sa nezhoduje |

## 6. Ako Testovať?

### Option 1: Manuálne v Postmane

```bash
# 1. Vytvor projekt
POST http://localhost:8000/api/projects/create
Authorization: Bearer {token}
{
  "project_name": "Test Project",
  "description": "Testing upload"
}
# Odpoveď: {"id": "project-123", ...}

# 2. Nahraj fotku
POST http://localhost:8000/api/projects/project-123/upload-image
Authorization: Bearer {token}
[vyber súbor]

# 3. Zisti fotky
GET http://localhost:8000/api/projects/project-123/images
Authorization: Bearer {token}
```

### Option 2: Aktualizované Frontend Logy

Teraz máš v `app/project/new.tsx`:
- Podrobné console.log() pre každý krok
- Error handling s detailom
- Alert s chybami

Otvori DevTools a sleduj Console pri Upload.
