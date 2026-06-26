@echo off
REM Test Backend-Frontend Integration (Windows compatible)

setlocal enabledelayedexpansion

color 0B
cls
REM Force UTF-8 code page in cmd to avoid garbled characters (best-effort).
REM Still, some terminals/fonts may not render box/emoji well, so we print ASCII below.
chcp 65001 >nul 2>&1

REM Always run from this script's directory (works from PowerShell too)
pushd "%~dp0" >nul 2>&1

echo.
echo =============================================================
echo   AIgram Integration Test Suite
echo =============================================================
echo.

REM ------------------------------------------------------------
REM Configuration (override via args)
REM Usage:
REM   test-integration.bat [backendUrl] [frontendUrl]
REM Example:
REM   test-integration.bat http://localhost:3000 http://localhost:8081
REM ------------------------------------------------------------
set "BACKEND_URL=%~1"
if "%BACKEND_URL%"=="" set "BACKEND_URL=http://localhost:3000"

set "FRONTEND_URL=%~2"
if "%FRONTEND_URL%"=="" set "FRONTEND_URL=http://localhost:8081"

set "API_BASE=%BACKEND_URL%/api"

REM Use Windows PowerShell in a compatible way (no PS7-only flags)
set "PS=powershell -NoProfile -ExecutionPolicy Bypass -Command"

echo [TEST 1] Backend Connectivity
echo -------------------------------------------------------------
echo Checking if backend is running on %BACKEND_URL% ...
echo.

%PS% "$u='%BACKEND_URL%/health'; try { $r=Invoke-WebRequest -Uri $u -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop; Write-Host ('[OK] Backend responding: HTTP ' + $r.StatusCode); } catch { Write-Host '[FAIL] Backend not reachable'; Write-Host ('   URL: ' + $u); Write-Host '   Start backend:'; Write-Host '     cd BACK'; Write-Host '     mvn spring-boot:run'; }"

echo.
echo [TEST 2] API Connectivity
echo -------------------------------------------------------------
echo Testing if API is accessible...
echo.

REM Prefer /api/status (always available) over a metadata lookup that may 500 on fake ids.
%PS% "$u='%BACKEND_URL%/api/status'; try { $r=Invoke-WebRequest -Uri $u -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop; Write-Host ('[OK] API responding: HTTP ' + $r.StatusCode); } catch { $code=$null; try { if ($_.Exception.Response) { $code=[int]$_.Exception.Response.StatusCode } } catch {} ; if ($code) { Write-Host ('[WARN] API responded with HTTP ' + $code); } else { Write-Host '[FAIL] API not reachable - check backend is running and CORS configuration'; } Write-Host ('   URL: ' + $u) }"

echo.
echo [TEST 3] Frontend Status
echo -------------------------------------------------------------
echo Frontend should be running on %FRONTEND_URL% (or Expo web fallback http://localhost:19006)
echo.

%PS% "$primary='%FRONTEND_URL%'; $fallback='http://localhost:19006'; try { $r=Invoke-WebRequest -Uri $primary -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop; Write-Host ('[OK] Frontend running: HTTP ' + $r.StatusCode + ' (' + $primary + ')'); } catch { try { $r=Invoke-WebRequest -Uri $fallback -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop; Write-Host ('[OK] Frontend running: HTTP ' + $r.StatusCode + ' (' + $fallback + ')'); } catch { Write-Host '[FAIL] Frontend not running'; Write-Host '   Start frontend with: npm run web'; Write-Host ('   Tried: ' + $primary + ', ' + $fallback); } }"

echo.
echo [TEST 4] Connection Summary
echo -------------------------------------------------------------
echo.
echo Backend URL: %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL% (or http://localhost:19006)
echo API Base URL: %API_BASE%
echo.

echo Connection Test Complete!
echo.
echo 📖 For more information, read: INTEGRATION_SETUP_GUIDE.md
echo.

REM Don't block CI/automation. Pause only when run interactively.
if /I "%CI%"=="true" goto :done
if /I "%GITHUB_ACTIONS%"=="true" goto :done

REM Avoid blocking in non-interactive runs (like being invoked from another process).
REM To force a pause, run: set PAUSE_ON_EXIT=1 && test-integration.bat
if "%PAUSE_ON_EXIT%"=="1" pause

:done
popd >nul 2>&1
endlocal
