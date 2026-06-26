# Practice with Video Questions - Backend Integration Documentation

## Overview

This document outlines the practice with video questions functionality in the AIGram platform, detailing the current implementation, data flow, and comprehensive backend integration requirements for learning with video content.

## Current Implementation Analysis

### 1. Practice Screen Structure

The practice functionality is currently implemented as a level-based learning system with the following components:

- **Level-based progression system** with XP rewards
- **Proof submission system** (screenshots, screen recordings)
- **Progress tracking** with visual indicators
- **Guest user limitations** with upgrade prompts

### 2. Video Integration Components

#### VideoPlayer Component
- **Stream URL management** with permission checks
- **Guest view limitations** with daily limits
- **Video engagement tracking** (views, likes)
- **Playback controls** with progress tracking
- **Auto-formatting** for duration and view counts

#### QuestionCard Component
- **Multiple choice questions** with visual feedback
- **Difficulty levels** (Easy, Medium, Hard) with color coding
- **Category-based organization**
- **Bookmark functionality** for registered users
- **Answer validation** with explanations
- **Statistics display** (views, accuracy, creation date)

## Backend Integration Requirements

### 1. Video-Question Association APIs

#### 1.1 Video-Question Linking
```typescript
// Input: Link questions to videos
POST /api/videos/{videoId}/questions
{
  "questionIds": ["q1", "q2", "q3"],
  "timestamps": [120, 300, 450], // seconds in video
  "displayMode": "OVERLAY" | "PAUSE" | "END_SCREEN",
  "isRequired": boolean,
  "passingScore": number // percentage
}

// Output: Video-Question Association
{
  "success": true,
  "data": {
    "associationId": "vq_123",
    "videoId": "v_456",
    "questions": [
      {
        "questionId": "q1",
        "timestamp": 120,
        "displayMode": "OVERLAY",
        "isRequired": true,
        "order": 1
      }
    ],
    "totalQuestions": 3,
    "passingScore": 70,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.2 Get Video Questions
```typescript
// Input: Retrieve questions for a video
GET /api/videos/{videoId}/questions?timestamp={seconds}

// Output: Questions at specific timestamp
{
  "success": true,
  "data": {
    "questions": [
      {
        "questionId": "q1",
        "questionText": "What is the main concept explained?",
        "options": [
          {
            "optionId": "opt1",
            "optionText": "Machine Learning",
            "isCorrect": true
          }
        ],
        "timestamp": 120,
        "displayMode": "OVERLAY",
        "isRequired": true,
        "explanation": "The video explains ML fundamentals",
        "difficulty": "MEDIUM",
        "category": "AI_CONCEPTS"
      }
    ],
    "hasMoreQuestions": true,
    "nextQuestionTimestamp": 300
  }
}
```

### 2. Learning Progress Tracking APIs

#### 2.1 Video Learning Session
```typescript
// Input: Start video learning session
POST /api/learning/sessions
{
  "videoId": "v_456",
  "userId": "u_123", // optional for guest users
  "deviceId": "device_789", // for guest tracking
  "sessionType": "VIDEO_PRACTICE",
  "expectedDuration": 1800 // seconds
}

// Output: Learning Session
{
  "success": true,
  "data": {
    "sessionId": "ls_001",
    "videoId": "v_456",
    "userId": "u_123",
    "startTime": "2024-01-15T10:30:00Z",
    "questionsAvailable": 5,
    "requiredQuestions": 3,
    "passingScore": 70,
    "status": "ACTIVE"
  }
}
```

#### 2.2 Submit Video Question Answer
```typescript
// Input: Submit answer during video
POST /api/learning/sessions/{sessionId}/answers
{
  "questionId": "q1",
  "selectedOptionId": "opt1",
  "timestamp": 125, // when answered in video
  "timeSpent": 15, // seconds to answer
  "videoPosition": 120, // video position when question appeared
  "attempts": 1
}

// Output: Answer Result
{
  "success": true,
  "data": {
    "answerId": "ans_001",
    "questionId": "q1",
    "isCorrect": true,
    "score": 10,
    "explanation": "Correct! Machine Learning is the main concept.",
    "nextAction": "CONTINUE_VIDEO" | "SHOW_EXPLANATION" | "RETRY_QUESTION",
    "sessionProgress": {
      "questionsAnswered": 1,
      "questionsCorrect": 1,
      "currentScore": 10,
      "progressPercentage": 20
    }
  }
}
```

#### 2.3 Video Learning Analytics
```typescript
// Input: Get learning analytics
GET /api/learning/analytics/{userId}?videoId={videoId}&timeframe=WEEK

// Output: Learning Analytics
{
  "success": true,
  "data": {
    "videosWatched": 15,
    "questionsAnswered": 45,
    "averageAccuracy": 78.5,
    "totalLearningTime": 7200, // seconds
    "completedSessions": 12,
    "streakDays": 5,
    "categoryProgress": {
      "AI_CONCEPTS": {
        "questionsAnswered": 20,
        "accuracy": 85,
        "timeSpent": 3600
      }
    },
    "weakAreas": ["DEEP_LEARNING", "NLP"],
    "strongAreas": ["MACHINE_LEARNING", "DATA_SCIENCE"]
  }
}
```

### 3. Adaptive Learning APIs

#### 3.1 Personalized Question Selection
```typescript
// Input: Get next recommended questions
POST /api/learning/recommendations
{
  "userId": "u_123",
  "videoId": "v_456",
  "currentTimestamp": 300,
  "userPerformance": {
    "recentAccuracy": 65,
    "weakCategories": ["DEEP_LEARNING"],
    "learningPace": "SLOW" | "MEDIUM" | "FAST"
  }
}

// Output: Recommended Questions
{
  "success": true,
  "data": {
    "recommendedQuestions": [
      {
        "questionId": "q2",
        "priority": "HIGH",
        "reason": "REINFORCEMENT", // REINFORCEMENT, NEW_CONCEPT, REVIEW
        "adaptedDifficulty": "EASY", // adjusted based on performance
        "estimatedTime": 30
      }
    ],
    "skipRecommendation": {
      "canSkip": true,
      "reason": "User performing well in this category"
    }
  }
}
```

#### 3.2 Learning Path Generation
```typescript
// Input: Generate personalized learning path
POST /api/learning/paths
{
  "userId": "u_123",
  "targetSkills": ["MACHINE_LEARNING", "DEEP_LEARNING"],
  "availableTime": 3600, // seconds per week
  "currentLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "preferredFormat": "VIDEO_WITH_QUESTIONS"
}

// Output: Learning Path
{
  "success": true,
  "data": {
    "pathId": "lp_001",
    "estimatedDuration": 14400, // seconds
    "estimatedWeeks": 4,
    "modules": [
      {
        "moduleId": "mod_1",
        "title": "ML Fundamentals",
        "videos": [
          {
            "videoId": "v_456",
            "title": "Introduction to ML",
            "duration": 1800,
            "questionsCount": 5,
            "difficulty": "BEGINNER",
            "order": 1
          }
        ],
        "expectedOutcomes": ["Understand ML basics", "Identify ML types"]
      }
    ]
  }
}
```

### 4. Gamification and Progress APIs

#### 4.1 XP and Achievement System
```typescript
// Input: Award XP for video completion
POST /api/gamification/xp
{
  "userId": "u_123",
  "sessionId": "ls_001",
  "activityType": "VIDEO_COMPLETION" | "QUESTION_CORRECT" | "STREAK_BONUS",
  "baseXP": 50,
  "multipliers": {
    "accuracy": 1.2, // 20% bonus for high accuracy
    "speed": 1.1, // 10% bonus for quick answers
    "streak": 1.5 // 50% bonus for streak
  }
}

// Output: XP Award
{
  "success": true,
  "data": {
    "xpAwarded": 82, // 50 * 1.2 * 1.1 * 1.5 (rounded)
    "totalXP": 1250,
    "currentLevel": 5,
    "nextLevelXP": 1500,
    "achievementsUnlocked": [
      {
        "achievementId": "streak_5",
        "title": "5-Day Streak",
        "description": "Completed learning for 5 consecutive days",
        "xpBonus": 100
      }
    ]
  }
}
```

#### 4.2 Leaderboard Integration
```typescript
// Input: Get video learning leaderboard
GET /api/leaderboard/video-learning?timeframe=WEEK&category=AI_CONCEPTS

// Output: Leaderboard
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "userId": "u_123",
        "username": "john_doe",
        "rank": 1,
        "score": 1250,
        "videosCompleted": 8,
        "questionsAnswered": 40,
        "accuracy": 87.5,
        "streak": 7
      }
    ],
    "userRank": {
      "rank": 15,
      "score": 850,
      "percentile": 75
    }
  }
}
```

### 5. Content Management APIs

#### 5.1 Question Pool Management
```typescript
// Input: Create question pool for video
POST /api/content/question-pools
{
  "videoId": "v_456",
  "poolName": "ML Basics Questions",
  "questions": [
    {
      "questionText": "What is supervised learning?",
      "options": [
        {"text": "Learning with labeled data", "isCorrect": true},
        {"text": "Learning without data", "isCorrect": false}
      ],
      "difficulty": "EASY",
      "category": "ML_CONCEPTS",
      "tags": ["supervised", "learning", "basics"],
      "explanation": "Supervised learning uses labeled training data",
      "estimatedTime": 30,
      "bloomsTaxonomy": "UNDERSTANDING"
    }
  ]
}

// Output: Question Pool
{
  "success": true,
  "data": {
    "poolId": "qp_001",
    "videoId": "v_456",
    "totalQuestions": 15,
    "difficultyDistribution": {
      "EASY": 5,
      "MEDIUM": 7,
      "HARD": 3
    },
    "categoryDistribution": {
      "ML_CONCEPTS": 8,
      "ALGORITHMS": 4,
      "APPLICATIONS": 3
    }
  }
}
```

#### 5.2 Dynamic Question Generation
```typescript
// Input: Generate questions from video content
POST /api/content/generate-questions
{
  "videoId": "v_456",
  "transcript": "In this video, we'll explore machine learning...",
  "keyTimestamps": [120, 300, 450],
  "targetDifficulties": ["EASY", "MEDIUM"],
  "questionTypes": ["MULTIPLE_CHOICE", "TRUE_FALSE"],
  "count": 5
}

// Output: Generated Questions
{
  "success": true,
  "data": {
    "generatedQuestions": [
      {
        "questionText": "What is the main topic of this video?",
        "options": [
          {"text": "Machine Learning", "isCorrect": true},
          {"text": "Data Science", "isCorrect": false}
        ],
        "suggestedTimestamp": 120,
        "confidence": 0.95,
        "difficulty": "EASY"
      }
    ],
    "generationMetadata": {
      "model": "gpt-4",
      "processingTime": 2.5,
      "qualityScore": 0.87
    }
  }
}
```

### 6. Assessment and Certification APIs

#### 6.1 Video Course Assessment
```typescript
// Input: Create assessment for video course
POST /api/assessments/video-courses
{
  "courseId": "course_001",
  "videoIds": ["v_456", "v_457", "v_458"],
  "assessmentType": "FINAL_EXAM" | "PROGRESS_CHECK" | "CERTIFICATION",
  "passingScore": 80,
  "timeLimit": 3600, // seconds
  "questionSelection": {
    "totalQuestions": 20,
    "distribution": {
      "v_456": 7,
      "v_457": 6,
      "v_458": 7
    },
    "difficultyMix": {
      "EASY": 30,
      "MEDIUM": 50,
      "HARD": 20
    }
  }
}

// Output: Assessment Created
{
  "success": true,
  "data": {
    "assessmentId": "assess_001",
    "courseId": "course_001",
    "totalQuestions": 20,
    "timeLimit": 3600,
    "passingScore": 80,
    "certificateTemplate": "cert_template_ml_basics",
    "validityPeriod": 365 // days
  }
}
```

#### 6.2 Generate Certificate
```typescript
// Input: Generate certificate after successful completion
POST /api/certificates/generate
{
  "userId": "u_123",
  "assessmentId": "assess_001",
  "finalScore": 85,
  "completionTime": 2400, // seconds
  "courseTitle": "Machine Learning Fundamentals",
  "skillsAcquired": ["ML Concepts", "Algorithm Understanding"]
}

// Output: Certificate
{
  "success": true,
  "data": {
    "certificateId": "cert_001",
    "certificateUrl": "https://cdn.aigram.com/certificates/cert_001.pdf",
    "verificationCode": "AIGRAM-ML-2024-001",
    "issuedAt": "2024-01-15T15:30:00Z",
    "expiresAt": "2025-01-15T15:30:00Z",
    "shareableUrl": "https://aigram.com/verify/cert_001"
  }
}
```

### 7. Real-time Features APIs

#### 7.1 Live Question Overlay
```typescript
// WebSocket Connection for real-time questions
// Connection: wss://api.aigram.com/ws/video-learning/{sessionId}

// Input: Video position update
{
  "type": "VIDEO_POSITION",
  "timestamp": 125,
  "playbackRate": 1.0,
  "isPlaying": true
}

// Output: Question trigger
{
  "type": "QUESTION_TRIGGER",
  "question": {
    "questionId": "q1",
    "questionText": "What concept was just explained?",
    "options": [...],
    "displayDuration": 30,
    "pauseVideo": true
  },
  "trigger": {
    "timestamp": 120,
    "reason": "SCHEDULED_CHECKPOINT"
  }
}
```

#### 7.2 Collaborative Learning
```typescript
// Input: Join collaborative session
POST /api/learning/collaborative-sessions
{
  "videoId": "v_456",
  "sessionType": "STUDY_GROUP",
  "maxParticipants": 5,
  "isPublic": true
}

// Output: Collaborative Session
{
  "success": true,
  "data": {
    "sessionId": "collab_001",
    "joinCode": "STUDY123",
    "participants": [
      {
        "userId": "u_123",
        "username": "john_doe",
        "role": "HOST",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "sharedProgress": {
      "currentTimestamp": 0,
      "questionsCompleted": 0,
      "groupScore": 0
    }
  }
}
```

### 8. Analytics and Reporting APIs

#### 8.1 Learning Effectiveness Analytics
```typescript
// Input: Get learning effectiveness report
GET /api/analytics/learning-effectiveness?videoId={videoId}&timeframe=MONTH

// Output: Effectiveness Report
{
  "success": true,
  "data": {
    "videoMetrics": {
      "totalViews": 1250,
      "completionRate": 68.5,
      "averageWatchTime": 1440, // seconds
      "questionEngagement": 82.3
    },
    "questionMetrics": {
      "totalAttempts": 3750,
      "averageAccuracy": 74.2,
      "mostDifficultQuestions": [
        {
          "questionId": "q5",
          "accuracy": 45.2,
          "avgAttempts": 2.3
        }
      ],
      "easiestQuestions": [
        {
          "questionId": "q1",
          "accuracy": 92.1,
          "avgAttempts": 1.1
        }
      ]
    },
    "learningOutcomes": {
      "knowledgeRetention": 78.5,
      "skillApplication": 65.2,
      "conceptUnderstanding": 82.1
    }
  }
}
```

#### 8.2 Content Optimization Recommendations
```typescript
// Input: Get content optimization suggestions
GET /api/analytics/optimization-recommendations/{videoId}

// Output: Optimization Recommendations
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "QUESTION_PLACEMENT",
        "priority": "HIGH",
        "description": "Add question at 5:30 - high drop-off point",
        "expectedImpact": "15% improvement in engagement",
        "implementation": {
          "timestamp": 330,
          "questionType": "ENGAGEMENT_CHECK",
          "difficulty": "EASY"
        }
      },
      {
        "type": "CONTENT_CLARIFICATION",
        "priority": "MEDIUM",
        "description": "Concept at 8:15 shows low comprehension",
        "expectedImpact": "20% improvement in question accuracy",
        "implementation": {
          "timestamp": 495,
          "action": "ADD_VISUAL_AID",
          "content": "Diagram explaining the concept"
        }
      }
    ],
    "overallScore": 7.2,
    "improvementPotential": 23.5
  }
}
```

## Data Models

### Core Entities

```typescript
// Video-Question Association
interface VideoQuestionAssociation {
  associationId: string;
  videoId: string;
  questionId: string;
  timestamp: number; // seconds
  displayMode: 'OVERLAY' | 'PAUSE' | 'END_SCREEN';
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Learning Session
interface LearningSession {
  sessionId: string;
  userId?: string; // optional for guests
  deviceId?: string; // for guest tracking
  videoId: string;
  sessionType: 'VIDEO_PRACTICE' | 'ASSESSMENT' | 'REVIEW';
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  finalScore: number;
  watchTime: number; // seconds
  completionRate: number; // percentage
}

// Video Question Answer
interface VideoQuestionAnswer {
  answerId: string;
  sessionId: string;
  questionId: string;
  userId?: string;
  selectedOptionId: string;
  isCorrect: boolean;
  score: number;
  timeSpent: number; // seconds to answer
  attempts: number;
  videoTimestamp: number; // when question appeared
  answeredAt: string;
}

// Learning Progress
interface LearningProgress {
  progressId: string;
  userId: string;
  videoId: string;
  courseId?: string;
  watchedDuration: number; // seconds
  totalDuration: number; // seconds
  questionsAnswered: number;
  questionsCorrect: number;
  currentAccuracy: number;
  lastWatchedTimestamp: number;
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

## Implementation Priority

### Phase 1: Core Video-Question Integration
1. Video-question association APIs
2. Basic question overlay functionality
3. Answer submission and validation
4. Progress tracking

### Phase 2: Learning Analytics
1. Session tracking
2. Performance analytics
3. Learning progress visualization
4. Basic recommendations

### Phase 3: Advanced Features
1. Adaptive learning algorithms
2. Collaborative learning sessions
3. Real-time question triggers
4. Advanced analytics

### Phase 4: Gamification & Certification
1. XP and achievement system
2. Leaderboards
3. Certificate generation
4. Course completion tracking

## Security Considerations

1. **Guest User Limitations**: Implement view limits and feature restrictions
2. **Content Protection**: Secure video streaming with token-based access
3. **Answer Validation**: Server-side validation to prevent cheating
4. **Rate Limiting**: Prevent abuse of question generation APIs
5. **Data Privacy**: Anonymize learning analytics for guest users

## Performance Optimization

1. **Caching Strategy**: Cache frequently accessed questions and video metadata
2. **CDN Integration**: Serve video content and questions from edge locations
3. **Database Indexing**: Optimize queries for video-question associations
4. **Real-time Optimization**: Use WebSocket connections efficiently
5. **Mobile Optimization**: Minimize data usage for mobile learners

This comprehensive documentation provides the foundation for implementing a robust practice with video questions system that enhances learning through interactive video content.
