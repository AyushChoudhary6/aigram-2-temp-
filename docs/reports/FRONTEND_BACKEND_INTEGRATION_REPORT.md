# Frontend-Backend Integration Report for AIgram

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Integration Status](#current-integration-status)
3. [API Endpoint Mapping](#api-endpoint-mapping)
4. [Integration Gaps Analysis](#integration-gaps-analysis)
5. [Data Contract Mismatches](#data-contract-mismatches)
6. [Authentication & Authorization Issues](#authentication--authorization-issues)
7. [Missing Frontend Implementations](#missing-frontend-implementations)
8. [Recommended API Client Structure](#recommended-api-client-structure)
9. [Priority Integration Plan](#priority-integration-plan)
10. [Risk Assessment](#risk-assessment)

## Executive Summary

The AIgram frontend is a React Native/Expo application with comprehensive service layers that are **partially aligned** with the backend API. While the architecture and service structure are well-designed, there are significant gaps between the frontend expectations and backend implementations.

### Key Findings:
- ✅ **Authentication Flow**: Well-aligned with backend OTP-based authentication
- ✅ **Service Architecture**: Frontend service layer matches backend service structure
- ⚠️ **API Endpoints**: ~60% coverage - many backend endpoints not integrated
- ❌ **Data Contracts**: Several payload and response format mismatches
- ❌ **UI Implementation**: Most service layers complete but UI components missing

### Integration Complexity: **MEDIUM to HIGH**
- Service layer integration: **LOW** (already well-structured)
- API contract alignment: **MEDIUM** (requires payload adjustments)
- UI implementation: **HIGH** (significant UI development needed)

## Current Integration Status

### ✅ Fully Integrated Services
**None** - While service layers exist, no services are fully integrated with complete UI implementations.

### 🚧 Partially Integrated Services

#### Authentication Service (70% Complete)
**Frontend File**: `src/services/authService.ts`
**Backend Endpoints**: `/api/auth/*`, `/api/validation/*`

**Implemented**:
- Phone-based OTP registration/login flow
- Guest authentication
- Token management and refresh
- JWT validation

**Missing**:
- Guest user upgrade implementation
- Bulk user operations (admin)
- User activity logging
- OTP status checking

#### User Profile Service (40% Complete)
**Frontend File**: `src/context/AppContext.tsx`, `src/screens/main/ProfileScreen.tsx`
**Backend Endpoints**: `/api/users/*`

**Implemented**:
- Basic profile display
- User context management

**Missing**:
- Profile editing interface
- Profile picture upload
- Creator/viewer dashboards
- User analytics
- Wallet integration

### ❌ Not Integrated Services

#### Video Service (Service Layer Only)
**Frontend File**: `src/services/videoService.ts`
**Backend Endpoints**: `/api/videos/*`

**Status**: Complete service layer, no UI implementation

#### AI Tools Service (Service Layer Only)
**Frontend File**: `src/services/aiToolsService.ts`
**Backend Endpoints**: `/api/ai-tools/*`

**Status**: Complete service layer, no UI implementation

#### Practice Service (Service Layer Only)
**Frontend File**: `src/services/practicePromptService.ts`
**Backend Endpoints**: `/api/practice/*`

**Status**: Complete service layer, no UI implementation

#### Payment Service (Not Implemented)
**Frontend File**: None
**Backend Endpoints**: `/api/payments/*`

**Status**: No frontend implementation

## API Endpoint Mapping

### Authentication & User Management

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| `sendRegistrationOtp()` | `POST /api/auth/register/send-otp` | ✅ Aligned | None |
| `verifyRegistration()` | `POST /api/auth/register/verify` | ✅ Aligned | None |
| `sendLoginOtp()` | `POST /api/auth/login/send-otp` | ✅ Aligned | None |
| `verifyLogin()` | `POST /api/auth/login/verify` | ✅ Aligned | None |
| `authenticateAsGuest()` | `POST /api/auth/guest/auth` | ✅ Aligned | None |
| `upgradeGuestUser()` | `POST /api/auth/guest/upgrade` | ❌ Not Implemented | Missing frontend implementation |
| `refreshToken()` | `POST /api/auth/refresh-token` | ✅ Aligned | None |
| `logout()` | `POST /api/auth/logout` | ✅ Aligned | None |
| `simpleLogout()` | `POST /api/auth/logout/simple` | ✅ Aligned | None |
| `guestLogout()` | `POST /api/auth/guest/logout` | ✅ Aligned | None |
| `validateToken()` | `POST /api/auth/validate-token` | ✅ Aligned | None |
| `sendOtp()` | `POST /api/validation/send-otp` | ❌ Not Used | Generic OTP not implemented |
| `verifyOtp()` | `POST /api/validation/verify-otp` | ❌ Not Used | Generic OTP not implemented |
| `validatePhoneNumber()` | `POST /api/validation/validate-phone` | ❌ Not Implemented | Missing frontend method |
| `getOtpStatus()` | `GET /api/validation/otp-status/{phoneNumber}` | ❌ Not Implemented | Missing frontend method |
| `resendOtp()` | `POST /api/validation/resend-otp` | ❌ Not Implemented | Missing frontend method |

### User Profile Management

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| `getCurrentUser()` | `GET /api/users/profile/me` | ⚠️ Context Only | No API integration |
| `updateProfile()` | `PUT /api/users/profile/me` | ❌ Not Implemented | Missing frontend method |
| `uploadProfilePicture()` | `POST /api/users/profile/me/picture` | ❌ Not Implemented | Missing frontend method |
| `getProfileByUsername()` | `GET /api/users/profile/username/{username}` | ❌ Not Implemented | Missing frontend method |
| `getCreatorDashboard()` | `GET /api/users/profile/creator-dashboard` | ❌ Not Implemented | Missing frontend method |
| `getViewerDashboard()` | `GET /api/users/profile/viewer-dashboard` | ❌ Not Implemented | Missing frontend method |
| `getWallet()` | `GET /api/users/wallet` | ❌ Not Implemented | Missing frontend method |
| `getWalletTransactions()` | `GET /api/users/wallet/transactions` | ❌ Not Implemented | Missing frontend method |

### Video Service

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| `uploadVideo()` | `POST /api/videos/upload` | ⚠️ Payload Mismatch | Frontend expects File, backend expects URL |
| `getUploadStatus()` | `GET /api/videos/{videoId}/upload-status` | ✅ Aligned | None |
| `getVideoById()` | `GET /api/videos/{videoId}` | ✅ Aligned | None |
| `searchVideos()` | `GET /api/videos/search` | ✅ Aligned | None |
| `getVideoFeed()` | `GET /api/videos/feed` | ✅ Aligned | None |
| `getUserVideos()` | `GET /api/videos/my-videos` | ✅ Aligned | None |
| `updateVideo()` | `PUT /api/videos/{videoId}` | ✅ Aligned | None |
| `deleteVideo()` | `DELETE /api/videos/{videoId}` | ✅ Aligned | None |
| `getStreamUrl()` | `GET /api/videos/{videoId}/stream` | ✅ Aligned | None |
| `toggleLike()` | `POST /api/videos/{videoId}/like` | ✅ Aligned | None |
| `getComments()` | `GET /api/videos/{videoId}/comments` | ✅ Aligned | None |
| `addComment()` | `POST /api/videos/{videoId}/comments` | ✅ Aligned | None |
| `getGuestViewLimit()` | `GET /api/videos/guest-limit` | ✅ Aligned | None |

### AI Tools Service

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| `getAITools()` | `GET /api/ai-tools` | ✅ Aligned | None |
| `getAIToolById()` | `GET /api/ai-tools/{toolId}` | ✅ Aligned | None |
| `searchAITools()` | `POST /api/ai-tools/search` | ⚠️ Method Mismatch | Frontend uses GET, backend uses POST |
| `createAITool()` | `POST /api/ai-tools` | ✅ Aligned | None |
| `updateAITool()` | `PUT /api/ai-tools/{toolId}` | ✅ Aligned | None |
| `executeAITool()` | `POST /api/ai-tools/{toolId}/execute` | ✅ Aligned | None |
| `getAIToolCostEstimate()` | `POST /api/ai-tools/{toolId}/estimate-cost` | ✅ Aligned | None |
| `getUsageHistory()` | `GET /api/ai-tools/usage/history` | ✅ Aligned | None |
| `executeGenericPrompt()` | `POST /api/ai-tools/generic-prompt/execute` | ✅ Aligned | None |
| `checkFreeUsage()` | `GET /api/ai-tools/generic-prompt/free-usage-check` | ✅ Aligned | None |
| `getPopularAITools()` | `GET /api/ai-tools/popular` | ✅ Aligned | None |

### Practice Service

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| `getQuestions()` | `GET /api/practice/questions` | ✅ Aligned | None |
| `getQuestionById()` | `GET /api/practice/questions/{questionId}` | ✅ Aligned | None |
| `createQuestion()` | `POST /api/practice/questions` | ✅ Aligned | None |
| `submitSolution()` | `POST /api/practice/submissions` | ✅ Aligned | None |
| `getMySubmissions()` | `GET /api/practice/submissions/my` | ✅ Aligned | None |
| `getLeaderboard()` | `GET /api/practice/leaderboard` | ✅ Aligned | None |
| `getMyStatistics()` | `GET /api/practice/statistics/my` | ✅ Aligned | None |
| `getPracticeMetadata()` | `GET /api/practice/metadata` | ✅ Aligned | None |

### Payment Service

| Frontend Service Method | Backend Endpoint | Status | Issues |
|-------------------------|------------------|---------|---------|
| **All Payment Methods** | `/api/payments/*` | ❌ Not Implemented | Entire service missing from frontend |

## Integration Gaps Analysis

### 1. Missing Backend Endpoints in Frontend

#### User Service Endpoints Not Integrated:
- `GET /api/admin/users` - Admin user management
- `PUT /api/admin/users/{userId}/status` - Update user status
- `PUT /api/admin/users/{userId}/role` - Update user role
- `DELETE /api/admin/users/{userId}` - Delete user
- `GET /api/admin/users/statistics` - User statistics
- `PUT /api/admin/users/bulk/status` - Bulk user operations
- `GET /api/admin/users/{userId}/activity` - User activity logs

#### Video Service Endpoints Not Integrated:
- `GET /api/videos/search/suggestions` - Search suggestions
- `POST /api/videos/{videoId}/view-progress` - View progress tracking
- `GET /api/videos/liked` - User's liked videos
- `GET /api/videos/{videoId}/like-stats` - Like statistics
- `GET /api/videos/comments/{commentId}/replies` - Comment replies
- `PUT /api/videos/comments/{commentId}` - Update comment
- `DELETE /api/videos/comments/{commentId}` - Delete comment
- `GET /api/videos/{videoId}/engagement-stats` - Engagement statistics
- `GET /api/videos/my-engagement-stats` - User engagement stats
- `GET /api/videos/device-info` - Device information
- All admin dashboard endpoints (`/api/admin/dashboard/*`)
- All admin video management endpoints (`/api/admin/videos/*`)

#### AI Tools Service Endpoints Not Integrated:
- `GET /api/ai-tools/author/{authorId}` - Tools by author
- `GET /api/ai-tools/{toolId}/statistics` - Tool statistics
- `GET /api/ai-tools/generic-prompt/usage-history` - Generic prompt history
- All admin endpoints (`/api/ai-tools/admin/*`, `/api/ai-tools/{toolId}/approve`, `/api/ai-tools/{toolId}/reject`)

#### Practice Service Endpoints Not Integrated:
- `GET /api/practice/questions/author/{authorId}` - Questions by author
- `GET /api/practice/questions/popular` - Popular questions
- `GET /api/practice/questions/top-rated` - Top-rated questions
- `GET /api/practice/submissions/question/{questionId}` - Question submissions

#### Payment Service Endpoints Not Integrated:
- **ALL ENDPOINTS** - Complete payment service missing

### 2. Frontend Methods Not Matching Backend

#### Video Upload Mismatch:
**Frontend Expectation**:
```typescript
uploadVideo(file: File, metadata: VideoUploadRequest): Promise<ApiResponse<VideoUploadResponse>>
```

**Backend Expectation**:
```json
POST /api/videos/upload
{
  "videoUrl": "https://example.com/video.mp4",
  "title": "Video Title",
  "description": "Description",
  "genre": "EDUCATIONAL",
  "tags": ["tag1", "tag2"],
  "visibility": "PUBLIC"
}
```

**Issue**: Frontend expects file upload, backend expects URL-based upload.

#### AI Tools Search Mismatch:
**Frontend Implementation**:
```typescript
searchAITools(query: string, page: number, size: number): Promise<ApiResponse<PaginatedResponse<AITool>>>
// Uses GET request with query parameters
```

**Backend Implementation**:
```json
POST /api/ai-tools/search
{
  "searchTerm": "search text",
  "visibility": "PUBLIC",
  "page": 0,
  "size": 20
}
```

**Issue**: Frontend uses GET, backend uses POST with request body.

## Data Contract Mismatches

### 1. Authentication Response Format

**Frontend Expectation** (`src/types/index.ts`):
```typescript
interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
  tokenExpiration: string;
}
```

**Backend Response**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "role": "REGISTERED",
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2024-01-19T12:00:00Z"
  }
}
```

**Mismatch**: Frontend expects `tokenExpiration`, backend provides `expiresAt`.

### 2. Video Model Differences

**Frontend Type** (`src/types/index.ts`):
```typescript
interface Video {
  videoId: string;
  title: string;
  description: string;
  authorId: string;
  authorName?: string;
  category: string;
  genre: string;
  tags: string[];
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  status: 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'PENDING';
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt?: string;
  thumbnailUrl?: string;
  streamUrl?: string;
}
```

**Backend Model**:
```json
{
  "videoId": "uuid",
  "title": "Video Title",
  "description": "Description",
  "authorId": "uuid",
  "genre": "ENTERTAINMENT",
  "duration": 120,
  "viewCount": 500,
  "likeCount": 50,
  "status": "APPROVED",
  "visibility": "PUBLIC",
  "createdAt": "2024-01-19T12:00:00Z",
  "thumbnailUrl": "url",
  "streamUrl": "url"
}
```

**Mismatches**:
- Frontend has `category` field, backend doesn't
- Frontend has `authorName` field, backend doesn't
- Frontend has `commentCount` field, backend doesn't
- Frontend has `updatedAt` field, backend doesn't

### 3. User Model Differences

**Frontend Type**:
```typescript
interface User {
  userId: string;
  name: string;
  username?: string;
  phoneNumber: string;
  role: UserRole;
  userType: UserType;
  bio?: string;
  profilePictureUrl?: string;
  totalVideosUploaded?: number;
  totalViews?: number;
  createdAt: string;
  updatedAt?: string;
  active?: boolean;
  lastLoginAt?: string;
}
```

**Backend Model**:
```json
{
  "userId": "uuid",
  "name": "John Doe",
  "username": "johndoe",
  "phoneNumber": "+1234567890",
  "role": "REGISTERED",
  "bio": "User bio",
  "profilePictureUrl": "url",
  "totalVideosUploaded": 5,
  "totalViews": 1000,
  "createdAt": "2024-01-19T12:00:00Z"
}
```

**Mismatches**:
- Frontend has `userType` field, backend doesn't
- Frontend has `updatedAt` field, backend doesn't
- Frontend has `active` field, backend doesn't
- Frontend has `lastLoginAt` field, backend doesn't

## Authentication & Authorization Issues

### 1. Header Management

**Frontend Implementation** (`src/services/api.ts`):
```typescript
// Frontend tries to manage headers manually
config.headers.Authorization = `Bearer ${accessToken}`;
```

**Backend Expectation**:
- Gateway strips forbidden headers: `X-User-ID`, `X-User-Phone`, `X-User-Role`
- Gateway injects user context headers automatically
- Frontend should only send `Authorization: Bearer <token>`

**Issue**: Frontend implementation is correct, but documentation needed.

### 2. Guest User Restrictions

**Frontend Implementation**:
```typescript
// Limited guest restrictions in VideoUpload component
if (!canUpload) {
  return <RestrictedView />;
}
```

**Backend Restrictions**:
- Comprehensive guest restrictions across all services
- Specific endpoints blocked for guest users
- Rate limiting differences by user role

**Issue**: Frontend doesn't implement all backend guest restrictions.

### 3. Rate Limiting

**Frontend**: No rate limiting awareness or handling
**Backend**: Comprehensive rate limiting with different tiers

**Issue**: Frontend should handle rate limit responses and show appropriate UI.

## Missing Frontend Implementations

### 1. Complete UI Components Missing

#### Video Platform UI:
- Video player component
- Video feed/list component
- Video search interface
- Comment system UI
- Video upload progress UI
- Video analytics dashboard

#### AI Tools Platform UI:
- AI tools marketplace/browser
- Tool execution interface
- Cost estimation display
- Usage history interface
- Tool creation wizard
- Generic prompt chat interface

#### Practice Platform UI:
- Question browser/filter interface
- Code editor component
- Submission results display
- Leaderboard interface
- Progress tracking dashboard
- Question creation interface

#### Payment System UI:
- Coin package selection
- Payment processing interface
- Transaction history
- Wallet balance display
- Payment success/failure handling

#### Admin Dashboard UI:
- User management interface
- Content moderation tools
- Analytics dashboards
- System health monitoring
- Bulk operations interface

### 2. Missing Service Integrations

#### Payment Service:
```typescript
// Completely missing from frontend
class PaymentService {
  async getPackages(): Promise<ApiResponse<CoinPackage[]>>
  async createPayment(data: PaymentCreateRequest): Promise<ApiResponse<PaymentCreateResponse>>
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<Payment>>
  async getPaymentHistory(): Promise<ApiResponse<PaginatedResponse<Payment>>>
  // ... all payment methods missing
}
```

#### Wallet Integration:
```typescript
// Missing from user service
async getWallet(): Promise<ApiResponse<Wallet>>
async getWalletTransactions(): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>>
```

#### Admin Operations:
```typescript
// Missing admin-specific methods in all services
async approveVideo(videoId: string): Promise<ApiResponse<any>>
async rejectVideo(videoId: string, reason: string): Promise<ApiResponse<any>>
async bulkApproveVideos(videoIds: string[]): Promise<ApiResponse<any>>
// ... many admin methods missing
```

## Recommended API Client Structure

### 1. Enhanced API Service

```typescript
// src/services/api.ts - Enhanced version
class ApiService {
  // Add rate limiting handling
  private handleRateLimit(error: any): void {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      // Show rate limit UI notification
      this.showRateLimitNotification(retryAfter);
    }
  }

  // Add guest restriction handling
  private handleGuestRestriction(error: any): void {
    if (error.response?.status === 403 && error.response.data?.message?.includes('guest')) {
      // Show upgrade prompt
      this.showGuestUpgradePrompt();
    }
  }

  // Enhanced error handling
  private handleApiError(error: any): ApiError {
    this.handleRateLimit(error);
    this.handleGuestRestriction(error);
    // ... existing error handling
  }
}
```

### 2. Payment Service Implementation

```typescript
// src/services/paymentService.ts - New file needed
import { apiService } from './api';
import { API_ENDPOINTS } from '../constants';

class PaymentService {
  async getPackages(): Promise<ApiResponse<CoinPackage[]>> {
    return await apiService.get<CoinPackage[]>(API_ENDPOINTS.PAYMENTS.PACKAGES);
  }

  async createPayment(data: PaymentCreateRequest): Promise<ApiResponse<PaymentCreateResponse>> {
    return await apiService.post<PaymentCreateResponse>(API_ENDPOINTS.PAYMENTS.CREATE, data);
  }

  async handlePaymentSuccess(data: PaymentSuccessRequest): Promise<ApiResponse<any>> {
    return await apiService.post(API_ENDPOINTS.PAYMENTS.SUCCESS, data);
  }

  async handlePaymentFailure(data: PaymentFailureRequest): Promise<ApiResponse<any>> {
    return await apiService.post(API_ENDPOINTS.PAYMENTS.FAILURE, data);
  }

  async getPaymentStatus(paymentId: string): Promise<ApiResponse<Payment>> {
    const url = apiService.replaceUrlParams(API_ENDPOINTS.PAYMENTS.STATUS, { paymentId });
    return await apiService.get<Payment>(url);
  }

  async getPaymentHistory(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const queryString = apiService.buildQueryString({ page, size });
    const url = `${API_ENDPOINTS.PAYMENTS.HISTORY}${queryString}`;
    return await apiService.get<PaginatedResponse<Payment>>(url);
  }
}

export const paymentService = new PaymentService();
```

### 3. Enhanced User Service

```typescript
// src/services/userService.ts - New file needed
class UserService {
  async getProfile(): Promise<ApiResponse<User>> {
    return await apiService.get<User>(API_ENDPOINTS.USERS.PROFILE_ME);
  }

  async updateProfile(updates: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return await apiService.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, updates);
  }

  async uploadProfilePicture(file: File): Promise<ApiResponse<User>> {
    return await apiService.uploadFile<User>(
      API_ENDPOINTS.USERS.UPLOAD_PICTURE,
      file,
      'file'
    );
  }

  async getWallet(): Promise<ApiResponse<Wallet>> {
    return await apiService.get<Wallet>(API_ENDPOINTS.USERS.WALLET);
  }

  async getWalletTransactions(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> {
    const queryString = apiService.buildQueryString({ page, size });
    const url = `${API_ENDPOINTS.USERS.WALLET_TRANSACTIONS}${queryString}`;
    return await apiService.get<PaginatedResponse<WalletTransaction>>(url);
  }

  async getCreatorDashboard(): Promise<ApiResponse<CreatorDashboard>> {
    return await apiService.get<CreatorDashboard>(API_ENDPOINTS.USERS.CREATOR_DASHBOARD);
  }

  async getViewerDashboard(): Promise<ApiResponse<ViewerDashboard>> {
    return await apiService.get<ViewerDashboard>(API_ENDPOINTS.USERS.VIEWER_DASHBOARD);
  }
}

export const userService = new UserService();
```

### 4. Fixed Video Service

```typescript
// src/services/videoService.ts - Fix video upload
class VideoService {
  // Fix video upload to match backend expectation
  async uploadVideoFromUrl(metadata: VideoUploadRequest): Promise<ApiResponse<VideoUploadResponse>> {
    return await apiService.post<VideoUploadResponse>(API_ENDPOINTS.VIDEOS.UPLOAD, metadata);
  }

  // Add missing methods
  async getSearchSuggestions(query: string, limit: number = 10): Promise<ApiResponse<string[]>> {
    const queryString = apiService.buildQueryString({ query, limit });
    const url = `${API_ENDPOINTS.VIDEOS.SEARCH_SUGGESTIONS}${queryString}`;
    return await apiService.get<string[]>(url);
  }

  async updateViewProgress(videoId: string, watchDurationSeconds: number, watchPercentage: number): Promise<ApiResponse<any>> {
    const queryString = apiService.buildQueryString({ watchDurationSeconds, watchPercentage });
    const url = `${API_ENDPOINTS.VIDEOS.VIEW_PROGRESS.replace('{videoId}', videoId)}${queryString}`;
    return await apiService.post(url);
  }

  async getLikedVideos(): Promise<ApiResponse<string[]>> {
    return await apiService.get<string[]>(API_ENDPOINTS.VIDEOS.LIKED);
  }

  // ... add all missing methods
}
```

### 5. Fixed AI Tools Service

```typescript
// src/services/aiToolsService.ts - Fix search method
class AIToolsService {
  // Fix search to use POST method
  async searchAITools(searchData: AIToolSearchRequest): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    return await apiService.post<PaginatedResponse<AITool>>(API_ENDPOINTS.AI_TOOLS.SEARCH, searchData);
  }

  // Add missing admin methods
  async approveTool(toolId: string, reason: string): Promise<ApiResponse<AITool>> {
    const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.APPROVE, { toolId });
    return await apiService.post<AITool>(url, { reason });
  }

  async rejectTool(toolId: string, reason: string): Promise<ApiResponse<any>> {
    const url = apiService.replaceUrlParams(API_ENDPOINTS.AI_TOOLS.REJECT, { toolId });
    return await apiService.post(url, { reason });
  }

  async getPendingTools(page: number = 0, size: number = 20): Promise<ApiResponse<PaginatedResponse<AITool>>> {
    const queryString = apiService.buildQueryString({ page, size });
    const url = `${API_ENDPOINTS.AI_TOOLS.ADMIN_PENDING}${queryString}`;
    return await apiService.get<PaginatedResponse<AITool>>(url);
  }
}
```

## Priority Integration Plan

### Phase 1: Critical Foundation (Week 1-2)
**Priority: HIGH**

1. **Fix Data Contract Mismatches**
   - Update `AuthResponse` interface to use `expiresAt` instead of `tokenExpiration`
   - Align `Video` and `User` models with backend responses
   - Update all type definitions to match backend contracts

2. **Implement Missing Authentication Features**
   - Guest user upgrade functionality
   - OTP status checking and resend functionality
   - Phone number validation

3. **Fix Video Upload Implementation**
   - Change from file upload to URL-based upload
   - Implement proper video upload flow
   - Add upload progress tracking

4. **Implement Payment Service**
   - Create complete payment service class
   - Integrate Razorpay payment flow
   - Add coin package management

### Phase 2: Core Features (Week 3-4)
**Priority: HIGH**

1. **Complete User Profile Integration**
   - Profile editing interface
   - Profile picture upload
   - Wallet integration
   - Creator/viewer dashboards

2. **Video Platform UI Implementation**
   - Video player component
   - Video feed interface
   - Comment system UI
   - Video search and filtering

3. **Enhanced Error Handling**
   - Rate limiting awareness
   - Guest restriction handling
   - Proper error notifications

### Phase 3: Advanced Features (Week 5-6)
**Priority: MEDIUM**

1. **AI Tools Platform UI**
   - Tool marketplace interface
   - Tool execution UI
   - Cost estimation display
   - Usage history interface

2. **Practice Platform UI**
   - Question browser
   - Code editor integration
   - Submission results display
   - Leaderboard interface

3. **Admin Dashboard Implementation**
   - Content moderation tools
   - User management interface
   - Analytics dashboards

### Phase 4: Polish & Optimization (Week 7-8)
**Priority: LOW**

1. **Advanced Features**
   - Real-time notifications
   - Advanced analytics
   - Bulk operations
   - Export functionality

2. **Performance Optimization**
   - Caching implementation
   - Lazy loading
   - Image optimization

3. **Testing & Documentation**
   - Integration testing
   - API documentation updates
   - User guides

## Risk Assessment

### High Risk Areas ❌

1. **Payment Integration Complexity**
   - **Risk**: Razorpay integration requires careful handling of webhooks and signatures
   - **Impact**: Critical for monetization
   - **Mitigation**: Thorough testing in sandbox environment, proper error handling

2. **Video Upload Architecture Mismatch**
   - **Risk**: Frontend expects file upload, backend expects URL upload
   - **Impact**: Core feature completely broken
   - **Mitigation**: Implement file-to-URL conversion service or change backend approach

3. **Data Contract Mismatches**
   - **Risk**: Multiple field name and structure differences
   - **Impact**: Runtime errors and data corruption
   - **Mitigation**: Comprehensive type alignment and testing

### Medium Risk Areas ⚠️

1. **Guest User Restrictions**
   - **Risk**: Frontend doesn't implement all backend restrictions
   - **Impact**: Security and business logic violations
   - **Mitigation**: Comprehensive restriction implementation and testing

2. **Rate Limiting Handling**
   - **Risk**: Frontend doesn't handle rate limits
   - **Impact**: Poor user experience when limits are hit
   - **Mitigation**: Implement rate limit awareness and user feedback

3. **Admin Feature Complexity**
   - **Risk**: Large number of admin endpoints to implement
   -
