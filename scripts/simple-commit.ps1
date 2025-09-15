# Simple Smart Commit Script
param([string]$CustomMessage = "")

Write-Host "🔍 Analyzing repository changes..." -ForegroundColor Cyan

# Check for changes
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    return
}

Write-Host "📊 Found changes:" -ForegroundColor Yellow
$changes | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

# Generate commit message if not provided
if (-not $CustomMessage) {
    $changedFiles = git diff --name-only HEAD
    $untracked = git ls-files --others --exclude-standard
    $allFiles = @($changedFiles; $untracked) | Where-Object { $_ }
    
    # Simple commit type detection
    $type = "refactor"
    $scope = "project"
    
    if ($allFiles | Where-Object { $_ -match "config" }) {
        $type = "config"
        $scope = "config"
    }
    if ($allFiles | Where-Object { $_ -match "webflow" }) {
        $type = "feat"
        $scope = "webflow"
    }
    if ($allFiles | Where-Object { $_ -match "3d-map" }) {
        $type = "feat"
        $scope = "3d-map"
    }
    if ($allFiles | Where-Object { $_ -match "\.md$" }) {
        $type = "docs"
        $scope = "readme"
    }
    
    $CustomMessage = "$type($scope): update project files"
}

Write-Host "`n💬 Commit message: $CustomMessage" -ForegroundColor Cyan

# Confirm
Write-Host "`n❓ Proceed with commit and push? [Y/n]: " -ForegroundColor Yellow -NoNewline
$confirm = Read-Host
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    return
}

# Execute git commands
Write-Host "`n📦 Staging changes..." -ForegroundColor Cyan
git add .

Write-Host "💾 Creating commit..." -ForegroundColor Cyan
git commit -m $CustomMessage

$branch = git branch --show-current
Write-Host "🚀 Pushing to $branch..." -ForegroundColor Cyan
git push origin $branch

Write-Host "`n✅ Success!" -ForegroundColor Green