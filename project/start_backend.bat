@echo off
echo Starting CampusXChange Backend...
cd /d "%~dp0backend"

:: Verify py launcher exists
where py >nul 2>&1
IF ERRORLEVEL 1 (
    echo.
    echo ERROR: Python not found. Please install Python 3.11+ from https://www.python.org
    echo Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

IF NOT EXIST "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    py -m venv venv
    IF ERRORLEVEL 1 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt --quiet
IF ERRORLEVEL 1 (
    echo ERROR: pip install failed.
    pause
    exit /b 1
)

echo.
echo Backend running at http://localhost:5000
echo Press Ctrl+C to stop.
echo.
py app.py
pause
