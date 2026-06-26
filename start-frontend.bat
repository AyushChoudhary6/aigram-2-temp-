@echo off
REM Frontend Start Script for AIgram (Windows)

setlocal enabledelayedexpansion

echo ======================================
echo AIgram Frontend - Development Server
echo ======================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Download from: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo ✅ Node.js: %NODE_VER%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo ✅ npm: %NPM_VER%
echo.

REM Check .env file
if not exist ".env" (
    echo ⚠️  .env file not found. Creating default configuration...
    (
        echo # Backend API Configuration
        echo EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
        echo EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
        echo.
        echo # Application Configuration
        echo EXPO_PUBLIC_ENV=development
        echo EXPO_PUBLIC_DEBUG_API_CALLS=true
    ) > .env
    echo ✅ Created .env file
)

echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo 🚀 Starting frontend...
echo.
echo Available commands:
echo   - 'w' for web (http://localhost:19006)
echo   - 'a' for Android emulator
echo   - 'i' for iOS simulator
echo   - 'q' to quit
echo.

call npm run start

pause
