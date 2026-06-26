# AWS Backend Integration - CORS & Headers Configuration

## Frontend Configuration ✅

### Current Headers Configuration (src/services/api.ts)

The frontend API service automatically includes these headers:

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>  (automatically added)
```

**Response Handling**:
- Automatic token refresh on 401
- Retry logic for failed requests
- Error mapping to standardized format

### CORS Handling

Axios handles CORS automatically. No additional frontend configuration needed.

**For local development with different backends**:

**Android Emulator**:
```
Use: http://10.0.2.2:8080/api
(Maps to host machine localhost)
```

**iOS Simulator**:
```
Use: http://localhost:8080/api
```

**Web**:
```
Use: http://localhost:8080/api (dev)
Use: http://3.110.173.55:8080/api (production)
```

---

## Backend Configuration Required ✅

### Spring Boot CORS Configuration

The backend needs this CORS configuration to work with all frontend clients:

**File**: `backend-aigram-mainline/src/main/java/com/aigram/config/CorsConfig.java`

```java
package com.aigram.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:3000",
                "http://localhost:8081",
                "http://localhost:19000",
                "http://localhost:19001",
                "http://10.0.2.2:8081",
                "http://10.0.2.2:19000",
                "http://10.0.2.2:19001",
                "http://*:*",  // Allow all for development
                "*"  // Production: replace with specific domains
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600)
            .exposedHeaders("Authorization", "X-Total-Count", "X-Page-Number");
    }
}
```

### Request/Response Headers

**Request Headers Expected by Backend**:
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Platform: ios | android | web (optional)
X-Device-Id: <device-id> (for analytics)
```

**Response Headers Provided by Backend**:
```
Content-Type: application/json
Authorization: Bearer <new_token> (if refreshed)
X-Total-Count: 100 (pagination)
X-Page-Number: 1 (pagination)
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

### JWT Configuration

**Backend JWT Configuration** (`application.yml`):

```yaml
app:
  jwt:
    secret: ${JWT_SECRET}  # Min 32 characters
    expiration: 3600000    # 1 hour in milliseconds
    refreshTokenExpiration: 604800000  # 7 days in milliseconds
```

**Frontend Token Handling** (`src/services/api.ts`):
```typescript
// Automatic token refresh on 401
// Token stored in SecureStore for iOS/Android
// Token stored in AsyncStorage for Web
// Supports guest tokens and registered user tokens
```

### Error Response Format

**Standardized Backend Error Response**:
```json
{
  "success": false,
  "message": "Authentication failed",
  "data": null,
  "statusCode": 401,
  "timestamp": "2026-05-04T12:00:00Z",
  "path": "/api/users/profile/me"
}
```

**Frontend Error Mapping** (handled in `api.ts`):
```typescript
HttpStatus.UNAUTHORIZED → ERROR_MESSAGES.UNAUTHORIZED
HttpStatus.FORBIDDEN → ERROR_MESSAGES.FORBIDDEN
HttpStatus.NOT_FOUND → ERROR_MESSAGES.NOT_FOUND
HttpStatus.TOO_MANY_REQUESTS → ERROR_MESSAGES.RATE_LIMITED
HttpStatus.INTERNAL_SERVER_ERROR → ERROR_MESSAGES.SERVER_ERROR
```

---

## Implementation Verification

### ✅ Checklist

- [x] Frontend API service configured with base URL
- [x] Axios interceptors for request/response handling
- [x] JWT token refresh mechanism
- [x] Error handling and retry logic
- [x] Environment variables configured
- [ ] Backend CORS configuration deployed
- [ ] Backend JWT secret configured
- [ ] Health check endpoint accessible
- [ ] API endpoints returning correct responses

### Test CORS Configuration

```bash
# Test OPTIONS request (CORS preflight)
curl -i -X OPTIONS http://3.110.173.55:8080/api/auth/guest/auth \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"

# Expected Response Headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: *
# Access-Control-Allow-Credentials: true
```

### Test Authentication

```bash
# 1. Send OTP
curl -X POST http://3.110.173.55:8080/api/auth/guest/auth \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Use returned token in subsequent requests
curl -X GET http://3.110.173.55:8080/api/users/profile/me \
  -H "Authorization: Bearer <token_from_step_1>"
```

---

## Production Security Configuration

### HTTPS/SSL Setup

**For EC2 Backend** (AWS Certificate Manager):

1. Request SSL certificate for your domain
2. Configure Security Group to allow 443
3. Set up load balancer with SSL termination
4. Update frontend URL to use HTTPS

```env
EXPO_PUBLIC_API_BASE_URL=https://api.aigram.com/api
EXPO_PUBLIC_BACKEND_URL=https://api.aigram.com
```

### CORS in Production

Replace wildcard origins with specific domains:

```java
.allowedOrigins(
    "https://web.aigram.com",
    "https://api.aigram.com",
    "https://app.aigram.com"
)
```

### Rate Limiting

Add rate limiting to prevent abuse:

```java
@Configuration
public class RateLimitConfig {
    @Bean
    public RateLimitInterceptor rateLimitInterceptor() {
        return new RateLimitInterceptor()
            .setRequestsPerMinute(100)  // 100 requests per minute
            .setBypassPaths("/actuator/health");
    }
}
```

### API Key Authentication

For external API integrations:

```typescript
// Frontend adds API key to headers
const config = {
    headers: {
        'X-API-Key': process.env.EXPO_PUBLIC_API_KEY,
        ...
    }
};
```

---

## Debugging & Monitoring

### Enable Debug Logging

**Frontend** (`src/constants/index.ts`):
```typescript
export const DEBUG_CONFIG = {
    API_CALLS: process.env.EXPO_PUBLIC_DEBUG_API_CALLS === 'true',
    AUTHENTICATION: process.env.EXPO_PUBLIC_DEBUG_AUTHENTICATION === 'true',
};
```

**Enable in .env**:
```
EXPO_PUBLIC_DEBUG_API_CALLS=true
EXPO_PUBLIC_DEBUG_AUTHENTICATION=true
```

### Monitor Backend Requests

```bash
# SSH to EC2
ssh -i keypair.pem ec2-user@3.110.173.55

# View real-time logs
sudo journalctl -u aigram -f

# View logs from last hour
sudo journalctl -u aigram --since "1 hour ago"

# View specific error
sudo journalctl -u aigram | grep "ERROR"
```

### Frontend Console Logging

With debug enabled, frontend logs requests:

```
🚀 API Request: {
  method: 'GET',
  url: 'http://3.110.173.55:8080/api/users/profile/me',
  headers: {
    Authorization: 'Bearer eyJhbGciOi...',
    'Content-Type': 'application/json'
  }
}

✅ API Response: {
  status: 200,
  url: 'http://3.110.173.55:8080/api/users/profile/me',
  data: { userId: '123', name: 'John' }
}
```

---

## Troubleshooting CORS Issues

### Issue: "No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Verify backend CORS is configured
2. Check origin is in allowedOrigins list
3. Ensure OPTIONS request returns 200
4. Check browser console for exact origin being sent

### Issue: "Credentials mode is 'include' but CORS headers allow '*'"

**Solution**: 
```java
// Change from allowedOrigins("*") to specific domains
registry.addMapping("/api/**")
    .allowedOrigins("http://localhost:3000")  // Not "*"
    .allowCredentials(true);
```

### Issue: "GET request works but POST returns CORS error"

**Solution**:
```java
// Verify all methods are allowed
.allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
```

---

## Common Integration Patterns

### Pattern 1: Authenticated API Calls

```typescript
// Frontend automatically adds Authorization header
const response = await apiService.get('/users/profile/me');
// Sent as: Authorization: Bearer <token>
```

### Pattern 2: Token Refresh

```typescript
// When 401 received:
// 1. Queue the request
// 2. Call refresh-token endpoint
// 3. Update authorization header
// 4. Retry original request
```

### Pattern 3: Error Handling

```typescript
// Standardized error response
{
    success: false,
    message: "User not found",
    data: null,
    statusCode: 404,
    timestamp: "2026-05-04T12:00:00Z"
}
```

### Pattern 4: Pagination

```typescript
// Response headers include pagination info
X-Total-Count: 100
X-Page-Number: 1

// Frontend uses these to calculate total pages
totalPages = Math.ceil(totalCount / pageSize)
```

---

## Best Practices

1. **Always use HTTPS in production** - Prevents man-in-the-middle attacks
2. **Rotate JWT secrets regularly** - Reduces risk of token compromise
3. **Implement request signing** - For sensitive operations
4. **Add rate limiting** - Prevents DOS attacks
5. **Monitor CORS errors** - May indicate misconfiguration or attacks
6. **Log all API errors** - For debugging and security audits
7. **Use specific CORS origins** - Don't use wildcards in production
8. **Validate all input** - Backend and frontend both

---

**Last Updated**: May 4, 2026
**AWS Backend IP**: 3.110.173.55
**AWS Backend Port**: 8080
**API Base Path**: /api
