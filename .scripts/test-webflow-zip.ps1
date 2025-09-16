# Test PowerShell script for Webflow ZIP processing
$ErrorActionPreference = "Stop"

Write-Host "🧪 TESTING WEBFLOW ZIP PROCESSING" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Set paths
$zipFile = "C:\Users\joao\Documents\My Scripts\webflow-gunther-map\.backups\go-goethe-quartier-ebde32.webflow (1).zip"
$stagingDir = "..\webflow-staging-site-files"
$templatesDir = "..\.templates"

Write-Host "🔍 Step 1: Checking sample ZIP file..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Write-Host "✅ Found ZIP: $(Split-Path -Leaf $zipFile)" -ForegroundColor Green
} else {
    Write-Host "❌ ZIP file not found: $zipFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗑️ Step 2: Clearing staging directory..." -ForegroundColor Yellow
if (Test-Path $stagingDir) {
    Remove-Item -Path $stagingDir -Recurse -Force
    Write-Host "✅ Old staging files removed" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
Write-Host "✅ Fresh staging directory created" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 3: Extracting ZIP..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipFile -DestinationPath $stagingDir -Force
    Write-Host "✅ ZIP extracted successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ ZIP extraction failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Step 4: Analyzing extracted files..." -ForegroundColor Yellow
$indexPath = Join-Path $stagingDir "index.html"
if (Test-Path $indexPath) {
    Write-Host "✅ index.html found" -ForegroundColor Green

    $content = Get-Content $indexPath -Raw

    # Check for existing 3D loader
    if ($content -match "simple-3d-loader") {
        Write-Host "⚠️ Fresh export already contains 3D loader script" -ForegroundColor Yellow

        if ($content -match "localhost") {
            Write-Host "  📍 Uses localhost URL" -ForegroundColor White
        } else {
            Write-Host "  🌐 Uses production URL" -ForegroundColor White
        }
    } else {
        Write-Host "📭 No 3D loader script found in fresh export" -ForegroundColor White
    }

    # Check for WebGL styling
    if ($content -match "WebGL Container Styling" -or $content -match "Anti-Flash Styling") {
        Write-Host "✅ WebGL styling found in fresh export" -ForegroundColor Green
    } else {
        Write-Host "📭 No WebGL styling in fresh export" -ForegroundColor White
    }

} else {
    Write-Host "❌ No index.html found after extraction!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Step 5: Checking templates..." -ForegroundColor Yellow

if (Test-Path "$templatesDir\script-clean.txt") {
    $script = Get-Content "$templatesDir\script-clean.txt" -Raw
    Write-Host "✅ Script template found: $($script.Trim())" -ForegroundColor Green
} else {
    Write-Host "❌ No script template found" -ForegroundColor Red
}

if (Test-Path "$templatesDir\styles-clean.txt") {
    Write-Host "✅ Styles template found" -ForegroundColor Green
} else {
    Write-Host "❌ No styles template found" -ForegroundColor Red
}

Write-Host ""
Write-Host "💉 Step 6: Testing injection process..." -ForegroundColor Yellow

# Create backup
$backupPath = Join-Path $stagingDir "index-original.html"
Copy-Item $indexPath $backupPath

# Test script injection
if (Test-Path "$templatesDir\script-clean.txt") {
    $customScript = Get-Content "$templatesDir\script-clean.txt" -Raw
    $customScript = $customScript.Trim()

    Write-Host "Injecting script: $customScript" -ForegroundColor White

    # Remove any existing 3D loader scripts
    $content = $content -replace '<script[^>]*simple-3d-loader[^>]*></script>', ''

    # Find insertion point
    $insertPoint = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
    $commentStart = '<!-- Simple 3D Loader Script -->'
    $scriptBlock = "`n  `n  " + $commentStart + "`n  " + $customScript

    $content = $content.Replace($insertPoint, $insertPoint + $scriptBlock)

    # Save
    $content | Set-Content $indexPath -NoNewline
    Write-Host "✅ Script injected" -ForegroundColor Green
}

# Test styles injection
if (Test-Path "$templatesDir\styles-clean.txt") {
    $customStyles = Get-Content "$templatesDir\styles-clean.txt" -Raw

    Write-Host "Injecting WebGL styles..." -ForegroundColor White

    # Remove existing styles
    $content = Get-Content $indexPath -Raw
    $content = $content -replace '(?s)<!--.*?Anti-Flash.*?Styling.*?-->.*?</style>', ''
    $content = $content -replace '(?s)<!--.*?WebGL Container Styling.*?-->.*?</style>', ''

    # Insert new styles
    $insertPoint = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
    $content = $content.Replace($insertPoint, $insertPoint + "`n  `n  " + $customStyles)

    $content | Set-Content $indexPath -NoNewline
    Write-Host "✅ Styles injected" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ TESTING COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Results saved to: $stagingDir" -ForegroundColor White
Write-Host "🌐 Test by opening: $stagingDir\index.html" -ForegroundColor White
Write-Host ""

# Show final verification
$finalContent = Get-Content $indexPath -Raw
if ($finalContent -match "simple-3d-loader") {
    Write-Host "✅ Final verification: 3D loader script present" -ForegroundColor Green
} else {
    Write-Host "❌ Final verification: 3D loader script missing" -ForegroundColor Red
}

if ($finalContent -match "webgl-container" -or $finalContent -match "WebGL Container") {
    Write-Host "✅ Final verification: WebGL styling present" -ForegroundColor Green
} else {
    Write-Host "❌ Final verification: WebGL styling missing" -ForegroundColor Red
}