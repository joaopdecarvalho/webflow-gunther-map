# Simple test for Webflow ZIP processing
Write-Host "TESTING WEBFLOW ZIP PROCESSING"
Write-Host "==============================="

$zipFile = "C:\Users\joao\Documents\My Scripts\webflow-gunther-map\.backups\go-goethe-quartier-ebde32.webflow (1).zip"
$stagingDir = "..\webflow-staging-site-files"

Write-Host "Step 1: Checking ZIP file..."
if (Test-Path $zipFile) {
    Write-Host "OK - ZIP file found"
} else {
    Write-Host "ERROR - ZIP file not found"
    exit
}

Write-Host "Step 2: Extracting ZIP..."
if (Test-Path $stagingDir) {
    Remove-Item -Path $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

try {
    Expand-Archive -Path $zipFile -DestinationPath $stagingDir -Force
    Write-Host "OK - ZIP extracted"
} catch {
    Write-Host "ERROR - ZIP extraction failed"
    exit
}

Write-Host "Step 3: Checking index.html..."
$indexPath = Join-Path $stagingDir "index.html"
if (Test-Path $indexPath) {
    Write-Host "OK - index.html found"

    $content = Get-Content $indexPath -Raw

    if ($content -match "simple-3d-loader") {
        Write-Host "INFO - Fresh export already has 3D loader"
    } else {
        Write-Host "INFO - Fresh export has no 3D loader"
    }

    if ($content -match "webgl-container|WebGL Container") {
        Write-Host "INFO - Fresh export has WebGL styling"
    } else {
        Write-Host "INFO - Fresh export has no WebGL styling"
    }

} else {
    Write-Host "ERROR - No index.html found"
}

Write-Host "Step 4: Checking templates..."
if (Test-Path "..\.templates\script-clean.txt") {
    Write-Host "OK - Script template exists"
    $script = Get-Content "..\.templates\script-clean.txt"
    Write-Host "Template contains: $script"
} else {
    Write-Host "WARNING - No script template"
}

if (Test-Path "..\.templates\styles-clean.txt") {
    Write-Host "OK - Styles template exists"
} else {
    Write-Host "WARNING - No styles template"
}

Write-Host ""
Write-Host "Test complete. Files are in: $stagingDir"