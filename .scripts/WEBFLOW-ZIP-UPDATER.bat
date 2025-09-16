@echo off
setlocal enabledelayedexpansion

echo ========================================
echo     WEBFLOW ZIP UPDATE SYSTEM
echo ========================================
echo.

:menu
echo Choose an option:
echo.
echo 1. BACKUP current files
echo 2. EXTRACT custom code (before getting new ZIP)
echo 3. PROCESS WEBFLOW ZIP (extract + inject custom code)
echo 4. INJECT custom code only
echo 5. Exit
echo.
set /p choice="Choice (1-5): "

if "%choice%"=="1" goto backup
if "%choice%"=="2" goto extract
if "%choice%"=="3" goto process_zip
if "%choice%"=="4" goto inject
if "%choice%"=="5" goto exit

echo Invalid choice. Try again.
goto menu

:backup
echo.
echo 🔄 Creating backup...
set timestamp=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
if not exist "..\.backups" mkdir "..\.backups"
if exist "..\webflow-staging-site-files" (
    echo Backing up staging files...
    xcopy "..\webflow-staging-site-files" "..\.backups\backup-%timestamp%\" /E /I /Q /Y
    echo ✅ Backup created: .backups\backup-%timestamp%
) else (
    echo ❌ No staging files found to backup
)
echo.
pause
goto menu

:extract
echo.
echo 🔍 Extracting custom code from current files...

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found in staging folder
    pause
    goto menu
)

if not exist "..\.templates" mkdir "..\.templates"

cd "..\webflow-staging-site-files"

echo Extracting script reference...
findstr /C:"simple-3d-loader" index.html > "..\.templates\script.txt" 2>nul

echo Extracting WebGL styles...
powershell -Command "try { $content = Get-Content 'index.html' -Raw -ErrorAction Stop; $startIdx = $content.IndexOf('<!-- WebGL Container Styling -->'); $endIdx = $content.IndexOf('</style>', $startIdx); if ($startIdx -ge 0 -and $endIdx -gt $startIdx) { $styles = $content.Substring($startIdx, $endIdx - $startIdx + 8); $styles | Set-Content '../.templates/styles.txt' -NoNewline; Write-Host 'Styles extracted successfully' } else { Write-Host 'WebGL styles not found' } } catch { Write-Host 'Error extracting styles' }"

cd "..\.scripts"

echo.
echo ✅ Custom code extracted to .templates folder
dir "..\.templates" /b
echo.
pause
goto menu

:process_zip
echo.
echo 📦 WEBFLOW ZIP PROCESSOR
echo ========================
echo.
echo This will:
echo 1. Ask you to select your Webflow ZIP file
echo 2. Extract it to staging folder
echo 3. Automatically inject your custom code
echo.
echo Make sure you ran EXTRACT first!
echo.
set /p continue="Continue? (y/n): "
if /i "%continue%" neq "y" goto menu

echo.
echo 📁 Please select your Webflow ZIP file...

:: Use PowerShell to show file picker
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog; $OpenFileDialog.Filter = 'ZIP files (*.zip)|*.zip'; $OpenFileDialog.Title = 'Select Webflow ZIP file'; if ($OpenFileDialog.ShowDialog() -eq 'OK') { $OpenFileDialog.FileName } else { 'CANCELLED' }" > temp_zippath.txt

set /p ZIPPATH=<temp_zippath.txt
del temp_zippath.txt

if "%ZIPPATH%"=="CANCELLED" (
    echo Operation cancelled.
    pause
    goto menu
)

if not exist "%ZIPPATH%" (
    echo ❌ ZIP file not found: %ZIPPATH%
    pause
    goto menu
)

echo.
echo ✅ Selected: %ZIPPATH%
echo.

:: Clear existing staging folder
echo 🗑️ Clearing old staging files...
if exist "..\webflow-staging-site-files" (
    rmdir /s /q "..\webflow-staging-site-files"
)
mkdir "..\webflow-staging-site-files"

:: Extract ZIP using PowerShell
echo 📤 Extracting ZIP file...
powershell -Command "try { Expand-Archive -Path '%ZIPPATH%' -DestinationPath '../webflow-staging-site-files' -Force; Write-Host 'ZIP extracted successfully' } catch { Write-Host 'Error extracting ZIP: ' + $_.Exception.Message }"

:: Check if extraction worked
if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ ZIP extraction failed or no index.html found
    pause
    goto menu
)

echo ✅ ZIP extracted to staging folder
echo.

:: Auto-inject custom code
call :inject_code

echo.
echo 🎉 COMPLETE! Your fresh Webflow export now has your custom 3D code.
echo.
pause
goto menu

:inject
echo.
echo 💉 Injecting custom code...
call :inject_code
pause
goto menu

:inject_code
if not exist "..\.templates\styles.txt" (
    echo ❌ No custom code templates found. Run EXTRACT first.
    goto :eof
)

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found in staging folder
    goto :eof
)

cd "..\webflow-staging-site-files"

echo Creating backup of fresh index.html...
copy index.html index-fresh.html.backup >nul

:: Inject styles
echo Injecting WebGL styles...
powershell -Command "try { $content = Get-Content 'index.html' -Raw -ErrorAction Stop; $styles = Get-Content '../.templates/styles.txt' -Raw -ErrorAction Stop; if ($styles -and $content -notmatch 'WebGL Container Styling') { $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $replacement = $insertPoint + \"`n  `n  \" + $styles; $content = $content.Replace($insertPoint, $replacement); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ Styles injected' } else { Write-Host '⚠️ Styles already present or template missing' } } catch { Write-Host '❌ Error injecting styles: ' + $_.Exception.Message }"

:: Inject script
echo Injecting 3D Loader script...
powershell -Command "try { $content = Get-Content 'index.html' -Raw -ErrorAction Stop; if ($content -notmatch 'simple-3d-loader') { $script = '  <!-- Simple 3D Loader Script -->`n  <script src=\"http://localhost:8080/src/scripts/simple-3d-loader.js\"></script>'; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $replacement = $insertPoint + \"`n  `n\" + $script; $content = $content.Replace($insertPoint, $replacement); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ Script injected' } else { Write-Host '⚠️ Script already present' } } catch { Write-Host '❌ Error injecting script: ' + $_.Exception.Message }"

cd "..\.scripts"
echo ✅ Custom code injection complete!
goto :eof

:exit
echo.
echo 👋 Done! Your Webflow site is ready.
exit

:start
goto menu