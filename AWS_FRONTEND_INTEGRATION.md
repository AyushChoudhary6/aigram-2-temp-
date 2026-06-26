# AIgram Frontend - AWS Backend Integration Guide

## Overview

This guide provides complete instructions for integrating the AIgram frontend with the deployed AWS backend.

**Current Status**: ✅ Backend deployed on AWS EC2 at `http://3.110.173.55:8080`

## Architecture

```
┌─────────────────────────────┐
│    Frontend (React Native)  │
│    - iOS/Android/Web        │
│    - Expo Framework         │
└────────────┬────────────────┘
             │ (HTTPS/HTTP)
             ▼
┌─────────────────────────────┐
│   AWS Backend API           │
│   http://3.110.173.55:8080  │
│                             │
│   ┌─────────────────────┐   │
│   │   Spring Boot       │   │
│   │   Java 17 - EC2     │   │
│   │   t2.micro          │   │
│   └─────────────────────┘   │
│            │                │
│            ▼                │
│   ┌─────────────────────┐   │
│   │  PostgreSQL RDS     │   │
│   │  (Private VPC)      │   │
│   └─────────────────────┘   │
│            │                │
│            ▼                │
│   ┌─────────────────────┐   │
│   │  AWS S3             │   │
│   │  (Videos & Media)   │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
```

## Configuration

### 1. Environment Variables

The frontend uses environment variables configured in `.env`:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://3.110.173.55:8080/api
EXPO_PUBLIC_BACKEND_URL=http://3.110.173.55:8080

# AWS Configuration
EXPO_PUBLIC_S3_BUCKET=aigram-practice-videos-2026
EXPO_PUBLIC_AWS_REGION=ap-south-1

# Optional: API Keys
HF_TOKEN=<your-huggingface-token>
```

### 2. Frontend Architecture

**Base Configuration** (`src/constants/index.ts`):
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://3.110.173.55:8080/api',
  TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

**API Service** (`src/services/api.ts`):
- Handles all HTTP requests via Axios
- Automatically includes JWT authentication headers
- Implements token refresh mechanism for expired sessions
- Handles error responses and retries

### 3. API Endpoints

All endpoints are prefixed with `http://3.110.173.55:8080/api`

#### Authentication Endpoints
```
POST   /auth/register/send-otp          - Send OTP for registration
POST   /auth/register/verify            - Verify OTP and register
POST   /auth/login/send-otp             - Send OTP for login
POST   /auth/login/verify               - Verify OTP and login
POST   /auth/guest/auth                 - Guest authentication
POST   /auth/refresh-token              - Refresh access token
POST   /auth/logout                     - Logout user
```

#### User Endpoints
```
GET    /users/profile/me                - Get current user profile
PUT    /users/profile/me                - Update user profile
GET    /users/wallet                    - Get wallet info
GET    /users/wallet/transactions       - Get wallet transactions
```

#### Video Endpoints
```
POST   /videos/upload                   - Upload video
GET    /videos/feed                     - Get personalized feed
GET    /videos/{videoId}                - Get video details
GET    /videos/{videoId}/stream         - Stream video
POST   /videos/{videoId}/like           - Like video
GET    /videos/{videoId}/comments       - Get comments
```

#### AI Tools Endpoints
```
GET    /ai-tools                        - List AI tools
POST   /ai-tools/{toolId}/execute       - Execute AI tool
GET    /ai-tools/{toolId}/free-usage-check - Check free usage
```

#### Practice Endpoints
```
GET    /practice-prompt/questions       - List practice questions
GET    /practice-prompt/questions/{id}  - Get question details
POST   /practice-prompt/submissions     - Submit solution
GET    /practice-prompt/leaderboard     - Get leaderboard
```

## Integration Checklist

### ✅ Completed
- [x] Backend deployed on AWS EC2
- [x] PostgreSQL RDS database configured
- [x] S3 bucket for video storage
- [x] Frontend API configuration
- [x] Axios HTTP client setup
- [x] JWT token management

### 🔄 In Progress
- [ ] CORS configuration verification
- [ ] SSL/HTTPS setup (optional)
- [ ] API health checks

### ⏳ Ready to Deploy
- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Test video upload/streaming
- [ ] Performance testing
- [ ] Error handling verification

## How It Works

### 1. Authentication Flow

```
User Login
    ↓
Send OTP to phone
    ↓
User verifies OTP
    ↓
Backend returns: access_token, refresh_token
    ↓
Frontend stores tokens in secure storage
    ↓
All subsequent requests include: Authorization: Bearer <access_token>
    ↓
When token expires: refresh-token endpoint returns new access_token
```

### 2. Video Upload Flow

```
User selects video
    ↓
Frontend picks video file
    ↓
Frontend gets SAS token from backend
    ↓
Frontend uploads to S3 directly using SAS token
    ↓
Frontend notifies backend of upload completion
    ↓
Backend processes video (transcoding, thumbnails)
    ↓
Video available in user's feed
```

### 3. API Request Flow

```
Frontend makes request
    ↓
Axios interceptor adds Authorization header
    ↓
Request sent to http://3.110.173.55:8080/api/...
    ↓
Backend validates JWT token
    ↓
Backend processes request
    ↓
Response interceptor handles errors/retries
    ↓
Frontend receives data
```

## Services

### Core Services

**API Service** (`src/services/api.ts`):
- Base HTTP client with Axios
- Token management (access/refresh)
- Request/response interceptors
- Error handling and retries
- Request queuing for concurrent requests

**Auth Service** (`src/services/authService.ts`):
- OTP-based authentication
- Phone number login/registration
- Guest authentication
- Token refresh
- Logout functionality

**User Service** (`src/services/userService.ts`):
- Get/update profile
- Wallet management
- Dashboard data

**Video Service** (`src/services/videoService.ts`):
- Fetch feed
- Video details
- Like/unlike videos
- Comments

**AWS Video Upload Service** (`src/services/awsVideoUploadService.ts`):
- Direct S3 upload with SAS tokens
- Upload progress tracking
- Metadata storage

**Practice Service** (`src/services/practiceVideoService.ts`):
- Fetch questions
- Submit solutions
- Leaderboard data

**AI Tools Service** (`src/services/aiToolsService.ts`):
- List AI tools
- Execute tools
- Usage tracking

## Key Configuration Files

### `app.config.js`
Expo configuration with environment variables:
```javascript
module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      EXPO_PUBLIC_BACKEND_URL: 'http://3.110.173.55:8080',
      API_BASE_URL: 'http://3.110.173.55:8080/api',
    },
  },
});
```

### `src/constants/index.ts`
Central configuration for all constants:
- API_CONFIG - Base URL, timeout, retry settings
- AWS_CONFIG - Backend URL for AWS services
- AUTH_CONFIG - Auth-related constants
- API_ENDPOINTS - All API endpoint paths
- DEBUG_CONFIG - Debug logging flags

### `.env` (Production)
Runtime environment variables:
```
EXPO_PUBLIC_API_BASE_URL=http://3.110.173.55:8080/api
EXPO_PUBLIC_BACKEND_URL=http://3.110.173.55:8080
EXPO_PUBLIC_S3_BUCKET=aigram-practice-videos-2026
EXPO_PUBLIC_AWS_REGION=ap-south-1
```

## Important: CORS Configuration

The backend should have CORS configured to accept requests from:
- iOS app (use `http://10.0.2.2:8080/api` for Android emulator)
- Android app (use `http://10.0.2.2:8080/api` for Android emulator)  
- Web app (use `http://localhost:3000` or your web domain)
- Production domain

**Backend CORS Setup** (Spring Boot):
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

## Troubleshooting

### API Connection Issues

**Problem**: "Cannot connect to backend"
```
Solution:
1. Verify EC2 instance is running: aws ec2 describe-instances
2. Check security group allows port 8080
3. Test health: curl http://3.110.173.55:8080/actuator/health
4. Check backend logs: ssh to EC2 and view journalctl logs
```

**Problem**: "401 Unauthorized"
```
Solution:
1. Verify access token is stored correctly
2. Check token hasn't expired
3. Verify refresh token mechanism works
4. Check JWT_SECRET matches between frontend and backend
```

**Problem**: "CORS error"
```
Solution:
1. Verify backend has CORS enabled
2. Check allowed origins in backend config
3. Enable credentials if using cookies
4. Check Access-Control-Allow-Headers includes Authorization
```

### Token Management

**Access Token Expiry**: The frontend automatically refreshes tokens
**Refresh Token**: Stored securely in Expo SecureStore
**Guest Token**: Stored in AsyncStorage

### Video Upload Issues

**Problem**: "Upload fails silently"
```
Solution:
1. Check S3 bucket permissions
2. Verify SAS token is valid
3. Check video file size limits
4. Verify network connectivity
```

## Testing

### Manual API Testing

```bash
# Health check
curl http://3.110.173.55:8080/actuator/health

# Get privacy policy (public endpoint)
curl http://3.110.173.55:8080/api/legal/privacy-policy

# Login (get token)
curl -X POST http://3.110.173.55:8080/api/auth/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919876543210"}'

# Authenticated request
curl -H "Authorization: Bearer <your_token>" \
  http://3.110.173.55:8080/api/users/profile/me
```

### Using Postman

1. Create collection
2. Set base URL: `http://3.110.173.55:8080/api`
3. Create requests for each endpoint
4. Save responses for documentation

## Security Best Practices

✅ **Implemented**:
- JWT token-based authentication
- Secure token storage (Expo SecureStore for iOS/Android)
- Automatic token refresh
- HTTPS support ready

✅ **Configure in Production**:
- Enable HTTPS/SSL
- Set strong JWT_SECRET (min 32 chars)
- Restrict CORS origins to specific domains
- Use environment-specific URLs
- Implement rate limiting
- Add API key for external integrations

## Performance Optimization

### Frontend Optimizations
- Axios request timeout: 30 seconds
- Automatic retry on failures (3 attempts)
- Request/response interceptor logging
- Token caching in secure storage
- Pagination for large datasets

### Backend Configuration (AWS)
- RDS Multi-AZ (high availability)
- CloudFront for static assets
- S3 for video storage
- Caching strategy for frequently accessed data
- Database connection pooling

## Deployment Steps

### Step 1: Prepare Environment
```bash
# Update .env file with your AWS backend IP
EXPO_PUBLIC_API_BASE_URL=http://<AWS_EC2_IP>:8080/api
EXPO_PUBLIC_BACKEND_URL=http://<AWS_EC2_IP>:8080
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Test Locally (Optional)
```bash
# Web
npm run web

# Android emulator
npm run android

# iOS simulator
npm run ios
```

### Step 4: Build for Production
```bash
# Android APK/AAB
npm run build:android

# iOS Archive
npm run build:ios

# Web
npm run build
```

### Step 5: Deploy
- Upload to Play Store (Android)
- Upload to App Store (iOS)
- Deploy web to Vercel/S3 (web)

## Monitoring

### Backend Monitoring
```bash
# SSH to EC2
ssh -i keypair.pem ec2-user@3.110.173.55

# View logs
sudo journalctl -u aigram -f

# Check status
sudo systemctl status aigram

# View metrics
curl http://localhost:8080/actuator/metrics
```

### Frontend Monitoring
- Debug logs in console (enable via `DEBUG_CONFIG`)
- Error tracking (integrate Sentry)
- Analytics (Firebase or custom)

## Support

For issues or questions:
1. Check backend logs on EC2
2. Verify API endpoints in `src/constants/index.ts`
3. Check service implementations in `src/services/`
4. Review AWS deployment documentation

---

**Last Updated**: May 4, 2026
**AWS Region**: ap-south-1
**Backend IP**: 3.110.173.55
**Backend Port**: 8080
**API Base Path**: /api
