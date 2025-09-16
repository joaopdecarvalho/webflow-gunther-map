@echo off
echo ========================================
echo   WEBFLOW UPDATE SYSTEM - QUICK MENU
echo ========================================
echo.
echo What would you like to do?
echo.
echo 1. BACKUP current files
echo 2. EXTRACT custom code from current files
echo 3. INJECT custom code into fresh export
echo 4. View HELP documentation
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto backup
if "%choice%"=="2" goto extract
if "%choice%"=="3" goto inject
if "%choice%"=="4" goto help
if "%choice%"=="5" goto exit
goto invalid

:backup
echo.
echo 🔄 Creating backup of current files...
powershell -ExecutionPolicy Bypass -File "webflow-update.ps1" backup
echo.
pause
goto menu

:extract
echo.
echo 🔍 Extracting custom code patterns...
powershell -ExecutionPolicy Bypass -File "webflow-update.ps1" extract
echo.
echo ✅ Custom code extracted! You can now:
echo    1. Download fresh export from Webflow
echo    2. Replace files in webflow-staging-site-files folder
echo    3. Run option 3 to inject custom code back
echo.
pause
goto menu

:inject
echo.
echo 💉 Injecting custom code into fresh export...
powershell -ExecutionPolicy Bypass -File "webflow-update.ps1" inject
echo.
echo ✅ Process complete! Test your site locally.
echo.
pause
goto menu

:help
echo.
echo 📖 Opening documentation...
start "" "..\docs\webflow-update-workflow.md"
echo.
pause
goto menu

:invalid
echo.
echo ❌ Invalid choice. Please select 1-5.
echo.
pause

:menu
cls
goto :start

:exit
echo.
echo 👋 Goodbye!
exit

:start
goto :menu