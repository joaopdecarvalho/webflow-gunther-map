@echo off
setlocal enabledelayedexpansion
title Webflow ZIP Processor - Final Solution

echo ================================================
echo       WEBFLOW ZIP PROCESSOR - WORKING VERSION
echo ================================================
echo.

:menu
echo What do you want to do?
echo.
echo 1. FIRST TIME SETUP (extract templates from current site)
echo 2. PROCESS NEW WEBFLOW ZIP (automatic)
echo 3. Test with sample ZIP in backups folder
echo 4. Manual help
echo 5. Exit
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto process
if "%choice%"=="3" goto test
if "%choice%"=="4" goto help
if "%choice%"=="5" exit
echo Invalid choice. Try again.
goto menu

:setup
echo.
echo ===========================================
echo  FIRST TIME SETUP - EXTRACTING TEMPLATES
echo ===========================================
echo.
echo This will extract your custom 3D code from the CURRENT staging files
echo so it can be preserved when updating with fresh Webflow exports.
echo.

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No current staging files found!
    echo.
    echo Please make sure your current Webflow site with 3D code is in:
    echo   webflow-staging-site-files\index.html
    echo.
    echo If you need to set this up:
    echo 1. Put your current working site in webflow-staging-site-files\
    echo 2. Run this setup again
    echo.
    pause
    goto menu
)

:: Create templates directory
if not exist "..\.templates" mkdir "..\.templates"

echo ✅ Found current staging files
echo 🔍 Extracting your custom 3D loader settings...

cd "..\webflow-staging-site-files"

:: Check what version of script URL is currently used
findstr "simple-3d-loader" index.html | findstr "localhost" >nul 2>&1
if not errorlevel 1 (
    echo   📍 Current setup uses LOCALHOST URL
    echo     ^<script src="http://localhost:8080/src/scripts/simple-3d-loader.js"^>^</script^> > "..\.templates\script-localhost.txt"
    set SCRIPT_TYPE=localhost
) else (
    echo   🌐 Current setup uses PRODUCTION URL
    for /f "tokens=*" %%A in ('findstr "simple-3d-loader" index.html') do (
        echo %%A > "..\.templates\script-production.txt"
        set SCRIPT_TYPE=production
    )
)

:: Extract ALL WebGL/3D related styling
echo 🎨 Extracting WebGL container styling...
powershell -Command "try { $content = Get-Content 'index.html' -Raw; $patterns = @('WebGL Container Styling', 'Anti-Flash Styling', 'webgl-container', 'camera-panel'); foreach ($pattern in $patterns) { if ($content -match \"(?s)<!--.*?$pattern.*?-->.*?</style>\") { $matches[0] | Set-Content '../.templates/extracted-styles.txt' -NoNewline; Write-Host \"Extracted styles with pattern: $pattern\"; break } } if (!(Test-Path '../.templates/extracted-styles.txt')) { Write-Host \"No WebGL styles found\" } } catch { Write-Host \"Error: $($_.Exception.Message)\" }"

cd "..\.scripts"

echo.
echo ✅ SETUP COMPLETE!
echo.
echo Templates created:
if exist "..\.templates\script-localhost.txt" echo   📍 script-localhost.txt (for development)
if exist "..\.templates\script-production.txt" echo   🌐 script-production.txt (for production)
if exist "..\.templates\extracted-styles.txt" (
    echo   🎨 extracted-styles.txt (WebGL styling)
) else (
    echo   ❌ extracted-styles.txt (NOT FOUND - check manually)
)

echo.
echo 🎯 What this means:
echo   ✅ Your custom 3D code is now saved as templates
echo   ✅ When you process new Webflow ZIPs, your settings will be preserved
echo   ✅ You can switch between localhost (dev) and production URLs
echo.
pause
goto menu

:process
echo.
echo =========================================
echo  PROCESSING NEW WEBFLOW ZIP FILE
echo =========================================
echo.

:: Check if templates exist
if not exist "..\.templates\extracted-styles.txt" (
    echo ❌ No templates found!
    echo.
    echo Please run option 1 (FIRST TIME SETUP) first to extract your templates.
    echo.
    pause
    goto menu
)

echo This will:
echo 1. Let you select your fresh Webflow ZIP file
echo 2. Extract it to replace your staging files
echo 3. Automatically inject your saved 3D code
echo.
set /p continue="Continue? (y/n): "
if /i "%continue%" neq "y" goto menu

:: File picker
echo 📁 Please select your Webflow ZIP file...
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.Filter = 'ZIP files (*.zip)|*.zip'; $dialog.Title = 'Select Webflow ZIP file'; if ($dialog.ShowDialog() -eq 'OK') { $dialog.FileName } else { 'CANCELLED' }" > temp_zip.txt

set /p ZIPFILE=<temp_zip.txt
del temp_zip.txt

if "%ZIPFILE%"=="CANCELLED" (
    echo Operation cancelled.
    pause
    goto menu
)

if not exist "%ZIPFILE%" (
    echo ❌ File not found: %ZIPFILE%
    pause
    goto menu
)

echo.
echo 🎯 Processing: %~nxZIPFILE%

call :process_zip "%ZIPFILE%"
pause
goto menu

:test
echo.
echo 🧪 TESTING WITH SAMPLE ZIP
echo.
set "TESTZIP=C:\Users\joao\Documents\My Scripts\webflow-gunther-map\.backups\go-goethe-quartier-ebde32.webflow (1).zip"

if not exist "%TESTZIP%" (
    echo ❌ Sample ZIP not found
    echo Expected: %TESTZIP%
    pause
    goto menu
)

echo ✅ Found test ZIP: go-goethe-quartier-ebde32.webflow (1).zip
call :process_zip "%TESTZIP%"
pause
goto menu

:process_zip
set "ZIPFILE=%~1"

echo.
echo 🔄 Step 1: Creating backup...
set timestamp=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
if not exist "..\.backups" mkdir "..\.backups"
if exist "..\webflow-staging-site-files" (
    xcopy "..\webflow-staging-site-files" "..\.backups\backup-%timestamp%\" /E /I /Q /Y >nul 2>&1
    echo ✅ Backup created: backup-%timestamp%
)

echo.
echo 📤 Step 2: Extracting fresh ZIP...
if exist "..\webflow-staging-site-files" rmdir /s /q "..\webflow-staging-site-files" >nul 2>&1
mkdir "..\webflow-staging-site-files"

powershell -Command "try { Expand-Archive -Path '%ZIPFILE%' -DestinationPath '../webflow-staging-site-files' -Force; Write-Host 'ZIP extracted successfully' } catch { Write-Host 'ERROR: ZIP extraction failed - ' + $_.Exception.Message; exit 1 }"
if errorlevel 1 (
    echo ❌ ZIP extraction failed!
    goto :eof
)

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found in ZIP!
    goto :eof
)

echo ✅ Fresh Webflow files extracted

echo.
echo 💉 Step 3: Injecting your custom 3D code...

cd "..\webflow-staging-site-files"

:: Backup original
copy index.html index-original-fresh.html >nul 2>&1

:: Inject script (choose localhost or production)
if exist "..\.templates\script-localhost.txt" (
    echo 📍 Injecting LOCALHOST script for development...
    set /p SCRIPT=<"..\.templates\script-localhost.txt"

    powershell -Command "try { $content = Get-Content 'index.html' -Raw; $content = $content -replace '<script[^>]*simple-3d-loader[^>]*></script>', ''; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $newScript = '  ' + '<!-- Simple 3D Loader Script (Development) -->' + \"`n  \" + '!SCRIPT!'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n\" + $newScript); $content | Set-Content 'index.html' -NoNewline; Write-Host 'Localhost script injected' } catch { Write-Host 'Script injection failed: ' + $_.Exception.Message }"
) else if exist "..\.templates\script-production.txt" (
    echo 🌐 Injecting PRODUCTION script...
    set /p SCRIPT=<"..\.templates\script-production.txt"

    powershell -Command "try { $content = Get-Content 'index.html' -Raw; $content = $content -replace '<script[^>]*simple-3d-loader[^>]*></script>', ''; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $newScript = '  ' + '<!-- Simple 3D Loader Script (Production) -->' + \"`n  \" + '!SCRIPT!'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n\" + $newScript); $content | Set-Content 'index.html' -NoNewline; Write-Host 'Production script injected' } catch { Write-Host 'Script injection failed: ' + $_.Exception.Message }"
)

:: Inject styles
if exist "..\.templates\extracted-styles.txt" (
    echo 🎨 Injecting WebGL container styling...

    powershell -Command "try { $content = Get-Content 'index.html' -Raw; $styles = Get-Content '../.templates/extracted-styles.txt' -Raw; if ($styles) { $content = $content -replace '(?s)<!--.*?Anti-Flash.*?Styling.*?-->.*?</style>', ''; $content = $content -replace '(?s)<!--.*?WebGL Container Styling.*?-->.*?</style>', ''; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n  \" + $styles); $content | Set-Content 'index.html' -NoNewline; Write-Host 'Custom WebGL styles injected' } else { Write-Host 'Empty styles template' } } catch { Write-Host 'Styles injection failed: ' + $_.Exception.Message }"
)

cd "..\.scripts"

echo.
echo 🎉 PROCESSING COMPLETE!
echo ================================================
echo ✅ Your fresh Webflow site now includes:
if exist "..\.templates\script-localhost.txt" echo    📍 Simple 3D Loader (localhost for development)
if exist "..\.templates\script-production.txt" echo    🌐 Simple 3D Loader (production URL)
echo    🎨 WebGL container styling
echo    🎮 Camera controls and panels
echo ================================================
echo.
echo 🌐 TESTING: Open webflow-staging-site-files\index.html in browser
echo 📊 Check console for: "Simple 3D Loader script loaded"
echo 🎯 Verify 3D model loads and controls work
echo.
echo 📁 Files are ready in: webflow-staging-site-files\
echo.
goto :eof

:help
echo.
echo =======================================
echo         MANUAL PROCESS
echo =======================================
echo.
echo If the automatic process doesn't work:
echo.
echo 1. EXTRACT YOUR ZIP MANUALLY:
echo    - Extract Webflow ZIP to webflow-staging-site-files\
echo.
echo 2. ADD 3D LOADER SCRIPT:
echo    Add this after the webclip.jpg line in index.html:
if exist "..\.templates\script-localhost.txt" (
    echo.
    echo    For DEVELOPMENT:
    type "..\.templates\script-localhost.txt"
    echo.
)
if exist "..\.templates\script-production.txt" (
    echo    For PRODUCTION:
    type "..\.templates\script-production.txt"
    echo.
)
echo.
echo 3. ADD WEBGL STYLING:
echo    Add the contents of: .templates\extracted-styles.txt
echo    (After the webclip.jpg line in index.html)
echo.
pause
goto menu

:start
goto menu