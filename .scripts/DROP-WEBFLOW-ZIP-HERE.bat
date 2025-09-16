@echo off
setlocal enabledelayedexpansion

echo ========================================
echo      DRAG & DROP WEBFLOW UPDATER
echo ========================================
echo.

:: Check if a file was dragged and dropped
if "%~1"=="" (
    echo ❌ No file provided!
    echo.
    echo HOW TO USE:
    echo 1. Download your Webflow site as ZIP
    echo 2. DRAG the ZIP file onto this .bat file
    echo 3. The script will automatically:
    echo    - Extract your ZIP
    echo    - Inject your 3D loader code
    echo    - Update your staging folder
    echo.
    echo OR run WEBFLOW-ZIP-UPDATER.bat for the menu version
    echo.
    pause
    exit /b 1
)

set "ZIPFILE=%~1"

:: Check if it's a ZIP file
if /i not "%~x1"==".zip" (
    echo ❌ Please drop a ZIP file, not %~x1
    echo.
    pause
    exit /b 1
)

if not exist "%ZIPFILE%" (
    echo ❌ File not found: %ZIPFILE%
    pause
    exit /b 1
)

echo 🎯 Processing: %~nx1
echo.

:: Check if custom code templates exist
if not exist "..\.templates\styles.txt" (
    echo ⚠️ No custom code templates found!
    echo.
    echo Please run this first:
    echo 1. Double-click WEBFLOW-ZIP-UPDATER.bat
    echo 2. Choose option 2 (EXTRACT custom code)
    echo.
    pause
    exit /b 1
)

:: Create backup of current files
echo 🔄 Creating backup...
set timestamp=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
if not exist "..\.backups" mkdir "..\.backups"

if exist "..\webflow-staging-site-files" (
    xcopy "..\webflow-staging-site-files" "..\.backups\backup-%timestamp%\" /E /I /Q /Y
    echo ✅ Backup created: backup-%timestamp%
)

:: Clear staging folder
echo 🗑️ Clearing staging folder...
if exist "..\webflow-staging-site-files" rmdir /s /q "..\webflow-staging-site-files"
mkdir "..\webflow-staging-site-files"

:: Extract ZIP
echo 📤 Extracting ZIP file...
powershell -Command "try { Expand-Archive -Path '%ZIPFILE%' -DestinationPath '../webflow-staging-site-files' -Force; Write-Host '✅ ZIP extracted successfully' } catch { Write-Host '❌ Error extracting ZIP: ' + $_.Exception.Message; exit 1 }"

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found in ZIP! Check your Webflow export.
    pause
    exit /b 1
)

:: Inject custom code
echo.
echo 💉 Injecting your custom 3D loader code...

cd "..\webflow-staging-site-files"

:: Backup fresh file
copy index.html index-fresh-backup.html >nul

:: Inject styles
powershell -Command "try { $content = Get-Content 'index.html' -Raw; $styles = Get-Content '../.templates/styles.txt' -Raw; if ($styles -and $content -notmatch 'WebGL Container Styling') { $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n  \" + $styles); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ WebGL styles injected' } else { Write-Host '⚠️ Styles already present' } } catch { Write-Host '❌ Error with styles: ' + $_.Exception.Message }"

:: Inject script
powershell -Command "try { $content = Get-Content 'index.html' -Raw; if ($content -notmatch 'simple-3d-loader') { $script = '  <!-- Simple 3D Loader Script -->`n  <script src=\"http://localhost:8080/src/scripts/simple-3d-loader.js\"></script>'; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n\" + $script); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ 3D Loader script injected' } else { Write-Host '⚠️ Script already present' } } catch { Write-Host '❌ Error with script: ' + $_.Exception.Message }"

cd "..\.scripts"

echo.
echo 🎉 SUCCESS! Your Webflow site is updated with:
echo    ✅ WebGL container styling
echo    ✅ Camera panel styles
echo    ✅ Simple 3D Loader script
echo.
echo 🚀 Next steps:
echo    1. Test locally: Open index.html in browser
echo    2. Check console for "Simple 3D Loader" messages
echo    3. Deploy to production when ready
echo.
echo Files location: webflow-staging-site-files\
echo.
pause