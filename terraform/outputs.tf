output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.video_upload_rg.name
}

output "resource_group_id" {
  description = "ID of the created resource group"
  value       = azurerm_resource_group.video_upload_rg.id
}

output "storage_account_name" {
  description = "Name of the Azure Storage Account"
  value       = azurerm_storage_account.video_storage.name
}

output "storage_account_id" {
  description = "ID of the Azure Storage Account"
  value       = azurerm_storage_account.video_storage.id
}

output "storage_account_primary_blob_endpoint" {
  description = "Primary blob endpoint of the storage account"
  value       = azurerm_storage_account.video_storage.primary_blob_endpoint
}

output "storage_account_connection_string" {
  description = "Connection string for the storage account"
  value       = azurerm_storage_account.video_storage.primary_connection_string
  sensitive   = true
}

output "storage_account_access_key" {
  description = "Primary access key for the storage account"
  value       = azurerm_storage_account.video_storage.primary_access_key
  sensitive   = true
}

output "blob_container_name" {
  description = "Name of the blob container for videos"
  value       = azurerm_storage_container.videos.name
}

output "blob_container_id" {
  description = "ID of the blob container"
  value       = azurerm_storage_container.videos.id
}

output "blob_container_url" {
  description = "URL of the blob container"
  value       = "${azurerm_storage_account.video_storage.primary_blob_endpoint}${azurerm_storage_container.videos.name}"
}

output "storage_account_sas_token" {
  description = "SAS token for storage account access"
  value       = data.azurerm_storage_account_sas.video_sas.sas
  sensitive   = true
}

output "cosmosdb_account_name" {
  description = "Name of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.video_db.name
}

output "cosmosdb_account_id" {
  description = "ID of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.video_db.id
}

output "cosmosdb_endpoint" {
  description = "Endpoint URI of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.video_db.endpoint
}

output "cosmosdb_primary_key" {
  description = "Primary master key for Cosmos DB"
  value       = azurerm_cosmosdb_account.video_db.primary_key
  sensitive   = true
}

output "cosmosdb_secondary_key" {
  description = "Secondary master key for Cosmos DB"
  value       = azurerm_cosmosdb_account.video_db.secondary_key
  sensitive   = true
}

output "cosmosdb_primary_readonly_key" {
  description = "Primary read-only key for Cosmos DB"
  value       = azurerm_cosmosdb_account.video_db.primary_readonly_key
  sensitive   = true
}

output "cosmosdb_secondary_readonly_key" {
  description = "Secondary read-only key for Cosmos DB"
  value       = azurerm_cosmosdb_account.video_db.secondary_readonly_key
  sensitive   = true
}

output "cosmosdb_database_name" {
  description = "Name of the Cosmos DB database"
  value       = azurerm_cosmosdb_sql_database.video_database.name
}

output "cosmosdb_container_name" {
  description = "Name of the Cosmos DB container"
  value       = azurerm_cosmosdb_sql_container.videos_container.name
}

output "cosmosdb_connection_string" {
  description = "Connection string for Cosmos DB"
  value       = "AccountEndpoint=${azurerm_cosmosdb_account.video_db.endpoint};AccountKey=${azurerm_cosmosdb_account.video_db.primary_key};"
  sensitive   = true
}

output "backend_environment_variables" {
  description = "Environment variables for backend configuration"
  value = {
    AZURE_STORAGE_ACCOUNT_NAME = azurerm_storage_account.video_storage.name
    AZURE_STORAGE_ACCOUNT_KEY  = azurerm_storage_account.video_storage.primary_access_key
    AZURE_BLOB_CONTAINER_NAME  = azurerm_storage_container.videos.name
    AZURE_COSMOS_ENDPOINT      = azurerm_cosmosdb_account.video_db.endpoint
    AZURE_COSMOS_KEY           = azurerm_cosmosdb_account.video_db.primary_key
    AZURE_COSMOS_DATABASE      = azurerm_cosmosdb_sql_database.video_database.name
    AZURE_COSMOS_CONTAINER     = azurerm_cosmosdb_sql_container.videos_container.name
  }
  sensitive = true
}

output "summary" {
  description = "Summary of created resources"
  value = {
    region                    = azurerm_resource_group.video_upload_rg.location
    resource_group            = azurerm_resource_group.video_upload_rg.name
    storage_account           = azurerm_storage_account.video_storage.name
    blob_container            = azurerm_storage_container.videos.name
    blob_endpoint             = azurerm_storage_account.video_storage.primary_blob_endpoint
    cosmosdb_account          = azurerm_cosmosdb_account.video_db.name
    cosmosdb_endpoint         = azurerm_cosmosdb_account.video_db.endpoint
    cosmosdb_database         = azurerm_cosmosdb_sql_database.video_database.name
    cosmosdb_container        = azurerm_cosmosdb_sql_container.videos_container.name
    cosmosdb_partition_key    = var.cosmosdb_partition_key
  }
}

output "backend_url" {
  description = "The deployed URL of the Node.js backend"
  value       = "https://${azurerm_linux_web_app.backend_app.default_hostname}"
}
