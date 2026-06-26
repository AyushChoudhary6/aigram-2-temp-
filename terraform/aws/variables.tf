variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "aigram"
}

variable "project_name" {
  description = "Project name for legacy EC2 resources"
  type        = string
  default     = "aigram-backend"
}

variable "s3_bucket_name" {
  description = "S3 bucket name used by legacy EC2 IAM policy"
  type        = string
  default     = "aigram-practice-videos-2026"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Owner       = "AIgram"
    CostCenter  = "Engineering"
    CreatedDate = "2024"
  }
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets (increases cost)"
  type        = bool
  default     = false # Set to true for production
}

# RDS Configuration (Free Tier)
variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro is free tier)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "aigram"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "aigramadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (must be 8-41 chars, alphanumeric + special chars)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 8 && length(var.db_password) <= 41
    error_message = "Password must be between 8 and 41 characters."
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB (20 GB is free tier)"
  type        = number
  default     = 20
}

variable "backup_retention_days" {
  description = "Database backup retention (7 days is free)"
  type        = number
  default     = 7
}

# EC2 Configuration (Free Tier or Minimal)
variable "enable_ec2" {
  description = "Deploy backend on EC2 (alternative to Fargate)"
  type        = bool
  default     = false # Set to true if using EC2 instead of Fargate
}

variable "ec2_instance_type" {
  description = "EC2 instance type (t3.micro is free tier)"
  type        = string
  default     = "t3.micro"
}

# ECS/Fargate Configuration (Serverless - more cost-effective)
variable "enable_fargate" {
  description = "Deploy backend on Fargate (serverless containers)"
  type        = bool
  default     = true
}

variable "fargate_cpu" {
  description = "Fargate CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "fargate_memory" {
  description = "Fargate memory in MB (512 MB)"
  type        = number
  default     = 512
}

# S3 Configuration
variable "enable_s3_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = false # Disable to reduce costs
}

variable "s3_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = false # Disable to reduce costs
}

# Monitoring
variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logs"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7 # Reduce from 30 to save costs
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Enable HTTPS with ACM certificate"
  type        = bool
  default     = true
}

# Backup Configuration
variable "enable_db_backup" {
  description = "Enable automated database backups"
  type        = bool
  default     = true
}

variable "backup_window" {
  description = "Backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}
