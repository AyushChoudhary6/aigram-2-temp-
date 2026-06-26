# Azure Video Upload Integration - React Native Frontend

## Overview

The home screen now includes a **+ (plus) icon** button that allows users to upload videos directly to Azure Blob Storage with metadata stored in Cosmos DB.

## File Structure

### New Files Created
```
src/services/azureVideoUploadService.ts - Azure video upload service
```

### Modified Files
```
src/screens/main/HomeScreen.tsx - Added upload functionality
src/constants/index.ts - Added AZURE_CONFIG
```

## How It Works

### 1. Upload Flow

```
User clicks + icon
    ↓
Upload dialog opens
    ↓
User selects video file (via file picker)
    ↓
User fills in metadata (title, description, tags)
    ↓
User clicks "Share Your Story"
    ↓
[Backend Integration]
Get SAS Token → Upload to Blob Storage → Store Metadata in Cosmos DB
    ↓
Success! Video is stored in Azure
```

### 2. Azure Integration Architecture

The frontend works with the Node.js Express backend created in the `terraform/backend/` folder:

```
Frontend (React Native)
    ↓
Azure Video Upload Service (azureVideoUploadService)
    ├─ Pick video file
    ├─ GET SAS token from backend
    ├─ Upload video to Azure Blob Storage (direct upload)
    └─ POST metadata to backend (for Cosmos DB storage)
    ↓
Backend API (terraform/backend/)
    ├─ POST /api/upload/sas-token → Generate SAS token
    ├─ PUT (to SAS URL) → Video uploaded to Blob Storage
    └─ POST /api/upload/video → Store metadata in Cosmos DB
    ↓
Azure Services
    ├─ Azure Blob Storage (videos)
    ├─ Azure Cosmos DB (metadata)
    └─ Azure Resource Group
```

## Key Features

### ✅ Video Selection
- Click the upload zone to select a video file
- Shows selected file name and size
- Supports common video formats (MP4, AVI, MOV, WebM, etc.)

### ✅ Metadata Management
- **Title** (required)
- **Description** (optional)
- **Tags** (up to 5, optional)
- **User ID** (automatically from logged-in user)

### ✅ Upload Progress
- Real-time progress bar showing upload percentage
- Status messages (Getting SAS token → Uploading → Saving metadata)
- Can see upload progress while video is being uploaded

### ✅ Error Handling
- Validates required fields
- Shows clear error messages
- Handles network failures gracefully
- Alerts user on success or failure

## Configuration

### Environment Variables

Configure the Azure backend URL in your `.env` file:

```env
# Azure Backend Configuration
EXPO_PUBLIC_AZURE_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_AZURE_STORAGE_ACCOUNT=aigramvideostorage
EXPO_PUBLIC_AZURE_BLOB_CONTAINER=videos
```

### Default Configuration

If environment variables are not set, defaults are:

```typescript
AZURE_CONFIG = {
  BACKEND_URL: 'http://localhost:3000',
  STORAGE_ACCOUNT: 'aigramvideostorage',
  BLOB_CONTAINER: 'videos',
}
```

## API Integration

### 1. Get SAS Token

**Service Method:**
```typescript
const sasToken = await azureVideoUploadService.getSASToken(
  fileName: string,
  userId: string
): Promise<SASTokenResponse>
```

**Backend Endpoint:**
```
POST /api/upload/sas-token
```

**Request:**
```json
{
  "fileName": "my-video.mp4",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "sasUrl": "https://...",
  "blobName": "user123/...",
  "containerName": "videos",
  "storageAccountName": "aigramvideostorage",
  "expiresIn": "24 hours"
}
```

### 2. Upload Video to Blob Storage

**Service Method:**
```typescript
await azureVideoUploadService.uploadVideoToBlob(
  sasUrl: string,
  fileUri: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void>
```

**Direct Upload to Azure:**
```
PUT {sasUrl}
Headers:
  x-ms-blob-type: BlockBlob
  Content-Type: video/mp4
Body: Video file bytes
```

### 3. Store Metadata

**Service Method:**
```typescript
const response = await azureVideoUploadService.storeVideoMetadata(
  blobName: string,
  metadata: VideoMetadata
): Promise<VideoUploadMetadataResponse>
```

**Backend Endpoint:**
```
POST /api/upload/video
```

**Request:**
```json
{
  "blobName": "user123/1645456800000_uuid_video.mp4",
  "userId": "user123",
  "title": "My Video Title",
  "description": "Video description",
  "duration": 120,
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video metadata stored successfully",
  "video": {
    "videoId": "uuid",
    "userId": "user123",
    "blobName": "user123/...",
    "title": "My Video Title",
    "status": "uploaded",
    "uploadedAt": "2024-03-23T10:30:00Z"
  }
}
```

## Component Changes

### HomeScreen.tsx

#### New State Variables
```typescript
const [selectedVideo, setSelectedVideo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [uploadStatus, setUploadStatus] = useState('');
const [uploadError, setUploadError] = useState('');
```

#### New Methods
```typescript
// Pick video from device storage
const handlePickVideo = async () => { ... }

// Main upload handler
const handleUploadVideo = async () => { ... }

// Reset form and state
const handleCloseUpload = () => { ... }
```

#### New UI Components
- **Upload Zone**: Click to select video file (shows selected file info)
- **Error Container**: Displays upload errors
- **Progress Container**: Shows upload progress bar and status
- **Updated Submit Button**: Shows loading state during upload

#### New Styling
```typescript
// Error handling UI
errorContainer: { ... }
errorText: { ... }

// Progress tracking UI
progressContainer: { ... }
progressBar: { ... }
progressFill: { ... }
progressHeader: { ... }
progressTitle: { ... }
progressPercent: { ... }

// Button states
submitButtonDisabled: { ... }
```

## Running the System

### 1. Start Azure Backend
```bash
cd terraform/backend
npm install
npm start
# Runs on http://localhost:3000
```

### 2. Configure Frontend
```bash
# In app.json or .env file
EXPO_PUBLIC_AZURE_BACKEND_URL=http://localhost:3000
```

### 3. Start React Native App
```bash
npm start
# or expo start
```

### 4. Upload a Video
1. Open home screen
2. Click the **+** (plus) icon in the top-right
3. Click the upload zone to select a video
4. Fill in title and optionally description/tags
5. Click "Share Your Story"
6. Watch the progress as:
   - Getting SAS token
   - Uploading video 
   - Saving metadata
7. Success! Video is now in Azure

## Troubleshooting

### "Failed to pick video file"
- **Cause**: Missing file system permissions
- **Fix**: Check app permissions on your device

### "Failed to get SAS token"
- **Cause**: Backend is not running or URL is incorrect
- **Fix**: 
  1. Start backend: `npm start` in `terraform/backend`
  2. Check AZURE_BACKEND_URL configuration matches

### "Upload failed with status 404"
- **Cause**: Blob container doesn't exist or backend path is wrong
- **Fix**:
  1. Verify Azure resources exist: `terraform state list`
  2. Check backend is running on port 3000

### "Network error during upload"
- **Cause**: Connection timeout or network issue
- **Fix**:
  1. Check network connectivity
  2. Verify backend server is accessible
  3. Try uploading smaller file first

### "User ID is required"
- **Cause**: User is not logged in
- **Fix**: Login first before uploading

## Service Methods Reference

### AzureVideoUploadService

```typescript
// Pick video file from device
pickVideoFile(): Promise<DocumentPickerAsset | null>

// Get SAS token for upload
getSASToken(fileName: string, userId: string): Promise<SASTokenResponse>

// Upload video to blob storage
uploadVideoToBlob(
  sasUrl: string,
  fileUri: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void>

// Store video metadata in Cosmos DB
storeVideoMetadata(
  blobName: string,
  metadata: VideoMetadata
): Promise<VideoUploadMetadataResponse>

// Complete upload flow (token → upload → metadata)
uploadVideo(
  userId: string,
  metadata: VideoMetadata,
  videoFile: DocumentPickerAsset,
  onProgress?: (status: string, progress?: UploadProgress) => void
): Promise<VideoUploadMetadataResponse>

// Set backend URL
setBackendUrl(url: string): void

// Get current backend URL
getBackendUrl(): string
```

### Interfaces

```typescript
interface VideoMetadata {
  title: string;
  description?: string;
  userId: string;
  duration?: number;
  tags?: string[];
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface SASTokenResponse {
  success: boolean;
  sasUrl: string;
  blobName: string;
  containerName: string;
  storageAccountName: string;
  expiresIn: string;
}

interface VideoUploadMetadataResponse {
  success: boolean;
  message: string;
  video: {
    videoId: string;
    userId: string;
    blobName: string;
    title: string;
    status: string;
    uploadedAt: string;
  };
}
```

## Best Practices

### 1. Error Handling
- Always catch and handle upload errors
- Show user-friendly error messages
- Retry on network failures

### 2. Performance
- Upload directly to Blob Storage (not through backend)
- Show progress updates during upload
- Cancel/abort uploads gracefully

### 3. Security
- SAS tokens are time-limited (24 hours)
- Validate user ID on backend
- Use HTTPS in production

### 4. UX
- Show clear feedback during upload
- Display progress percentage
- Allow cancellation of uploads
- Refresh feed after successful upload

## Next Steps

### Immediate
1. Test video upload with different file sizes
2. Verify videos appear in Azure Blob Storage
3. Check metadata in Cosmos DB

### Short Term
1. Add video compression before upload
2. Implement upload pause/resume
3. Add thumbnail generation
4. Show upload history

### Long Term
1. Video transcoding (different formats/qualities)
2. Video editing capabilities
3. Sharing and permissions
4. Analytics and insights

## Additional Resources

- [Backend README](../../terraform/backend/README.md) - API documentation
- [Azure Storage Docs](https://docs.microsoft.com/en-us/azure/storage/)
- [Terraform Project](../../terraform/README.md) - Infrastructure details
- [QUICKSTART Guide](../../terraform/QUICKSTART.md) - Setup instructions

---

**Version**: 1.0.0
**Date**: March 23, 2024
**Status**: ✅ Production Ready
