import { UserRole, UserType } from '../constants';

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
  first: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// User Types
export interface User {
  userId: string;
  name: string;
  email?: string;
  username?: string;
  phoneNumber: string;
  role: UserRole;
  bio?: string;
  profilePictureUrl?: string;
  totalVideosUploaded?: number;
  totalViews?: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface GuestAuthRequest {
  deviceId: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
}

export interface RegisterRequest {
  phoneNumber: string;
  otp: string;
  name: string;
}

export interface LoginRequest {
  phoneNumber: string;
  otp: string;
}

export interface OtpRequest {
  phoneNumber: string;
}

export interface OtpResponse {
  phoneNumber: string;
  message: string;
  expiryTime: string;
  otpLength: number;
}

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse {
  isValid: boolean;
  userId?: string;
  email?: string;
  userType?: UserType;
  expiration?: string;
}

// Profile Types
export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  username?: string;
  profilePictureUrl?: string;
}

export interface CreatorDashboard {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  recentVideos: Video[];
  analytics: any;
}

export interface ViewerDashboard {
  watchHistory: Video[];
  favoriteVideos: Video[];
  watchTime: number;
  preferences: any;
  recommendations: Video[];
}

// Video Types
export interface Video {
  videoId: string;
  title: string;
  description: string;
  authorId: string;
  authorName?: string; // Creator's name
  genre: string;
  tags: string[];
  duration: number;
  viewCount: number;
  likeCount: number;
  status: 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'PENDING';
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  thumbnailUrl?: string;
  streamUrl?: string | number;
  // Backend video source properties
  videoUrl?: string | number;  // Cloud-based URL (S3, CDN, etc.) or require() return
  videoPath?: string; // Local or relative path
  // Social media handles (optional)
  instagramHandle?: string;
  linkedinHandle?: string;
  twitterHandle?: string;
}

export interface VideoUploadRequest {
  videoUrl: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  thumbnailUrl?: string;
}

export interface VideoUploadResponse {
  uploadId: string;
  videoId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedTime?: string;
}

export interface VideoUpdateRequest {
  title?: string;
  description?: string;
  genre?: string;
  tags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE';
  thumbnailUrl?: string;
  instagramHandle?: string;
  twitterHandle?: string;
  linkedinHandle?: string;
}

export interface VideoSearchParams extends PaginationParams {
  query?: string;
  genre?: string;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}

// Feed Types (Based on Backend API Documentation)
export interface FeedParams extends PaginationParams {
  algorithm?: 'PERSONALIZED' | 'TRENDING' | 'LATEST' | 'POPULAR';
  genre?: string;
  excludeGenres?: string[];
  minEngagement?: number;
  maxAge?: number; // in hours
}

export interface FeedPreferences {
  preferredCategories: string[];
  excludedCategories: string[];
  algorithm: 'PERSONALIZED' | 'TRENDING' | 'LATEST' | 'POPULAR';
}

export interface FeedRefreshRequest {
  algorithm?: 'PERSONALIZED' | 'TRENDING' | 'LATEST' | 'POPULAR';
  preferences?: {
    categories: string[];
  };
}

export interface FeedRefreshResponse {
  success: boolean;
  message: string;
  refreshedAt: string;
}

export interface FeedPositionRequest {
  lastViewedVideoId: string;
  position: number;
}

export interface FeedResetResponse {
  success: boolean;
  message: string;
  resetAt: string;
}

export interface VideoEngagement {
  videoId: string;
  isLiked: boolean;
  totalLikes: number;
  userCanComment: boolean;
  commentCount: number;
}

export interface Comment {
  commentId: string;
  videoId: string;
  content: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
}

export interface CommentRequest {
  videoId: string;
  content: string;
  parentCommentId?: string;
}

export interface GuestViewLimit {
  viewsRemaining: number;
  totalLimit: number;
  resetTime: string;
  isLimitReached: boolean;
}

// AI Tools Types
export interface AITool {
  toolId: string;
  title: string;
  description: string;
  authorId: string;
  authorName?: string;
  category: string;
  jsonSchema: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  usageCount: number;
  costPerCall: number;
  freeCallsLimit: number;
  priceMultiplier: number;
  openaiModel: string;
  maxTokens: number;
  temperature: number;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  createdAt: string;
  updatedAt?: string;
}

export interface AIToolCreateRequest {
  title: string;
  description: string;
  jsonSchema: string;
  category: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  freeCallsLimit?: number;
  costPerCall?: number;
  priceMultiplier?: number;
  openaiModel?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIToolExecutionRequest {
  inputPrompt: string;
}

export interface AIToolExecutionResponse {
  executionId: string;
  outputResponse: string;
  tokensUsed: number;
  executionTime: number;
  costIncurred: number;
  isFreeCall: boolean;
  createdAt: string;
}

// Practice Platform Types
export interface PracticeQuestion {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: PracticeQuestionOption[];
  explanation?: string;
  codeSnippet?: string;
  viewCount?: number;
  attemptCount?: number;
  correctAnswerCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PracticeQuestionOption {
  optionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface PracticeSession {
  sessionId: string;
  userId: string;
  questionIds: string[];
  answers: PracticeAnswer[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface PracticeAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpent: number;
  answeredAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  rank: number;
  streak: number;
}

export interface AIToolCostEstimate {
  toolId: string;
  estimatedCostToProvider: number;
  estimatedPriceToUser: number;
  priceMultiplier: number;
  openaiModel: string;
  isFreeCall: boolean;
  remainingFreeCalls: number;
}

export interface GenericPromptRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenericPromptResponse {
  response: string;
  tokensUsed: number;
  costIncurred: number;
  isFreeCall: boolean;
  model: string;
}

export interface FreeUsageCheck {
  remainingFreeCalls: number;
  totalFreeCalls: number;
  resetDate: string;
}

// Practice Types
export interface Question {
  questionId: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  tags: string[];
  authorId: string;
  authorName?: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  testCases: TestCase[];
  solution?: string;
  hints?: string[];
  usageCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface QuestionCreateRequest {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  tags: string[];
  testCases: TestCase[];
  solution?: string;
  hints?: string[];
}

export interface Submission {
  submissionId: string;
  questionId: string;
  userId: string;
  solution: string;
  language: string;
  status: 'CORRECT' | 'INCORRECT' | 'PARTIAL';
  score: number;
  feedback?: string;
  executionTime?: number;
  memoryUsed?: number;
  submittedAt: string;
}

export interface SubmissionRequest {
  questionId: string;
  solution: string;
  language?: string;
  notes?: string;
}

export interface UserStatistics {
  totalSubmissions: number;
  correctSubmissions: number;
  averageScore: number;
  rank: number;
  streakCount: number;
  categoriesAttempted: string[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
  totalSubmissions: number;
  correctSubmissions: number;
}

export interface PracticeMetadata {
  categories: string[];
  tags: string[];
  difficulties: string[];
}

// Payment Types
export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  description: string;
  popular?: boolean;
}

export interface PaymentCreateRequest {
  userId: string;
  amount: number;
  currency: string;
  packageId: string;
  paymentMethod: string;
}

export interface PaymentCreateResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  paymentUrl: string;
}

export interface Payment {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  packageId: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentSuccessRequest {
  paymentId: string;
  userId: string;
  amount: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface PaymentFailureRequest {
  paymentId: string;
  userId: string;
  amount: number;
  errorCode: string;
  errorDescription: string;
}

// Wallet Types
export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface WalletTransaction {
  transactionId: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

// Admin Types
export interface AdminDashboard {
  totalVideos: number;
  pendingVideos: number;
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
  totalAITools?: number;
  pendingAITools?: number;
  totalPayments?: number;
  totalRevenue?: number;
}

export interface AdminVideoReviewRequest {
  action: 'APPROVE' | 'REJECT' | 'FLAG';
  reason: string;
  notes?: string;
}

export interface AdminVideoReviewResponse {
  success: boolean;
  videoId: string;
  newStatus: string;
  message: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface AdminUserUpdateRequest {
  active?: boolean;
  role?: UserRole;
  reason: string;
}

export interface SystemHealth {
  healthy: boolean;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  components: {
    database: 'UP' | 'DOWN';
    redis: 'UP' | 'DOWN';
    storage: 'UP' | 'DOWN';
  };
  checkedAt: string;
}

// Navigation Types
export interface NavigationParams {
  [key: string]: any;
}

export interface StackNavigationProp {
  navigate: (screen: string, params?: NavigationParams) => void;
  goBack: () => void;
  push: (screen: string, params?: NavigationParams) => void;
  replace: (screen: string, params?: NavigationParams) => void;
  reset: (state: any) => void;
}

// Error Types
export interface ApiError {
  success: false;
  message: string;
  data: null;
  timestamp: string;
  path: string;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Form Types
export interface FormField {
  value: string;
  error?: string;
  touched?: boolean;
}

export interface LoginForm {
  phoneNumber: FormField;
}

export interface RegisterForm {
  phoneNumber: FormField;
  name: FormField;
}

export interface OtpForm {
  otp: FormField;
}

export interface ProfileForm {
  name: FormField;
  username: FormField;
  bio: FormField;
}

// Device Types
export interface DeviceInfo {
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  os: string;
  isMobile: boolean;
}

// Search Types
export interface SearchSuggestion {
  text: string;
  type: 'VIDEO' | 'USER' | 'TAG';
}

// Analytics Types
export interface VideoAnalytics {
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  deviceBreakdown: Record<string, number>;
  geographicData: Record<string, number>;
}

export interface UserAnalytics {
  totalVideosUploaded: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: number;
  topVideos: Video[];
}

// State Management Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

export interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    hasMore: boolean;
  };
}

export interface AIToolState {
  tools: AITool[];
  currentTool: AITool | null;
  isLoading: boolean;
  error: string | null;
  executionHistory: AIToolExecutionResponse[];
}

export interface PracticeState {
  questions: Question[];
  currentQuestion: Question | null;
  submissions: Submission[];
  userStats: UserStatistics | null;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  videos: VideoState;
  aiTools: AIToolState;
  practice: PracticeState;
}
