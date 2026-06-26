# Backend AWS Deployment Guide

## Overview
This guide covers deploying the Aigram backend to AWS and connecting it with the frontend.

## Prerequisites

- AWS Account with appropriate credentials
- Terraform installed (v1.0+)
- AWS CLI configured
- Node.js 16+ (for local development)
- Docker (for containerization)

## Architecture

```
Frontend (React/Expo) 
    ↓
API Gateway / ALB (Application Load Balancer)
    ↓
ECS Fargate (Container-based backend)
    ↓
RDS PostgreSQL (Database)
    ├─ DynamoDB (Cache/Sessions)
    └─ S3 (Video Storage)
        └─ CloudFront (CDN)
```

## Step 1: Prepare AWS Credentials

1. **Create AWS IAM User** (if not already done):
   - Go to AWS IAM Console
   - Create a user with `AdministratorAccess` (or appropriate permissions)
   - Create access keys

2. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter default region (e.g., us-east-1)
   # Enter default output format (json)
   ```

3. **Verify Configuration**:
   ```bash
   aws sts get-caller-identity
   ```

## Step 2: Prepare Backend Environment

1. **Create/Update `.env` file** in `terraform/backend/`:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_S3_BUCKET=aigram-video-uploads-{account-id}
   AWS_DYNAMODB_TABLE=aigram-videos
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:8081,http://10.0.2.2:8081,https://your-frontend-domain.com
   
   # Security
   API_KEY=your_api_key
   JWT_SECRET=your_jwt_secret_min_32_chars
   
   # Logging
   LOG_LEVEL=info
   
   # Features
   MAX_VIDEO_SIZE_MB=1024
   ALLOWED_VIDEO_TYPES=mp4,avi,mov,mkv,webm
   ```

2. **Update Terraform Variables** in `terraform/terraform.tfvars`:
   ```hcl
   aws_region = "us-east-1"
   environment = "production"
   app_name = "aigram"
   enable_fargate = true
   enable_nat_gateway = true
   enable_cloudwatch_logs = true
   ```

## Step 3: Deploy Infrastructure with Terraform

1. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

2. **Review Terraform Plan**:
   ```bash
   terraform plan -out=tfplan
   ```

3. **Apply Terraform Configuration**:
   ```bash
   terraform apply tfplan
   ```
   
   This will create:
   - VPC, Subnets, Security Groups
   - Application Load Balancer (ALB)
   - ECS Cluster and Fargate Service
   - RDS PostgreSQL Database
   - S3 Bucket
   - CloudFront Distribution
   - CloudWatch Logs

4. **Save Terraform Outputs**:
   ```bash
   terraform output -json > deployment-output.json
   ```

## Step 4: Build and Push Docker Image

1. **Create Dockerfile** (if not exists) in `terraform/backend/`:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   
   # Copy application files
   COPY . .
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
   
   EXPOSE 3000
   
   CMD ["node", "server.js"]
   ```

2. **Build Docker Image**:
   ```bash
   cd terraform/backend
   docker build -t aigram-backend:latest .
   ```

3. **Push to ECR**:
   ```bash
   # Get ECR login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-repository-url>
   
   # Tag image
   docker tag aigram-backend:latest <ecr-repository-url>/aigram-backend:latest
   
   # Push to ECR
   docker push <ecr-repository-url>/aigram-backend:latest
   ```

## Step 5: Configure Frontend

Update `src/constants/index.ts` with the deployed backend URL:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
};

export const AWS_CONFIG = {
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
};
```

Set environment variables:
```bash
EXPO_PUBLIC_API_BASE_URL=http://<alb-dns-name>/api
EXPO_PUBLIC_BACKEND_URL=http://<alb-dns-name>
```

## Step 6: Testing and Verification

### Backend Health Checks

1. **Check ALB is accessible**:
   ```bash
   curl http://<alb-dns-name>/health
   ```

2. **Check API Status**:
   ```bash
   curl http://<alb-dns-name>/api/status
   ```

3. **Test Upload Endpoint**:
   ```bash
   curl -X POST http://<alb-dns-name>/api/upload/video \
     -H "Content-Type: application/json" \
     -d '{"videoId": "test-video", "title": "Test"}'
   ```

### Frontend Integration Tests

1. **Update API configuration in frontend**
2. **Test authentication**:
   ```bash
   # Run authentication test
   npm run test:auth
   ```

3. **Test video upload flow**
4. **Test feed loading**
5. **Test AI tools integration**

## Step 7: CORS Configuration

Ensure backend CORS is properly configured:

1. **Update backend CORS_ORIGIN** in `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000,http://10.0.2.2:8081,http://localhost:19000,https://your-frontend-domain.com
   ```

2. **Redeploy backend**:
   ```bash
   cd terraform/backend
   docker build -t aigram-backend:latest .
   # Push to ECR and trigger ECS deployment
   ```

## Step 8: Production Deployment

1. **Enable HTTPS**:
   - Request or import SSL certificate in ACM
   - Add HTTPS listener to ALB
   - Update security groups

2. **Set Up CloudFront**:
   - Enable caching for API responses
   - Set origin policy

3. **Configure DNS**:
   - Create Route 53 hosted zone
   - Add A record pointing to ALB
   - Update frontend to use custom domain

4. **Enable Logging**:
   ```bash
   # CloudWatch Logs for ECS
   # S3 access logs for ALB
   # CloudTrail for API calls
   ```

5. **Set Up Monitoring**:
   - CloudWatch alarms for CPU, Memory
   - Alarms for RDS connections
   - Alarms for S3 bucket size

## Troubleshooting

### Backend Not Responding

```bash
# Check ECS task logs
aws logs tail /ecs/aigram-backend --follow

# Check ECS service status
aws ecs describe-services --cluster aigram-cluster --services aigram-backend

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

### Database Connection Issues

```bash
# Check RDS endpoint connectivity
nc -zv <rds-endpoint> 5432

# Check RDS parameter group
aws rds describe-db-parameters --db-parameter-group-name aigram-db-params
```

### CORS Issues

```bash
# Test with curl
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://<alb-dns-name>/api/upload/video -v
```

## Cost Optimization

1. **Use AWS Free Tier resources** where applicable
2. **Set up auto-scaling** for ECS tasks
3. **Use RDS Reserved Instances** for production
4. **Configure S3 lifecycle policies** for old videos
5. **Use CloudFront** for video delivery

## Cleanup

To destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all resources including databases and S3 buckets!

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
2. Configure auto-scaling policies
3. Set up backup and disaster recovery
4. Implement API rate limiting
5. Add request logging and monitoring
