# PowerShell Script - 3D Model API Testing
# Pred spustením:
# 1. Spustire Docker: docker-compose up -d
# 2. Spustire príkaz: .\test-3d-api.ps1

# Admin credentials
$username = "admin"
$password = "admin123"

# Step 1: Get auth token
Write-Host "[*] Prihlasovanie..." -ForegroundColor Cyan
$loginResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
  -Method POST `
  -Body (@{ username = $username; password = $password } | ConvertTo-Json) `
  -ContentType "application/json" `
  -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.access_token
$userId = $loginData.user.id

Write-Host "[+] Prihlaseny ako: $($loginData.user.username) (ID: $userId)" -ForegroundColor Green

# Step 2: Get all projects
Write-Host "`n[*] Nacitavam projekty..." -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

$projectsResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/projects/" `
  -Headers $headers `
  -Method GET `
  -UseBasicParsing

$projects = $projectsResponse.Content | ConvertFrom-Json

Write-Host "[+] Najdene projekty: $($projects.Count)" -ForegroundColor Green
$projects | ForEach-Object { Write-Host "  - $($_.project_name) (ID: $($_.id))" }

# Step 3: Check 3D model for first project
if ($projects.Count -gt 0) {
  $projectId = $projects[0].id
  
  Write-Host "`n[*] Skontroluj 3D model pre projekt: $($projects[0].project_name)" -ForegroundColor Cyan
  Write-Host "   Project ID: $projectId" -ForegroundColor Gray
  
  try {
    $modelCheckResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/projects/$projectId/3d-model" `
      -Headers $headers `
      -Method GET `
      -UseBasicParsing
    
    $modelData = $modelCheckResponse.Content | ConvertFrom-Json
    
    if ($modelData.exists) {
      Write-Host "[+] 3D Model najdeny!" -ForegroundColor Green
      Write-Host "   Velkost: $([Math]::Round($modelData.size / 1024 / 1024, 2)) MB"
      Write-Host "   Filename: $($modelData.filename)"
      Write-Host "   Download URL: $($modelData.url)"
      
      # Try to download
      Write-Host "`n[*] Stiahem model..." -ForegroundColor Cyan
      $downloadUrl = "http://localhost:8000$($modelData.url)?token=$token"
      $modelContent = Invoke-WebRequest -Uri $downloadUrl `
        -Method GET `
        -UseBasicParsing `
        -OutFile "test_model.ply"
      
      Write-Host "[+] Model stiahnuty: test_model.ply" -ForegroundColor Green
      Write-Host "   Velkost: $((Get-Item test_model.ply).Length / 1024 / 1024) MB"
    } else {
      Write-Host "[-] Ziadny 3D model najdeny pre tento projekt" -ForegroundColor Yellow
      Write-Host "   Musis nahrat model do: Back-end/routers/projects/$userId/$projectId/3Dmodel/model.ply" -ForegroundColor Gray
    }
  } catch {
    Write-Host "[-] Chyba pri kontrole modelu: $_" -ForegroundColor Red
  }
}

Write-Host "`n[+] Test Complete!" -ForegroundColor Green
