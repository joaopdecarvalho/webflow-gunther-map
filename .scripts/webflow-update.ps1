# Webflow Update PowerShell Script - Simple Custom Code Management
# Usage: .\webflow-update.ps1 [backup|extract|inject]

param(
    [Parameter(Position=0)]
    [ValidateSet("backup", "extract", "inject", "help")]
    [string]$Command = "help"
)

$stagingDir = "..\webflow-staging-site-files"
$backupDir = "..\.backups"
$templatesDir = "..\.templates"

function Show-Help {
    Write-Host "🚀 Webflow Update System - Custom Code Manager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  backup  - Create backup of current staging files" -ForegroundColor Green
    Write-Host "  extract - Extract custom code from current files" -ForegroundColor Green
    Write-Host "  inject  - Apply custom code to fresh export" -ForegroundColor Green
    Write-Host ""
    Write-Host "Example Workflow:" -ForegroundColor Yellow
    Write-Host "1. .\webflow-update.ps1 backup" -ForegroundColor White
    Write-Host "2. .\webflow-update.ps1 extract" -ForegroundColor White
    Write-Host "3. [Replace files with fresh Webflow export]" -ForegroundColor Magenta
    Write-Host "4. .\webflow-update.ps1 inject" -ForegroundColor White
}

function Backup-CurrentFiles {
    Write-Host "🔄 Creating backup of current files..." -ForegroundColor Yellow

    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupPath = Join-Path $backupDir "webflow-backup-$timestamp"

    # Create backup directory
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }

    # Copy staging directory
    if (Test-Path $stagingDir) {
        Copy-Item -Path $stagingDir -Destination $backupPath -Recurse -Force
        Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
        return $backupPath
    } else {
        Write-Host "❌ Staging directory not found: $stagingDir" -ForegroundColor Red
        return $null
    }
}

function Extract-CustomCode {
    Write-Host "🔍 Extracting custom code from index.html..." -ForegroundColor Yellow

    $indexPath = Join-Path $stagingDir "index.html"

    if (!(Test-Path $indexPath)) {
        Write-Host "❌ index.html not found: $indexPath" -ForegroundColor Red
        return
    }

    $content = Get-Content $indexPath -Raw
    $customCode = @{
        scripts = @()
        styles = @()
    }

    # Extract 3D Loader Script
    if ($content -match '.*simple-3d-loader\.js.*') {
        $scriptLine = ($content -split "`n" | Where-Object { $_ -match 'simple-3d-loader\.js' })[0]
        if ($scriptLine) {
            $customCode.scripts += @{
                type = "3d-loader-script"
                content = $scriptLine.Trim()
                description = "Simple 3D Loader Script"
            }
            Write-Host "✅ Found: Simple 3D Loader Script" -ForegroundColor Green
        }
    }

    # Extract WebGL Styling (between WebGL Container Styling comment and </style>)
    $stylePattern = '(?s)<!-- WebGL Container Styling -->.*?</style>'
    $styleMatch = [regex]::Match($content, $stylePattern)

    if ($styleMatch.Success) {
        $customCode.styles += @{
            type = "webgl-styles"
            content = $styleMatch.Value
            description = "WebGL Container and Camera Panel Styles"
        }
        Write-Host "✅ Found: WebGL Container Styles" -ForegroundColor Green
    }

    # Create templates directory
    if (!(Test-Path $templatesDir)) {
        New-Item -ItemType Directory -Path $templatesDir -Force | Out-Null
    }

    # Save as JSON template
    $template = @{
        metadata = @{
            extractedDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
            description = "Custom code templates for Webflow site updates"
            version = "1.0.0"
        }
        scripts = $customCode.scripts
        styles = $customCode.styles
    }

    $templatePath = Join-Path $templatesDir "custom-code-templates.json"
    $template | ConvertTo-Json -Depth 10 | Set-Content $templatePath

    # Create readable template
    $readableTemplate = "# Custom Code Templates`n`n"

    if ($customCode.scripts.Count -gt 0) {
        $readableTemplate += "## Scripts`n"
        foreach ($script in $customCode.scripts) {
            $readableTemplate += "### $($script.description)`n````html`n$($script.content)`n````n`n"
        }
    }

    if ($customCode.styles.Count -gt 0) {
        $readableTemplate += "## Styles`n"
        foreach ($style in $customCode.styles) {
            $readableTemplate += "### $($style.description)`n````html`n$($style.content)`n````n`n"
        }
    }

    $readablePath = Join-Path $templatesDir "custom-code-templates.md"
    $readableTemplate | Set-Content $readablePath

    Write-Host "✅ Custom code extracted to: $templatePath" -ForegroundColor Green
    Write-Host "📋 Readable template: $readablePath" -ForegroundColor Green
}

function Inject-CustomCode {
    Write-Host "💉 Injecting custom code into fresh export..." -ForegroundColor Yellow

    $templatePath = Join-Path $templatesDir "custom-code-templates.json"
    $indexPath = Join-Path $stagingDir "index.html"

    if (!(Test-Path $templatePath)) {
        Write-Host "❌ No templates found. Run 'extract' first." -ForegroundColor Red
        return
    }

    if (!(Test-Path $indexPath)) {
        Write-Host "❌ index.html not found: $indexPath" -ForegroundColor Red
        return
    }

    # Load templates
    $templates = Get-Content $templatePath | ConvertFrom-Json
    $content = Get-Content $indexPath -Raw
    $originalContent = $content

    # Inject scripts
    foreach ($script in $templates.scripts) {
        if ($content -notmatch [regex]::Escape($script.content)) {
            # Insert after webclip line
            $insertAfter = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
            $replacement = "$insertAfter`n  `n  $($script.content)"
            $content = $content -replace [regex]::Escape($insertAfter), $replacement
            Write-Host "✅ Injected: $($script.description)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Already exists: $($script.description)" -ForegroundColor Yellow
        }
    }

    # Inject styles
    foreach ($style in $templates.styles) {
        if ($content -notmatch "WebGL Container Styling") {
            # Insert after webclip line
            $insertAfter = '<link href="images/webclip.jpg" rel="apple-touch-icon">'
            $replacement = "$insertAfter`n  `n  $($style.content)"
            $content = $content -replace [regex]::Escape($insertAfter), $replacement
            Write-Host "✅ Injected: $($style.description)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Already exists: $($style.description)" -ForegroundColor Yellow
        }
    }

    # Save updated content
    if ($content -ne $originalContent) {
        $content | Set-Content $indexPath -NoNewline
        Write-Host "✅ Custom code injection complete!" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No changes needed - all custom code already present" -ForegroundColor Blue
    }
}

# Main execution
switch ($Command) {
    "backup" {
        Backup-CurrentFiles
    }
    "extract" {
        Extract-CustomCode
    }
    "inject" {
        Inject-CustomCode
    }
    "help" {
        Show-Help
    }
    default {
        Show-Help
    }
}