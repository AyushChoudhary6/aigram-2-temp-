# AIgram Frontend Implementation Documentation

## Table of Contents
1. [High-Level Architecture Overview](#high-level-architecture-overview)
2. [Project Structure](#project-structure)
3. [Implemented Features](#implemented-features)
4. [User Workflows](#user-workflows)
5. [State Management](#state-management)
6. [API Usage](#api-usage)
7. [Reusable Components](#reusable-components)
8. [Design Patterns](#design-patterns)
9. [Implementation Assumptions](#implementation-assumptions)

## High-Level Architecture Overview

AIgram is a React Native/Expo application built with TypeScript that serves as a comprehensive social learning platform. The architecture follows a service-oriented pattern with clear separation of concerns:

### Core Architecture Principles
- **Cross-Platform Compatibility**: Built with Expo for web, Android, and iOS deployment
- **Service Layer Pattern**: Business logic encapsulated in dedicated service classes
- **Context-Based State Management**: Global state managed through React Context API
- **Type-Safe Development**: Comprehensive TypeScript definitions throughout
- **Modular Navigation**: Stack and tab-based navigation with role-based routing

### Technology Stack
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript 5.9.2 with strict mode enabled
- **Navigation**: React Navigation v7 (Stack, Bottom Tabs)
- **HTTP Client**: Axios 1.13.4 with interceptors
- **Storage**: Expo SecureStore (native) / AsyncStorage (web)
- **State Management**: React Context API with useReducer
- **Icons**: Expo Vector Icons 15.0.3

### Architecture Layers
```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (Screens, Components, Navigation)  │
├─────────────────────────────────────┤
│           Context Layer             │
│     (Global State Management)      │
├─────────────────────────────────────┤
│           Service Layer             │
│  (Business Logic, API Integration)  │
├─────────────────────────────────────┤
│           Utility Layer             │
│    (Storage, Constants, Types)      │
└─────────────────────────────────────┘
```

## Project Structure

```
frontend-aigram/
├── App.tsx                    # Root component with AppProvider
├── index.ts                   # Expo entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables
├── assets/                    # Static assets (icons, images)
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/            # Reusable UI components
    │   └── VideoUpload.tsx    # Video upload component
    ├── constants/             # App-wide constants
    │   └── index.ts           # API endpoints, routes, config
    ├── context/               # Global state management
    │   └── AppContext.tsx     # Main app context with auth state
    ├── navigation/            # Navigation setup
    │   ├── AppNavigator.tsx   # Root navigator with auth routing
    │   ├── AuthNavigator.tsx  # Authentication flow navigator
    │   └── MainNavigator.tsx  # Main app tab navigator
    ├── screens/               # Screen components
    │   ├── auth/              # Authentication screens
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── OtpVerificationScreen.tsx
    │   │   └── GuestAuthScreen.tsx
    │   └── main/              # Main application screens
    │       ├── HomeScreen.tsx
    │       ├── VideosScreen.tsx
    │       ├── AIToolsScreen.tsx
    │       ├── PracticeScreen.tsx
    │       └── ProfileScreen.tsx
    ├── services/              # Business logic and API integration
    │   ├── api.ts             # Core HTTP client with interceptors
    │   ├── authService.ts     # Authentication service
    │   ├── videoService.ts    # Video management service
    │   ├── aiToolsService.ts  # AI tools service
    │   └── practicePromptService.ts # Practice prompt/coding service
    ├── store/                 # Future state management (empty)
    ├── types/                 # TypeScript type definitions
    │   └── index.ts           # All application types
    └── utils/                 # Utility functions
        └── storage.ts         # Cross-platform secure storage
```

### Folder Responsibilities

- **`components/`**: Reusable UI components that can be used across multiple screens
- **`constants/`**: Application-wide constants including API endpoints, routes, and configuration
- **`context/`**: Global state management using React Context API
- **`navigation/`**: Navigation structure and routing logic
- **`screens/`**: Screen components organized by feature area (auth, main)
- **`services/`**: Business logic layer with API integration and data processing
- **`types/`**: TypeScript type definitions for type safety
- **`utils/`**: Utility functions and helpers

## Implemented Features

### 1. Authentication System ✅ FULLY IMPLEMENTED
**Files**: `src/services/authService.ts`, `src/screens/auth/*`, `src/context/AppContext.tsx`

- **Multi-tier Authentication**: Support for Guest, Registered, and Admin users
- **OTP-based Authentication**: Phone number + OTP verification flow
- **Guest Mode**: Limited access for unregistered users with device-based sessions
- **Token Management**: JWT access/refresh tokens with automatic renewal
- **Cross-platform Storage**: SecureStore for native, AsyncStorage for web
- **Session Persistence**: Automatic session restoration on app restart

**Key Components**:
- `LoginScreen.tsx`: Phone number input and OTP request
- `RegisterScreen.tsx`: User registration flow
- `OtpVerificationScreen.tsx`: OTP verification (implementation needed)
- `GuestAuthScreen.tsx`: Guest authentication (implementation needed)

### 2. Navigation System ✅ FULLY IMPLEMENTED
**Files**: `src/navigation/*`

- **Conditional Routing**: Auth stack vs Main stack based on authentication state
- **Tab Navigation**: Bottom tab navigation for main app features
- **Stack Navigation**: Screen transitions within feature areas
- **Role-based Access**: Different navigation flows for different user roles

**Navigation Structure**:
```
AppNavigator (Root)
├── AuthStack (Unauthenticated users)
│   ├── Login
│   ├── Register
│   ├── OtpVerification
│   └── GuestAuth
└── MainStack (Authenticated users)
    └── TabNavigator
        ├── Home
        ├── Videos
        ├── AITools
        ├── Practice
        └── Profile
```

### 3. API Integration Layer ✅ FULLY IMPLEMENTED
**Files**: `src/services/api.ts`, `src/services/*Service.ts`

- **Centralized HTTP Client**: Axios-based with comprehensive interceptors
- **Automatic Token Management**: Token attachment and refresh handling
- **Error Handling**: Standardized error responses and retry logic
- **Request/Response Logging**: Debug-friendly API call logging
- **File Upload Support**: Multipart form data handling for video uploads

**Service Classes**:
- `authService.ts`: Authentication operations (login, register, OTP, guest auth)
- `videoService.ts`: Video management (upload, stream, engagement, comments)
- `aiToolsService.ts`: AI tools (execution, cost estimation, usage tracking)
- `practicePromptService.ts`: Coding practice (questions, submissions, leaderboards)

### 4. State Management ✅ FULLY IMPLEMENTED
**Files**: `src/context/AppContext.tsx`

- **Global App State**: Authentication, theme, network status
- **Context Provider**: Centralized state management with useReducer
- **Convenience Hooks**: `useAuth()`, `useTheme()`, `useNetwork()`
- **Automatic Initialization**: Session restoration and state hydration

### 5. Type System ✅ FULLY IMPLEMENTED
**Files**: `src/types/index.ts`

- **Comprehensive Types**: 200+ TypeScript interfaces and types
- **API Response Types**: Standardized response formats
- **Domain Models**: User, Video, AITool, Question, Payment types
- **Form Types**: Input validation and form state types

### 6. Video Platform 🚧 PARTIALLY IMPLEMENTED
**Files**: `src/services/videoService.ts`, `src/components/VideoUpload.tsx`, `src/screens/main/VideosScreen.tsx`

**Implemented**:
- Video upload service with progress tracking
- File validation and metadata handling
- Video streaming URL generation
- Engagement features (likes, comments)
- Guest view limitations

**Not Implemented**:
- Video player component
- Video feed UI
- Comment display and interaction
- Video search and filtering UI

### 7. AI Tools Platform 🚧 SERVICE LAYER ONLY
**Files**: `src/services/aiToolsService.ts`, `src/screens/main/AIToolsScreen.tsx`

**Implemented**:
- Complete service layer for AI tools
- Tool execution with cost tracking
- Generic prompt execution
- Usage history and analytics
- Cost estimation and free usage limits

**Not Implemented**:
- AI tools browsing UI
- Tool execution interface
- Cost display and payment integration
- Usage history display

### 8. Practice Platform 🚧 SERVICE LAYER ONLY
**Files**: `src/services/practicePromptService.ts`, `src/screens/main/PracticeScreen.tsx`

**Implemented**:
- Complete service layer for coding practice
- Question management and submission
- Leaderboard and statistics
- Multi-language code support
- Test case validation

**Not Implemented**:
- Question browsing UI
- Code editor interface
- Submission results display
- Leaderboard UI

### 9. User Profile System 🚧 BASIC IMPLEMENTATION
**Files**: `src/screens/main/ProfileScreen.tsx`, `src/screens/main/HomeScreen.tsx`

**Implemented**:
- Basic profile display
- User statistics display
- Logout functionality
- Guest user upgrade prompts

**Not Implemented**:
- Profile editing interface
- Avatar/profile picture upload
- Detailed user analytics
- Settings management

## User Workflows

### 1. Authentication Flow
```
App Launch
├── Check stored session
├── If authenticated → Main App
└── If not authenticated → Auth Flow
    ├── Login Screen
    │   ├── Enter phone number
    │   ├── Send OTP → OTP Verification
    │   └── Continue as Guest → Guest Auth
    ├── Register Screen
    │   ├── Enter phone + name
    │   ├── Send OTP → OTP Verification
    │   └── Account created → Main App
    └── OTP Verification
        ├── Enter OTP code
        ├── Verify → Main App
        └── Resend OTP
```

### 2. Main App Navigation Flow
```
Main App (Tab Navigator)
├── Home Tab
│   ├── Welcome message
│   ├── User info display
│   ├── Feature overview
│   └── Guest upgrade prompt (if guest)
├── Videos Tab
│   ├── Video feed (not implemented)
│   ├── Upload video (implemented)
│   └── Video player (not implemented)
├── AI Tools Tab
│   ├── Browse tools (not implemented)
│   ├── Execute tools (not implemented)
│   └── Usage history (not implemented)
├── Practice Tab
│   ├── Browse questions (not implemented)
│   ├── Code editor (not implemented)
│   └── Leaderboard (not implemented)
└── Profile Tab
    ├── User profile display
    ├── Statistics
    ├── Settings (not implemented)
    └── Logout
```

### 3. Video Upload Workflow
```
Video Upload Component
├── Check user permissions (no guest uploads)
├── File Selection
│   ├── Validate file type and size
│   └── Display file info
├── Upload Process
│   ├── Show progress bar
│   ├── Handle upload errors
│   └── Success confirmation
└── Post-upload
    ├── Video processing status
    └── Redirect to video management
```

### 4. Guest User Limitations
```
Guest User Experience
├── Limited video viewing (5 views per 24 hours)
├── No video uploads
├── Limited AI tool usage (2 free calls)
├── No practice submissions
├── Upgrade prompts throughout app
└── Session tied to device ID
```

## State Management

### AppContext Structure
**File**: `src/context/AppContext.tsx`

The application uses React Context API with useReducer for global state management:

```typescript
interface AppState {
  auth: AuthState;
  theme: 'light' | 'dark';
  isOnline: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
```

### State Management Pattern
1. **Centralized State**: All global state in AppContext
2. **Action-based Updates**: useReducer with typed actions
3. **Convenience Hooks**: Specialized hooks for different state slices
4. **Automatic Persistence**: Session data persisted to secure storage

### Available Hooks
- `useApp()`: Full app context access
- `useAuth()`: Authentication state and actions
- `useTheme()`: Theme state and toggle
- `useNetwork()`: Network connectivity status

### State Initialization Flow
```
App Launch
├── AppProvider initialization
├── Load user from storage
├── Validate stored tokens
├── Initialize network listeners
└── Set initial app state
```

## API Usage

### API Service Architecture
**File**: `src/services/api.ts`

The API layer is built around a centralized Axios instance with comprehensive interceptors:

```typescript
class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean;
  private failedQueue: Array<{resolve, reject}>;
}
```

### Key Features
1. **Automatic Token Management**: Tokens attached to all requests
2. **Token Refresh**: Automatic refresh on 401 responses
3. **Request Queuing**: Queue requests during token refresh
4. **Error Standardization**: Consistent error response format
5. **Retry Logic**: Configurable retry with exponential backoff
6. **Debug Logging**: Comprehensive request/response logging

### API Endpoints Configuration
**File**: `src/constants/index.ts`

All API endpoints are centrally defined:

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER_SEND_OTP: '/auth/register/send-otp',
    LOGIN_VERIFY: '/auth/login/verify',
    GUEST_AUTH: '/auth/guest/auth',
    // ... more endpoints
  },
  VIDEOS: {
    UPLOAD: '/videos/upload',
    FEED: '/videos/feed',
    STREAM: '/videos/{videoId}/stream',
    // ... more endpoints
  },
  // ... other service endpoints
};
```

### Service Layer Pattern
Each domain has a dedicated service class:

1. **AuthService**: Authentication operations
2. **VideoService**: Video management operations
3. **AIToolsService**: AI tools operations
4. **PracticePromptService**: Coding practice operations

### API Response Format
All API responses follow a standardized format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}
```

## Reusable Components

### Current Components

#### VideoUpload Component
**File**: `src/components/VideoUpload.tsx`

A comprehensive video upload component with:
- File selection and validation
- Upload progress tracking
- Error handling
- Guest user restrictions
- Cross-platform file handling

**Props**:
```typescript
interface VideoUploadProps {
  onUploadComplete?: (response: VideoUploadResponse) => void;
  onUploadError?: (error: string) => void;
}
```

**Features**:
- File type and size validation
- Progress bar during upload
- Guest user access control
- Platform-specific file selection

### Missing Components (Not Implemented)
Based on the service layer, these components should exist but are not implemented:

1. **VideoPlayer**: Video playback with controls
2. **VideoFeed**: Scrollable video list
3. **AIToolCard**: AI tool display and execution
4. **CodeEditor**: Code input and syntax highlighting
5. **QuestionCard**: Practice question display
6. **Leaderboard**: User rankings display
7. **CommentSection**: Video comments interface
8. **PaymentModal**: Coin purchase interface

## Design Patterns

### 1. Service Layer Pattern
All business logic is encapsulated in service classes:
- Separation of concerns between UI and business logic
- Centralized API integration
- Reusable across different components
- Easy to test and mock

### 2. Context Provider Pattern
Global state management using React Context:
- Single source of truth for app state
- Automatic re-renders on state changes
- Convenient hooks for accessing state
- Proper TypeScript integration

### 3. Higher-Order Component Pattern
Navigation components wrap screens with additional props:
```typescript
<Tab.Screen name={ROUTES.HOME}>
  {(props) => <HomeScreen {...props} user={user} />}
</Tab.Screen>
```

### 4. Factory Pattern
API service creates different service instances:
- Consistent configuration across services
- Shared interceptors and error handling
- Centralized token management

### 5. Observer Pattern
Network status monitoring:
```typescript
useEffect(() => {
  const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

### 6. Strategy Pattern
Platform-specific storage implementation:
```typescript
class SecureStorageService {
  private isWeb = Platform.OS === 'web';
  
  async setItem(key: string, value: string): Promise<void> {
    if (this.isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}
```

## Implementation Assumptions

### 1. Backend API Assumptions
- **RESTful API**: All services assume REST endpoints with standard HTTP methods
- **JWT Authentication**: Token-based authentication with access/refresh token pattern
- **Standardized Responses**: All API responses follow the `ApiResponse<T>` format
- **File Upload**: Multipart form data support for video uploads
- **OTP System**: Backend supports phone-based OTP authentication

### 2. Platform Assumptions
- **Expo Compatibility**: Built for Expo managed workflow
- **Cross-platform Storage**: SecureStore available on native platforms
- **File System Access**: File selection and upload capabilities
- **Network Connectivity**: Online/offline detection available

### 3. User Experience Assumptions
- **Guest Users**: Limited functionality to encourage registration
- **Phone Authentication**: Primary authentication method is phone + OTP
- **Progressive Enhancement**: Core features work offline, enhanced features require network

### 4. Development Assumptions
- **TypeScript**: Full TypeScript adoption with strict mode
- **Modern React**: Hooks-based components, no class components
- **ES6+**: Modern JavaScript features available
- **Build Tools**: Expo CLI for building and deployment

### 5. Business Logic Assumptions
- **Coin-based Economy**: AI tools use virtual currency
- **Content Moderation**: Videos require approval before public visibility
- **User Roles**: Three-tier user system (Guest, Registered, Admin)
- **Usage Limits**: Free tier limitations to encourage paid upgrades

### 6. Security Assumptions
- **Secure Storage**: Sensitive data stored securely on device
- **Token Expiration**: Automatic token refresh handling
- **Input Validation**: Client-side validation with server-side verification
- **HTTPS**: All API communication over secure connections

### 7. Performance Assumptions
- **Lazy Loading**: Components and data loaded on demand
- **Caching**: API responses cached where appropriate
- **Optimistic Updates**: UI updates before server confirmation
- **Error Recovery**: Graceful handling of network failures

### 8. Deployment Assumptions
- **Environment Configuration**: Different configs for dev/staging/production
- **Asset Management**: Static assets served from CDN
- **App Store Distribution**: Built for iOS App Store and Google Play Store
- **Web Deployment**: Also deployable as web application

## Current Implementation Status Summary

### ✅ Fully Implemented
- Core architecture and project structure
- Authentication system and user management
- Navigation and routing
- API integration layer
- State management with Context API
- TypeScript type system
- Cross-platform storage utilities
- Basic video upload functionality

### 🚧 Partially Implemented
- Video platform (service layer complete, UI minimal)
- User profile system (basic display only)
- Home screen (informational only)

### ❌ Not Implemented
- AI Tools user interface
- Practice/coding user interface
- Payment system integration
- Video player and feed
- Comment system UI
- Admin dashboard
- Settings and preferences
- Push notifications
- Offline functionality

The codebase provides a solid foundation with comprehensive service layers and proper architecture, but requires significant UI development to become a fully functional application.
