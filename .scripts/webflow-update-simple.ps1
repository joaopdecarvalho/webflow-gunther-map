# Simple Webflow Update Script - Fixed Version
param([string]$Command = "help")

$stagingDir = "..\webflow-staging-site-files"
$backupDir = "..\.backups"
$templatesDir = "..\.templates"

function Show-Help {
    Write-Host "Webflow Update System" -ForegroundColor Cyan
    Write-Host "Commands: backup, extract, inject" -ForegroundColor Yellow
}

function Backup-Files {
    Write-Host "Creating backup..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupPath = Join-Path $backupDir "backup-$timestamp"

    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }

    if (Test-Path $stagingDir) {
        Copy-Item -Path $stagingDir -Destination $backupPath -Recurse -Force
        Write-Host "Backup created: $backupPath" -ForegroundColor Green
    } else {
        Write-Host "Staging directory not found" -ForegroundColor Red
    }
}

function Extract-Code {
    Write-Host "Extracting custom code..." -ForegroundColor Yellow
    $indexPath = Join-Path $stagingDir "index.html"

    if (!(Test-Path $indexPath)) {
        Write-Host "index.html not found" -ForegroundColor Red
        return
    }

    $content = Get-Content $indexPath -Raw

    # Create templates directory
    if (!(Test-Path $templatesDir)) {
        New-Item -ItemType Directory -Path $templatesDir -Force | Out-Null
    }

    # Extract and save script line
    $scriptLines = $content -split "`n" | Where-Object { $_ -like '*simple-3d-loader*' }

    # Extract style block
    $styleStart = $content.IndexOf('<!-- WebGL Container Styling -->')
    $styleEnd = $content.IndexOf('</style>', $styleStart) + 8
    $styleBlock = ""
    if ($styleStart -ge 0 -and $styleEnd -gt $styleStart) {
        $styleBlock = $content.Substring($styleStart, $styleEnd - $styleStart)
    }

    # Save to files for manual reference
    if ($scriptLines) {
        $scriptLines[0] | Set-Content (Join-Path $templatesDir "script.txt")
        Write-Host "Script extracted" -ForegroundColor Green
    }

    if ($styleBlock) {
        $styleBlock | Set-Content (Join-Path $templatesDir "styles.txt")
        Write-Host "Styles extracted" -ForegroundColor Green
    }
}

function Inject-Code {
    Write-Host "Injecting custom code..." -ForegroundColor Yellow
    $indexPath = Join-Path $stagingDir "index.html"
    $scriptFile = Join-Path $templatesDir "script.txt"
    $stylesFile = Join-Path $templatesDir "styles.txt"

    if (!(Test-Path $indexPath)) {
        Write-Host "index.html not found" -ForegroundColor Red
        return
    }

    $content = Get-Content $indexPath -Raw
    $originalContent = $content

    # Insert script if exists and not already present
    if ((Test-Path $scriptFile)) {
        $scriptContent = Get-Content $scriptFile -Raw
        if ($scriptContent -and $content -notmatch [regex]::Escape($scriptContent.Trim())) {
            $insertPoint = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
            $content = $content.Replace($insertPoint, "$insertPoint`n  `n  $($scriptContent.Trim())")
            Write-Host "Script injected" -ForegroundColor Green
        }
    }

    # Insert styles if exists and not already present
    if ((Test-Path $stylesFile)) {
        $stylesContent = Get-Content $stylesFile -Raw
        if ($stylesContent -and $content -notmatch "WebGL Container Styling") {
            $insertPoint = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
            $content = $content.Replace($insertPoint, "$insertPoint`n  `n  $stylesContent")
            Write-Host "Styles injected" -ForegroundColor Green
        }
    }

    # Save if changed
    if ($content -ne $originalContent) {
        $content | Set-Content $indexPath -NoNewline
        Write-Host "Injection complete!" -ForegroundColor Green
    } else {
        Write-Host "No changes needed" -ForegroundColor Blue
    }
}

# Execute command
switch ($Command) {
    "backup" { Backup-Files }
    "extract" { Extract-Code }
    "inject" { Inject-Code }
    default { Show-Help }
}