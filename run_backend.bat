@echo off
echo ===================================================
echo Starting EdGenie backend server...
echo ===================================================

REM Get the directory of this batch file
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend

REM Check if the backend directory exists
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    echo Make sure this script is in the project root directory.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python is not installed or not in your PATH.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if requirements.txt exists
if not exist "%BACKEND_DIR%\requirements.txt" (
    echo WARNING: requirements.txt not found at %BACKEND_DIR%\requirements.txt
    echo You may need to install required packages manually.
)

REM Check if .env file exists
if not exist "%BACKEND_DIR%\.env" (
    echo WARNING: .env file not found at %BACKEND_DIR%\.env
    echo A template .env file will be created when you run the server.
    echo You will need to edit it to add your OpenRouter API key.
)

REM Run the Python script
echo.
echo Running server from %BACKEND_DIR%
cd /d "%BACKEND_DIR%"
python run.py --port 8888

REM If the server crashes, pause to see the error message
if %ERRORLEVEL% neq 0 (
    echo.
    echo Server exited with error code %ERRORLEVEL%
    pause
) 