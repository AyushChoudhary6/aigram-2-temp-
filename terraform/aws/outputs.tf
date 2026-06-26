output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = var.enable_fargate ? aws_lb.main[0].dns_name : null
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = var.enable_fargate ? "http://${aws_lb.main[0].dns_name}" : null
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for video uploads"
  value       = aws_s3_bucket.video_uploads.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.video_uploads.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  value       = aws_ecr_repository.backend.repository_url
}

output "secrets_manager_db_secret_arn" {
  description = "ARN of the database secret in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "secrets_manager_jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for ECS"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.ecs[0].name : null
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = var.enable_fargate ? aws_ecs_cluster.main[0].name : null
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = var.enable_fargate ? aws_ecs_service.backend[0].name : null
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "deployment_summary" {
  description = "Summary of deployment information for frontend configuration"
  value = {
    backend_url       = var.enable_fargate ? "http://${aws_lb.main[0].dns_name}" : null
    s3_bucket         = aws_s3_bucket.video_uploads.id
    cloudfront_url    = "https://${aws_cloudfront_distribution.s3_distribution.domain_name}"
    region            = var.aws_region
    environment       = var.environment
  }
}
