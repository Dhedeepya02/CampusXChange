@echo off
echo Starting CampusXChange Frontend...
cd /d "%~dp0"

:: Ensure Node/npm is on PATH (common install locations)
SET "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

:: Verify npm exists
where npm >nul 2>&1
IF ERRORLEVEL 1 (
    echo.
    echo ERROR: npm not found. Please install Node.js from https://nodejs.org
    echo Then reopen this terminal and try again.
    pause
    exit /b 1
)

IF NOT EXIST "node_modules" (
    echo Installing npm packages...
    npm install
    IF ERRORLEVEL 1 (
        echo.
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo Frontend running at http://localhost:5173
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
