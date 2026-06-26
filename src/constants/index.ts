import Constants from 'expo-constants';

const _expoExtra = (Constants.expoConfig || (Constants as any).manifest)?.extra || {};

const getWebOrigin = (): string | null => {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null;
  }
  return window.location.origin;
};

const isLocalWebHost = (origin: string): boolean =>
  origin.includes('localhost') || origin.includes('127.0.0.1');

const getApiBaseUrl = () => {
  const webOrigin = getWebOrigin();
  if (webOrigin && !isLocalWebHost(webOrigin)) {
    // Web production: always use Vercel rewrite proxy, regardless of other env vars
    return `${webOrigin}/proxy/api`;
  }

  const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || _expoExtra.API_BASE_URL;
  if (envApiBaseUrl) return envApiBaseUrl;

  // Local BACK/ backend defaults to PORT=3000 unless overridden.
  return 'http://localhost:3000/api';
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
};

// Get the base IP/Domain from API_CONFIG to construct AWS_CONFIG URL dynamically
// This ensures that if we're using 10.0.2.2 (Android Emulator) it will adapt properly
const getAWSBackendUrl = () => {
  const webOrigin = getWebOrigin();
  if (webOrigin && !isLocalWebHost(webOrigin)) {
    // Web production: always use Vercel rewrite proxy, regardless of other env vars
    return `${webOrigin}/proxy`;
  }

  const expoExtra = _expoExtra;

  const url = process.env.EXPO_PUBLIC_BACKEND_URL ||
              expoExtra.EXPO_PUBLIC_BACKEND_URL;

  if (url) return url;

  // Local BACK/ backend defaults to PORT=3000 unless overridden.
  return 'http://localhost:3000';
};

// AWS Video Upload Configuration
export const AWS_CONFIG = {
  BACKEND_URL: getAWSBackendUrl(),
};

// App Configuration
export const APP_CONFIG = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || 'AIgram',
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENV || 'development',
};

// Authentication Configuration
export const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'aigram_access_token',
  REFRESH_TOKEN_KEY: 'aigram_refresh_token',
  USER_DATA_KEY: 'aigram_user_data',
  GUEST_TOKEN_KEY: 'aigram_guest_token',
  DEVICE_ID_KEY: 'aigram_device_id',
  ACCESS_TOKEN_EXPIRY: process.env.EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY || '1h',
  REFRESH_TOKEN_EXPIRY: process.env.EXPO_PUBLIC_REFRESH_TOKEN_EXPIRY || '7d',
};

// User Roles
export const USER_ROLES = {
  GUEST: 'GUEST',
  REGISTERED: 'REGISTERED',
  ADMIN: 'ADMIN',
} as const;

// User Types
export const USER_TYPES = {
  AUTHENTICATED: 'AUTHENTICATED',
  GUEST: 'GUEST',
} as const;

// Guest User Configuration
export const GUEST_CONFIG = {
  VIEW_LIMIT: parseInt(process.env.EXPO_PUBLIC_GUEST_VIEW_LIMIT || '5'),
  VIEW_RESET_HOURS: parseInt(process.env.EXPO_PUBLIC_GUEST_VIEW_RESET_HOURS || '24'),
};

// AI Tools Configuration
export const AI_TOOLS_CONFIG = {
  FREE_CALLS_LIMIT: parseInt(process.env.EXPO_PUBLIC_FREE_AI_CALLS_LIMIT || '2'),
  RATE_LIMIT: parseInt(process.env.EXPO_PUBLIC_AI_TOOLS_RATE_LIMIT || '50'),
  MODELS: {
    GPT_3_5_TURBO: 'gpt-3.5-turbo',
    GPT_4: 'gpt-4',
  },
  CATEGORIES: {
    TEXT_GENERATION: 'TEXT_GENERATION',
    TEXT_PROCESSING: 'TEXT_PROCESSING',
    CODE_GENERATION: 'CODE_GENERATION',
    IMAGE_PROCESSING: 'IMAGE_PROCESSING',
  },
};

// Video Configuration
export const VIDEO_CONFIG = {
  MAX_UPLOAD_SIZE: process.env.EXPO_PUBLIC_MAX_VIDEO_UPLOAD_SIZE || '100MB',
  SUPPORTED_FORMATS: (process.env.EXPO_PUBLIC_SUPPORTED_VIDEO_FORMATS || 'mp4,avi,mov,mkv').split(','),
  QUALITY_OPTIONS: (process.env.EXPO_PUBLIC_VIDEO_QUALITY_OPTIONS || '720p,480p,360p').split(','),
  GENRES: {
    EDUCATIONAL: 'EDUCATIONAL',
    ENTERTAINMENT: 'ENTERTAINMENT',
    TECHNOLOGY: 'TECHNOLOGY',
    LIFESTYLE: 'LIFESTYLE',
    BUSINESS: 'BUSINESS',
  },
  VISIBILITY: {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE',
  },
};

// Feed Configuration
export const FEED_CONFIG = {
  DEFAULT_PAGE_SIZE: parseInt(process.env.EXPO_PUBLIC_FEED_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.EXPO_PUBLIC_FEED_MAX_PAGE_SIZE || '50'),
  ALGORITHMS: {
    PERSONALIZED: 'PERSONALIZED',
    TRENDING: 'TRENDING',
    LATEST: 'LATEST',
    POPULAR: 'POPULAR',
  },
  REFRESH_REASONS: {
    USER_REQUEST: 'USER_REQUEST',
    AUTO_REFRESH: 'AUTO_REFRESH',
    PREFERENCE_CHANGE: 'PREFERENCE_CHANGE',
  },
};

// Practice Configuration
export const PRACTICE_CONFIG = {
  DIFFICULTIES: {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
  },
  LANGUAGES: {
    JAVASCRIPT: 'JAVASCRIPT',
    PYTHON: 'PYTHON',
    JAVA: 'JAVA',
    CPP: 'CPP',
  },
  SUBMISSION_STATUS: {
    CORRECT: 'CORRECT',
    INCORRECT: 'INCORRECT',
    PARTIAL: 'PARTIAL',
  },
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
  CURRENCY: process.env.EXPO_PUBLIC_CURRENCY || 'INR',
  PAYMENT_METHODS: {
    RAZORPAY: 'RAZORPAY',
  },
  PACKAGES: {
    BASIC: 'basic',
    STANDARD: 'standard',
    PREMIUM: 'premium',
  },
};

// Navigation Routes
export const ROUTES = {
  // Auth Stack
  AUTH_STACK: 'AuthStack',
  LOGIN: 'Login',
  REGISTER: 'Register',
  OTP_VERIFICATION: 'OtpVerification',
  GUEST_AUTH: 'GuestAuth',
  
  // Main App Stack
  MAIN_STACK: 'MainStack',
  TAB_NAVIGATOR: 'TabNavigator',
  
  // Tab Routes
  HOME: 'Home',
  VIDEOS: 'Videos',
  AI_TOOLS: 'AITools',
  PRACTICE: 'Practice',
  PROFILE: 'Profile',
  BUSINESS: 'Business',
  
  // Video Stack
  VIDEO_STACK: 'VideoStack',
  VIDEO_PLAYER: 'VideoPlayer',
  VIDEO_UPLOAD: 'VideoUpload',
  VIDEO_DETAILS: 'VideoDetails',
  
  // AI Tools Stack
  AI_TOOLS_STACK: 'AIToolsStack',
  AI_TOOL_DETAILS: 'AIToolDetails',
  AI_TOOL_EXECUTION: 'AIToolExecution',
  GENERIC_PROMPT: 'GenericPrompt',
  
  // Practice Stack
  PRACTICE_STACK: 'PracticeStack',
  QUESTION_DETAILS: 'QuestionDetails',
  CODE_EDITOR: 'CodeEditor',
    GAMIFIED_PRACTICE: 'GamifiedPractice',
  CHALLENGE_DETAIL: 'ChallengeDetail',
  EDIT_PROFILE: 'EditProfile',
  SETTINGS: 'Settings',
  WALLET: 'Wallet',
  
  // Admin Stack
  ADMIN_STACK: 'AdminStack',
  ADMIN_DASHBOARD: 'AdminDashboard',
  USER_MANAGEMENT: 'UserManagement',
  CONTENT_MODERATION: 'ContentModeration',
  
  // Payment Stack
  PAYMENT_STACK: 'PaymentStack',
  COIN_PACKAGES: 'CoinPackages',
  PAYMENT_HISTORY: 'PaymentHistory',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER_SEND_OTP: '/auth/register/send-otp',
    REGISTER_VERIFY: '/auth/register/verify',
    LOGIN_SEND_OTP: '/auth/login/send-otp',
    LOGIN_VERIFY: '/auth/login/verify',
    LOGIN_EMAIL: '/auth/email/login',
    REGISTER_EMAIL: '/auth/email/register',
    GUEST_AUTH: '/auth/guest/auth',
    GUEST_UPGRADE: '/auth/guest/upgrade',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    LOGOUT_SIMPLE: '/auth/logout/simple',
    GUEST_LOGOUT: '/auth/guest/logout',
    VALIDATE_TOKEN: '/auth/validate-token',
  },
  
  // User Management
  USERS: {
    PROFILE_ME: '/users/profile/me',
    UPDATE_PROFILE: '/users/profile/me',
    UPLOAD_PICTURE: '/users/profile/me/picture',
    PROFILE_BY_USERNAME: '/users/profile/username',
    CREATOR_DASHBOARD: '/users/profile/creator-dashboard',
    VIEWER_DASHBOARD: '/users/profile/viewer-dashboard',
    WALLET: '/users/wallet',
    WALLET_TRANSACTIONS: '/users/wallet/transactions',
  },
  
  // Videos
  VIDEOS: {
    UPLOAD: '/videos/upload',
    UPLOAD_STATUS: '/videos/{videoId}/upload-status',
    DETAILS: '/videos/{videoId}',
    UPDATE: '/videos/{videoId}',
    DELETE: '/videos/{videoId}',
    MY_VIDEOS: '/videos/my-videos',
    STREAM: '/videos/{videoId}/stream',
    RESOLVE_STREAM_URL: '/videos/resolve-stream-url',
    SEARCH: '/videos/search',
    FEED: '/videos/feed', // Legacy endpoint for specialized use cases
    LIKE: '/videos/{videoId}/like',
    COMMENTS: '/videos/{videoId}/comments',
    GUEST_LIMIT: '/videos/guest-limit',
  },

  // User Feed (New personalized feed API)
  FEED: {
    GET_FEED: '/feed',
    PERSONALIZED: '/feed/personalized',
    PREFERENCES: '/feed/preferences',
    REFRESH: '/feed/refresh',
    RESET: '/feed/reset',
    POSITION: '/feed/position',
  },
  
  // AI Tools
  AI_TOOLS: {
    LIST: '/ai-tools',
    DETAILS: '/ai-tools/{toolId}',
    CREATE: '/ai-tools',
    UPDATE: '/ai-tools/{toolId}',
    EXECUTE: '/ai-tools/{toolId}/execute',
    ESTIMATE_COST: '/ai-tools/{toolId}/estimate-cost',
    SEARCH: '/ai-tools/search',
    POPULAR: '/ai-tools/popular',
    USAGE_HISTORY: '/ai-tools/usage/history',
    GENERIC_PROMPT: '/ai-tools/generic-prompt/execute',
    FREE_USAGE_CHECK: '/ai-tools/generic-prompt/free-usage-check',
  },
  
  // Practice (Updated to practice-prompt endpoints)
  PRACTICE: {
    QUESTIONS: '/practice-prompt/questions',
    QUESTION_DETAILS: '/practice-prompt/questions/{questionId}',
    SUBMISSIONS: '/practice-prompt/submissions',
    MY_SUBMISSIONS: '/practice-prompt/submissions/my',
    LEADERBOARD: '/practice-prompt/leaderboard',
    STATISTICS: '/practice-prompt/statistics/my',
    METADATA: '/practice-prompt/metadata',
    // Additional endpoints from new API
    QUESTIONS_BY_AUTHOR: '/practice-prompt/questions/author/{authorId}',
    POPULAR_QUESTIONS: '/practice-prompt/questions/popular',
    TOP_RATED_QUESTIONS: '/practice-prompt/questions/top-rated',
    SUBMISSIONS_BY_QUESTION: '/practice-prompt/submissions/question/{questionId}',
    USER_DASHBOARD: '/practice-prompt/dashboard',
    USER_STATS: '/practice-prompt/users/stats',
    USER_HISTORY: '/practice-prompt/users/history',
    DAILY_ACTIVITY: '/practice-prompt/users/daily-activity',
    GLOBAL_LEADERBOARD: '/practice-prompt/leaderboard/global',
    USER_RANKING: '/practice-prompt/leaderboard/user-ranking',
    WEEKLY_LEADERBOARD: '/practice-prompt/leaderboard/weekly',
    CATEGORY_LEADERBOARD: '/practice-prompt/leaderboard/category/{category}',
    // Admin endpoints
    ADMIN_PENDING_REVIEWS: '/practice-prompt/admin/reviews/pending',
    ADMIN_REVIEW: '/practice-prompt/admin/reviews',
    ADMIN_REVIEW_STATS: '/practice-prompt/admin/reviews/stats',
    
    // Video Practice endpoints
    VIDEO_LEVELS: '/practice-video/levels',
    VIDEO_LEVEL_DETAILS: '/practice-video/levels/{levelId}',
    VIDEO_SECTIONS: '/practice-video/sections',
    USER_VIDEO_PROGRESS: '/practice-video/progress/user/{userId}',
    MY_VIDEO_PROGRESS: '/practice-video/progress/my',
    VIDEO_SUBMISSIONS: '/practice-video/submissions',
    MY_VIDEO_SUBMISSIONS: '/practice-video/submissions/my',
    RETRY_VIDEO_SUBMISSION: '/practice-video/submissions/retry',
    VIDEO_STATISTICS: '/practice-video/statistics/my',
    VIDEO_LEADERBOARD: '/practice-video/leaderboard',
    VIDEO_RANKING: '/practice-video/leaderboard/user-ranking',
  },
  
  // Payments
  PAYMENTS: {
    PACKAGES: '/payments/packages',
    CREATE: '/payments/create',
    STATUS: '/payments/status/{paymentId}',
    HISTORY: '/payments/history',
    SUCCESS: '/payments/success',
    FAILURE: '/payments/failure',
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    VIDEOS_PENDING: '/admin/videos/pending-review',
    VIDEO_REVIEW: '/admin/videos/{videoId}/review',
    AI_TOOLS_PENDING: '/ai-tools/admin/pending',
    AI_TOOL_APPROVE: '/ai-tools/{toolId}/approve',
    AI_TOOL_REJECT: '/ai-tools/{toolId}/reject',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid credentials.',
  TOKEN_EXPIRED: 'Session expired. Please login again.',
  GUEST_LIMIT_REACHED: 'Guest view limit reached. Please register to continue.',
  INSUFFICIENT_COINS: 'Insufficient coins. Please purchase more coins.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  VIDEO_UPLOADED: 'Video uploaded successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
  API_CALLS: process.env.EXPO_PUBLIC_DEBUG_API_CALLS === 'true',
  NAVIGATION: process.env.EXPO_PUBLIC_DEBUG_NAVIGATION === 'true',
  AUTHENTICATION: process.env.EXPO_PUBLIC_DEBUG_AUTHENTICATION === 'true',
};

// Platform Detection
export const PLATFORM = {
  IS_IOS: Constants.platform?.ios !== undefined,
  IS_ANDROID: Constants.platform?.android !== undefined,
  IS_WEB: Constants.platform?.web !== undefined,
};

// Screen Dimensions (will be updated by the app)
export const SCREEN_DIMENSIONS = {
  WIDTH: 0,
  HEIGHT: 0,
};

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
export type Route = typeof ROUTES[keyof typeof ROUTES];
