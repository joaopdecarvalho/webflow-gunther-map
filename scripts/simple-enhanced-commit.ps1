# Enhanced Smart Commit Script with Comprehensive Analysis
param([string]$CustomMessage = "")

Write-Host "[*] Analyzing repository changes..." -ForegroundColor Cyan

# Check for changes
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "[OK] No changes to commit" -ForegroundColor Green
    return
}

Write-Host "[*] Found changes:" -ForegroundColor Yellow
$changes | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

# Generate comprehensive commit message if not provided
if (-not $CustomMessage) {
    $changedFiles = git diff --name-only HEAD
    $untracked = git ls-files --others --exclude-standard
    $allFiles = @($changedFiles; $untracked) | Where-Object { $_ }
    
    # Count file changes
    $newFiles = @()
    $modifications = @()
    $deletions = @()
    
    foreach ($change in $changes) {
        $status = $change.Substring(0, 2).Trim()
        $file = $change.Substring(3)
        
        switch ($status) {
            "M" { $modifications += $file }
            "A" { $newFiles += $file }
            "D" { $deletions += $file }
            "??" { $newFiles += $file }
        }
    }
    
    # Smart categorization
    $type = "refactor"
    $scope = "core"
    $description = "update project files"
    $benefits = @()
    
    # Check for 3D map changes
    $has3dMap = $allFiles | Where-Object { $_ -match "3d-map" }
    if ($has3dMap) {
        $type = "feat"
        $scope = "3d-map"
        $description = "enhance 3D visualization system"
        $benefits += "improved 3D rendering and user interaction"
        $benefits += "enhanced camera controls and model loading"
    }
    
    # Check for configuration changes  
    $hasConfig = $allFiles | Where-Object { $_ -match "config" -or $_ -match "\.json$" }
    if ($hasConfig -and $type -eq "refactor") {
        $type = "config"
        $scope = "config"
        $description = "update configuration system"
        $benefits += "improved configuration management"
        $benefits += "enhanced environment detection"
    }
    
    # Check for Webflow changes
    $hasWebflow = $allFiles | Where-Object { $_ -match "webflow" -or $_ -match "embed" }
    if ($hasWebflow) {
        $type = "feat" 
        $scope = "webflow"
        $description = "improve Webflow integration"
        $benefits += "seamless Webflow site integration"
        $benefits += "enhanced cross-environment compatibility"
    }
    
    # Check for router changes
    $hasRouter = $allFiles | Where-Object { $_ -match "router" -or $_ -match "scripts/" }
    if ($hasRouter -and $type -eq "refactor") {
        $type = "feat"
        $scope = "router"
        $description = "enhance script loading system"
        $benefits += "improved script routing and loading"
        $benefits += "better environment detection"
    }
    
    # Check for documentation changes
    $hasDocs = $allFiles | Where-Object { $_ -match "\.md$" -or $_ -match "README" }
    if ($hasDocs -and $type -eq "refactor") {
        $type = "docs"
        $scope = "readme"
        $description = "update project documentation"
        $benefits += "improved developer experience"
        $benefits += "enhanced project understanding"
    }
    
    # Check for commit script changes
    $hasCommitScripts = $allFiles | Where-Object { $_ -match "commit.*\.ps1" -or $_ -match "smart-commit" }
    if ($hasCommitScripts) {
        $type = "build"
        $scope = "scripts"
        $description = "enhance commit automation"
        $benefits += "improved commit message generation"
        $benefits += "better change analysis and workflow"
    }
    
    # Build detailed message
    $fileCount = $allFiles.Count
    $newCount = $newFiles.Count
    $modCount = $modifications.Count
    
    $detailedDesc = $description
    
    # Add file counts if significant
    if ($newCount -gt 0 -and $modCount -gt 0) {
        $detailedDesc += " ($newCount new, $modCount modified)"
    } elseif ($newCount -gt 0) {
        $detailedDesc += " ($newCount new files)"
    } elseif ($modCount -gt 0) {
        $detailedDesc += " ($modCount files updated)"
    }
    
    # Add benefits
    if ($benefits.Count -gt 0) {
        $detailedDesc += "`n`nBenefits: " + ($benefits -join ", ")
    }
    
    # Add affected areas for large changes
    if ($fileCount -gt 3) {
        $areas = @()
        if ($allFiles | Where-Object { $_ -match "src/scripts" }) { $areas += "core scripts" }
        if ($allFiles | Where-Object { $_ -match "config" }) { $areas += "configuration" }
        if ($allFiles | Where-Object { $_ -match "webflow" }) { $areas += "Webflow integration" }
        if ($allFiles | Where-Object { $_ -match "\.md$" }) { $areas += "documentation" }
        if ($allFiles | Where-Object { $_ -match "scripts" }) { $areas += "automation" }
        
        if ($areas.Count -gt 0) {
            $detailedDesc += "`n`nAffected areas: " + ($areas -join ", ")
        }
    }
    
    $CustomMessage = "$type($scope): $detailedDesc"
}

Write-Host "`n[Generated commit message]:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host "$CustomMessage" -ForegroundColor White  
Write-Host "----------------------------------------" -ForegroundColor DarkGray

# Execute git commands automatically
Write-Host "`n[*] Staging changes..." -ForegroundColor Cyan
git add .

Write-Host "[*] Creating commit..." -ForegroundColor Cyan
git commit -m $CustomMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to create commit" -ForegroundColor Red
    return
}

$branch = git branch --show-current
Write-Host "[*] Pushing to $branch..." -ForegroundColor Cyan
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Success! Changes committed and pushed to $branch" -ForegroundColor Green
} else {
    Write-Host "[X] Failed to push changes" -ForegroundColor Red
}