# Create Resource Group
resource "azurerm_resource_group" "video_upload_rg" {
  name     = var.resource_group_name
  location = var.location

  tags = merge(
    var.common_tags,
    {
      Name = var.resource_group_name
    }
  )
}

# Create Storage Account
resource "azurerm_storage_account" "video_storage" {
  name                     = replace(var.storage_account_name, "-", "")
  resource_group_name      = azurerm_resource_group.video_upload_rg.name
  location                 = azurerm_resource_group.video_upload_rg.location
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_replication_type

  https_traffic_only_enabled = true
  min_tls_version            = "TLS1_2"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["DELETE", "GET", "HEAD", "MERGE", "POST", "OPTIONS", "PUT", "PATCH"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = merge(
    var.common_tags,
    {
      Name = var.storage_account_name
      Type = "Video Storage"
    }
  )

  lifecycle {
    ignore_changes = [tags["CreatedDate"]]
  }
}

# Create Blob Storage Container for Videos
resource "azurerm_storage_container" "videos" {
  name                  = var.blob_container_name
  storage_account_name  = azurerm_storage_account.video_storage.name
  container_access_type = "blob" # Allows public web access to video files
}

# Create Cosmos DB Account
resource "azurerm_cosmosdb_account" "video_db" {
  name                = var.cosmosdb_account_name
  location            = azurerm_resource_group.video_upload_rg.location
  resource_group_name = azurerm_resource_group.video_upload_rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # Enable automatic failover
  automatic_failover_enabled = true

  # Consistency policy
  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  # Geo-replication (optional - add more locations as needed)
  geo_location {
    location          = azurerm_resource_group.video_upload_rg.location
    failover_priority = 0
  }

  # Security
  is_virtual_network_filter_enabled = false
  public_network_access_enabled     = true

  tags = merge(
    var.common_tags,
    {
      Name = var.cosmosdb_account_name
      Type = "Video Metadata Database"
    }
  )

  depends_on = [azurerm_resource_group.video_upload_rg]

  lifecycle {
    ignore_changes = [tags["CreatedDate"]]
  }
}

# Create Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "video_database" {
  name                = var.cosmosdb_database_name
  resource_group_name = azurerm_resource_group.video_upload_rg.name
  account_name        = azurerm_cosmosdb_account.video_db.name
}

# Create Cosmos DB Container
resource "azurerm_cosmosdb_sql_container" "videos_container" {
  name                = var.cosmosdb_container_name
  resource_group_name = azurerm_resource_group.video_upload_rg.name
  account_name        = azurerm_cosmosdb_account.video_db.name
  database_name       = azurerm_cosmosdb_sql_database.video_database.name

  # Use partition_key_paths (list format) instead of deprecated partition_key_path
  partition_key_paths = [var.cosmosdb_partition_key]

  throughput = var.cosmosdb_throughput

  # TTL Configuration - videos never auto-expire unless explicitly deleted
  default_ttl = -1

  depends_on = [azurerm_cosmosdb_sql_database.video_database]
}

# Generate Storage Account Access Key SAS Token (for backend use in generating secure upload URLs)
data "azurerm_storage_account_sas" "video_sas" {
  connection_string = azurerm_storage_account.video_storage.primary_connection_string
  https_only        = true
  signed_version    = "2021-06-08"
  
  resource_types {
    service   = true
    container = true
    object    = true
  }

  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }

  start  = timestamp()
  expiry = timeadd(timestamp(), "8760h") # 1 year

  permissions {
    read   = true
    write  = true
    delete = false
    list   = true
    add    = true
    create = true
    update = false
    process = false
    filter = false
    tag    = false
  }
}

# Local value for common tags with environment
locals {
  enhanced_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Project     = var.project_name
    }
  )
}

# Create App Service Plan
resource "azurerm_service_plan" "backend_plan" {
  name                = "${var.resource_group_name}-plan"
  resource_group_name = azurerm_resource_group.video_upload_rg.name
  location            = azurerm_resource_group.video_upload_rg.location
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku

  tags = local.enhanced_tags
}

# Create Linux Web App for the Node.js Backend
resource "azurerm_linux_web_app" "backend_app" {
  name                = var.backend_app_name
  resource_group_name = azurerm_resource_group.video_upload_rg.name
  location            = azurerm_service_plan.backend_plan.location
  service_plan_id     = azurerm_service_plan.backend_plan.id

  site_config {
    always_on = false
    
    application_stack {
      node_version = "20-lts"
    }
    
    cors {
      allowed_origins = ["*"]
    }
  }

  app_settings = {
    "PORT"                       = "8080"
    "NODE_ENV"                   = "production"
    "AZURE_STORAGE_ACCOUNT_NAME" = azurerm_storage_account.video_storage.name
    "AZURE_STORAGE_ACCOUNT_KEY"  = azurerm_storage_account.video_storage.primary_access_key
    "AZURE_BLOB_CONTAINER_NAME"  = var.blob_container_name
    "AZURE_COSMOS_ENDPOINT"      = azurerm_cosmosdb_account.video_db.endpoint
    "AZURE_COSMOS_KEY"           = azurerm_cosmosdb_account.video_db.primary_key
    "AZURE_COSMOS_DATABASE"      = var.cosmosdb_database_name
    "AZURE_COSMOS_CONTAINER"     = var.cosmosdb_container_name
    "SAS_TOKEN_EXPIRY_HOURS"     = "24"
    "HF_API_KEY"                 = var.hf_api_key
    "HF_WHISPER_MODEL"           = "openai/whisper-large-v3-turbo"
    "HF_TEXT_MODEL"              = "meta-llama/Meta-Llama-3-8B-Instruct"
  }

  tags = local.enhanced_tags
}
