# Smart Commit and Push Script for GitHub Copilot
# Usage: .\scripts\smart-commit.ps1 ["custom commit message"]

param(
    [string]$CustomMessage = ""
)

function Get-ChangeAnalysis {
    $statusOutput = git status --porcelain 2>$null
    $stagedFiles = git diff --cached --name-only 2>$null
    $unstagedFiles = git diff --name-only 2>$null
    $untrackedFiles = git ls-files --others --exclude-standard 2>$null
    
    $allChangedFiles = @($stagedFiles; $unstagedFiles; $untrackedFiles) | Where-Object { $_ } | Sort-Object -Unique
    
    return @{
        StatusOutput = $statusOutput
        StagedFiles = $stagedFiles
        UnstagedFiles = $unstagedFiles
        UntrackedFiles = $untrackedFiles
        AllChangedFiles = $allChangedFiles
        HasChanges = ($statusOutput.Length -gt 0)
    }
}

function Get-CommitType {
    param($files)
    
    # Analyze file patterns to determine commit type
    $hasNewFeatures = $files | Where-Object { 
        $_ -match "\.(js|html|css)$" -and 
        (Select-String -Path $_ -Pattern "(new|add|create|implement)" -Quiet 2>$null)
    }
    
    $hasConfigChanges = $files | Where-Object { $_ -match "(config|\.json|\.yaml|\.yml)$" }
    $hasDocChanges = $files | Where-Object { $_ -match "(?i)(readme|\.md|docs/)" }
    $hasStyleChanges = $files | Where-Object { $_ -match "\.(css|scss|less)$" }
    $hasTestChanges = $files | Where-Object { $_ -match "(test|spec)" }
    $hasBugFixes = $files | Where-Object { 
        $_ -match "\.(js|html|css)$" -and 
        (Select-String -Path $_ -Pattern "(fix|bug|error|issue)" -Quiet 2>$null)
    }
    
    # Determine primary type
    if ($hasBugFixes) { return "fix" }
    if ($hasNewFeatures) { return "feat" }
    if ($hasConfigChanges -and !$hasNewFeatures) { return "config" }
    if ($hasDocChanges -and ($files.Count -eq ($hasDocChanges | Measure-Object).Count)) { return "docs" }
    if ($hasStyleChanges -and !$hasNewFeatures -and !$hasBugFixes) { return "style" }
    if ($hasTestChanges) { return "test" }
    
    return "refactor"
}

function Get-CommitScope {
    param($files)
    
    # Determine scope based on file locations and names
    $webflowFiles = $files | Where-Object { $_ -match "(webflow|embed)" }
    $configFiles = $files | Where-Object { $_ -match "config" }
    $mapFiles = $files | Where-Object { $_ -match "3d-map" }
    $routerFiles = $files | Where-Object { $_ -match "router" }
    $testFiles = $files | Where-Object { $_ -match "(test|spec)" }
    $srcFiles = $files | Where-Object { $_ -match "src/" }
    
    if ($webflowFiles) { return "webflow" }
    if ($mapFiles) { return "3d-map" }
    if ($configFiles) { return "config" }
    if ($routerFiles) { return "router" }
    if ($testFiles) { return "test" }
    if ($srcFiles) { return "core" }
    
    return "project"
}

function New-CommitMessage {
    param($analysis)
    
    if (-not $analysis.HasChanges) {
        return $null
    }
    
    $type = Get-CommitType $analysis.AllChangedFiles
    $scope = Get-CommitScope $analysis.AllChangedFiles
    
    # Generate descriptive message based on file changes
    $fileCount = ($analysis.AllChangedFiles | Measure-Object).Count
    $descriptions = @()
    
    # Analyze specific changes
    if ($analysis.AllChangedFiles | Where-Object { $_ -match "config.*\.json" }) {
        $descriptions += "update configuration settings"
    }
    
    if ($analysis.AllChangedFiles | Where-Object { $_ -match "webflow.*embed" }) {
        $descriptions += "enhance embed code functionality"
    }
    
    if ($analysis.AllChangedFiles | Where-Object { $_ -match "3d-map.*\.js" }) {
        $descriptions += "improve 3D map implementation"
    }
    
    if ($analysis.AllChangedFiles | Where-Object { $_ -match "router\.js" }) {
        $descriptions += "update script routing logic"
    }
    
    if ($analysis.AllChangedFiles | Where-Object { $_ -match "\.md$" }) {
        $descriptions += "update documentation"
    }
    
    if ($analysis.UntrackedFiles) {
        $descriptions += "add new files"
    }
    
    # Create main description
    $mainDescription = if ($descriptions.Count -gt 0) {
        $descriptions[0]
    } else {
        if ($fileCount -eq 1) {
            "update $(Split-Path -Leaf $analysis.AllChangedFiles[0])"
        } else {
            "update multiple files"
        }
    }
    
    # Add additional context for multiple changes
    $additionalContext = ""
    if ($descriptions.Count -gt 1) {
        $additionalContext = "`n`nChanges include:"
        $descriptions | ForEach-Object { $additionalContext += "`n- $_" }
    }
    
    return "${type}(${scope}): ${mainDescription}${additionalContext}"
}

function Main {
    Write-Host "🔍 Analyzing repository changes..." -ForegroundColor Cyan
    
    # Check if we're in a git repository
    $isGitRepo = git rev-parse --is-inside-work-tree 2>$null
    if (-not $isGitRepo) {
        Write-Host "❌ Error: Not in a Git repository" -ForegroundColor Red
        exit 1
    }
    
    # Get current branch
    $currentBranch = git branch --show-current
    Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow
    
    # Analyze changes
    $analysis = Get-ChangeAnalysis
    
    if (-not $analysis.HasChanges) {
        Write-Host "✅ No changes to commit" -ForegroundColor Green
        return
    }
    
    # Display change summary
    Write-Host "`n📊 Change Summary:" -ForegroundColor Cyan
    if ($analysis.StagedFiles) {
        Write-Host "   Staged files: $($analysis.StagedFiles.Count)" -ForegroundColor Green
        $analysis.StagedFiles | ForEach-Object { Write-Host "     + $_" -ForegroundColor Green }
    }
    if ($analysis.UnstagedFiles) {
        Write-Host "   Modified files: $($analysis.UnstagedFiles.Count)" -ForegroundColor Yellow
        $analysis.UnstagedFiles | ForEach-Object { Write-Host "     ~ $_" -ForegroundColor Yellow }
    }
    if ($analysis.UntrackedFiles) {
        Write-Host "   New files: $($analysis.UntrackedFiles.Count)" -ForegroundColor Blue
        $analysis.UntrackedFiles | ForEach-Object { Write-Host "     ? $_" -ForegroundColor Blue }
    }
    
    # Generate or use custom commit message
    if ($CustomMessage) {
        $commitMessage = $CustomMessage
        Write-Host "`n💬 Using custom commit message: $commitMessage" -ForegroundColor Magenta
    } else {
        $commitMessage = New-CommitMessage $analysis
        Write-Host "`n🤖 Generated commit message:" -ForegroundColor Cyan
        Write-Host "   $commitMessage" -ForegroundColor White
    }
    
    # Confirm before proceeding
    Write-Host "`n❓ Proceed with commit and push? [Y/n]: " -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host
    
    if ($confirmation -eq "n" -or $confirmation -eq "N") {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        return
    }
    
    try {
        # Stage all changes
        Write-Host "`n📦 Staging all changes..." -ForegroundColor Cyan
        git add .
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to stage changes"
        }
        
        # Commit changes
        Write-Host "💾 Creating commit..." -ForegroundColor Cyan
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create commit"
        }
        
        # Push changes
        Write-Host "🚀 Pushing to $currentBranch..." -ForegroundColor Cyan
        git push origin $currentBranch
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to push changes"
        }
        
        Write-Host "`n✅ Successfully committed and pushed changes!" -ForegroundColor Green
        Write-Host "📝 Commit message: $commitMessage" -ForegroundColor White
        
    } catch {
        Write-Host "`n❌ Error: $_" -ForegroundColor Red
        Write-Host "🔄 You may need to resolve conflicts or check your git configuration" -ForegroundColor Yellow
        exit 1
    }
}

# Run the main function
Main