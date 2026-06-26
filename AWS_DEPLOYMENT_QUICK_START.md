# AWS Backend Deployment - Quick Start Guide

This guide will help you deploy the Aigram backend to AWS in 5 easy steps.

## Step 1: Prepare Your AWS Account

### Prerequisites
- AWS Account (with credit card for billing)
- AWS CLI installed: https://aws.amazon.com/cli/
- Terraform installed: https://www.terraform.io/downloads.html
- Docker installed: https://www.docker.com/products/docker-desktop
- Node.js 18+ installed

### Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# When prompted, enter:
# AWS Access Key ID: [Your access key]
# AWS Secret Access Key: [Your secret key]
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

## Step 2: Update Configuration Files

### 1. Update Backend Environment (`.env.production`)

Edit `terraform/backend/.env.production`:

```env
# Change these for production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key

# Update CORS for your frontend domains
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com

# Generate a random JWT secret (32+ characters)
JWT_SECRET=your-super-secret-key-min-32-chars-long

# Generate a random API key
API_KEY=your-api-key
```

### 2. Update Terraform Variables (`terraform/aws.tfvars`)

Edit `terraform/aws.tfvars`:

```hcl
# Change database password (8-41 characters with special chars)
db_password = "YourSecurePassword123!"

# Update other settings as needed
aws_region = "us-east-1"
environment = "production"
```

## Step 3: Deploy Infrastructure

### Option A: Using PowerShell (Windows)

```powershell
# Run the deployment script
.\deploy-backend-aws.ps1

# Or skip Docker and just deploy infrastructure
.\deploy-backend-aws.ps1 -SkipDocker

# Or skip Terraform and just build/push Docker
.\deploy-backend-aws.ps1 -SkipTerraform
```

### Option B: Using Bash (macOS/Linux)

```bash
# Make script executable
chmod +x deploy-backend-aws.sh

# Run the deployment script
./deploy-backend-aws.sh

# Or with environment variables
SKIP_DOCKER=true ./deploy-backend-aws.sh
SKIP_TERRAFORM=true ./deploy-backend-aws.sh
```

### Option C: Manual Deployment

If you prefer to deploy manually:

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Plan deployment
terraform plan -var-file="aws.tfvars" -out=tfplan

# 3. Review and apply
terraform apply tfplan

# 4. Get outputs
terraform output -json > deployment-output.json

# 5. Build and push Docker image
cd terraform/backend
docker build -t aigram-backend:latest .

# Get ECR repository URL from terraform outputs
# Then push to ECR:
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr-url>

docker tag aigram-backend:latest <ecr-url>/aigram-backend:latest
docker push <ecr-url>/aigram-backend:latest
```

## Step 4: Retrieve Deployment Information

After successful deployment, check the output files:

```bash
# View deployment info
cat deployment-output/deployment-info.env

# Example output:
# ALB_DNS_NAME=aigram-alb-1234567890.us-east-1.elb.amazonaws.com
# RDS_ENDPOINT=aigram-db.c1234567890.us-east-1.rds.amazonaws.com
# S3_BUCKET=aigram-videos-123456789
# ECR_REPOSITORY=123456789.dkr.ecr.us-east-1.amazonaws.com/aigram-backend
```

## Step 5: Connect Frontend to Backend

### Update Frontend Environment Variables

Create or update `.env` in your frontend project root:

```env
# Frontend .env
EXPO_PUBLIC_BACKEND_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com
EXPO_PUBLIC_API_BASE_URL=http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com/api
```

Or in `app.json` (for Expo):

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

### Update Constants File

Edit `src/constants/index.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 
            'http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com/api',
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
};

export const AWS_CONFIG = {
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 
               'http://aigram-alb-1234567890.us-east-1.elb.amazonaws.com',
};
```

## Verify Deployment

### Test Backend Endpoints

```bash
# Get the ALB DNS name
ALB_DNS=aigram-alb-1234567890.us-east-1.elb.amazonaws.com

# Test health endpoint
curl http://$ALB_DNS/health

# Test API status
curl http://$ALB_DNS/api/status

# Test upload endpoint (without authentication)
curl -X POST http://$ALB_DNS/api/upload/video \
  -H "Content-Type: application/json" \
  -d '{"videoId": "test", "title": "Test"}'
```

### Check Logs

```bash
# View CloudWatch logs
aws logs tail /ecs/aigram-backend --follow

# Or view a specific time range
aws logs tail /ecs/aigram-backend \
  --start-time 30m \
  --follow
```

## Common Issues

### Backend Not Responding

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster aigram-cluster \
  --services aigram-backend \
  --region us-east-1

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1

# View CloudWatch logs
aws logs tail /ecs/aigram-backend --follow --region us-east-1
```

### CORS Issues

Update `terraform/backend/.env.production`:

```env
# Add your frontend domain
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,https://your-domain.com
```

Then redeploy:

```bash
# Build new Docker image
cd terraform/backend
docker build -t aigram-backend:latest .

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ecr-url>

docker push <ecr-url>/aigram-backend:latest

# Update ECS service to use new image
# This will be automatic if you're using deployment pipeline
```

### Database Connection Issues

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier aigram-db \
  --region us-east-1

# Test connection (if you have psql installed)
psql -h <rds-endpoint> -U aigramadmin -d aigram
```

## Next Steps

1. **Set Up HTTPS**
   - Request SSL certificate from AWS Certificate Manager
   - Update ALB listener to use HTTPS
   - Update frontend to use https:// URLs

2. **Configure Custom Domain**
   - Create Route 53 hosted zone
   - Add A record pointing to ALB
   - Update CORS and frontend URLs

3. **Set Up Monitoring**
   ```bash
   # Create CloudWatch alarms for key metrics
   # Monitor CPU, Memory, Database connections
   # Set up SNS notifications for alerts
   ```

4. **Implement CI/CD**
   - Set up GitHub Actions workflow
   - Automatically build and push Docker images
   - Automatically update ECS service on new deployments

5. **Backup and Disaster Recovery**
   - Enable automated RDS backups
   - Configure S3 versioning
   - Test restore procedures

## Cost Estimation

**Typical monthly costs (dev environment):**
- ECS Fargate: ~$15-30
- RDS PostgreSQL (t3.micro): ~$15
- S3: ~$5-10 (depending on storage)
- CloudFront: ~$5-10 (depending on usage)
- **Total: ~$40-65/month**

To optimize costs:
- Use free tier where available
- Delete resources not in use
- Use auto-scaling for variable load
- Monitor CloudWatch for unexpected usage

## Support

For issues or questions:
1. Check CloudWatch logs: `/ecs/aigram-backend`
2. Review Terraform outputs
3. Check AWS service status page
4. Review application logs in ECS

## Cleanup

To delete all AWS resources (WARNING - this is permanent):

```bash
cd terraform
terraform destroy

# Or with auto-approve (be careful!)
terraform destroy -auto-approve

# Confirm deletion:
rm -rf .terraform/ terraform.tfstate* .terraform.lock.hcl
```

---

**Last Updated:** 2024
**Version:** 1.0
