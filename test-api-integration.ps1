# AIgram API Testing - Windows PowerShell Version
# Tests all critical endpoints for functionality

param(
    [string]$BackendUrl = "http://localhost:3000"
)

$API_BASE = "$BackendUrl/api"
$PASSED = 0
$FAILED = 0
$WARNINGS = 0

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "AIgram API Integration Test Suite" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl"
Write-Host "API Base: $API_BASE"
Write-Host ""

# Test Helper Function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Body,
        [string]$ExpectedStatus,
        [string]$AuthToken
    )
    
    Write-Host -NoNewline "  Testing: $Name... "
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($AuthToken) {
            $headers["Authorization"] = "Bearer $AuthToken"
        }
        
        $params = @{
            Uri     = "$API_BASE$Endpoint"
            Method  = $Method
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params["Body"] = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -like "$ExpectedStatus*") {
            Write-Host "[OK] ($statusCode)" -ForegroundColor Green
            $script:PASSED++
            return $response
        } else {
            Write-Host "[FAIL] Expected $ExpectedStatus*, got $statusCode" -ForegroundColor Red
            $script:FAILED++
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value
        if ($statusCode -like "$ExpectedStatus*") {
            Write-Host "[OK] ($statusCode)" -ForegroundColor Green
            $script:PASSED++
            return $null
        } else {
            Write-Host "[FAIL] Expected $ExpectedStatus*, got $statusCode" -ForegroundColor Red
            $script:FAILED++
            return $null
        }
    }
}

# TEST 1: Basic Connectivity
Write-Host "TEST 1: Basic Connectivity" -ForegroundColor Yellow
Write-Host "---"

Write-Host -NoNewline "Testing health endpoint... "
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/actuator/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK]" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "  Service: $($healthData.service)"
        Write-Host "  Status: $($healthData.status)"
        $script:PASSED++
    } else {
        Write-Host "[FAIL]" -ForegroundColor Red
        $script:FAILED++
    }
}
catch {
    Write-Host "[FAIL] $($_)" -ForegroundColor Red
    $script:FAILED++
}

Write-Host ""

# TEST 2: Public Endpoints
Write-Host "TEST 2: Public Endpoints (No Auth)" -ForegroundColor Yellow
Write-Host "---"

Test-Endpoint "Privacy Policy" "GET" "/legal/privacy-policy" "" "200"
Test-Endpoint "Terms of Service" "GET" "/legal/terms" "" "200"

Write-Host ""

# TEST 3: Authentication
Write-Host "TEST 3: Authentication Endpoints" -ForegroundColor Yellow
Write-Host "---"

Write-Host -NoNewline "  Testing: Guest Authentication... "
$GUEST_TOKEN = $null
try {
    $guestResponse = Invoke-WebRequest -Uri "$API_BASE/auth/guest/auth" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body '{}' `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $guestData = $guestResponse.Content | ConvertFrom-Json
    
    if ($guestData.accessToken) {
        Write-Host "[OK]" -ForegroundColor Green
        Write-Host "    Token: $($guestData.accessToken.Substring(0, [Math]::Min(20, $guestData.accessToken.Length)))..."
        $script:PASSED++
        $GUEST_TOKEN = $guestData.accessToken
    } else {
        Write-Host "[WARN] No token in response" -ForegroundColor Yellow
        $script:WARNINGS++
    }
}
catch {
    Write-Host "[FAIL] $($_)" -ForegroundColor Red
    $script:FAILED++
}

Write-Host ""

# TEST 4: User Endpoints
Write-Host "TEST 4: User Endpoints (With Auth)" -ForegroundColor Yellow
Write-Host "---"

if ($GUEST_TOKEN) {
    Test-Endpoint "Get Profile" "GET" "/users/profile/me" "" "200" $GUEST_TOKEN
    Test-Endpoint "Get Wallet" "GET" "/users/wallet" "" "200" $GUEST_TOKEN
} else {
    Write-Host "  [SKIP] No guest token available"
    $script:WARNINGS++
}

Write-Host ""

# TEST 5: Video Endpoints
Write-Host "TEST 5: Video Endpoints" -ForegroundColor Yellow
Write-Host "---"

if ($GUEST_TOKEN) {
    Test-Endpoint "Get Feed" "GET" "/videos/feed?page=1&size=10" "" "200" $GUEST_TOKEN
    Test-Endpoint "Search Videos" "GET" "/videos/search?q=test" "" "200" $GUEST_TOKEN
} else {
    Write-Host "  [SKIP] No auth token available"
    $script:WARNINGS++
}

Write-Host ""

# TEST 6: AI Tools
Write-Host "TEST 6: AI Tools Endpoints" -ForegroundColor Yellow
Write-Host "---"

if ($GUEST_TOKEN) {
    Test-Endpoint "List AI Tools" "GET" "/ai-tools" "" "200" $GUEST_TOKEN
} else {
    Write-Host "  [SKIP] No auth token available"
    $script:WARNINGS++
}

Write-Host ""

# TEST 7: Error Handling
Write-Host "TEST 7: Error Handling" -ForegroundColor Yellow
Write-Host "---"

Write-Host -NoNewline "  Testing: 404 Error Response... "
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/nonexistent" -UseBasicParsing -ErrorAction Stop
    Write-Host "[FAIL] Expected 4xx" -ForegroundColor Red
    $script:FAILED++
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    if ($statusCode -ge 400 -and $statusCode -lt 500) {
        Write-Host "[OK] ($statusCode)" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "[FAIL] Expected 4xx, got $statusCode" -ForegroundColor Red
        $script:FAILED++
    }
}

Write-Host ""

# Summary
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [PASS] Passed:   $PASSED" -ForegroundColor Green
Write-Host "  [FAIL] Failed:   $FAILED" -ForegroundColor Red
Write-Host "  [WARN] Warnings: $WARNINGS" -ForegroundColor Yellow
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "[SUCCESS] All critical tests passed!" -ForegroundColor Green
    Write-Host "[INFO] Frontend is ready to integrate with backend" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[ERROR] Some tests failed. Check output above." -ForegroundColor Red
    exit 1
}
