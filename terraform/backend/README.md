# Aigram Video Upload Backend

Production-ready Node.js Express backend for video upload with Azure Blob Storage and Cosmos DB integration.

## Features

- 🚀 **SAS Token Generation**: Secure, time-limited tokens for direct blob uploads
- 📊 **Metadata Management**: Store and retrieve video metadata in Cosmos DB
- 🔐 **Security**: CORS, Helmet for security headers, HTTPS enforced
- 📝 **Logging**: Morgan + custom logging middleware
- ⚠️ **Error Handling**: Comprehensive error handling for Azure services
- 🧪 **Production Ready**: Graceful shutdown, health checks, environment validation

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Azure Subscription with:
  - Storage Account
  - Cosmos DB Account
  - Service Principal credentials (for Terraform deployment)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure your Azure credentials in `.env`:
```env
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account
AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your_cosmos_key
PORT=3000
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (dev/production) | No (default: development) |
| `AZURE_STORAGE_ACCOUNT_NAME` | Azure Storage Account name | Yes |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage account access key | Yes |
| `AZURE_BLOB_CONTAINER_NAME` | Blob container name | Yes |
| `AZURE_COSMOS_ENDPOINT` | Cosmos DB endpoint URL | Yes |
| `AZURE_COSMOS_KEY` | Cosmos DB primary key | Yes |
| `AZURE_COSMOS_DATABASE` | Database name | Yes |
| `AZURE_COSMOS_CONTAINER` | Container name | Yes |
| `SAS_TOKEN_EXPIRY_HOURS` | SAS token expiration | No (default: 24) |
| `CORS_ORIGIN` | CORS allowed origin | No (default: *) |
| `LOG_LEVEL` | Log level (debug/info/error) | No (default: info) |

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health & Status

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-23T10:30:00Z",
  "service": "aigram-video-upload-backend",
  "version": "1.0.0"
}
```

#### `GET /api/status`
API status endpoint with feature information.

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2024-03-23T10:30:00Z",
  "environment": "development",
  "features": {
    "videoUpload": true,
    "blobStorage": true,
    "cosmosDb": true
  }
}
```

### Video Upload

#### `POST /api/upload/sas-token`
Generate a SAS token for secure blob upload.

**Request Body:**
```json
{
  "fileName": "video.mp4",
  "userId": "user123",
  "videoId": "video-uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "sasUrl": "https://...",
  "blobName": "user123/1645456800000_uuid_video.mp4",
  "containerName": "videos",
  "storageAccountName": "aigramvideostorage",
  "expiresIn": "24 hours",
  "uploadInstructions": {
    "method": "PUT",
    "url": "https://...",
    "headers": {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "video/*"
    }
  }
}
```

#### `POST /api/upload/video`
Store video metadata in Cosmos DB.

**Request Body:**
```json
{
  "blobName": "user123/1645456800000_uuid_video.mp4",
  "userId": "user123",
  "title": "My Video",
  "description": "Video description",
  "duration": 120,
  "thumbnail": "https://...",
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
    "blobName": "...",
    "title": "My Video",
    "status": "uploaded",
    "uploadedAt": "2024-03-23T10:30:00Z"
  }
}
```

#### `GET /api/upload/metadata/:videoId`
Get video metadata.

**Query Parameters:**
- `userId`: User ID (optional for security)

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "userId": "user123",
    "title": "My Video",
    "description": "...",
    "status": "uploaded",
    "uploadedAt": "2024-03-23T10:30:00Z",
    "views": 0,
    "likes": 0
  }
}
```

#### `PUT /api/upload/metadata/:videoId`
Update video metadata.

**Request Body:**
```json
{
  "userId": "user123",
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["new-tag"],
  "thumbnail": "https://..."
}
```

#### `DELETE /api/upload/metadata/:videoId`
Soft delete video metadata.

**Request Body:**
```json
{
  "userId": "user123"
}
```

#### `GET /api/upload/user/:userId/videos`
List all videos for a user.

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "count": 5,
  "videos": [
    {
      "id": "uuid",
      "title": "Video 1",
      "uploadedAt": "2024-03-23T10:30:00Z",
      ...
    }
  ]
}
```

## Working with the Backend

### 1. Generate SAS Token
```bash
curl -X POST http://localhost:3000/api/upload/sas-token \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "video.mp4",
    "userId": "user123"
  }'
```

### 2. Upload Video using SAS URL
```bash
curl -X PUT "<SAS_URL>" \
  -H "x-ms-blob-type: BlockBlob" \
  -H "Content-Type: video/mp4" \
  --data-binary "@video.mp4"
```

### 3. Store Metadata
```bash
curl -X POST http://localhost:3000/api/upload/video \
  -H "Content-Type: application/json" \
  -d '{
    "blobName": "user123/1645456800000_uuid_video.mp4",
    "userId": "user123",
    "title": "My Video",
    "description": "Great video!",
    "duration": 120
  }'
```

## Project Structure

```
backend/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env.example            # Environment variables template
├── config/
│   └── azure.js            # Azure service configuration
├── routes/
│   └── upload.js           # Upload routes
├── middleware/
│   ├── errorHandler.js     # Global error handler
│   └── logging.js          # Request logging
└── README.md               # This file
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

All errors include a structured JSON response:
```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

## Security Considerations

1. **SAS Tokens**: Time-limited, expire after configured hours
2. **CORS**: Configured to allow specific origins only
3. **HTTPS**: Enforced for all connections
4. **Helmet**: Security headers protection
5. **Environment Variables**: Never commit `.env` files
6. **Access Keys**: Store securely, rotate regularly

## Performance Optimization

- Connection pooling for Cosmos DB
- Efficient indexing in Cosmos DB
- Blob upload directly from client (reduces server load)
- Caching strategies for metadata

## Monitoring & Logging

- Request/response logging with Morgan
- Custom error logging
- Azure service logs available in Azure Portal
- Health check endpoint for monitoring

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### Azure App Service
1. Create App Service
2. Configure environment variables in App Settings
3. Deploy via Git/GitHub/Azure DevOps

### Kubernetes
See `k8s/` directory for Kubernetes manifests.

## Troubleshooting

### Connection Errors
- Verify Azure credentials in `.env`
- Check firewall rules in Azure Portal
- Ensure storage account has blob service enabled

### Cosmos DB Errors
- Check partition key in requests
- Verify database and container names
- Monitor RU consumption in Azure Portal

### Upload Failures
- Verify SAS token hasn't expired
- Check blob size limits
- Ensure container exists and is accessible

## Development

### Run Tests
```bash
npm test
```

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Contributing

Please follow the existing code style and add tests for new features.

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.

## Version History

### v1.0.0 (2024-03-23)
- Initial release
- SAS token generation
- Video metadata management
- Azure Blob Storage integration
- Cosmos DB integration
