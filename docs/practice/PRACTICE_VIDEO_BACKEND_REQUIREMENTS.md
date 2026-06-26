# Practice Video Backend Requirements

## Overview
This document outlines the backend requirements for implementing video practice functionality in the AIgram frontend application. The video practice feature allows users to submit screen recordings as proof of completing AI-related tasks and receive AI-powered feedback.

## API Endpoints Required

### 1. Video Practice Levels Management

#### GET `/practice-video/levels`
**Purpose**: Retrieve paginated list of video practice levels
**Parameters**:
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Items per page
- `difficulty` (optional): Filter by difficulty (EASY, MEDIUM, HARD)
- `category` (optional): Filter by skill category
- `tags` (optional): Comma-separated list of tags

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "level_number": 1,
        "title": "Create OpenAI Account",
        "description": "Set up your first AI platform account",
        "goal": "Successfully create and verify an OpenAI account",
        "hint": "Visit openai.com and follow the registration process",
        "proof_type": ["video", "screenshot"],
        "xp_reward": 100,
        "skill_category": "prompting",
        "difficulty": "EASY",
        "prerequisites": [],
        "tags": ["openai", "account", "setup"],
        "video_url": "https://example.com/tutorial-video.mp4",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "duration": 180,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0,
    "size": 20
  }
}
```

#### GET `/practice-video/levels/{levelId}`
**Purpose**: Get specific video practice level details
**Parameters**:
- `levelId` (path): Level ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "level_number": 1,
    "title": "Create OpenAI Account",
    "description": "Set up your first AI platform account",
    "goal": "Successfully create and verify an OpenAI account",
    "hint": "Visit openai.com and follow the registration process",
    "proof_type": ["video", "screenshot"],
    "xp_reward": 100,
    "skill_category": "prompting",
    "difficulty": "EASY",
    "prerequisites": [],
    "tags": ["openai", "account", "setup"],
    "video_url": "https://example.com/tutorial-video.mp4",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "duration": 180,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/practice-video/sections`
**Purpose**: Get video levels grouped by sections/categories
**Response**:
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "title": "🚀 Baby Steps to Brilliance",
        "subtitle": "Start your AI journey here",
        "levels": [
          {
            "id": 1,
            "level_number": 1,
            "title": "Create OpenAI Account",
            "description": "Set up your first AI platform account",
            "goal": "Successfully create and verify an OpenAI account",
            "hint": "Visit openai.com and follow the registration process",
            "proof_type": ["video", "screenshot"],
            "xp_reward": 100,
            "skill_category": "prompting",
            "difficulty": "EASY"
          }
        ]
      }
    ]
  }
}
```

### 2. User Progress Management

#### GET `/practice-video/progress/my`
**Purpose**: Get current user's video practice progress
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "progress-uuid-1",
      "user_id": "user-uuid",
      "level_id": 1,
      "status": "completed",
      "score": 85,
      "ai_feedback": "Great job! Your screen recording clearly showed the account creation process.",
      "video_proof_url": "https://storage.example.com/proofs/user-uuid/level-1/video.mp4",
      "prompt_description": "I created an OpenAI account by visiting openai.com and following the signup process.",
      "started_at": "2024-01-01T10:00:00Z",
      "completed_at": "2024-01-01T10:15:00Z",
      "submission_count": 1,
      "max_attempts": 3
    }
  ]
}
```

#### GET `/practice-video/progress/user/{userId}`
**Purpose**: Get specific user's video practice progress (admin only)
**Parameters**:
- `userId` (path): User ID

### 3. Video Submissions

#### POST `/practice-video/submissions`
**Purpose**: Submit video proof for a level
**Content-Type**: `multipart/form-data`
**Parameters**:
- `level_id` (form): Level ID
- `video_file` (file): Video file (max 100MB)
- `prompt_description` (form): User's description of their approach
- `approach_explanation` (optional, form): Additional explanation
- `metadata` (optional, form): JSON string with video metadata

**Response**:
```json
{
  "success": true,
  "data": {
    "submission_id": "submission-uuid",
    "evaluation": {
      "canProceed": true,
      "score": 85,
      "feedback": "Excellent demonstration! You successfully created the account and showed all required steps.",
      "strengths": [
        "Clear screen recording quality",
        "Followed all steps correctly",
        "Good explanation of the process"
      ],
      "improvements": [
        "Could have shown email verification step"
      ],
      "next_steps": [
        "Try the next level: Write Your First GPT Prompt"
      ]
    }
  }
}
```

#### GET `/practice-video/submissions/my`
**Purpose**: Get current user's video submissions
**Parameters**:
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Items per page
- `levelId` (optional): Filter by level ID
- `status` (optional): Filter by status

#### POST `/practice-video/submissions/retry`
**Purpose**: Retry submission for a level
**Request Body**:
```json
{
  "level_id": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "can_retry": true,
    "attempts_remaining": 2
  }
}
```

### 4. Statistics and Leaderboard

#### GET `/practice-video/statistics/my`
**Purpose**: Get current user's video practice statistics
**Response**:
```json
{
  "success": true,
  "data": {
    "total_levels": 50,
    "completed_levels": 12,
    "in_progress_levels": 3,
    "total_xp_earned": 1850,
    "average_score": 82.5,
    "completion_rate": 24.0,
    "streak_days": 7,
    "total_videos_submitted": 15,
    "categories_mastered": ["prompting", "automation"],
    "skill_breakdown": {
      "prompting": {
        "completed": 8,
        "total": 15,
        "average_score": 85.2
      },
      "automation": {
        "completed": 4,
        "total": 12,
        "average_score": 78.5
      }
    }
  }
}
```

#### GET `/practice-video/leaderboard`
**Purpose**: Get video practice leaderboard
**Parameters**:
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Items per page
- `timeframe` (optional, default: 'all'): 'all', 'month', 'week'
- `category` (optional): Filter by skill category

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "user_id": "user-uuid-1",
        "username": "ai_master_2024",
        "avatar_url": "https://example.com/avatar1.jpg",
        "total_xp": 5420,
        "completed_levels": 45,
        "average_score": 92.3,
        "rank": 1,
        "streak_days": 28,
        "badges": ["early_adopter", "perfectionist", "speed_demon"]
      }
    ],
    "totalElements": 1250,
    "totalPages": 63,
    "currentPage": 0,
    "size": 20
  }
}
```

#### GET `/practice-video/leaderboard/user-ranking`
**Purpose**: Get current user's ranking
**Response**:
```json
{
  "success": true,
  "data": {
    "global_rank": 156,
    "category_ranks": {
      "prompting": 45,
      "automation": 89,
      "creation": 234
    },
    "percentile": 87.5,
    "total_users": 1250
  }
}
```

## Database Schema Requirements

### 1. video_practice_levels Table
```sql
CREATE TABLE video_practice_levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level_number INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    goal TEXT NOT NULL,
    hint TEXT,
    proof_type JSON NOT NULL, -- ["video", "screenshot", "text", "code"]
    xp_reward INT NOT NULL DEFAULT 0,
    skill_category VARCHAR(100) NOT NULL,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'EASY',
    prerequisites JSON, -- [1, 2, 3] - array of prerequisite level IDs
    tags JSON, -- ["openai", "account", "setup"]
    video_url VARCHAR(500), -- Tutorial video URL
    thumbnail_url VARCHAR(500), -- Thumbnail image URL
    duration INT, -- Video duration in seconds
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_skill_category (skill_category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_level_number (level_number),
    INDEX idx_is_active (is_active)
);
```

### 2. user_video_practice_progress Table
```sql
CREATE TABLE user_video_practice_progress (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    user_id VARCHAR(36) NOT NULL,
    level_id BIGINT NOT NULL,
    status ENUM('not_started', 'in_progress', 'submitted', 'completed', 'failed') DEFAULT 'not_started',
    score INT, -- 0-100
    ai_feedback TEXT,
    video_proof_url VARCHAR(500), -- S3/storage URL
    prompt_description TEXT,
    approach_explanation TEXT,
    submission_count INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (level_id) REFERENCES video_practice_levels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_level (user_id, level_id),
    INDEX idx_user_id (user_id),
    INDEX idx_level_id (level_id),
    INDEX idx_status (status),
    INDEX idx_completed_at (completed_at)
);
```

### 3. video_practice_submissions Table
```sql
CREATE TABLE video_practice_submissions (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    user_id VARCHAR(36) NOT NULL,
    level_id BIGINT NOT NULL,
    video_file_url VARCHAR(500) NOT NULL,
    video_file_size BIGINT, -- File size in bytes
    video_duration INT, -- Duration in seconds
    video_format VARCHAR(20), -- mp4, webm, etc.
    prompt_description TEXT NOT NULL,
    approach_explanation TEXT,
    ai_evaluation_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    ai_score INT, -- 0-100
    ai_feedback TEXT,
    ai_strengths JSON, -- Array of strengths
    ai_improvements JSON, -- Array of improvements
    ai_next_steps JSON, -- Array of next steps
    processing_time_ms INT, -- AI processing time
    submission_attempt INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (level_id) REFERENCES video_practice_levels(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_level_id (level_id),
    INDEX idx_ai_evaluation_status (ai_evaluation_status),
    INDEX idx_created_at (created_at)
);
```

## File Storage Requirements

### 1. Video Storage
- **Storage Service**: AWS S3, Google Cloud Storage, or similar
- **File Structure**: 
  ```
  /practice-videos/
    /{user_id}/
      /{level_id}/
        /{submission_id}/
          /original.{ext}
          /compressed.mp4
          /thumbnail.jpg
  ```
- **File Limits**:
  - Maximum file size: 100MB
  - Supported formats: MP4, WebM, MOV, AVI
  - Automatic compression for files > 50MB
  - Thumbnail generation at 2-second mark

### 2. CDN Configuration
- Enable CDN for video delivery
- Configure appropriate caching headers
- Implement signed URLs for security
- Set up automatic cleanup for old submissions

## AI Evaluation Service Requirements

### 1. Video Analysis Pipeline
```python
# Pseudo-code for AI evaluation service
class VideoEvaluationService:
    def evaluate_submission(self, video_url: str, level: VideoLevel, user_description: str):
        # 1. Download and analyze video
        video_analysis = self.analyze_video_content(video_url)
        
        # 2. Extract key frames and text
        key_frames = self.extract_key_frames(video_url)
        ocr_text = self.extract_text_from_frames(key_frames)
        
        # 3. Analyze against level requirements
        completion_check = self.check_goal_completion(
            level.goal, 
            video_analysis, 
            ocr_text, 
            user_description
        )
        
        # 4. Generate feedback using LLM
        feedback = self.generate_feedback(
            level, 
            completion_check, 
            user_description,
            video_analysis
        )
        
        return {
            "canProceed": completion_check.is_complete,
            "score": completion_check.score,
            "feedback": feedback.summary,
            "strengths": feedback.strengths,
            "improvements": feedback.improvements,
            "next_steps": feedback.next_steps
        }
```

### 2. Required AI Capabilities
- **Video Content Analysis**: Detect UI elements, actions, text
- **OCR (Optical Character Recognition)**: Extract text from screenshots
- **Natural Language Processing**: Analyze user descriptions
- **Goal Verification**: Check if video demonstrates required tasks
- **Feedback Generation**: Provide constructive, personalized feedback

### 3. Integration Points
- **OpenAI GPT-4 Vision**: For video frame analysis
- **Google Cloud Vision API**: For OCR and object detection
- **AWS Rekognition**: For video content analysis
- **Custom ML Models**: For specific AI tool recognition

## Security Requirements

### 1. Authentication & Authorization
- JWT token validation for all endpoints
- Role-based access control (user, admin)
- Rate limiting for video uploads
- User quota management

### 2. File Security
- Virus scanning for uploaded videos
- Content moderation checks
- Signed URLs with expiration
- User isolation (users can only access their own videos)

### 3. Data Privacy
- GDPR compliance for user data
- Video retention policies
- Right to deletion implementation
- Data anonymization for analytics

## Performance Requirements

### 1. API Performance
- Video upload: < 30 seconds for 100MB file
- AI evaluation: < 2 minutes average processing time
- Leaderboard queries: < 500ms response time
- Progress tracking: < 200ms response time

### 2. Scalability
- Support for 10,000+ concurrent users
- Horizontal scaling for AI evaluation workers
- Database read replicas for analytics
- CDN for global video delivery

### 3. Monitoring
- Video processing queue monitoring
- AI evaluation success rates
- User engagement metrics
- System performance dashboards

## Error Handling

### 1. Video Upload Errors
```json
{
  "success": false,
  "error": {
    "code": "VIDEO_TOO_LARGE",
    "message": "Video file must be under 100MB",
    "details": {
      "max_size": 104857600,
      "uploaded_size": 157286400
    }
  }
}
```

### 2. AI Evaluation Errors
```json
{
  "success": false,
  "error": {
    "code": "AI_EVALUATION_FAILED",
    "message": "Unable to process video for evaluation",
    "details": {
      "retry_after": 300,
      "support_ticket": "TICKET-12345"
    }
  }
}
```

## Testing Requirements

### 1. Unit Tests
- Video upload validation
- AI evaluation logic
- Progress calculation
- Leaderboard ranking

### 2. Integration Tests
- End-to-end submission flow
- AI service integration
- File storage operations
- Database transactions

### 3. Load Tests
- Concurrent video uploads
- AI evaluation queue processing
- Database performance under load
- CDN performance testing

## Deployment Considerations

### 1. Infrastructure
- Container orchestration (Kubernetes/Docker)
- Auto-scaling for AI workers
- Database clustering
- Redis for caching and queues

### 2. CI/CD Pipeline
- Automated testing
- Database migrations
- Blue-green deployments
- Rollback procedures

### 3. Monitoring & Logging
- Application performance monitoring
- Error tracking and alerting
- Video processing metrics
- User behavior analytics

## Future Enhancements

### 1. Advanced Features
- Real-time video streaming for live practice
- Collaborative practice sessions
- AI-powered hints during recording
- Voice analysis for explanation quality

### 2. Gamification
- Achievement badges
- Streak tracking
- Social features (sharing achievements)
- Seasonal challenges and competitions

### 3. Analytics
- Learning path optimization
- Difficulty adjustment based on performance
- Personalized recommendations
- Success prediction models
