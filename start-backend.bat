@echo off
REM Backend Setup & Run Script for AIgram (Windows)

setlocal enabledelayedexpansion

echo ======================================
echo AIgram Backend Setup ^& Run
echo ======================================
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Maven not found.
    echo.
    echo SOLUTION: Install Maven manually:
    echo 1. Download from: https://maven.apache.org/download.cgi
    echo 2. Extract to: C:\Maven
    echo 3. Add to PATH: C:\Maven\bin
    echo.
    echo OR use: choco install maven -y (in Administrator Command Prompt)
    echo.
    exit /b 1
)

REM Check if Java is installed
java -version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Java not found. Please install Java 21+
    echo Download from: https://www.oracle.com/java/technologies/downloads/
    exit /b 1
)

for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| find "java version"') do set JAVA_VER=%%i
echo ✅ Using: %JAVA_VER%
echo.

REM Navigate to backend directory
cd /d BACK
if %errorlevel% neq 0 (
    echo ❌ Backend directory not found
    exit /b 1
)

echo 🔨 Building backend...
echo.
call mvn clean install -DskipTests

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed. Check errors above.
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.
echo 🚀 Starting backend server...
echo 📍 Server will run on: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the application
call mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Server failed to start. Check errors above.
    exit /b 1
)
