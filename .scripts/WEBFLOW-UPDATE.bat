@echo off
echo ========================================
echo   WEBFLOW UPDATE SYSTEM - ULTRA SIMPLE
echo ========================================
echo.

:menu
echo What do you want to do?
echo.
echo 1. BACKUP current files
echo 2. EXTRACT custom code
echo 3. INJECT custom code into fresh export
echo 4. COMPLETE WORKFLOW (backup + extract)
echo 5. Exit
echo.
set /p choice="Choice (1-5): "

if "%choice%"=="1" goto backup
if "%choice%"=="2" goto extract
if "%choice%"=="3" goto inject
if "%choice%"=="4" goto workflow
if "%choice%"=="5" goto exit

echo Invalid choice. Try again.
echo.
goto menu

:backup
echo.
echo 🔄 Creating backup...
set timestamp=%date:~-4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
if not exist "..\.backups" mkdir "..\.backups"
xcopy "..\webflow-staging-site-files" "..\.backups\backup-%timestamp%\" /E /I /Q
echo ✅ Backup created in .backups\backup-%timestamp%
echo.
pause
goto menu

:extract
echo.
echo 🔍 Extracting custom code...
if not exist "..\.templates" mkdir "..\.templates"

cd "..\webflow-staging-site-files"
findstr "simple-3d-loader" index.html > "..\.templates\script-raw.txt"
findstr /C:"<!-- Simple 3D Loader Script -->" /A:1 index.html > "..\.templates\script-line.txt"

echo Extracting styles...
powershell -Command "(Get-Content 'index.html' -Raw) -match '(?s)<!-- WebGL Container Styling -->.*?</style>' | Out-Null; $matches[0] | Set-Content '../.templates/styles.txt'"

cd "..\.scripts"
echo.
echo ✅ Custom code extracted to .templates folder
echo   - styles.txt contains your WebGL styling
echo   - script-raw.txt contains script reference
echo.
pause
goto menu

:inject
echo.
echo 💉 Injecting custom code...

if not exist "..\.templates\styles.txt" (
    echo ❌ No templates found. Run EXTRACT first.
    echo.
    pause
    goto menu
)

cd "..\webflow-staging-site-files"

echo Backing up original index.html...
copy index.html index.html.backup

echo Injecting styles...
powershell -Command "$content = Get-Content 'index.html' -Raw; $styles = Get-Content '../.templates/styles.txt' -Raw; if ($styles -and $content -notmatch 'WebGL Container Styling') { $content = $content.Replace('<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">', '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">' + [Environment]::NewLine + '  ' + [Environment]::NewLine + '  ' + $styles); $content | Set-Content 'index.html' -NoNewline; Write-Host 'Styles injected' } else { Write-Host 'Styles already present or missing' }"

echo Injecting script...
powershell -Command "$content = Get-Content 'index.html' -Raw; $script = '  <script src=\"http://localhost:8080/src/scripts/simple-3d-loader.js\"></script>'; if ($content -notmatch 'simple-3d-loader') { $content = $content.Replace('<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">', '<link href=\"images/webclip.jpg\" rel=\"apple-touch-icon\">' + [Environment]::NewLine + '  ' + [Environment]::NewLine + '  <!-- Simple 3D Loader Script -->' + [Environment]::NewLine + $script); $content | Set-Content 'index.html' -NoNewline; Write-Host 'Script injected' } else { Write-Host 'Script already present' }"

cd "..\.scripts"
echo.
echo ✅ Injection complete! Test your site locally.
echo.
pause
goto menu

:workflow
echo.
echo 🚀 Running complete workflow (backup + extract)...
echo This prepares everything for a fresh Webflow export.
echo.

call :backup
call :extract

echo.
echo ✅ Workflow complete! Now you can:
echo   1. Download fresh export from Webflow
echo   2. Replace files in webflow-staging-site-files
echo   3. Run option 3 (INJECT) to restore custom code
echo.
pause
goto menu

:exit
echo.
echo 👋 Update complete! Happy coding!
timeout /t 2 /nobreak >nul
exit

:start
goto menu