@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    WEBFLOW ZIP UPDATER - FIXED VERSION
echo ========================================
echo.

:: Check if a ZIP file was dragged onto this script
if not "%~1"=="" (
    set "ZIPFILE=%~1"
    goto process_dropped_zip
)

:menu
echo Choose what to do:
echo.
echo 1. EXTRACT custom code from current staging files
echo 2. PROCESS WEBFLOW ZIP (drag & drop or select file)
echo 3. TEST with sample ZIP in backups folder
echo 4. Exit
echo.
set /p choice="Choice (1-4): "

if "%choice%"=="1" goto extract
if "%choice%"=="2" goto select_zip
if "%choice%"=="3" goto test_sample
if "%choice%"=="4" goto exit

echo Invalid choice.
goto menu

:extract
echo.
echo 🔍 EXTRACTING custom code from current staging files...
echo.

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found in webflow-staging-site-files folder
    echo.
    echo Please make sure your current Webflow site is in:
    echo   webflow-staging-site-files\index.html
    echo.
    pause
    goto menu
)

if not exist "..\.templates" mkdir "..\.templates"

cd "..\webflow-staging-site-files"

echo Checking current index.html for custom code...
findstr /C:"simple-3d-loader" index.html >nul 2>&1
if errorlevel 1 (
    echo ❌ No simple-3d-loader script found in current index.html
    echo.
    echo Make sure your staging files contain your custom 3D code first.
    cd "..\.scripts"
    pause
    goto menu
) else (
    echo ✅ Found 3D loader script
)

:: Extract script line (remove line number prefix)
for /f "tokens=2*" %%A in ('findstr /N "simple-3d-loader" index.html') do (
    echo %%B > "..\.templates\script-clean.txt"
    echo ✅ Script extracted: %%B
    goto script_done
)
:script_done

:: Extract WebGL styles
echo Extracting WebGL styles...
powershell -Command "try { $content = Get-Content 'index.html' -Raw; $start = $content.IndexOf('<!-- WebGL Container Styling -->'); if ($start -lt 0) { $start = $content.IndexOf('<!--  Anti-Flash Styling'); }; if ($start -ge 0) { $end = $content.IndexOf('</style>', $start) + 8; if ($end -gt $start) { $styles = $content.Substring($start, $end - $start); $styles | Set-Content '../.templates/styles-clean.txt' -NoNewline; Write-Host 'WebGL styles extracted' } else { Write-Host 'Style end tag not found' } } else { Write-Host 'WebGL styling not found' } } catch { Write-Host 'Error: ' + $_.Exception.Message }"

cd "..\.scripts"

echo.
echo ✅ Custom code extraction complete!
echo.
echo Extracted files:
if exist "..\.templates\script-clean.txt" (
    echo   ✅ script-clean.txt
    type "..\.templates\script-clean.txt"
) else (
    echo   ❌ script-clean.txt - MISSING
)

if exist "..\.templates\styles-clean.txt" (
    echo   ✅ styles-clean.txt
) else (
    echo   ❌ styles-clean.txt - MISSING
)

echo.
pause
goto menu

:select_zip
echo.
echo 📁 Please select your Webflow ZIP file...
echo.

powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.Filter = 'ZIP files (*.zip)|*.zip'; $dialog.Title = 'Select your Webflow ZIP file'; if ($dialog.ShowDialog() -eq 'OK') { $dialog.FileName } else { 'CANCELLED' }" > temp_path.txt

set /p ZIPFILE=<temp_path.txt
del temp_path.txt

if "%ZIPFILE%"=="CANCELLED" (
    echo Operation cancelled.
    pause
    goto menu
)

goto process_zip_file

:test_sample
echo.
echo 🧪 TESTING with sample ZIP in backups folder...
set "ZIPFILE=C:\Users\joao\Documents\My Scripts\webflow-gunther-map\.backups\go-goethe-quartier-ebde32.webflow (1).zip"

if not exist "%ZIPFILE%" (
    echo ❌ Sample ZIP not found: %ZIPFILE%
    pause
    goto menu
)

echo ✅ Found sample ZIP: go-goethe-quartier-ebde32.webflow (1).zip
goto process_zip_file

:process_dropped_zip
echo.
echo 📦 PROCESSING DROPPED ZIP: %~nx1
echo.

:process_zip_file
if not exist "%ZIPFILE%" (
    echo ❌ ZIP file not found: %ZIPFILE%
    pause
    goto menu
)

echo 🎯 Processing: %ZIPFILE%
echo.

:: Check if templates exist
if not exist "..\.templates\styles-clean.txt" (
    echo ⚠️ No custom code templates found!
    echo.
    echo Please run option 1 (EXTRACT) first to save your custom code.
    echo.
    pause
    goto menu
)

:: Create backup
echo 🔄 Creating backup of current staging files...
set timestamp=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%

if not exist "..\.backups" mkdir "..\.backups"

if exist "..\webflow-staging-site-files" (
    echo Backing up to: backup-%timestamp%
    xcopy "..\webflow-staging-site-files" "..\.backups\backup-%timestamp%\" /E /I /Q /Y >nul 2>&1
    echo ✅ Backup created
)

:: Clear and recreate staging folder
echo 🗑️ Clearing staging folder...
if exist "..\webflow-staging-site-files" rmdir /s /q "..\webflow-staging-site-files"
mkdir "..\webflow-staging-site-files"

:: Extract ZIP
echo 📤 Extracting ZIP file...
powershell -Command "try { Expand-Archive -Path '%ZIPFILE%' -DestinationPath '../webflow-staging-site-files' -Force; Write-Host 'ZIP extracted successfully' } catch { Write-Host 'ERROR extracting ZIP: ' + $_.Exception.Message; exit 1 }"

if errorlevel 1 (
    echo ❌ ZIP extraction failed!
    pause
    goto menu
)

if not exist "..\webflow-staging-site-files\index.html" (
    echo ❌ No index.html found after extraction!
    echo.
    echo Check if your ZIP file contains the correct Webflow export.
    pause
    goto menu
)

echo ✅ ZIP extracted successfully

:: Now inject the custom code
echo.
echo 💉 INJECTING your custom code...

cd "..\webflow-staging-site-files"

:: Create backup of fresh file
copy index.html index-original-from-webflow.html >nul 2>&1

:: Check what's currently in the fresh file
echo.
echo 🔍 Analyzing fresh Webflow export...
findstr /C:"simple-3d-loader" index.html >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ Fresh export already contains simple-3d-loader script
    echo   This might be a production version. Checking...

    findstr /C:"localhost" index.html >nul 2>&1
    if errorlevel 1 (
        echo   ✅ Using production URL (not localhost)
        echo   Will replace with your custom localhost version
    ) else (
        echo   ✅ Already using localhost
    )
) else (
    echo ✅ Fresh export has no 3D loader script - will add it
)

:: Inject custom script if template exists
if exist "..\.templates\script-clean.txt" (
    set /p CUSTOM_SCRIPT=<"..\.templates\script-clean.txt"
    echo.
    echo 📜 Injecting script: !CUSTOM_SCRIPT!

    powershell -Command "try { $content = Get-Content 'index.html' -Raw; $content = $content -replace '<script[^>]*simple-3d-loader[^>]*></script>', ''; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $script = '  <!-- Simple 3D Loader Script -->`n  !CUSTOM_SCRIPT!'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n\" + $script); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ Script injected successfully' } catch { Write-Host '❌ Script injection failed: ' + $_.Exception.Message }"
) else (
    echo ❌ No script template found
)

:: Inject custom styles if template exists
if exist "..\.templates\styles-clean.txt" (
    echo.
    echo 🎨 Injecting WebGL styles...

    powershell -Command "try { $content = Get-Content 'index.html' -Raw; $styles = Get-Content '../.templates/styles-clean.txt' -Raw; if ($styles) { $content = $content -replace '(?s)<!--.*?Anti-Flash.*?-->.*?</style>', ''; $content = $content -replace '(?s)<!--.*?WebGL Container Styling.*?-->.*?</style>', ''; $insertPoint = '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">'; $content = $content.Replace($insertPoint, $insertPoint + \"`n  `n  \" + $styles); $content | Set-Content 'index.html' -NoNewline; Write-Host '✅ Styles injected successfully' } else { Write-Host '❌ Empty styles template' } } catch { Write-Host '❌ Styles injection failed: ' + $_.Exception.Message }"
) else (
    echo ❌ No styles template found
)

cd "..\.scripts"

echo.
echo 🎉 PROCESSING COMPLETE!
echo.
echo ✅ Your Webflow site has been updated with:
if exist "..\.templates\script-clean.txt" echo   • Simple 3D Loader script
if exist "..\.templates\styles-clean.txt" echo   • WebGL container styling
echo   • Camera panel styles
echo.
echo 📁 Files location: webflow-staging-site-files\
echo 🌐 Test by opening: webflow-staging-site-files\index.html
echo.
echo 🔧 Next steps:
echo   1. Open index.html in your browser
echo   2. Check browser console for 3D loader messages
echo   3. Verify 3D model loads correctly
echo.

pause
goto menu

:exit
echo.
echo 👋 Done!
exit

:start
goto menu