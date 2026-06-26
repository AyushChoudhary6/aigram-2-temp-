# AIgram Frontend-to-AWS Backend Integration - Quick Reference

## 🚀 Quick Start

### For Development

```bash
# 1. Clone and install
git clone <repo>
cd frontend-aigram-beIntegrated
npm install

# 2. Create/update .env
cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=http://3.110.173.55:8080/api
EXPO_PUBLIC_BACKEND_URL=http://3.110.173.55:8080
EXPO_PUBLIC_S3_BUCKET=aigram-practice-videos-2026
EXPO_PUBLIC_AWS_REGION=ap-south-1
EXPO_PUBLIC_DEBUG_API_CALLS=true
EOF

# 3. Test backend connectivity
bash verify-backend-integration.sh
bash test-api-integration.sh

# 4. Start development
npm run web    # Web (localhost:19006)
npm run android # Android Emulator
npm run ios     # iOS Simulator
```

### For Production

```bash
# 1. Update .env for production
# ⚠️ Set all EXPO_PUBLIC_* variables to production URLs

# 2. Build for deployment
npm run build:android  # Creates APK/AAB for Play Store
npm run build:ios      # Creates Archive for App Store
npm run build          # Creates web build for Vercel/S3

# 3. Upload builds to respective stores
```

---

## 📋 Environment Variables

| Variable | Development | Production |
|----------|------------|-----------|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8080/api` or `http://3.110.173.55:8080/api` | `https://api.aigram.com/api` |
| `EXPO_PUBLIC_BACKEND_URL` | `http://localhost:8080` or `http://3.110.173.55:8080` | `https://api.aigram.com` |
| `EXPO_PUBLIC_S3_BUCKET` | `aigram-practice-videos-2026` | `aigram-practice-videos-2026` |
| `EXPO_PUBLIC_AWS_REGION` | `ap-south-1` | `ap-south-1` |
| `EXPO_PUBLIC_DEBUG_API_CALLS` | `true` | `false` |
| `EXPO_PUBLIC_ENV` | `development` | `production` |

---

## 🔌 API Base URL by Platform

### Android Emulator
- Development: `http://10.0.2.2:8080/api` (maps to host machine)
- Production: `http://3.110.173.55:8080/api` (AWS IP)

### iOS Simulator
- Development: `http://localhost:8080/api`
- Production: `http://3.110.173.55:8080/api` (AWS IP)

### Web Browser
- Development: `http://localhost:8080/api`
- Production: `https://api.aigram.com/api` (with HTTPS)

### Physical Device (iOS/Android)
- Must use public IP or domain: `http://3.110.173.55:8080/api`

---

## 🔐 Authentication Flow

```
1. User clicks "Continue as Guest" or enters phone number
                    ↓
2. Frontend calls POST /auth/guest/auth OR /auth/login/send-otp
                    ↓
3. Backend returns access_token & refresh_token
                    ↓
4. Frontend stores tokens securely:
   - iOS/Android: Expo SecureStore
   - Web: localStorage (with httpOnly if available)
                    ↓
5. Frontend automatically adds "Authorization: Bearer <token>" to all requests
                    ↓
6. When token expires (1 hour), frontend calls /auth/refresh-token
                    ↓
7. Backend returns new access_token
                    ↓
8. Frontend updates header and retries original request
```

---

## 📝 API Endpoints Cheat Sheet

### Authentication
```bash
# Guest auth
curl -X POST http://3.110.173.55:8080/api/auth/guest/auth

# Send OTP
curl -X POST http://3.110.173.55:8080/api/auth/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919876543210"}'

# Verify OTP & login
curl -X POST http://3.110.173.55:8080/api/auth/login/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919876543210","otp":"123456"}'

# Refresh token
curl -X POST http://3.110.173.55:8080/api/auth/refresh-token \
  -H "Authorization: Bearer <refresh_token>"
```

### User Profile
```bash
# Get profile
curl -H "Authorization: Bearer <token>" \
  http://3.110.173.55:8080/api/users/profile/me

# Update profile
curl -X PUT http://3.110.173.55:8080/api/users/profile/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'
```

### Videos
```bash
# Get feed
curl -H "Authorization: Bearer <token>" \
  "http://3.110.173.55:8080/api/videos/feed?page=1&size=20"

# Get video details
curl -H "Authorization: Bearer <token>" \
  http://3.110.173.55:8080/api/videos/{videoId}

# Like video
curl -X POST -H "Authorization: Bearer <token>" \
  http://3.110.173.55:8080/api/videos/{videoId}/like
```

---

## 🧪 Testing

### Quick Test: Is Backend Running?
```bash
curl http://3.110.173.55:8080/actuator/health
# Expected: {"status":"UP"}
```

### Quick Test: Can I Authenticate?
```bash
curl -X POST http://3.110.173.55:8080/api/auth/guest/auth \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: Token in response
```

### Full Integration Test
```bash
bash test-api-integration.sh
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check EC2 instance running, port 8080 open, security groups |
| "401 Unauthorized" | Token expired/missing, check SecureStore/localStorage, verify JWT_SECRET |
| "CORS error" | Backend CORS config issue, check Access-Control-Allow-Origin header |
| "Network timeout" | Increase API_TIMEOUT in constants/index.ts, check network connectivity |
| "Upload fails" | Check S3 bucket permissions, SAS token valid, network connectivity |

---

## 📚 File Structure

```
src/
├── services/
│   ├── api.ts                    # Main HTTP client with interceptors
│   ├── authService.ts            # Authentication service
│   ├── userService.ts            # User management
│   ├── videoService.ts           # Video operations
│   ├── aiToolsService.ts         # AI tools
│   ├── practiceVideoService.ts   # Practice questions
│   └── awsVideoUploadService.ts  # S3 video upload
│
├── constants/
│   └── index.ts                  # API config, endpoints, constants
│
├── types/
│   └── index.ts                  # TypeScript types & interfaces
│
└── utils/
    └── storage.ts                # Token storage helper
```

---

## 🔑 Key Constants

**File**: `src/constants/index.ts`

```typescript
API_CONFIG = {
  BASE_URL: 'http://3.110.173.55:8080/api',
  TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

AWS_CONFIG = {
  BACKEND_URL: 'http://3.110.173.55:8080'
}

AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'aigram_access_token',
  REFRESH_TOKEN_KEY: 'aigram_refresh_token',
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d',
}

API_ENDPOINTS = {
  AUTH: { GUEST_AUTH: '/auth/guest/auth', ... },
  USERS: { PROFILE_ME: '/users/profile/me', ... },
  VIDEOS: { FEED: '/videos/feed', ... },
  // ... more endpoints
}
```

---

## 💾 Token Storage

### iOS/Android
```typescript
// Stored in Expo SecureStore (encrypted)
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('aigram_access_token', token);
const token = await SecureStore.getItemAsync('aigram_access_token');
```

### Web
```typescript
// Stored in localStorage
localStorage.setItem('aigram_access_token', token);
const token = localStorage.getItem('aigram_access_token');
```

---

## 🔄 Token Refresh Mechanism

```typescript
// In api.ts interceptor
if (error.response?.status === 401 && !originalRequest._retry) {
  // 1. Get refresh token from storage
  // 2. Call POST /auth/refresh-token with refresh token
  // 3. Get new access token
  // 4. Update Authorization header
  // 5. Retry original request
  // 6. If refresh fails, logout user
}
```

---

## 📊 Debug Mode

Enable API logging for development:

**In `.env`**:
```
EXPO_PUBLIC_DEBUG_API_CALLS=true
EXPO_PUBLIC_DEBUG_AUTHENTICATION=true
```

**In Console**:
```
🚀 API Request: { method: 'GET', url: '...', headers: {...} }
✅ API Response: { status: 200, data: {...} }
❌ API Error: { status: 401, message: '...' }
```

---

## 🚀 Deployment Checklist

- [ ] Update all `EXPO_PUBLIC_*` variables to production values
- [ ] Set `EXPO_PUBLIC_DEBUG_*` to `false`
- [ ] Set `EXPO_PUBLIC_ENV` to `production`
- [ ] Enable HTTPS for API endpoints
- [ ] Update CORS origins to production domain
- [ ] Disable guest authentication (if required)
- [ ] Set up error tracking (Sentry, Firebase)
- [ ] Configure analytics (Firebase, Mixpanel)
- [ ] Test all flows before publishing
- [ ] Monitor backend logs in production
- [ ] Set up automated backups for database
- [ ] Configure CI/CD pipeline for deployments

---

## 📞 Support Links

- [Backend AWS Documentation](./backend-aigram-mainline/aws-deployment/README.md)
- [Full Integration Guide](./AWS_FRONTEND_INTEGRATION.md)
- [CORS & Headers Config](./CORS_AND_HEADERS_CONFIG.md)
- [Verification Script](./verify-backend-integration.sh)
- [API Test Suite](./test-api-integration.sh)

---

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Verify backend**: `bash verify-backend-integration.sh`
3. **Run integration tests**: `bash test-api-integration.sh`
4. **Start development**: `npm run web` (or `npm run android`/`npm run ios`)
5. **Check console logs** for API calls with debug enabled
6. **Deploy** using appropriate build commands

---

**Current Setup**:
- Backend: AWS EC2 at `3.110.173.55:8080`
- Database: PostgreSQL RDS (private VPC)
- Storage: S3 bucket `aigram-practice-videos-2026`
- Region: ap-south-1 (Mumbai)
- Status: ✅ Ready for integration

