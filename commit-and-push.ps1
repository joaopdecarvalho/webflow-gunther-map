#!/usr/bin/env pwsh
# Enhanced Smart Commit and Push Script
# Generates comprehensive commit messages with detailed change analysis and benefits
# Usage: ./commit-and-push.ps1 ["custom message"]

param([string]$CustomMessage = "")

# Use the simple enhanced commit script
$enhancedCommitPath = Join-Path $PSScriptRoot "scripts\simple-enhanced-commit.ps1"

if (Test-Path $enhancedCommitPath) {
    if ($CustomMessage) {
        & $enhancedCommitPath -CustomMessage $CustomMessage
    } else {
        & $enhancedCommitPath
    }
} else {
    Write-Host "[X] Enhanced commit script not found at: $enhancedCommitPath" -ForegroundColor Red
    Write-Host "Please ensure scripts\simple-enhanced-commit.ps1 exists" -ForegroundColor Yellow
}