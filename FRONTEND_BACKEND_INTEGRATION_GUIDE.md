# Frontend-Backend Integration Guide

This guide covers connecting your Aigram frontend to the AWS-deployed backend.

## Overview

The frontend communicates with the backend through API endpoints defined in the constants file. After deploying the backend to AWS, you need to update these endpoints to point to your deployed backend.

## Architecture

```
┌─────────────────────────────┐
│      Frontend App           │
│  (React/Expo/React Native)  │
└──────────────┬──────────────┘
               │
               │ HTTP/HTTPS API Calls
               │
       ┌───────▼────────┐
       │   ALB (AWS)    │
       │  Load Balancer │
       └───────┬────────┘
               │
       ┌───────▼─────────────────┐
       │  ECS Fargate Container  │
       │   Node.js Backend       │
       └───────┬─────────────────┘
               │
      ┌────────┼────────┐
      │                 │
      ▼                 ▼
   ┌────────┐     ┌──────────┐
   │ RDS DB │     │ S3 & DDB │
   │(Postgres)    │(Storage) │
   └────────┘     └──────────┘
```

## Step 1: Get Your Backend URL

After deploying with Terraform, retrieve your backend URL:

```bash
# Option 1: Check deployment info file
cat deployment-output/deployment-info.env | grep ALB_DNS_NAME

# Option 2: Using AWS CLI
aws elbv2 describe-load-balancers \
  --names aigram-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Option 3: Using Terraform outputs
cd terraform
terraform output alb_dns_name
```

You'll get something like:
```
aigram-alb-1234567890.us-east-1.elb.amazonaws.com
```

## Step 2: Update Frontend Configuration

### Method 1: Environment Variables (Recommended)

#### For React Web App:

Create `.env` file in your project root:

```env
REACT_APP_API_BASE_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com/api
REACT_APP_BACKEND_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com
```

#### For Expo/React Native:

Create `.env` file in your project root:

```env
EXPO_PUBLIC_API_BASE_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com/api
EXPO_PUBLIC_BACKEND_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com
```

Or in `app.json`:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com/api",
      "EXPO_PUBLIC_BACKEND_URL": "http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com"
    }
  }
}
```

### Method 2: Update Constants File Directly

Edit `src/constants/index.ts`:

```typescript
import Constants from 'expo-constants';

const _expoExtra = (Constants.expoConfig || (Constants as any).manifest)?.extra || {};

// Update with your ALB DNS name
const ALB_DNS_NAME = 'aigram-alb-1234567890.us-east-1.elb.amazonaws.com';

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 
            _expoExtra.API_BASE_URL || 
            `http://${ALB_DNS_NAME}/api`,
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
};

export const AWS_CONFIG = {
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 
               _expoExtra.EXPO_PUBLIC_BACKEND_URL ||
               `http://${ALB_DNS_NAME}`,
};

// ... rest of constants
```

## Step 3: Configure API Service

The API service should automatically use the constants. Verify your API service in `src/services/apiService.ts`:

```typescript
import { API_CONFIG } from '../constants';
import axios from 'axios';

const apiService = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle errors
    if (error.response?.status === 401) {
      // Token expired, refresh or redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiService;
```

## Step 4: Update CORS Configuration (Backend)

Make sure the backend CORS is configured to accept requests from your frontend.

Edit `terraform/backend/.env` or `terraform/backend/.env.production`:

```env
# Add all your frontend domains
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,http://10.0.2.2:8081,http://10.0.2.2:19000,https://your-frontend-domain.com
```

Then redeploy the backend if needed.

## Step 5: Test the Integration

### Test 1: Simple Health Check

```bash
# Get ALB DNS name
ALB_DNS=$(cat deployment-output/deployment-info.env | grep ALB_DNS_NAME | cut -d= -f2)

# Test backend
curl http://$ALB_DNS/health
# Should return: {"status":"ok",...}

curl http://$ALB_DNS/api/status
# Should return: {"status":"operational",...}
```

### Test 2: Test from Frontend Code

Create a test component:

```typescript
import { useEffect, useState } from 'react';
import { AWS_CONFIG } from '../constants';

export const BackendConnectionTest = () => {
  const [status, setStatus] = useState<string>('Testing...');

  useEffect(() => {
    const testBackend = async () => {
      try {
        // Test 1: Health check
        const healthRes = await fetch(`${AWS_CONFIG.BACKEND_URL}/health`);
        if (!healthRes.ok) throw new Error('Health check failed');
        
        // Test 2: API status
        const statusRes = await fetch(`${AWS_CONFIG.BACKEND_URL}/api/status`);
        if (!statusRes.ok) throw new Error('Status check failed');
        
        const statusData = await statusRes.json();
        setStatus(`✓ Backend connected! Status: ${statusData.status}`);
      } catch (error) {
        setStatus(`✗ Connection failed: ${error.message}`);
      }
    };

    testBackend();
  }, []);

  return (
    <div>
      <h2>Backend Connection Status</h2>
      <p>{status}</p>
      <p>Backend URL: {AWS_CONFIG.BACKEND_URL}</p>
      <p>API Base URL: {API_CONFIG.BASE_URL}</p>
    </div>
  );
};
```

### Test 3: Test API Endpoint

```bash
# Upload endpoint test
curl -X POST http://$ALB_DNS/api/upload/sas-token \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-video.mp4",
    "videoId": "test-123",
    "userId": "user-456",
    "folder": "uploads"
  }'

# Should return: {"success":true,"sasUrl":"...","blobName":"..."}
```

## Step 6: Handle Common Issues

### Issue 1: CORS Errors

**Error:** `Access to XMLHttpRequest at 'http://...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
1. Update backend `.env` with your frontend domain
2. Redeploy the backend:
   ```bash
   cd terraform/backend
   docker build -t aigram-backend:latest .
   docker push <ecr-url>/aigram-backend:latest
   ```
3. Check CloudWatch logs for CORS settings

### Issue 2: Network Timeout

**Error:** `Network request failed` or `Request timeout`

**Solution:**
1. Check if ALB is accessible:
   ```bash
   curl -i http://$ALB_DNS/health
   ```
2. Check ECS service status:
   ```bash
   aws ecs describe-services --cluster aigram-cluster --services aigram-backend
   ```
3. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/aigram-backend --follow
   ```

### Issue 3: 502 Bad Gateway

**Error:** `Bad Gateway` response from ALB

**Solution:**
1. Wait for ECS service to fully start (can take 2-3 minutes)
2. Check if backend is healthy:
   ```bash
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```
3. View container logs:
   ```bash
   aws logs tail /ecs/aigram-backend --follow
   ```

### Issue 4: DNS Resolution Issues (Mobile)

For Android emulator using `http://10.0.2.2`:

```env
# In .env
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:3000
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
```

For iOS simulator using `localhost`:

```env
# In .env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Step 7: Implement Error Handling

Update your API service to handle backend errors:

```typescript
// Enhanced error handling
apiService.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message);
          break;
        case 401:
          console.error('Unauthorized - token may have expired');
          // Refresh token or redirect to login
          break;
        case 403:
          console.error('Forbidden - access denied');
          break;
        case 404:
          console.error('Not Found:', data.message);
          break;
        case 500:
          console.error('Server Error:', data.message);
          break;
        default:
          console.error('Error:', status, data.message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
      console.error('Is the backend running?');
      console.error('Backend URL:', API_CONFIG.BASE_URL);
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
```

## Step 8: Testing Checklist

- [ ] Backend health check passes
- [ ] API status endpoint returns "operational"
- [ ] CORS errors are resolved
- [ ] Frontend can make API requests
- [ ] Authentication works (login/logout)
- [ ] Video upload works
- [ ] Video playback works
- [ ] All API endpoints are accessible

## Monitoring and Debugging

### Monitor Backend Health

```bash
# Watch logs in real-time
aws logs tail /ecs/aigram-backend --follow

# View logs for specific time range
aws logs tail /ecs/aigram-backend --start-time 30m

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/aigram-backend \
  --filter-pattern "ERROR"
```

### Check Performance Metrics

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/aigram-alb/* \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

## Production Checklist

Before going to production:

- [ ] Update backend `.env` with production values
- [ ] Enable HTTPS on ALB
- [ ] Use custom domain with Route 53
- [ ] Set up CloudWatch alarms
- [ ] Enable database backups
- [ ] Configure auto-scaling
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Test disaster recovery
- [ ] Document deployment process

---

**Last Updated:** 2024
**Version:** 1.0
