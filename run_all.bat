@echo off
echo ===================================================
echo Starting EdGenie Application (Frontend + Backend)
echo ===================================================

REM Get the directory of this batch file
set SCRIPT_DIR=%~dp0

echo.
echo This script will start both the backend and frontend servers
echo in separate windows. Close the windows when you're done.
echo.
echo 1. Backend: http://localhost:8000
echo 2. Frontend: http://localhost:8081
echo.
echo Press any key to start the servers...
pause >nul

REM Start the backend server in a new window
start "EdGenie Backend" cmd /c "%SCRIPT_DIR%run_backend.bat"

REM Wait a moment for backend to initialize
echo Waiting for backend to initialize...
timeout /t 3 >nul

REM Start the frontend server in a new window
start "EdGenie Frontend" cmd /c "%SCRIPT_DIR%run_frontend.bat"

echo.
echo Servers are starting in separate windows.
echo.
echo When finished, close both server windows.
echo.

REM Keep this window open to show instructions
echo Press any key to exit this window...
pause >nul 