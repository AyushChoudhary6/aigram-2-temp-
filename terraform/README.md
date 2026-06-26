# Aigram Azure Video Upload System - Complete Project

Production-ready infrastructure-as-code and application for a video upload system on Microsoft Azure. This project includes Terraform infrastructure code, Node.js Express backend, and a modern web frontend.

## 📋 Project Overview

Complete solution for building a scalable video upload platform with:

- **Infrastructure**: Azure Resource Group, Storage Account, Blob Container, Cosmos DB
- **Backend API**: Node.js Express server with SAS token generation and metadata management
- **Frontend**: Modern, responsive web interface with drag-and-drop upload
- **Security**: Time-limited SAS tokens, HTTPS enforced, proper authentication

## 📁 Project Structure

```
terraform/
├── README.md                           # Root documentation (this file)
├── provider.tf                         # Azure provider configuration
├── variables.tf                        # Variable definitions
├── main.tf                             # Main resources (Resource Group, Storage, Cosmos DB)
├── outputs.tf                          # Output values
├── terraform.tfvars.example            # Example environment variables
│
├── backend/                            # Node.js Express backend
│   ├── README.md                       # Backend documentation
│   ├── package.json                    # Dependencies
│   ├── server.js                       # Main server
│   ├── .env.example                    # Environment template
│   ├── config/
│   │   └── azure.js                    # Azure client configuration
│   ├── routes/
│   │   └── upload.js                   # Video upload endpoints
│   └── middleware/
│       ├── errorHandler.js             # Error handling
│       └── logging.js                  # Request logging
│
└── frontend/                           # Web frontend
    ├── README.md                       # Frontend documentation
    └── video-upload.html               # Complete web application
```

## 🚀 Quick Start

### Prerequisites

1. **Azure Prerequisites**
   - Azure Subscription
   - Azure CLI installed (`az --version`)
   - Service Principal credentials (or use az login)

2. **Local Prerequisites**
   - Terraform >= 1.0
   - Node.js >= 16.0
   - npm or yarn

3. **Optional Tools**
   - Azure Storage Explorer
   - Postman (API testing)
   - VS Code with Azure extensions

### Step 1: Authenticate with Azure

```bash
# Interactive login (for development)
az login

# Or use Service Principal (recommended for CI/CD)
az login --service-principal \
  -u <client-id> \
  -p <client-secret> \
  --tenant <tenant-id>
```

### Step 2: Configure Terraform

```bash
cd terraform

# Copy example to actual config
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
# - subscription_id
# - client_id (Service Principal)
# - client_secret
# - tenant_id
# - region (e.g., "Central India")
# - unique storage account name
# - unique cosmos db name

# Verify the values
cat terraform.tfvars
```

### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply changes
terraform apply

# Save outputs (important!)
terraform output -json > outputs.json
```

### Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Add Azure credentials from terraform outputs
# Edit .env with:
# - AZURE_STORAGE_ACCOUNT_NAME
# - AZURE_STORAGE_ACCOUNT_KEY
# - AZURE_COSMOS_ENDPOINT
# - AZURE_COSMOS_KEY

# Start backend
npm run dev
# Backend runs on http://localhost:3000
```

### Step 5: Access Frontend

```bash
# Option 1: Python server
cd frontend
python -m http.server 8000
# Open http://localhost:8000/video-upload.html

# Option 2: Node.js http-server
npx http-server terraform/frontend
# Open http://localhost:8080/video-upload.html

# Option 3: Direct file
# Open terraform/frontend/video-upload.html in browser
```

## 📊 Architecture

### Infrastructure Architecture

```
┌─────────────────────────────────────────────────┐
│         Azure Resource Group (Central India)    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────┐                      │
│  │  Storage Account     │                      │
│  │  - Standard Tier     │                      │
│  │  - LRS Replication   │                      │
│  │  ┌────────────────┐  │                      │
│  │  │ videos (private)  │                      │
│  │  │ Blob Container   │                      │
│  │  └────────────────┘  │                      │
│  └──────────────────────┘                      │
│                                                 │
│  ┌──────────────────────┐                      │
│  │  Cosmos DB (Core SQL)│                      │
│  │  ┌────────────────┐  │                      │
│  │  │   video-db     │  │                      │
│  │  │ ┌────────────┐ │  │                      │
│  │  │ │   videos   │ │  │                      │
│  │  │ │  Container │ │  │                      │
│  │  │ └────────────┘ │  │                      │
│  │  └────────────────┘  │                      │
│  └──────────────────────┘                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Application Flow

```
Frontend                Backend API           Azure Services
  │                        │                      │
  ├─ Select Video ─────────→                      │
  │                        │                      │
  │                    Get SAS Token              │
  │                        ├─────────────────────→
  │                        │ Generate SAS         │
  │←─────────── SAS URL ───┤                      │
  │                        │←─────────────────────┤
  │                        │                      │
  ├─ Upload to Blob ───────────────────────────→
  │  (via SAS URL)         │                  Upload
  │                        │                      │
  │                        │                 Stored
  │                        │                      │
  ├─ Store Metadata ──────→                      │
  │  (title, desc, etc)    ├─────────────────────→
  │                        │  Store in  Cosmos DB │
  │                        │                      │
  │←─ Success/VideoID ─────┤←─────────────────────┤
  │                        │                      │
```

### Data Flow

1. **SAS Token Generation**
   - User clicks upload
   - Frontend requests SAS token
   - Backend generates time-limited token
   - Token returned to frontend

2. **Video Upload**
   - Frontend uploads file to Blob Storage via SAS URL
   - Direct upload (doesn't pass through backend)
   - Reduces backend load

3. **Metadata Storage**
   - Frontend submits metadata to backend
   - Backend stores in Cosmos DB
   - Returns video ID for future reference

4. **Retrieval**
   - Frontend/Backend queries Cosmos DB
   - Retrieves video metadata using video ID
   - Lists videos by user ID

## 🔐 Security

### Authentication & Authorization

```hcl
# Provider authentication via Service Principal
provider "azurerm" {
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}
```

### Storage Security

```
✓ HTTPS only (min_tls_version = "TLS1_2")
✓ Private blob access (container_access_type = "private")
✓ SAS tokens with expiration
✓ Time-limited upload permissions
```

### API Security

```
✓ CORS enabled (configurable origins)
✓ Helmet middleware for security headers
✓ User ID validation
✓ Error handling without exposing internals
```

## 📈 Deployment Scenarios

### Development Setup
```bash
# Local development with Terraform and Node.js
terraform apply
npm run dev
# Frontend: Open HTML in browser
```

### Staging
```bash
# Infrastructure in Azure
terraform apply -var="environment=staging"

# Backend deployed to Azure App Service
az webapp up --name aigram-backend-staging

# Frontend on static hosting
az storage account create --name aigramfrontend
```

### Production
```bash
# Multiple regions with failover
terraform apply -var="environment=prod" -var="location=East US"

# Backend in App Service with autoscaling
# Frontend behind CDN
# SSL certificates
# Monitoring and logging
```

## 📊 Monitoring & Logging

### Backend Logs
```bash
# View real-time logs
npm run dev

# Application Insights (if configured)
az monitor app-insights show --resource-group aigram-video-upload-rg
```

### Blob Storage Monitoring
```bash
# Check storage metrics
az storage account show-connection-string --name <storage-account>

# List uploaded blobs
az storage blob list --container-name videos
```

### Cosmos DB Monitoring
```bash
# Check RU consumption
az cosmosdb show --name aigram-videodb --resource-group aigram-video-upload-rg

# View database metrics
# Portal: Cosmos DB → Metrics
```

## 🧪 Testing the System

### 1. Test Terraform Deployment
```bash
# Check plan
terraform plan -out=tfplan

# Show what will be created
terraform show tfplan

# Apply
terraform apply tfplan
```

### 2. Test Backend API
```bash
# Health check
curl http://localhost:3000/health

# Get API status
curl http://localhost:3000/api/status

# Generate SAS token
curl -X POST http://localhost:3000/api/upload/sas-token \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.mp4",
    "userId": "test-user"
  }'
```

### 3. Test Frontend Upload
1. Open http://localhost:8000/video-upload.html
2. Configure backend URL in Config tab
3. Test connection
4. Select a video file
5. Fill in metadata
6. Click Upload

## 🔧 Maintenance

### Updating Azure Resources

```bash
# List current resources
az resource list --resource-group aigram-video-upload-rg

# Update storage tier (scale-up)
terraform apply -var="storage_account_tier=Premium"

# Increase Cosmos DB throughput
terraform apply -var="cosmosdb_throughput=800"
```

### Monitoring & Alerts

```bash
# Set up alert for storage quota
az monitor metrics alert create \
  --resource-group aigram-video-upload-rg \
  --name "Storage Quota Alert"
```

### Cost Optimization

- **Storage**: Use LRS for cost savings (default)
- **Cosmos DB**: Start with 400 RU, scale as needed
- **Region**: Central India has lower costs
- **Cleanup**: `terraform destroy` to remove resources

## 📚 Resource References

### Terraform Documentation
- [Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest)
- [Storage Account](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/storage_account)
- [Cosmos DB](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/cosmosdb_account)

### Azure Services
- [Azure Storage](https://docs.microsoft.com/en-us/azure/storage/)
- [Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Shared Access Signatures (SAS)](https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview)

### Node.js Libraries
- [Azure Storage Blob SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [Azure Cosmos SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/cosmosdb)
- [Express.js](https://expressjs.com/)

## 🆘 Troubleshooting

### Terraform Issues

**Error: "Provider not initialized"**
```bash
rm -rf .terraform
terraform init
```

**Error: "Invalid credentials"**
```bash
# Re-authenticate
az logout
az login
```

### Backend Issues

**Error: "Cannot find module"**
```bash
npm install
npm install @azure/storage-blob @azure/cosmos
```

**Error: "Connection refused"**
- Check Azure credentials in .env
- Verify storage account exists
- Check network connectivity

### Frontend Issues

**Error: "Failed to get SAS token"**
- Verify backend is running
- Check API URL in Config tab
- Check CORS configuration in backend

**Error: "Upload fails"**
- Check file size (max 1GB default)
- Verify blob container is writable
- Check SAS token hasn't expired

## 📝 Documentation

- [Backend README](backend/README.md) - API endpoints, configuration, deployment
- [Frontend README](frontend/README.md) - UI features, customization, usage

## 📞 Support & Contributing

### Getting Help
1. Check individual README files
2. Review [troubleshooting](#-troubleshooting) section
3. Check Azure Portal for resource issues
4. Review backend logs

### Contributing
- Follow existing code style
- Add comments for complex logic
- Test all changes before committing
- Update documentation

## 📜 License

MIT License - See LICENSE file

## 🎯 Next Steps

1. **Deploy Infrastructure**
   ```bash
   terraform init && terraform apply
   ```

2. **Setup Backend**
   ```bash
   cd backend && npm install && npm start
   ```

3. **Access Frontend**
   ```bash
   # Open video-upload.html in browser
   ```

4. **Monitor**
   ```bash
   # Check Azure Portal for resource metrics
   ```

5. **Scale**
   - Increase Cosmos DB RU for high traffic
   - Add regions for geo-redundancy
   - Configure CDN for frontend

## 📚 Version History

### v1.0.0 (2024-03-23)
- Terraform infrastructure complete
- Node.js Express backend with SAS token support
- Modern HTML5 frontend with drag-and-drop
- Cosmos DB integration for metadata
- Production-ready code structure
- Comprehensive documentation

---

**Created**: March 23, 2024  
**Project**: Aigram Video Upload System  
**Platform**: Azure  
**Infrastructure Manager**: Terraform  
**Backend**: Node.js Express  
**Frontend**: HTML5 + JavaScript
