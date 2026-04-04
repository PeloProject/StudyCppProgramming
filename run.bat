@echo off
setlocal
cd /d %~dp0

echo ==========================================
echo   C++ Mastery Platform Launcher
echo ==========================================

if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

echo [INFO] Starting development server...
call npm run dev

pause
