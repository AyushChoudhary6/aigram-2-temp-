#!/bin/bash
# ============================================
# AIgram API Testing - Comprehensive Integration Test
# ============================================
# Tests all critical endpoints for functionality
# Run: bash test-api-integration.sh [backend_url]
# ============================================

set -euo pipefail

BACKEND_URL="${1:-http://3.110.173.55:8080}"
API_BASE="${BACKEND_URL}/api"

echo "🧪 AIgram API Integration Test Suite"
echo "=================================================="
echo "Backend URL: ${BACKEND_URL}"
echo "API Base: ${API_BASE}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# ============================================
# Test Helper Functions
# ============================================

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local body="$4"
    local expected_status="$5"
    local auth_token="${6:-}"
    
    echo -n "  Testing: $name... "
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$auth_token" ]; then
        headers="$headers -H 'Authorization: Bearer $auth_token'"
    fi
    
    local cmd="curl -s -w '\\n%{http_code}' -X $method ${API_BASE}${endpoint} $headers"
    
    if [ -n "$body" ]; then
        cmd="$cmd -d '$body'"
    fi
    
    local response=$(eval $cmd)
    local http_code=$(echo "$response" | tail -n1)
    local body_content=$(echo "$response" | head -n-1)
    
    if [[ "$http_code" =~ ^${expected_status}[0-9]$ ]]; then
        echo "✅ ($http_code)"
        ((PASSED++))
        return 0
    else
        echo "❌ Expected $expected_status*, got $http_code"
        ((FAILED++))
        return 1
    fi
}

# ============================================
# 1. Basic Connectivity Tests
# ============================================
echo "🔗 Test 1: Basic Connectivity"
echo "---"

echo "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -w '%{http_code}' -o /dev/null "${BACKEND_URL}/actuator/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "  ✅ Health check passed"
    ((PASSED++))
else
    echo "  ❌ Health check failed (status: $HEALTH_STATUS)"
    ((FAILED++))
fi

echo ""

# ============================================
# 2. Public Endpoints (No Auth Required)
# ============================================
echo "🔓 Test 2: Public Endpoints (No Auth)"
echo "---"

test_endpoint "Privacy Policy" "GET" "/legal/privacy-policy" "" "200"
test_endpoint "Terms of Service" "GET" "/legal/terms" "" "200"

echo ""

# ============================================
# 3. Authentication Endpoints
# ============================================
echo "🔐 Test 3: Authentication Endpoints"
echo "---"

# Test guest auth
echo -n "  Testing: Guest Authentication... "
GUEST_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/guest/auth" \
  -H 'Content-Type: application/json' \
  -d '{}')

if echo "$GUEST_RESPONSE" | grep -q "success"; then
    echo "✅"
    GUEST_TOKEN=$(echo "$GUEST_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ -n "$GUEST_TOKEN" ]; then
        echo "    Got token: ${GUEST_TOKEN:0:20}..."
        ((PASSED++))
    else
        echo "    ⚠️ No token in response"
        ((WARNINGS++))
    fi
else
    echo "❌"
    ((FAILED++))
fi

echo ""

# ============================================
# 4. User Endpoints (With Auth)
# ============================================
echo "👤 Test 4: User Endpoints (With Auth)"
echo "---"

if [ -n "${GUEST_TOKEN:-}" ]; then
    test_endpoint "Get Profile" "GET" "/users/profile/me" "" "200" "$GUEST_TOKEN"
    test_endpoint "Update Profile" "PUT" "/users/profile/me" '{"name":"Test"}' "200" "$GUEST_TOKEN"
    test_endpoint "Get Wallet" "GET" "/users/wallet" "" "200" "$GUEST_TOKEN"
else
    echo "  ⏭️ Skipping (no guest token available)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 5. Video Endpoints
# ============================================
echo "🎬 Test 5: Video Endpoints"
echo "---"

if [ -n "${GUEST_TOKEN:-}" ]; then
    test_endpoint "Get Feed" "GET" "/videos/feed?page=1&size=10" "" "200" "$GUEST_TOKEN"
    test_endpoint "Search Videos" "GET" "/videos/search?q=test" "" "200" "$GUEST_TOKEN"
    test_endpoint "Video Count Check" "GET" "/videos/guest-limit" "" "200" "$GUEST_TOKEN"
else
    echo "  ⏭️ Skipping (no auth token available)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 6. AI Tools Endpoints
# ============================================
echo "🤖 Test 6: AI Tools Endpoints"
echo "---"

if [ -n "${GUEST_TOKEN:-}" ]; then
    test_endpoint "List AI Tools" "GET" "/ai-tools" "" "200" "$GUEST_TOKEN"
    test_endpoint "Popular AI Tools" "GET" "/ai-tools/popular" "" "200" "$GUEST_TOKEN"
else
    echo "  ⏭️ Skipping (no auth token available)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 7. Practice Endpoints
# ============================================
echo "📚 Test 7: Practice Endpoints"
echo "---"

if [ -n "${GUEST_TOKEN:-}" ]; then
    test_endpoint "List Questions" "GET" "/practice-prompt/questions?page=1&size=10" "" "200" "$GUEST_TOKEN"
    test_endpoint "Get Metadata" "GET" "/practice-prompt/metadata" "" "200" "$GUEST_TOKEN"
else
    echo "  ⏭️ Skipping (no auth token available)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 8. Error Handling Tests
# ============================================
echo "⚠️  Test 8: Error Handling"
echo "---"

echo -n "  Testing: 404 Error Response... "
RESPONSE=$(curl -s -X GET "${API_BASE}/users/profile/nonexistent" \
  -H 'Content-Type: application/json' \
  -w '\n%{http_code}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [[ "$HTTP_CODE" == "40"* ]]; then
    echo "✅ ($HTTP_CODE)"
    ((PASSED++))
else
    echo "❌ Expected 4xx, got $HTTP_CODE"
    ((FAILED++))
fi

echo -n "  Testing: 401 Unauthorized (no token)... "
HTTP_CODE=$(curl -s -w '%{http_code}' -X GET "${API_BASE}/users/profile/me" \
  -o /dev/null)
if [[ "$HTTP_CODE" == "40"* ]]; then
    echo "✅ ($HTTP_CODE)"
    ((PASSED++))
else
    echo "⚠️ Got $HTTP_CODE (expected 4xx)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 9. Performance Tests
# ============================================
echo "⚡ Test 9: Performance Tests"
echo "---"

echo -n "  Testing: Response time < 2 seconds... "
START=$(date +%s%N | cut -b1-13)
curl -s "${API_BASE}/legal/privacy-policy" > /dev/null
END=$(date +%s%N | cut -b1-13)
DURATION=$((END - START))

if [ "$DURATION" -lt 2000 ]; then
    echo "✅ (${DURATION}ms)"
    ((PASSED++))
else
    echo "⚠️ Took ${DURATION}ms (expected < 2000ms)"
    ((WARNINGS++))
fi

echo ""

# ============================================
# 10. CORS Tests
# ============================================
echo "🌐 Test 10: CORS Configuration"
echo "---"

echo -n "  Testing: CORS preflight response... "
CORS_RESPONSE=$(curl -s -i -X OPTIONS "${API_BASE}/auth/guest/auth" \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' 2>&1)

if echo "$CORS_RESPONSE" | grep -i "Access-Control-Allow-Origin" > /dev/null; then
    echo "✅"
    ((PASSED++))
    echo "    CORS headers:"
    echo "$CORS_RESPONSE" | grep -i "Access-Control" | sed 's/^/      /'
else
    echo "⚠️ No CORS headers found"
    ((WARNINGS++))
fi

echo ""

# ============================================
# Summary Report
# ============================================
echo "📊 Test Results Summary"
echo "=================================================="
echo ""
echo "  ✅ Passed:   $PASSED"
echo "  ❌ Failed:   $FAILED"
echo "  ⚠️  Warnings: $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All critical tests passed!"
    echo ""
    echo "✨ Frontend is ready to integrate with AWS backend"
    echo ""
    echo "Next steps:"
    echo "  1. npm install"
    echo "  2. npm run web (for web testing)"
    echo "  3. npm run android (for Android)"
    echo "  4. npm run ios (for iOS)"
    exit 0
else
    echo "❌ Some tests failed. Please check the output above."
    echo ""
    echo "Common issues:"
    echo "  1. Backend not running: Check EC2 instance status"
    echo "  2. Port 8080 blocked: Check security group rules"
    echo "  3. CORS not configured: Check backend CorsConfig"
    echo ""
    exit 1
fi
