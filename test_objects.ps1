# Test script for objects field functionality

$baseUrl = "http://localhost:8000/api"

# Step 1: Register new user
Write-Host "Step 1: Registering user test_user..." -ForegroundColor Cyan
$registerData = @{
    username = "test_user"
    email = "test@example.com"
    password = "test_pass_123"
} | ConvertTo-Json

try {
    $regResp = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method POST `
        -Body $registerData -ContentType "application/json" -UseBasicParsing
    Write-Host "OK: Registration successful" -ForegroundColor Green
    $regContent = $regResp.Content | ConvertFrom-Json
    Write-Host "User ID: $($regContent.id)"
} catch {
    Write-Host "ERROR: Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Login
Write-Host "`nStep 2: Logging in..." -ForegroundColor Cyan
$loginData = @{
    username = "test_user"
    password = "test_pass_123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST `
        -Body $loginData -ContentType "application/json" -UseBasicParsing
    $loginContent = $loginResp.Content | ConvertFrom-Json
    $token = $loginContent.access_token
    Write-Host "OK: Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..."
} catch {
    Write-Host "ERROR: Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create project with objects field
Write-Host "`nStep 3: Creating project with objects..." -ForegroundColor Cyan
$projectData = @{
    project_name = "Living Room"
    description = "Scanned living room"
    objects = "sofa, table, lamp, picture, cabinet"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $projectResp = Invoke-WebRequest -Uri "$baseUrl/projects/create" -Method POST `
        -Body $projectData -Headers $headers -UseBasicParsing
    $projectContent = $projectResp.Content | ConvertFrom-Json
    Write-Host "OK: Project created successfully" -ForegroundColor Green
    Write-Host "Project ID: $($projectContent.id)"
    Write-Host "Project Name: $($projectContent.project_name)"
    Write-Host "Objects received: '$($projectContent.objects)'" -ForegroundColor Yellow
    
    # Verify objects field
    if ($projectContent.objects -eq "sofa, table, lamp, picture, cabinet") {
        Write-Host "SUCCESS: OBJECTS FIELD PERSISTED!" -ForegroundColor Green
        $projectId = $projectContent.id
    } else {
        Write-Host "ERROR: Objects not persisted - Got: '$($projectContent.objects)'" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Project creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Retrieve project and verify objects field
Write-Host "`nStep 4: Retrieving project to verify persistence..." -ForegroundColor Cyan
try {
    $getResp = Invoke-WebRequest -Uri "$baseUrl/projects/" -Method GET `
        -Headers $headers -UseBasicParsing
    $projects = $getResp.Content | ConvertFrom-Json
    $testProject = $projects | Where-Object { $_.id -eq $projectId }
    
    if ($testProject) {
        Write-Host "OK: Project retrieved successfully" -ForegroundColor Green
        Write-Host "Objects in DB: '$($testProject.objects)'" -ForegroundColor Yellow
        
        if ($testProject.objects -eq "sofa, table, lamp, picture, cabinet") {
            Write-Host "SUCCESS SUCCESS SUCCESS - Objects persisted to DB!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Objects not persisted correctly" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERROR: Project not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to retrieve projects: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ALL TESTS PASSED ===" -ForegroundColor Green
