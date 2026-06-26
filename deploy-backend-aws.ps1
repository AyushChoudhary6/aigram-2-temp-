# ================================================
# AIGRAM BACKEND AWS DEPLOYMENT SCRIPT (PowerShell)
# ================================================
# This script automates the deployment of Aigram backend to AWS
# Prerequisites: AWS CLI, Terraform, Docker, Node.js

param(
    [switch]$SkipDocker = $false,
    [switch]$SkipTerraform = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# ================================================
# Functions
# ================================================

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================"  -ForegroundColor Blue
    Write-Host $Message  -ForegroundColor Blue
    Write-Host "========================================"  -ForegroundColor Blue
    Write-Host ""
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message"  -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message"  -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message"  -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message"  -ForegroundColor Cyan
}

# ================================================
# Pre-flight Checks
# ================================================

function Check-Prerequisites {
    Print-Header "Checking Prerequisites"
    
    # Check AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Print-Error "AWS CLI not found. Please install it first."
        exit 1
    }
    Print-Success "AWS CLI installed"
    
    # Check Terraform
    if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
        Print-Error "Terraform not found. Please install it first."
        exit 1
    }
    Print-Success "Terraform installed"
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Print-Error "Docker not found. Please install it first."
        exit 1
    }
    Print-Success "Docker installed"
    
    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Print-Success "AWS credentials configured"
        Print-Info "AWS Account ID: $($identity.Account)"
        return $identity
    }
    catch {
        Print-Error "AWS credentials not configured or invalid."
        Print-Info "Run: aws configure"
        exit 1
    }
}

# ================================================
# Environment Setup
# ================================================

function Setup-Environment {
    Print-Header "Setting Up Environment"
    
    $script:SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
    $script:PROJECT_ROOT = $SCRIPT_DIR
    $script:BACKEND_DIR = Join-Path $PROJECT_ROOT "terraform" "backend"
    $script:TERRAFORM_DIR = Join-Path $PROJECT_ROOT "terraform"
    
    Print-Info "Project Root: $script:PROJECT_ROOT"
    Print-Info "Backend Directory: $script:BACKEND_DIR"
    Print-Info "Terraform Directory: $script:TERRAFORM_DIR"
    
    # Create output directory
    $outputDir = Join-Path $PROJECT_ROOT "deployment-output"
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    
    $script:AWS_REGION = aws configure get region
    if ([string]::IsNullOrEmpty($script:AWS_REGION)) {
        $script:AWS_REGION = "us-east-1"
    }
    Print-Info "AWS Region: $script:AWS_REGION"
}

# ================================================
# Docker Build & Push
# ================================================

function Build-And-Push-Docker {
    Print-Header "Building and Pushing Docker Image"
    
    Push-Location $script:BACKEND_DIR
    
    try {
        # Get AWS account ID
        $accountId = aws sts get-caller-identity --query Account --output text
        
        # Get ECR repository URL
        $ecrRepoUrl = aws ecr describe-repositories `
            --repository-names aigram-backend `
            --region $script:AWS_REGION `
            --query 'repositories[0].repositoryUri' `
            --output text 2>$null
        
        if ([string]::IsNullOrEmpty($ecrRepoUrl) -or $ecrRepoUrl -eq "None") {
            # Create ECR repository if it doesn't exist
            Print-Info "Creating ECR repository..."
            $ecrRepoUrl = aws ecr create-repository `
                --repository-name aigram-backend `
                --region $script:AWS_REGION `
                --query 'repository.repositoryUri' `
                --output text
            Print-Success "ECR repository created"
        }
        
        Print-Info "ECR Repository URL: $ecrRepoUrl"
        
        # Build Docker image
        Print-Info "Building Docker image..."
        docker build -t aigram-backend:latest .
        Print-Success "Docker image built successfully"
        
        # Get ECR login token
        Print-Info "Logging into ECR..."
        $loginCmd = aws ecr get-login-password --region $script:AWS_REGION | `
            docker login --username AWS --password-stdin $ecrRepoUrl
        Print-Success "Logged into ECR"
        
        # Tag image
        Print-Info "Tagging Docker image..."
        docker tag aigram-backend:latest "$ecrRepoUrl/aigram-backend:latest"
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        docker tag aigram-backend:latest "$ecrRepoUrl/aigram-backend:$timestamp"
        Print-Success "Docker image tagged"
        
        # Push to ECR
        Print-Info "Pushing Docker image to ECR..."
        docker push "$ecrRepoUrl/aigram-backend:latest"
        Print-Success "Docker image pushed to ECR"
        
        # Save ECR repo URL
        $ecrRepoUrl | Out-File -FilePath (Join-Path $script:PROJECT_ROOT "deployment-output" "ecr-repo-url.txt")
    }
    finally {
        Pop-Location
    }
}

# ================================================
# Terraform Deployment
# ================================================

function Deploy-Infrastructure {
    Print-Header "Deploying Infrastructure with Terraform"
    
    Push-Location $script:TERRAFORM_DIR
    
    try {
        # Initialize Terraform
        Print-Info "Initializing Terraform..."
        terraform init -upgrade
        Print-Success "Terraform initialized"
        
        # Validate configuration
        Print-Info "Validating Terraform configuration..."
        terraform validate
        Print-Success "Terraform configuration valid"
        
        # Create plan
        Print-Info "Creating Terraform plan..."
        terraform plan -var-file="aws.tfvars" -out=tfplan
        Print-Success "Terraform plan created"
        
        # Show warning
        Write-Host ""
        Print-Warning "Review the plan above carefully!"
        $confirm = Read-Host "Do you want to proceed with deployment? (yes/no)"
        
        if ($confirm -ne "yes") {
            Print-Warning "Deployment cancelled"
            exit 0
        }
        
        # Apply configuration
        Print-Info "Applying Terraform configuration..."
        terraform apply tfplan
        Print-Success "Infrastructure deployed successfully"
        
        # Get outputs
        Print-Info "Retrieving deployment outputs..."
        $outputs = terraform output -json | ConvertFrom-Json
        
        $outputs | ConvertTo-Json | Out-File -FilePath (Join-Path $script:PROJECT_ROOT "deployment-output" "terraform-outputs.json")
        
        # Extract key information
        $albDns = $outputs.alb_dns_name.value
        $rdsEndpoint = ($outputs.rds_endpoint.value -split ":")[0]
        $s3Bucket = $outputs.s3_bucket_name.value
        $ecrRepo = $outputs.ecr_repository_url.value
        $accountId = aws sts get-caller-identity --query Account --output text
        
        Print-Success "Deployment outputs retrieved"
        
        # Save to file
        $deploymentInfo = @"
ALB_DNS_NAME=$albDns
RDS_ENDPOINT=$rdsEndpoint
S3_BUCKET=$s3Bucket
ECR_REPOSITORY=$ecrRepo
AWS_REGION=$script:AWS_REGION
AWS_ACCOUNT_ID=$accountId
"@
        
        $deploymentInfo | Out-File -FilePath (Join-Path $script:PROJECT_ROOT "deployment-output" "deployment-info.env")
        
        Print-Info "Deployment info saved to deployment-output/deployment-info.env"
        
        # Return outputs for use in other functions
        return @{
            AlbDns = $albDns
            RdsEndpoint = $rdsEndpoint
            S3Bucket = $s3Bucket
            EcrRepo = $ecrRepo
            AccountId = $accountId
        }
    }
    finally {
        Pop-Location
    }
}

# ================================================
# Post-Deployment Setup
# ================================================

function Post-Deployment-Setup {
    param([hashtable]$DeploymentInfo)
    
    Print-Header "Post-Deployment Configuration"
    
    if ([string]::IsNullOrEmpty($DeploymentInfo.AlbDns)) {
        Print-Warning "Unable to retrieve ALB DNS name. Please check deployment outputs."
        return
    }
    
    Print-Info "Backend URL: http://$($DeploymentInfo.AlbDns)"
    
    # Test health endpoint
    Print-Info "Testing backend health endpoint..."
    Start-Sleep -Seconds 30  # Wait for ECS service to stabilize
    
    $maxAttempts = 10
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://$($DeploymentInfo.AlbDns)/health" -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Print-Success "Backend is healthy"
                return
            }
        }
        catch {
            if ($i -lt $maxAttempts) {
                Print-Info "Waiting for backend to start... (attempt $i/$maxAttempts)"
                Start-Sleep -Seconds 10
            }
            else {
                Print-Warning "Backend health check failed after 100 seconds"
                Print-Info "It may still be starting. Check CloudWatch logs for details."
            }
        }
    }
}

# ================================================
# Frontend Configuration
# ================================================

function Configure-Frontend {
    param([hashtable]$DeploymentInfo)
    
    Print-Header "Frontend Configuration"
    
    if ([string]::IsNullOrEmpty($DeploymentInfo.AlbDns)) {
        Print-Warning "Unable to retrieve ALB DNS name."
        return
    }
    
    $backendUrl = "http://$($DeploymentInfo.AlbDns)"
    $apiUrl = "$backendUrl/api"
    
    Print-Info "Update your frontend .env files with:"
    Write-Host ""
    Write-Host "EXPO_PUBLIC_BACKEND_URL=$backendUrl"
    Write-Host "EXPO_PUBLIC_API_BASE_URL=$apiUrl"
    Write-Host ""
    
    # Try to update frontend constants
    $constantsFile = Join-Path $script:PROJECT_ROOT "src" "constants" "index.ts"
    if (Test-Path $constantsFile) {
        Print-Info "Found frontend constants file"
        Print-Warning "Please manually update the API_CONFIG and AWS_CONFIG in $constantsFile"
    }
}

# ================================================
# Health Checks
# ================================================

function Run-Health-Checks {
    param([hashtable]$DeploymentInfo)
    
    Print-Header "Running Health Checks"
    
    if ([string]::IsNullOrEmpty($DeploymentInfo.AlbDns)) {
        Print-Warning "Unable to retrieve ALB DNS name. Skipping health checks."
        return
    }
    
    $backendUrl = "http://$($DeploymentInfo.AlbDns)"
    
    # Check health endpoint
    Print-Info "Checking health endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing
        if ($response.Content -match "ok") {
            Print-Success "Health check passed"
        }
        else {
            Print-Warning "Health check failed"
        }
    }
    catch {
        Print-Warning "Health check request failed: $_"
    }
    
    # Check API status
    Print-Info "Checking API status..."
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/status" -UseBasicParsing
        if ($response.Content -match "operational") {
            Print-Success "API status check passed"
        }
        else {
            Print-Warning "API status check failed"
        }
    }
    catch {
        Print-Warning "API status request failed: $_"
    }
}

# ================================================
# Display Summary
# ================================================

function Display-Summary {
    param([hashtable]$DeploymentInfo)
    
    Print-Header "Deployment Summary"
    
    if ($DeploymentInfo) {
        Write-Host ""
        Write-Host "Backend URL:  http://$($DeploymentInfo.AlbDns)"
        Write-Host "API URL:      http://$($DeploymentInfo.AlbDns)/api"
        Write-Host "Region:       $($DeploymentInfo.AwsRegion)"
        Write-Host "Account ID:   $($DeploymentInfo.AccountId)"
        Write-Host "S3 Bucket:    $($DeploymentInfo.S3Bucket)"
        Write-Host "RDS Endpoint: $($DeploymentInfo.RdsEndpoint)"
        Write-Host ""
    }
    
    Write-Host "Output files:"
    Write-Host "  - deployment-output/terraform-outputs.json"
    Write-Host "  - deployment-output/deployment-info.env"
    Write-Host "  - deployment-output/ecr-repo-url.txt (if Docker pushed)"
    Write-Host ""
    
    Print-Success "Deployment complete!"
    Write-Host ""
    Print-Info "Next steps:"
    Write-Host "  1. Update frontend .env with backend URL"
    Write-Host "  2. Configure CORS in backend .env if needed"
    Write-Host "  3. Test the integration"
    Write-Host "  4. Set up monitoring and alerts"
    Write-Host ""
}

# ================================================
# Main Execution
# ================================================

function Main {
    Print-Header "AIGRAM BACKEND AWS DEPLOYMENT"
    
    # Run checks
    $identity = Check-Prerequisites
    Setup-Environment
    
    # Deploy
    if (-not $SkipDocker) {
        try {
            Build-And-Push-Docker
        }
        catch {
            Print-Warning "Docker build failed: $_"
        }
    }
    
    if (-not $SkipTerraform) {
        $deploymentInfo = Deploy-Infrastructure
        $deploymentInfo.AwsRegion = $script:AWS_REGION
        $deploymentInfo.AccountId = $identity.Account
    }
    else {
        $deploymentInfo = @{}
    }
    
    # Post-deployment
    Post-Deployment-Setup $deploymentInfo
    Configure-Frontend $deploymentInfo
    Run-Health-Checks $deploymentInfo
    
    # Summary
    Display-Summary $deploymentInfo
}

# ================================================
# Run main
# ================================================

try {
    Main
}
catch {
    Print-Error "Script failed: $_"
    exit 1
}
