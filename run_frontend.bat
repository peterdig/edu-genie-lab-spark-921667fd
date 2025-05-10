@echo off
echo ===================================================
echo Starting EdGenie frontend server...
echo ===================================================

REM Get the directory of this batch file
set SCRIPT_DIR=%~dp0

REM Check if package.json exists (for npm commands)
if not exist "%SCRIPT_DIR%package.json" (
    echo ERROR: package.json not found at %SCRIPT_DIR%
    echo Make sure this script is in the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "%SCRIPT_DIR%node_modules" (
    echo WARNING: node_modules directory not found.
    echo Running npm install to install dependencies...
    cd /d "%SCRIPT_DIR%"
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Run the npm command
echo.
echo Running frontend from %SCRIPT_DIR%
cd /d "%SCRIPT_DIR%"
npm run dev

REM If the server crashes, pause to see the error message
if %ERRORLEVEL% neq 0 (
    echo.
    echo Frontend server exited with error code %ERRORLEVEL%
    pause
) 