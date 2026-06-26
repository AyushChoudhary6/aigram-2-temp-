# Aigram AWS Deployment Script (PowerShell)
$IP = "15.206.35.25"
$KEY_PATH = "d:\projects\Aigram\frontend-aigram-integratred\frontend-aigram-beIntegrated\terraform\aws\aigram-aws-v2.pem"

Write-Host "Starting deployment to $IP..." -ForegroundColor Cyan

# Check if key exists
if (!(Test-Path $KEY_PATH)) {
    Write-Host "Error: Key not found at $KEY_PATH" -ForegroundColor Red
    exit 1
}

# Fix permissions for the key (Windows OpenSSH requirement)
Write-Host "Ensuring key permissions are correct..." -ForegroundColor Cyan
icacls $KEY_PATH /inheritance:r
icacls $KEY_PATH /grant:r "$($env:USERDOMAIN)\$($env:USERNAME):R"

Write-Host "Packaging source code..." -ForegroundColor Cyan
$tempDir = "temp_deploy"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null
Get-ChildItem -Path . -Exclude node_modules, .git, temp, uploads, *.zip, deploy.ps1, deploy.sh, temp_deploy, .env | Copy-Item -Destination $tempDir -Recurse
if (Test-Path "aigram-backend.zip") { Remove-Item "aigram-backend.zip" }
Compress-Archive -Path "$tempDir\*" -DestinationPath aigram-backend.zip -Force
Remove-Item -Recurse -Force $tempDir

Write-Host "Uploading to server..." -ForegroundColor Cyan
scp -i $KEY_PATH -o StrictHostKeyChecking=no aigram-backend.zip ec2-user@$IP`:/home/ec2-user/

Write-Host "Setting up on server..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$IP "
    sudo dnf install -y unzip &&
    mkdir -p app && 
    unzip -o /home/ec2-user/aigram-backend.zip -d /home/ec2-user/app && 
    cd /home/ec2-user/app && 
    npm install && 
    pm2 stop all || true &&
    pm2 start server.js --name aigram-backend &&
    pm2 save
"

Write-Host "Writing backend .env on server..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$IP "
cat > /home/ec2-user/app/.env <<'EOF'
PORT=3000
NODE_ENV=production
AWS_REGION=ap-south-1
AWS_S3_BUCKET=aigram-practice-videos-027748318601
AWS_DYNAMODB_TABLE=aigram-videos
CORS_ORIGIN=*
EOF
pm2 restart aigram-backend
"

Write-Host "All done! Backend is live at http://$IP:3000" -ForegroundColor Green
Write-Host "Check health at http://$IP:3000/api/status" -ForegroundColor Cyan
