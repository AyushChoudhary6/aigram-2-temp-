#!/bin/bash
# ============================================
# Frontend-to-AWS Backend Integration Verification
# ============================================
# This script verifies that all components are properly
# configured for AWS backend integration
# ============================================

set -euo pipefail

BACKEND_URL="${1:-http://3.110.173.55:8080}"
API_BASE_URL="${BACKEND_URL}/api"

echo "🔍 AIgram Frontend - AWS Backend Integration Verification"
echo "=================================================="
echo ""
echo "Backend URL: ${BACKEND_URL}"
echo "API Base URL: ${API_BASE_URL}"
echo ""

# ============================================
# 1. Check Backend Connectivity
# ============================================
echo "📡 Step 1: Checking backend connectivity..."
echo ""

# Health Check
echo "  Testing health endpoint..."
if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/actuator/health" | grep -q "200"; then
    echo "  ✅ Backend is reachable"
else
    echo "  ❌ Backend health check failed"
    exit 1
fi

# API Base Check
echo "  Testing API base endpoint..."
if curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/legal/privacy-policy" | grep -q "200"; then
    echo "  ✅ API base endpoint accessible"
else
    echo "  ⚠️  API base endpoint returned non-200 status"
fi

echo ""

# ============================================
# 2. Check CORS Configuration
# ============================================
echo "🔐 Step 2: Checking CORS configuration..."
echo ""

echo "  Checking CORS headers..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "${API_BASE_URL}/auth/guest/auth" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
HEADERS=$(echo "$RESPONSE" | head -n-1)

if echo "$HEADERS" | grep -i "Access-Control-Allow-Origin" > /dev/null; then
    echo "  ✅ CORS headers present"
    echo "  $(echo "$HEADERS" | grep -i "Access-Control-Allow-Origin")"
else
    echo "  ⚠️  CORS headers not found (may be configured on OPTIONS)"
fi

echo ""

# ============================================
# 3. Check API Endpoints
# ============================================
echo "📋 Step 3: Checking critical API endpoints..."
echo ""

ENDPOINTS=(
    "auth|POST|/auth/guest/auth"
    "legal|GET|/legal/privacy-policy"
    "users|GET|/users/profile/me"
)

for entry in "${ENDPOINTS[@]}"; do
    IFS='|' read -r name method path <<< "$entry"
    echo "  Testing $name (${method} ${path})..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${API_BASE_URL}${path}")
    
    if [[ "$HTTP_CODE" == "20"* ]]; then
        echo "    ✅ Endpoint accessible (HTTP $HTTP_CODE)"
    elif [[ "$HTTP_CODE" == "40"* ]]; then
        echo "    ℹ️  Endpoint requires authentication (HTTP $HTTP_CODE) - expected"
    else
        echo "    ❌ Endpoint returned HTTP $HTTP_CODE"
    fi
done

echo ""

# ============================================
# 4. Check Environment Configuration
# ============================================
echo "⚙️  Step 4: Checking environment configuration..."
echo ""

if [ -f ".env" ]; then
    echo "  ✅ .env file exists"
    
    if grep -q "EXPO_PUBLIC_API_BASE_URL" .env; then
        echo "  ✅ EXPO_PUBLIC_API_BASE_URL configured"
    else
        echo "  ❌ EXPO_PUBLIC_API_BASE_URL not configured"
    fi
    
    if grep -q "EXPO_PUBLIC_BACKEND_URL" .env; then
        echo "  ✅ EXPO_PUBLIC_BACKEND_URL configured"
    else
        echo "  ❌ EXPO_PUBLIC_BACKEND_URL not configured"
    fi
else
    echo "  ⚠️  .env file not found"
fi

echo ""

# ============================================
# 5. Check Frontend Dependencies
# ============================================
echo "📦 Step 5: Checking frontend dependencies..."
echo ""

if [ -f "package.json" ]; then
    echo "  ✅ package.json exists"
    
    if grep -q "axios" package.json; then
        echo "  ✅ Axios installed"
    else
        echo "  ❌ Axios not found in package.json"
    fi
    
    if grep -q "expo" package.json; then
        echo "  ✅ Expo installed"
    else
        echo "  ❌ Expo not found in package.json"
    fi
    
    if grep -q "react-native" package.json; then
        echo "  ✅ React Native installed"
    else
        echo "  ❌ React Native not found in package.json"
    fi
else
    echo "  ❌ package.json not found"
fi

echo ""

# ============================================
# 6. Configuration Summary
# ============================================
echo "📊 Configuration Summary"
echo "=================================================="
echo ""
echo "Backend Configuration:"
echo "  Backend URL: ${BACKEND_URL}"
echo "  API Base URL: ${API_BASE_URL}"
echo "  AWS Region: ap-south-1"
echo "  S3 Bucket: aigram-practice-videos-2026"
echo ""

# ============================================
# 7. Next Steps
# ============================================
echo "✅ Verification Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Install dependencies:     npm install"
echo "  2. Start development:        npm start"
echo "  3. Test on web:              npm run web"
echo "  4. Test on Android:          npm run android"
echo "  5. Test on iOS:              npm run ios"
echo ""
echo "🧪 To test API calls:"
echo "  - Enable DEBUG_CONFIG.API_CALLS in src/constants/index.ts"
echo "  - Monitor console logs for request/response details"
echo ""
echo "📚 Documentation:"
echo "  - See AWS_FRONTEND_INTEGRATION.md for detailed integration guide"
echo ""
