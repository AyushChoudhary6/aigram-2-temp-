variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "client_id" {
  description = "Azure Client ID (Service Principal)"
  type        = string
  sensitive   = true
}

variable "client_secret" {
  description = "Azure Client Secret (Service Principal)"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  sensitive   = true
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "aigram-video-upload-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Central India"
}

variable "storage_account_name" {
  description = "Name of the storage account (must be globally unique, lowercase, 3-24 chars)"
  type        = string
  default     = "aigramvideostorage"

  validation {
    condition     = length(var.storage_account_name) >= 3 && length(var.storage_account_name) <= 24 && can(regex("^[a-z0-9]+$", var.storage_account_name))
    error_message = "Storage account name must be 3-24 characters, lowercase, alphanumeric only."
  }
}

variable "storage_account_tier" {
  description = "Storage account tier (Standard or Premium)"
  type        = string
  default     = "Standard"

  validation {
    condition     = contains(["Standard", "Premium"], var.storage_account_tier)
    error_message = "Storage account tier must be either Standard or Premium."
  }
}

variable "storage_replication_type" {
  description = "Storage replication type (LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS)"
  type        = string
  default     = "LRS"

  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS", "GZRS", "RAGZRS"], var.storage_replication_type)
    error_message = "Storage replication type must be one of: LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS."
  }
}

variable "blob_container_name" {
  description = "Name of the blob container for videos"
  type        = string
  default     = "videos"

  validation {
    condition     = length(var.blob_container_name) >= 3 && length(var.blob_container_name) <= 63 && can(regex("^[a-z0-9-]+$", var.blob_container_name))
    error_message = "Blob container name must be 3-63 characters, lowercase, alphanumeric and hyphens only."
  }
}

variable "cosmosdb_account_name" {
  description = "Name of the Cosmos DB account (must be globally unique, lowercase, 3-44 chars)"
  type        = string
  default     = "aigram-videodb"

  validation {
    condition     = length(var.cosmosdb_account_name) >= 3 && length(var.cosmosdb_account_name) <= 44 && can(regex("^[a-z0-9-]+$", var.cosmosdb_account_name))
    error_message = "Cosmos DB account name must be 3-44 characters, lowercase, alphanumeric and hyphens only."
  }
}

variable "cosmosdb_database_name" {
  description = "Name of the Cosmos DB database"
  type        = string
  default     = "video-db"
}

variable "cosmosdb_container_name" {
  description = "Name of the Cosmos DB container"
  type        = string
  default     = "videos"
}

variable "cosmosdb_partition_key" {
  description = "Partition key for Cosmos DB container"
  type        = string
  default     = "/userId"
}

variable "cosmosdb_throughput" {
  description = "Throughput for Cosmos DB (RU/s)"
  type        = number
  default     = 400

  validation {
    condition     = var.cosmosdb_throughput >= 400 && var.cosmosdb_throughput <= 1000000
    error_message = "Cosmos DB throughput must be between 400 and 1,000,000 RU/s."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "aigram"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Aigram"
    Environment = "dev"
    ManagedBy   = "Terraform"
    CreatedDate = ""
  }
}

variable "app_service_plan_sku" {
  description = "The SKU for the App Service Plan"
  type        = string
  default     = "F1" # Free tier by default
}

variable "backend_app_name" {
  description = "The globally unique name for the backend App Service"
  type        = string
  default     = "aigram-backend-api-v1"
}

variable "hf_api_key" {
  description = "The Hugging Face API key for transcription services"
  type        = string
  sensitive   = true
}
