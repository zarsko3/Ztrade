@echo off
echo Starting daily Git push for Z-Trade project...
echo.

REM Change to the project directory
cd /d "%~dp0.."

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\daily-git-push.ps1" %*

echo.
echo Daily push completed!
pause
