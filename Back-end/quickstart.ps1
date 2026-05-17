# Quick Start - Nerfstudio 3D Model Generation (Windows)
# Spustenie automatického generovania 3D modelov

Write-Host "`n╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🚀 3D MODEL GENERATION - QUICK START (Windows)                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Skontroluj či je Nerfstudio aktivovaný
Write-Host "1️⃣  Kontrola Nerfstudio..." -ForegroundColor Yellow

try {
    $result = & ns-train --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Nerfstudio je dostupný: $result" -ForegroundColor Green
    } else {
        throw "ns-train command failed"
    }
} catch {
    Write-Host "   ❌ Nerfstudio nieje dostupný" -ForegroundColor Red
    Write-Host "   Prosím aktivuj: conda activate nerfstudio" -ForegroundColor Yellow
    exit 1
}

# 2. Skontroluj Python dependencies
Write-Host "`n2️⃣  Kontrola Python dependencies..." -ForegroundColor Yellow

try {
    python -c "import fastapi, dotenv, pydantic" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Všetky dependencies sú nainštalované" -ForegroundColor Green
    } else {
        throw "Dependencies missing"
    }
} catch {
    Write-Host "   ❌ Chýbajúce dependencies" -ForegroundColor Red
    Write-Host "   Inštalácia: pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# 3. Spustenie setup wizardu
Write-Host "`n3️⃣  Setup Wizard..." -ForegroundColor Yellow
python setup_nerfstudio.py

# 4. Výber režimu
Write-Host "`n════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Vyber režim spustenia:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1) Všetky projekty bez modelov (automaticky)"
Write-Host "  2) Konkrétny projekt (zadaj user_id a project_id)"
Write-Host "  3) Batch s async worker (rýchlo sa vráti)"
Write-Host "  4) Testy"
Write-Host ""

$choice = Read-Host "Vyber [1-4]"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Spúšťam generovanie všetkých projektov..." -ForegroundColor Green
        python generate_3d_models.py
    }
    "2" {
        Write-Host ""
        $user_id = Read-Host "User ID"
        $project_id = Read-Host "Project ID"
        Write-Host "`n🚀 Spúšťam generovanie projektu..." -ForegroundColor Green
        python generate_3d_models.py $user_id $project_id
    }
    "3" {
        Write-Host "`n🚀 Spúšťam batch async generovanie..." -ForegroundColor Green
        Write-Host "Server musí bežať na http://localhost:8000"
        $token = Read-Host "Authorization token"
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        Invoke-WebRequest -Uri "http://localhost:8000/api/projects/batch/generate-all-models" `
            -Method POST `
            -Headers $headers `
            -Body "{}"
        
        Write-Host ""
        Write-Host "✅ Generovanie spustené v pozadí" -ForegroundColor Green
    }
    "4" {
        Write-Host "`n🧪 Spúšťam testy..." -ForegroundColor Yellow
        pytest test_3d_models.py -v
    }
    default {
        Write-Host "Neznáma voľba" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Hotovo! Pozri README_NERFSTUDIO.md pre detaily." -ForegroundColor Green
Write-Host "📖 Logy: nerfstudio_training.log" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
