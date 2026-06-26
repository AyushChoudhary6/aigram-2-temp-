# Video Playback Validation Instructions

## Overview

This document provides step-by-step instructions for validating the complete video pipeline (path resolution → player → UI playback) using a local demo video file.

## Demo Video Configuration

### Demo Video Details
- **File name**: `Kabhi_Na_Kabhi_720p.mp4`
- **Full path**: `/Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4`
- **Purpose**: Validate local filesystem path handling and video playback functionality

### Files Modified for Testing

1. **`src/utils/videoSourceResolver.ts`**
   - Added demo video configuration with environment variable controls
   - Enhanced local path processing for demo video file
   - Platform-specific handling (web vs React Native)

2. **`__tests__/components/VideoPlaybackTest.tsx`** (NEW)
   - Comprehensive test component for both services
   - Visual test results and video player validation
   - Error handling and logging

## Setup Instructions

### 1. Enable Demo Mode

Set the following environment variable to enable demo video testing:

```bash
# For development testing only
export REACT_APP_DEMO_VIDEO=true
```

**Alternative methods:**
- Add to `.env` file: `REACT_APP_DEMO_VIDEO=true`
- Set in package.json scripts: `REACT_APP_DEMO_VIDEO=true npm start`

### 2. Verify Demo Video File

Ensure the demo video file exists at the specified path:
```bash
ls -la /Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4
```

If the file doesn't exist, the system will gracefully fallback to the sample video.

### 3. Add Test Component to Navigation

Temporarily add the test component to your app navigation for testing:

```typescript
// In your main App.tsx or navigation file
import VideoPlaybackTest from './__tests__/components/VideoPlaybackTest';

// Add to your navigation or render conditionally
{process.env.NODE_ENV === 'development' && <VideoPlaybackTest />}
```

## Running the Tests

### 1. Start the Application

```bash
npm start
# or
expo start
```

### 2. Navigate to Test Component

Access the Video Playback Test component through your app navigation.

### 3. Run Service Tests

The test component provides buttons to test both services:

#### Test VideoStream Service
- Click "Test VideoStream Service" button
- Validates video source resolution for regular video streams
- Checks cloud/local path detection and processing

#### Test Practice Video Service  
- Click "Test Practice Video Service" button
- Validates video source resolution for practice video questions
- Ensures practice videos work with the same pipeline

### 4. Validate Video Player

After successful service tests:
- Video player should render with the demo video
- Test play/pause functionality
- Test seeking (scrubbing through video)
- Verify controls work properly
- Check for any UI layout issues

## Expected Test Results

### Successful Test Output

```
🎬 [DEMO MODE] Using local demo video: /Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4
🎬 [DEMO MODE] Overriding video source with demo video
🎬 Processing local video path: /Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4
🎬 [DEMO MODE] Processing demo video file path
🎬 [DEMO MODE] Using file URL: file:///Users/pawanjin/Downloads/other/Kabhi_Na_Kabhi_720p.mp4
✅ VideoStream Service test passed
✅ Practice Video Service test passed
```

### Test Result Details

Each successful test should show:
- **Service**: VideoStream Service / Practice Video Service
- **Status**: ✅ PASS
- **Stream URL**: Generated file:// URL or fallback URL
- **Is Local**: Yes (for demo video)
- **Is Cloud**: No (for local file)
- **Provider**: Not applicable for local files

## Platform-Specific Behavior

### React Native
- Uses `file://` protocol for local video access
- Direct file system access supported
- Video should play from local file path

### Web Browser
- Cannot access local file system directly
- Automatically falls back to sample video
- Shows warning in console about web limitations

## Validation Checklist

### ✅ Path Resolution
- [ ] Demo video path is correctly detected as local filesystem path
- [ ] VideoSourceResolver processes demo video path appropriately
- [ ] Platform-specific handling works (file:// for RN, fallback for web)
- [ ] Error handling works when file doesn't exist

### ✅ Service Integration
- [ ] VideoStream Service resolves demo video source correctly
- [ ] Practice Video Service resolves demo video source correctly
- [ ] Both services return consistent results
- [ ] Fallback mechanisms work when demo mode is disabled

### ✅ Video Player Functionality
- [ ] Video player renders without UI layout changes
- [ ] Play/pause controls work properly
- [ ] Seeking/scrubbing functionality works
- [ ] Video loads and plays smoothly
- [ ] Error handling displays appropriate messages
- [ ] Video completion events fire correctly

### ✅ Error Scenarios
- [ ] File not found handled gracefully
- [ ] Demo mode disabled shows appropriate message
- [ ] Network errors handled properly
- [ ] Invalid video formats handled correctly

## Troubleshooting

### Demo Mode Not Working
1. Verify `REACT_APP_DEMO_VIDEO=true` is set
2. Check that `NODE_ENV=development`
3. Restart the development server after setting environment variables

### Video File Not Found
1. Verify the file path is correct
2. Check file permissions
3. Ensure the file is a valid MP4 video
4. System will fallback to sample video automatically

### Video Player Issues
1. Check console for error messages
2. Verify expo-av is properly installed
3. Test with sample video to isolate issues
4. Check platform-specific video format support

### Console Logging
Enable debug logging by checking the console for:
- `🎬 [DEMO MODE]` messages for demo video processing
- `🧪` messages for test execution
- `✅` or `❌` for test results
- Error messages for troubleshooting

## Cleanup Instructions

### 1. Remove Demo Configuration

After validation is complete, clean up the demo configuration:

```bash
# Remove environment variable
unset REACT_APP_DEMO_VIDEO

# Or remove from .env file
# REACT_APP_DEMO_VIDEO=true  # <- Remove this line
```

### 2. Remove Test Component

Remove or comment out the test component from your navigation:

```typescript
// Remove or comment out:
// import VideoPlaybackTest from './src/components/VideoPlaybackTest';
// {process.env.NODE_ENV === 'development' && <VideoPlaybackTest />}
```

### 3. Optional: Remove Test Files

If desired, remove the test component file:

```bash
rm __tests__/components/VideoPlaybackTest.tsx
```

Or remove the entire test directory if no other tests exist:

```bash
rm -rf __tests__/
```

**Note**: Keep the demo configuration in `videoSourceResolver.ts` as it's safely guarded by environment variables and won't affect production builds.

## Production Safety

### Environment Variable Guards
- Demo mode only activates when `NODE_ENV=development` AND `REACT_APP_DEMO_VIDEO=true`
- Production builds automatically disable demo functionality
- No demo code executes in production environment

### Code Safety
- All demo logic is clearly marked with `[DEMO MODE]` comments
- Demo configuration is isolated in a private static property
- No hardcoded paths in production code paths

## Summary

This validation setup provides comprehensive testing of:
1. **Path Resolution**: Local filesystem path detection and processing
2. **Service Integration**: Both VideoStream and Practice Video services
3. **Video Player**: Complete playback functionality validation
4. **Error Handling**: Graceful fallback mechanisms
5. **Platform Compatibility**: Web and React Native support

The demo configuration is production-safe and will not affect live deployments while providing thorough validation of the video playback pipeline.
