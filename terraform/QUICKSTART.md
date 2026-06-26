# Quick Setup Guide - Aigram Azure Video Upload

Get up and running in 5 minutes!

## Prerequisites

- Azure Account with active subscription
- Terraform CLI (version >= 1.0)
- Node.js (version >= 16)
- npm or yarn

## 5-Minute Setup

### 1️⃣ Azure Authentication (2 min)

```bash
# Login to Azure
az login

# Verify you're logged in
az account show
```

### 2️⃣ Terraform Deployment (2 min)

```bash
cd terraform

# Setup variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your Azure credentials
# nano terraform.tfvars

# Deploy infrastructure
terraform init
terraform plan
terraform apply

# Save outputs
terraform output -json > outputs.json
```

### 3️⃣ Backend Setup (1 min)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Add credentials from terraform outputs to .env
# AZURE_STORAGE_ACCOUNT_NAME=...
# AZURE_COSMOS_ENDPOINT=...
# AZURE_COSMOS_KEY=...

# Start server
npm start
# Runs on http://localhost:3000
```

### 4️⃣ Open Frontend

```bash
# Option 1: Python server
cd frontend
python -m http.server 8000
# Open http://localhost:8000/video-upload.html

# Option 2: Directly open HTML
# Open terraform/frontend/video-upload.html in your browser
```

## Testing It Works

### Test Backend
```bash
# In Browser or Terminal
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Test Frontend Upload
1. Go to http://localhost:8000/video-upload.html
2. Click on Config tab
3. Click "Test Connection"
4. Should see: "✓ Connected to aigram-video-upload-backend"
5. Select a video file
6. Fill in metadata
7. Click "Upload Video"

## Key Files Overview

| File/Folder | Purpose |
|-------------|---------|
| `provider.tf` | Azure provider config |
| `variables.tf` | All configuration variables |
| `main.tf` | Resources (Storage, Cosmos DB) |
| `outputs.tf` | Output values for setup |
| `backend/server.js` | Express backend |
| `backend/routes/upload.js` | API endpoints |
| `frontend/video-upload.html` | Web interface |

## Common Commands

```bash
# Terraform
terraform plan          # Preview changes
terraform apply         # Deploy
terraform destroy       # Cleanup (⚠️ WARNING: Deletes resources)
terraform output        # Show outputs
terraform show          # Show current state

# Backend
npm start              # Run production
npm run dev            # Run development with nodemon
npm test               # Run tests (if available)

# Azure CLI
az resource list --resource-group aigram-video-upload-rg
az storage blob list --account-name <storage-account> --container-name videos
```

## Environment Variables Summary

### Backend (.env)
```
PORT=3000
AZURE_STORAGE_ACCOUNT_NAME=your_account
AZURE_STORAGE_ACCOUNT_KEY=your_key
AZURE_BLOB_CONTAINER_NAME=videos
AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your_key
AZURE_COSMOS_DATABASE=video-db
AZURE_COSMOS_CONTAINER=videos
```

### Terraform (terraform.tfvars)
```
subscription_id = "your-subscription-id"
client_id       = "your-client-id"
client_secret   = "your-client-secret"
tenant_id       = "your-tenant-id"
location        = "Central India"
```

## Where to Find Credentials

### Azure Subscription ID
```bash
az account show --query id -o tsv
```

### Service Principal (for terraform.tfvars)
```bash
# Create new service principal
az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/<subscription-id>"

# Copy the values:
# - appId → client_id
# - password → client_secret
# - tenant → tenant_id
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| "Provider not initialized" | Run `terraform init` |
| "Authentication failed" | Run `az login` again |
| "Module not found" | Run `npm install` in backend folder |
| "Connection refused" | Make sure backend is running with `npm start` |
| "CORS error" | Check backend CORS_ORIGIN in .env |
| "File too large" | Adjust MAX_VIDEO_SIZE_MB in backend .env |

## Next Steps

### For Development
1. Explore API endpoints in frontend "API" tab
2. Check backend logs while uploading
3. View uploaded files in Azure Portal

### For Production
1. Set up Azure App Service for backend
2. Configure CDN for frontend
3. Enable logging and monitoring
4. Set up automatic backups
5. Configure custom domain

### To Explore More
- [Backend README](backend/README.md) - Full API documentation
- [Frontend README](frontend/README.md) - UI customization guide
- [Terraform README](README.md) - Infrastructure deep dive

## Security Reminders

⚠️ **Important**
- Never commit `.env` files
- Never share `terraform.tfvars`
- Rotate credentials regularly
- Use strong passwords for Azure
- Enable MFA on Azure account
- Review storage access logs regularly

## Getting Help

### Check Logs
```bash
# Backend logs
npm run dev  # Shows all requests

# Azure Portal
# Search resource group → resource → Logs
```

### Verify Setup
1. Backend health: `curl http://localhost:3000/health`
2. Blob storage: Check Azure Portal → Storage Account → Containers
3. Cosmos DB: Check Azure Portal → Cosmos DB → Data Explorer

## Cost Estimation

### Monthly Azure Costs (Approximate)
- Storage Account: $1-5
- Cosmos DB: $25+ (depending on RU usage)
- Data transfer: Depends on traffic

**Start**: Free tier eligibility includes:
- 5GB blob storage
- 400 RU Cosmos DB free tier

## Support

1. Check README files in each folder
2. Review backend logs: `npm run dev`
3. Check Azure Portal for resource health
4. Visit [Azure Documentation](https://docs.microsoft.com/azure/)

---

**Ready to upload?** 🚀

Open http://localhost:8000/video-upload.html and start uploading!
