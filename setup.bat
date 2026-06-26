@echo off
REM Complete AIgram Integration Setup Script for Windows

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   AIgram Frontend-Backend Integration Setup for Windows    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM ============================================
REM SYSTEM CHECKS
REM ============================================
echo [1/5] Checking system requirements...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Node.js not found
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: npm not found
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i

REM Check Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Java not found (required for backend only)
) else (
    for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| find "version"') do echo ✅ Java: %%i
)

echo.
echo ✅ System requirements check passed!
echo.

REM ============================================
REM ENVIRONMENT SETUP
REM ============================================
echo [2/5] Configuring environment...
echo.

if not exist ".env" (
    echo Creating .env file with default configuration...
    (
        echo # Backend API Configuration
        echo EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
        echo EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
        echo EXPO_PUBLIC_ENV=development
        echo EXPO_PUBLIC_DEBUG_API_CALLS=true
        echo.
        echo # AWS Configuration
        echo EXPO_PUBLIC_S3_BUCKET=aigram-practice-videos-2026
        echo EXPO_PUBLIC_AWS_REGION=ap-south-1
    ) > .env
    echo ✅ Created .env
) else (
    echo ✅ .env already exists
)

echo.

REM ============================================
REM FRONTEND SETUP
REM ============================================
echo [3/5] Setting up frontend...
echo.

if exist "node_modules" (
    echo ✅ node_modules exists, skipping npm install
) else (
    echo Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo ❌ npm install failed
        pause
        exit /b 1
    )
)
echo ✅ Frontend setup complete

echo.

REM ============================================
REM BACKEND CHECK
REM ============================================
echo [4/5] Checking backend status...
echo.

if not exist "BACK\pom.xml" (
    echo ⚠️  Backend directory not found
) else (
    echo ✅ Backend project structure found
    
    where mvn >nul 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  Maven not found - backend build/run requires Maven
    ) else (
        echo ✅ Maven is available
    )
)

echo.

REM ============================================
REM STARTUP OPTIONS
REM ============================================
echo [5/5] Ready to start!
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    STARTUP OPTIONS                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. Start Frontend Only (Web)                              ║
echo ║ 2. Start Frontend Only (Android Emulator)                 ║
echo ║ 3. Start Frontend Only (iOS Simulator)                    ║
echo ║ 4. Start Backend (requires Maven)                         ║
echo ║ 5. Backend Setup Guide                                    ║
echo ║ 6. View Troubleshooting Guide                             ║
echo ║ 0. Exit                                                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set /p choice="Select option (0-6): "

if "%choice%"=="1" (
    color 0B
    cls
    echo Starting Frontend (Web)...
    echo.
    echo 🌐 Frontend will open at: http://localhost:19006
    echo ⏳ This may take a minute to start...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npm run web
    goto end
)

if "%choice%"=="2" (
    color 0B
    cls
    echo Starting Frontend (Android)...
    echo.
    echo 📱 Make sure Android Emulator is running
    echo ⏳ This may take a minute to start...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npm run android
    goto end
)

if "%choice%"=="3" (
    color 0B
    cls
    echo Starting Frontend (iOS)...
    echo.
    echo 📱 Make sure iOS Simulator is running
    echo ⏳ This may take a minute to start...
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npm run ios
    goto end
)

if "%choice%"=="4" (
    color 0B
    cls
    
    where mvn >nul 2>nul
    if %errorlevel% neq 0 (
        color 0C
        echo ❌ Maven not found. Please see option 5 for setup.
        echo.
        pause
        goto menu
    )
    
    echo Starting Backend...
    echo.
    echo 🔨 Building...
    cd BACK
    call mvn clean install -DskipTests -q
    if %errorlevel% neq 0 (
        color 0C
        echo ❌ Build failed
        cd ..
        pause
        goto menu
    )
    
    echo ✅ Build successful. Starting server...
    echo 📍 Server running at: http://localhost:8080
    echo Press Ctrl+C to stop the server
    echo.
    call mvn spring-boot:run
    cd ..
    goto end
)

if "%choice%"=="5" (
    cls
    type BACKEND_SETUP_GUIDE.txt 2>nul || (
        color 0E
        echo.
        echo ╔════════════════════════════════════════════════════════════╗
        echo ║           BACKEND SETUP GUIDE FOR WINDOWS                  ║
        echo ╚════════════════════════════════════════════════════════════╝
        echo.
        echo STEP 1: Install Maven
        echo ──────────────────────────────────────────────────────────
        echo Download Maven from: https://maven.apache.org/download.cgi
        echo.
        echo Option A: Manual Installation
        echo   1. Download Maven (e.g., apache-maven-3.9.x-bin.zip^)
        echo   2. Extract to: C:\Maven
        echo   3. Add to system PATH:
        echo      - Right-click 'This PC' ^> Properties
        echo      - Click 'Advanced system settings'
        echo      - Click 'Environment Variables'
        echo      - Add C:\Maven\bin to PATH
        echo   4. Verify: Open new terminal and run 'mvn --version'
        echo.
        echo Option B: Using Chocolatey (if installed^)
        echo   - Open Command Prompt as Administrator
        echo   - Run: choco install maven -y
        echo.
        echo STEP 2: Verify Java
        echo ──────────────────────────────────────────────────────────
        echo Run: java -version
        echo Required: Java 21 or higher
        echo Download from: https://www.oracle.com/java/technologies/downloads/
        echo.
        echo STEP 3: Build Backend
        echo ──────────────────────────────────────────────────────────
        echo Navigate to project root and run:
        echo   cd BACK
        echo   mvn clean install -DskipTests
        echo.
        echo STEP 4: Run Backend
        echo ──────────────────────────────────────────────────────────
        echo   mvn spring-boot:run
        echo.
        echo STEP 5: Verify Backend is Running
        echo ──────────────────────────────────────────────────────────
        echo Open browser and visit:
        echo   http://localhost:8080/health
        echo.
        echo You should see: HTTP 200 OK response
        echo.
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="6" (
    cls
    color 0E
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║            TROUBLESHOOTING GUIDE                           ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo FRONTEND ISSUES
    echo ──────────────────────────────────────────────────────────
    echo.
    echo Problem: "Command not found: npm"
    echo Solution: Install Node.js from https://nodejs.org/
    echo.
    echo Problem: Port 19006 already in use
    echo Solution: Change port or kill process:
    echo   - netstat -ano ^| findstr :19006
    echo   - taskkill /PID [PID_NUMBER] /F
    echo.
    echo Problem: API connection failed
    echo Solution: 
    echo   1. Check backend is running: curl http://localhost:8080/health
    echo   2. Verify .env has correct API_BASE_URL
    echo   3. Check CORS is enabled in backend
    echo.
    echo BACKEND ISSUES
    echo ──────────────────────────────────────────────────────────
    echo.
    echo Problem: "Maven command not found"
    echo Solution: Install Maven - see option 5 above
    echo.
    echo Problem: Build fails with Java version error
    echo Solution: Install Java 21+
    echo   - Download from: https://www.oracle.com/java/technologies/downloads/
    echo.
    echo Problem: Port 8080 already in use
    echo Solution: 
    echo   - netstat -ano ^| findstr :8080
    echo   - taskkill /PID [PID_NUMBER] /F
    echo.
    echo Problem: Database connection error
    echo Solution: Check application.properties configuration
    echo   - File: BACK/src/main/resources/application.properties
    echo   - Verify all environment variables are set
    echo.
    echo API INTEGRATION ISSUES
    echo ──────────────────────────────────────────────────────────
    echo.
    echo Problem: CORS errors in browser console
    echo Solution:
    echo   - Backend CORS_ORIGIN must match frontend URL
    echo   - Check BACK/src/main/java/com/aigram/backend/config/CorsConfig.java
    echo.
    echo Problem: 401 Unauthorized errors
    echo Solution:
    echo   - Verify JWT token is included in Authorization header
    echo   - Check token storage in secure storage
    echo.
    echo QUICK DIAGNOSTIC COMMAND
    echo ──────────────────────────────────────────────────────────
    echo.
    echo Check backend health:
    echo   curl http://localhost:8080/health
    echo.
    echo Test API endpoint:
    echo   curl -X POST http://localhost:8080/api/upload/sas-token ^
    echo     -H "Content-Type: application/json" ^
    echo     -d "{\"fileName\":\"test.mp4\",\"userId\":\"user123\"}"
    echo.
    pause
    goto menu
)

if "%choice%"=="0" (
    color 07
    cls
    echo Goodbye!
    exit /b 0
)

color 0C
echo ❌ Invalid choice. Please select 0-6.
echo.
pause
goto menu

:menu
cls
goto ask

:end
color 07
