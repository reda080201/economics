@echo off
setlocal

cd /d "%~dp0"

set "PORT=8788"
set "APP_URL=http://127.0.0.1:%PORT%/index.html"
set "PYTHON_CMD="

where py >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=py -3"

if not defined PYTHON_CMD (
    where python >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo [ERROR] Python 3 was not found.
    echo Install Python, then run this file again.
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Agent Macro Lab
echo URL: %APP_URL%
echo Press Ctrl+C to stop the server.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%APP_URL%'"
%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1

endlocal
