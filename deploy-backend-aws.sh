#!/bin/bash

# ================================================
# AIGRAM BACKEND AWS DEPLOYMENT SCRIPT
# ================================================
# This script automates the deployment of Aigram backend to AWS
# Prerequisites: AWS CLI, Terraform, Docker, Node.js

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================================
# Functions
# ================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ================================================
# Pre-flight Checks
# ================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    print_success "AWS CLI installed"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install it first."
        exit 1
    fi
    print_success "Terraform installed"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install it first."
        exit 1
    fi
    print_success "Docker installed"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid."
        echo "Run: aws configure"
        exit 1
    fi
    print_success "AWS credentials configured"
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_info "AWS Account ID: $AWS_ACCOUNT_ID"
    
    # Get AWS region
    AWS_REGION=$(aws configure get region)
    AWS_REGION=${AWS_REGION:-us-east-1}
    print_info "AWS Region: $AWS_REGION"
}

# ================================================
# Environment Setup
# ================================================

setup_environment() {
    print_header "Setting Up Environment"
    
    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$SCRIPT_DIR"
    BACKEND_DIR="$PROJECT_ROOT/terraform/backend"
    TERRAFORM_DIR="$PROJECT_ROOT/terraform"
    
    print_info "Project Root: $PROJECT_ROOT"
    print_info "Backend Directory: $BACKEND_DIR"
    print_info "Terraform Directory: $TERRAFORM_DIR"
    
    # Create output directory
    mkdir -p "$PROJECT_ROOT/deployment-output"
}

# ================================================
# Docker Build & Push
# ================================================

build_and_push_docker_image() {
    print_header "Building and Pushing Docker Image"
    
    cd "$BACKEND_DIR"
    
    # Get ECR repository URL from terraform outputs (if available)
    if [ -f "$TERRAFORM_DIR/terraform.tfstate" ]; then
        ECR_REPO_URL=$(terraform output -json 2>/dev/null | grep -o '"ecr_repository_url": "[^"]*' | sed 's/"ecr_repository_url": "//' || echo "")
    fi
    
    if [ -z "$ECR_REPO_URL" ]; then
        print_warning "ECR Repository URL not found in terraform state."
        print_info "Will create ECR repository and get URL from terraform."
        return
    fi
    
    print_info "ECR Repository URL: $ECR_REPO_URL"
    
    # Build Docker image
    print_info "Building Docker image..."
    docker build -t aigram-backend:latest .
    print_success "Docker image built successfully"
    
    # Get ECR login token
    print_info "Logging into ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO_URL"
    print_success "Logged into ECR"
    
    # Tag image
    print_info "Tagging Docker image..."
    docker tag aigram-backend:latest "$ECR_REPO_URL/aigram-backend:latest"
    docker tag aigram-backend:latest "$ECR_REPO_URL/aigram-backend:$(date +%Y%m%d-%H%M%S)"
    print_success "Docker image tagged"
    
    # Push to ECR
    print_info "Pushing Docker image to ECR..."
    docker push "$ECR_REPO_URL/aigram-backend:latest"
    print_success "Docker image pushed to ECR"
    
    echo "$ECR_REPO_URL" > "$PROJECT_ROOT/deployment-output/ecr-repo-url.txt"
}

# ================================================
# Terraform Deployment
# ================================================

deploy_infrastructure() {
    print_header "Deploying Infrastructure with Terraform"
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    print_info "Initializing Terraform..."
    terraform init -upgrade
    print_success "Terraform initialized"
    
    # Validate configuration
    print_info "Validating Terraform configuration..."
    terraform validate
    print_success "Terraform configuration valid"
    
    # Create plan
    print_info "Creating Terraform plan..."
    terraform plan -var-file="aws.tfvars" -out=tfplan
    print_success "Terraform plan created"
    
    # Show summary
    echo ""
    print_warning "Review the plan above carefully!"
    read -p "Do you want to proceed with deployment? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Apply configuration
    print_info "Applying Terraform configuration..."
    terraform apply tfplan
    print_success "Infrastructure deployed successfully"
    
    # Get outputs
    print_info "Retrieving deployment outputs..."
    terraform output -json > "$PROJECT_ROOT/deployment-output/terraform-outputs.json"
    
    # Extract key information
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint 2>/dev/null | cut -d: -f1 || echo "")
    S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
    ECR_REPO=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
    
    print_success "Deployment outputs retrieved"
    
    # Save to file
    {
        echo "ALB_DNS_NAME=$ALB_DNS"
        echo "RDS_ENDPOINT=$RDS_ENDPOINT"
        echo "S3_BUCKET=$S3_BUCKET"
        echo "ECR_REPOSITORY=$ECR_REPO"
        echo "AWS_REGION=$AWS_REGION"
        echo "AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
    } > "$PROJECT_ROOT/deployment-output/deployment-info.env"
    
    print_info "Deployment info saved to deployment-output/deployment-info.env"
}

# ================================================
# Post-Deployment Configuration
# ================================================

post_deployment_setup() {
    print_header "Post-Deployment Configuration"
    
    # Load deployment info
    if [ -f "$PROJECT_ROOT/deployment-output/deployment-info.env" ]; then
        source "$PROJECT_ROOT/deployment-output/deployment-info.env"
    fi
    
    if [ -z "$ALB_DNS_NAME" ]; then
        print_warning "Unable to retrieve ALB DNS name. Please check deployment outputs."
        return
    fi
    
    print_info "Backend URL: http://$ALB_DNS_NAME"
    
    # Test health endpoint
    print_info "Testing backend health endpoint..."
    sleep 30  # Wait for ECS service to stabilize
    
    for i in {1..10}; do
        if curl -s "http://$ALB_DNS_NAME/health" > /dev/null 2>&1; then
            print_success "Backend is healthy"
            break
        fi
        
        if [ $i -lt 10 ]; then
            print_info "Waiting for backend to start... (attempt $i/10)"
            sleep 10
        else
            print_warning "Backend health check failed after 100 seconds"
            print_info "It may still be starting. Check CloudWatch logs for details."
        fi
    done
}

# ================================================
# Frontend Configuration
# ================================================

configure_frontend() {
    print_header "Frontend Configuration"
    
    # Load deployment info
    if [ -f "$PROJECT_ROOT/deployment-output/deployment-info.env" ]; then
        source "$PROJECT_ROOT/deployment-output/deployment-info.env"
    fi
    
    if [ -z "$ALB_DNS_NAME" ]; then
        print_warning "Unable to retrieve ALB DNS name."
        return
    fi
    
    BACKEND_URL="http://$ALB_DNS_NAME"
    API_URL="$BACKEND_URL/api"
    
    print_info "Update your frontend .env files with:"
    echo ""
    echo "EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL"
    echo "EXPO_PUBLIC_API_BASE_URL=$API_URL"
    echo ""
    
    # Try to update frontend constants
    CONSTANTS_FILE="$PROJECT_ROOT/src/constants/index.ts"
    if [ -f "$CONSTANTS_FILE" ]; then
        print_info "Found frontend constants file"
        print_warning "Please manually update the API_CONFIG and AWS_CONFIG in $CONSTANTS_FILE"
    fi
}

# ================================================
# Health Checks
# ================================================

run_health_checks() {
    print_header "Running Health Checks"
    
    # Load deployment info
    if [ -f "$PROJECT_ROOT/deployment-output/deployment-info.env" ]; then
        source "$PROJECT_ROOT/deployment-output/deployment-info.env"
    fi
    
    if [ -z "$ALB_DNS_NAME" ]; then
        print_warning "Unable to retrieve ALB DNS name. Skipping health checks."
        return
    fi
    
    BACKEND_URL="http://$ALB_DNS_NAME"
    
    # Check health endpoint
    print_info "Checking health endpoint..."
    if curl -s "$BACKEND_URL/health" | grep -q "ok"; then
        print_success "Health check passed"
    else
        print_warning "Health check failed"
    fi
    
    # Check API status
    print_info "Checking API status..."
    if curl -s "$BACKEND_URL/api/status" | grep -q "operational"; then
        print_success "API status check passed"
    else
        print_warning "API status check failed"
    fi
}

# ================================================
# Display Summary
# ================================================

display_summary() {
    print_header "Deployment Summary"
    
    if [ -f "$PROJECT_ROOT/deployment-output/deployment-info.env" ]; then
        source "$PROJECT_ROOT/deployment-output/deployment-info.env"
        
        echo ""
        echo "Backend URL:  http://$ALB_DNS_NAME"
        echo "API URL:      http://$ALB_DNS_NAME/api"
        echo "Region:       $AWS_REGION"
        echo "Account ID:   $AWS_ACCOUNT_ID"
        echo "S3 Bucket:    $S3_BUCKET"
        echo "RDS Endpoint: $RDS_ENDPOINT"
        echo ""
    fi
    
    echo "Output files:"
    echo "  - deployment-output/terraform-outputs.json"
    echo "  - deployment-output/deployment-info.env"
    echo "  - deployment-output/ecr-repo-url.txt (if Docker pushed)"
    echo ""
    
    print_success "Deployment complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Update frontend .env with backend URL"
    echo "  2. Configure CORS in backend .env if needed"
    echo "  3. Test the integration"
    echo "  4. Set up monitoring and alerts"
    echo ""
}

# ================================================
# Main Execution
# ================================================

main() {
    print_header "AIGRAM BACKEND AWS DEPLOYMENT"
    
    # Check if user wants to skip any step
    SKIP_DOCKER=${SKIP_DOCKER:-false}
    SKIP_TERRAFORM=${SKIP_TERRAFORM:-false}
    
    # Run checks
    check_prerequisites
    setup_environment
    
    # Deploy
    if [ "$SKIP_DOCKER" != "true" ]; then
        build_and_push_docker_image || print_warning "Docker build skipped"
    fi
    
    if [ "$SKIP_TERRAFORM" != "true" ]; then
        deploy_infrastructure || exit 1
    fi
    
    # Post-deployment
    post_deployment_setup
    configure_frontend
    run_health_checks
    
    # Summary
    display_summary
}

# ================================================
# Error Handler
# ================================================

trap 'print_error "Script failed at line $LINENO"' ERR

# ================================================
# Run main
# ================================================

main "$@"
