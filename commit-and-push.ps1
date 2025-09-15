#!/usr/bin/env pwsh
# Quick wrapper for the smart commit script
# Usage: ./commit-and-push.ps1 ["custom message"]

param([string]$Message = "")

$scriptPath = Join-Path $PSScriptRoot "scripts\simple-commit.ps1"

if ($Message) {
    & $scriptPath -CustomMessage $Message
} else {
    & $scriptPath
}