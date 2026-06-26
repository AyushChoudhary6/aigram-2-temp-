# AIgram AWS Frontend Integration - Deployment Checklist

## Phase 1: Pre-Integration Setup ✅

### Environment Configuration
- [x] Backend deployed on AWS EC2 (3.110.173.55:8080)
- [x] PostgreSQL RDS configured and running
- [x] S3 bucket created (aigram-practice-videos-2026)
- [x] Environment variables defined in `.env`
- [x] API_CONFIG properly set in constants/index.ts
- [x] AWS credentials configured in AWS_CONFIG

### Frontend Code Review
- [x] API service configured with axios
- [x] JWT token management implemented
- [x] Request/response interceptors set up
- [x] Error handling and retry logic in place
- [x] All API endpoints defined in constants
- [x] Services properly structured for AWS integration

### Documentation
- [x] AWS_FRONTEND_INTEGRATION.md created
- [x] CORS_AND_HEADERS_CONFIG.md created
- [x] QUICK_REFERENCE.md created
- [x] Integration verification script created
- [x] API test suite created

---

## Phase 2: Configuration & Setup 🔄

### Environment Variables
- [ ] Update `.env` with correct backend URL
  ```
  EXPO_PUBLIC_API_BASE_URL=http://3.110.173.55:8080/api
  EXPO_PUBLIC_BACKEND_URL=http://3.110.173.55:8080
  ```
- [ ] Update AWS region if different
- [ ] Set debug flags for development

### Backend CORS Configuration
- [ ] Verify backend has CorsConfig.java
- [ ] Check allowed origins include all platforms:
  - [ ] http://localhost:3000 (web)
  - [ ] http://10.0.2.2:8081 (Android emulator)
  - [ ] http://localhost:19000 (Expo web)
- [ ] Verify allowedMethods includes OPTIONS
- [ ] Verify allowedHeaders includes Authorization
- [ ] Verify allowCredentials is true if needed

### JWT Configuration
- [ ] Backend JWT_SECRET is set (min 32 chars)
- [ ] Frontend knows about token expiry
- [ ] Refresh token mechanism tested
- [ ] Token storage secure (SecureStore for mobile)

---

## Phase 3: Testing & Verification 🧪

### Connectivity Tests
- [ ] Backend is reachable:
  ```bash
  curl http://3.110.173.55:8080/actuator/health
  ```
- [ ] Health endpoint returns UP
- [ ] Public endpoints accessible:
  ```bash
  curl http://3.110.173.55:8080/api/legal/privacy-policy
  ```

### Authentication Tests
- [ ] Guest auth works:
  ```bash
  curl -X POST http://3.110.173.55:8080/api/auth/guest/auth
  ```
- [ ] Returns valid access token
- [ ] Token can be used in Authorization header
- [ ] Token refresh works on expiry
- [ ] Logout clears tokens

### API Endpoint Tests
- [ ] User profile endpoints:
  - [ ] GET /users/profile/me
  - [ ] PUT /users/profile/me
  - [ ] GET /users/wallet
  
- [ ] Video endpoints:
  - [ ] GET /videos/feed
  - [ ] GET /videos/{videoId}
  - [ ] POST /videos/{videoId}/like
  
- [ ] AI Tools endpoints:
  - [ ] GET /ai-tools
  - [ ] POST /ai-tools/{toolId}/execute
  
- [ ] Practice endpoints:
  - [ ] GET /practice-prompt/questions
  - [ ] POST /practice-prompt/submissions

### CORS Tests
- [ ] Preflight OPTIONS request returns 200
- [ ] Access-Control-Allow-Origin header present
- [ ] Access-Control-Allow-Methods includes all HTTP methods
- [ ] Access-Control-Allow-Headers includes Authorization

### Error Handling Tests
- [ ] Invalid endpoints return 404
- [ ] Unauthorized requests return 401
- [ ] Expired tokens trigger refresh
- [ ] Refresh token expiry logs out user
- [ ] Server errors return 500 with proper message

---

## Phase 4: Platform-Specific Configuration 📱

### Android Development
- [ ] Android emulator uses `http://10.0.2.2:8080/api`
- [ ] Or use actual device with `http://3.110.173.55:8080/api`
- [ ] Network permissions in AndroidManifest.xml
- [ ] Firewall allows outbound traffic

### iOS Development
- [ ] iOS simulator uses `http://localhost:8080/api`
- [ ] Or use actual device with `http://3.110.173.55:8080/api`
- [ ] App Transport Security configured if needed
- [ ] Allow HTTP for development (localhost)

### Web Development
- [ ] Web uses `http://localhost:8080/api` (dev)
- [ ] Production uses `https://api.aigram.com/api`
- [ ] CORS configured for web origins
- [ ] LocalStorage for token storage

---

## Phase 5: Development Environment Setup 💻

### Local Development
- [ ] Clone repository
  ```bash
  git clone <repo>
  cd frontend-aigram-beIntegrated
  ```

- [ ] Install dependencies
  ```bash
  npm install
  ```

- [ ] Create .env file
  ```bash
  cp .env.example .env
  # Edit with correct backend URL
  ```

- [ ] Run verification script
  ```bash
  bash verify-backend-integration.sh
  ```

- [ ] Run integration tests
  ```bash
  bash test-api-integration.sh
  ```

### Development Server
- [ ] Start Expo development server
  ```bash
  npm start
  ```

- [ ] Web: `npm run web` (Ctrl+W)
- [ ] Android: `npm run android` (a)
- [ ] iOS: `npm run ios` (i)

### Enable Debug Logging
- [ ] Set in .env: `EXPO_PUBLIC_DEBUG_API_CALLS=true`
- [ ] Check console for request/response logs
- [ ] Monitor API calls during testing

---

## Phase 6: Video Upload & Media Functionality 🎬

### S3 Integration
- [ ] S3 bucket accessible from backend
- [ ] IAM role has S3 access
- [ ] Backend can generate SAS tokens
- [ ] Frontend receives SAS tokens correctly

### Video Upload Testing
- [ ] Upload endpoint returns SAS token
- [ ] Frontend can upload to S3 using token
- [ ] Uploaded video appears in user's feed
- [ ] Video processing (transcoding) works
- [ ] Thumbnails generated

### Streaming
- [ ] Stream endpoint returns video URL
- [ ] Video player can play streamed content
- [ ] Seek/pause/resume works
- [ ] Quality switching works (if implemented)

---

## Phase 7: Production Build & Deployment 📦

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Debug logging disabled
- [ ] Environment variables set for production
- [ ] HTTPS enabled for backend
- [ ] CORS configured for production domains

### Backend URL Configuration
- [ ] Production backend has SSL/HTTPS
- [ ] Update `EXPO_PUBLIC_API_BASE_URL` to production
- [ ] Example: `https://api.aigram.com/api`

### Web Build
- [ ] Build: `npm run build`
- [ ] Output: `web-build/` directory
- [ ] Deploy to Vercel/S3/CloudFront
- [ ] Test all features on production web
- [ ] Monitor error tracking (Sentry)

### Android Build
- [ ] Build: `npm run build:android`
- [ ] Creates APK for testing
- [ ] Creates AAB for Play Store
- [ ] Test on physical devices
- [ ] Upload to Google Play Store
- [ ] Monitor crash reports

### iOS Build
- [ ] Build: `npm run build:ios`
- [ ] Creates archive for App Store
- [ ] Test on physical iOS devices
- [ ] Upload to App Store
- [ ] Monitor TestFlight feedback

---

## Phase 8: Post-Deployment Monitoring 📊

### Backend Monitoring
- [ ] Set up CloudWatch monitoring
- [ ] Configure log aggregation
- [ ] Monitor EC2 CPU/Memory/Disk
- [ ] Set up alerts for errors
- [ ] Track API response times

### Frontend Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure analytics (Firebase/Mixpanel)
- [ ] Monitor user sessions
- [ ] Track API failure rates
- [ ] Monitor crash rates

### Database Monitoring
- [ ] Monitor RDS performance
- [ ] Set up backups (automated daily)
- [ ] Monitor disk space usage
- [ ] Track query performance
- [ ] Verify replication (if enabled)

### S3 Monitoring
- [ ] Monitor bucket size
- [ ] Track upload/download rates
- [ ] Verify access logs
- [ ] Set up lifecycle policies
- [ ] Monitor costs

---

## Phase 9: Performance Optimization ⚡

### Frontend Optimization
- [ ] Implement pagination (default 20 items)
- [ ] Cache API responses where appropriate
- [ ] Lazy load images and videos
- [ ] Code splitting for faster initial load
- [ ] Optimize bundle size

### Backend Optimization
- [ ] Enable Redis caching
- [ ] Optimize database queries
- [ ] Implement rate limiting
- [ ] Use CDN for static assets
- [ ] Profile and optimize slow endpoints

### Network Optimization
- [ ] Enable gzip compression
- [ ] Use HTTP/2
- [ ] Optimize asset delivery
- [ ] Monitor latency
- [ ] Use regional endpoints if available

---

## Phase 10: Security Hardening 🔒

### API Security
- [ ] Enable HTTPS/TLS everywhere
- [ ] Implement CORS restrictions
- [ ] Add rate limiting
- [ ] Validate all inputs
- [ ] Sanitize outputs

### Authentication Security
- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Implement token expiry
- [ ] Use refresh tokens
- [ ] Secure token storage
- [ ] Implement account lockout

### Data Security
- [ ] Encrypt sensitive data in transit
- [ ] Encrypt data at rest
- [ ] Implement access controls
- [ ] Regular security audits
- [ ] PII data protection

### Infrastructure Security
- [ ] Restrict security groups
- [ ] Enable VPC endpoints
- [ ] Use private subnets for database
- [ ] Implement WAF
- [ ] Regular backup testing

---

## Documentation Checklist ✍️

- [x] AWS_FRONTEND_INTEGRATION.md - Complete integration guide
- [x] CORS_AND_HEADERS_CONFIG.md - CORS and header configuration
- [x] QUICK_REFERENCE.md - Quick reference for developers
- [x] verify-backend-integration.sh - Backend verification script
- [x] test-api-integration.sh - Comprehensive API test suite
- [ ] DEPLOYMENT.md - Step-by-step deployment guide
- [ ] TROUBLESHOOTING.md - Common issues and solutions
- [ ] API_DOCUMENTATION.md - Detailed API documentation
- [ ] POSTMAN_COLLECTION.md - Export Postman collection
- [ ] VIDEO_TUTORIAL.md - Video setup tutorial

---

## Common Issues & Solutions

### "Cannot connect to backend"
```
1. Check EC2 instance is running
2. Verify port 8080 in security group
3. Check backend process: sudo systemctl status aigram
4. Check logs: sudo journalctl -u aigram -f
```

### "CORS error"
```
1. Verify CorsConfig.java in backend
2. Check allowed origins list
3. Ensure allowCredentials = true if needed
4. Check Content-Type header handling
```

### "401 Unauthorized"
```
1. Verify token stored correctly
2. Check token not expired
3. Verify Authorization header format: "Bearer <token>"
4. Check JWT_SECRET matches backend
```

### "Upload fails"
```
1. Check S3 bucket exists and accessible
2. Verify IAM role has S3 permissions
3. Check SAS token generation
4. Verify file size limits
```

---

## Quick Verification Commands

```bash
# Check backend health
curl http://3.110.173.55:8080/actuator/health

# Test authentication
curl -X POST http://3.110.173.55:8080/api/auth/guest/auth \
  -H "Content-Type: application/json" -d '{}'

# Test user endpoint
curl -H "Authorization: Bearer <token>" \
  http://3.110.173.55:8080/api/users/profile/me

# Run full integration test
bash test-api-integration.sh

# View backend logs
ssh -i keypair.pem ec2-user@3.110.173.55 \
  "sudo journalctl -u aigram -f"
```

---

## Sign-Off

- [ ] All phases completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Ready for production deployment

**Prepared By**: AIgram Development Team
**Date**: May 4, 2026
**Status**: ✅ Ready for Integration

---

## Contact & Support

- **Backend Issues**: Check backend logs on EC2
- **API Issues**: Review API_ENDPOINTS in constants/index.ts
- **Frontend Issues**: Enable DEBUG_CONFIG and check console
- **Deployment**: Follow steps in AWS_FRONTEND_INTEGRATION.md
- **Troubleshooting**: See CORS_AND_HEADERS_CONFIG.md

