# Aigram Video Upload Frontend

Modern, responsive web interface for uploading videos to Azure Blob Storage with metadata management in Cosmos DB.

## Features

- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 📹 **Drag & Drop**: Intuitive file selection with drag-and-drop support
- 📊 **Progress Tracking**: Real-time upload progress visualization
- 🏷️ **Tag Management**: Add and manage video tags
- 📝 **Metadata**: Comprehensive video metadata (title, description, duration)
- 🔧 **Configuration**: Easy backend URL configuration
- 📚 **API Documentation**: Built-in API endpoint reference
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- ♿ **Accessible**: Semantic HTML and keyboard navigation

## Installation

### Option 1: Direct File Usage
Simply open `video-upload.html` in your web browser:
```bash
# Standard HTTP server
python -m http.server 8000

# Or with Node.js
npx http-server

# Then open http://localhost:8000/terraform/frontend/video-upload.html
```

### Option 2: React/Vue Integration
Copy the HTML file and integrate the JavaScript functionality into your frontend framework.

## Configuration

### 1. Update Backend URL
In the Config tab, update the Backend API URL:
```
Default: http://localhost:3000
```

Change this to match your backend deployment:
```
Production: https://your-backend.azurewebsites.net
```

### 2. Environment Variables (Backend)
Ensure your backend has all required environment variables:
```env
AZURE_STORAGE_ACCOUNT_NAME=your_account
AZURE_STORAGE_ACCOUNT_KEY=your_key
AZURE_BLOB_CONTAINER_NAME=videos
AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your_key
AZURE_COSMOS_DATABASE=video-db
AZURE_COSMOS_CONTAINER=videos
```

## Usage

### Basic Upload Flow

1. **Select a Video**
   - Click the upload area or drag-and-drop a video file
   - Supported formats: MP4, AVI, MOV, MKV, WebM
   - Maximum size: 1GB (configurable)

2. **Fill in Metadata**
   - Title: Give your video a descriptive title
   - Description: Optional detailed description
   - User ID: Your unique user identifier
   - Duration: Video duration in seconds (auto-detected optional)
   - Tags: Add relevant tags for categorization

3. **Upload**
   - Click the "Upload Video" button
   - Watch the progress bar as your video uploads
   - Metadata is automatically stored after upload completes

4. **Success**
   - Receive confirmation with unique Video ID
   - Use this ID to access your video later

### Advanced Features

#### Add Multiple Tags
```
1. Type a tag name in the tag input
2. Click "Add" or press Enter
3. Tags appear below the input
4. Click × on any tag to remove it
```

#### API Documentation Tab
Access built-in API endpoint reference:
- Get SAS Token
- Upload to Blob Storage
- Store Metadata
- Retrieve Metadata
- List User Videos

#### Configuration Tab
- Update backend URL
- Set maximum file size
- Test connection to backend
- View required environment variables

## Architecture

### Upload Process

```
1. User selects video file
2. Frontend requests SAS token from backend
3. Backend generates time-limited SAS token
4. Frontend uploads video directly to Azure Blob Storage
5. Frontend sends metadata to backend
6. Backend stores metadata in Cosmos DB
7. Success confirmation returned to user
```

### Why Direct Blob Upload?

- **Scalability**: Large files uploaded directly to Azure, not through backend
- **Performance**: Faster upload speeds
- **Cost**: Reduced backend bandwidth costs
- **Security**: SAS tokens are time-limited and revokable

## API Endpoints Used

### Generate SAS Token
```
POST /api/upload/sas-token
Content-Type: application/json

{
  "fileName": "video.mp4",
  "userId": "user123"
}

Response:
{
  "sasUrl": "https://...",
  "blobName": "user123/...",
  "expiresIn": "24 hours"
}
```

### Store Metadata
```
POST /api/upload/video
Content-Type: application/json

{
  "blobName": "user123/...",
  "userId": "user123",
  "title": "My Video",
  "description": "...",
  "duration": 120,
  "tags": ["tag1", "tag2"]
}

Response:
{
  "videoId": "uuid",
  "title": "My Video",
  "status": "uploaded",
  "uploadedAt": "2024-03-23T10:30:00Z"
}
```

### Retrieve Metadata
```
GET /api/upload/metadata/:videoId?userId=user123

Response:
{
  "video": {
    "id": "uuid",
    "title": "My Video",
    "uploadedAt": "2024-03-23T10:30:00Z",
    ...
  }
}
```

## Customization

### Styling
The frontend uses inline CSS with variables. To customize:

1. **Colors**: Update gradient colors
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

2. **Fonts**: Change font family
```css
font-family: 'Your Font', sans-serif;
```

3. **Sizes**: Modify dimensions
```css
max-width: 800px; /* Card width */
padding: 20px;     /* Spacing */
```

### Form Fields
Add additional metadata fields:

```html
<div class="form-group">
  <label for="newField">New Field</label>
  <input type="text" id="newField" placeholder="...">
</div>
```

Then include in metadata submission:
```javascript
newField: document.getElementById('newField').value
```

### Validation
Add custom validation:

```javascript
if (!videoTitle.match(/^[a-zA-Z0-9\s]{3,100}$/)) {
  showAlert('error', 'Title must be 3-100 alphanumeric characters');
  return;
}
```

## Error Handling

The frontend gracefully handles:

- **Network Errors**: Connection failures display user-friendly messages
- **File Size**: Validates file size before upload
- **Required Fields**: Prompts for missing metadata
- **Azure Errors**: Displays Azure service error messages
- **Timeout**: Handles upload timeouts

## Performance Optimization

1. **Direct Upload**: Files stream directly to Azure Blob Storage
2. **Progress Tracking**: XMLHttpRequest with progress events
3. **Minimal Dependencies**: Pure JavaScript, no frameworks needed
4. **Responsive**: CSS Grid and Flexbox for layout
5. **Lazy Loading**: API documentation loaded on-demand

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Security Considerations

1. **SAS Tokens**: Time-limited, automatically expire
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Backend configures allowed origins
4. **Sensitive Data**: Never expose storage keys in frontend (server-side only)
5. **User ID**: Validate user authentication on backend

## Troubleshooting

### "Failed to get SAS token"
- Verify backend is running
- Check API URL configuration
- Ensure backend has Azure credentials

### "Upload failed with status 404"
- Check blob container name matches backend configuration
- Verify storage account is accessible

### "Connection refused"
- Check backend URL is correct
- Ensure backend server is running
- Check firewall rules if on network

### Large file uploads timeout
- Increase SAS token expiration time
- Split file into smaller chunks
- Check network connection speed

## Development

### Local Testing
```bash
# Terminal 1: Start backend
cd terraform/backend
npm install
npm run dev

# Terminal 2: Serve frontend
cd terraform/frontend
python -m http.server 8000
# or
npx http-server

# Browser
http://localhost:8000/video-upload.html
```

### Debug Mode
```javascript
// Add to console
localStorage.debug = '*'
```

## Deployment

### Static Hosting

#### Azure Blob Storage + CDN
```bash
# Upload HTML to blob storage
az storage blob upload --container-name '$web' --file video-upload.html
```

#### GitHub Pages
```bash
# Copy to gh-pages branch
git checkout gh-pages
cp terraform/frontend/video-upload.html index.html
git push
```

#### AWS S3 + CloudFront
```bash
aws s3 cp video-upload.html s3://your-bucket/
```

### Docker with Nginx
```dockerfile
FROM nginx:alpine
COPY terraform/frontend/video-upload.html /usr/share/nginx/html/index.html
EXPOSE 80
```

## License

MIT

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend logs
3. Check Azure Portal resources
4. Open an issue on GitHub

## Version History

### v1.0.0
- Initial release
- Drag-and-drop upload
- Real-time progress tracking
- Metadata management
- Responsive design
- API documentation tab
