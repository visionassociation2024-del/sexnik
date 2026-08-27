@echo off
echo ===================================================
echo   Installing and Starting niksex Companion Services
echo ===================================================

cd /d "%~dp0"

echo [1/3] Setting up Bridge API Service...
cd scraper-api
if not exist node_modules (
    echo Installing scraper-api dependencies...
    call npm install
)
if not exist .env (
    copy .env.example .env
)
cd ..

echo [2/3] All dependencies installed!
echo.
echo ===================================================
echo   Commands Available:
echo ===================================================
echo 1. To bulk-scrape hundreds of videos into database:
echo      cd services\scraper-api ^&^& npm run bulk-import
echo.
echo 2. To run the Scraper Companion Service (Port 3001):
echo      cd services\scraper-api ^&^& npm start
echo.
echo 3. To import SQL file into phpMyAdmin:
echo      Import database\imported_videos.sql
echo ===================================================
pause
