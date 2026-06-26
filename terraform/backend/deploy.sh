#!/bin/bash
# Aigram Backend Deployment Script for AWS (Bash)
IP="13.233.118.132"
KEY="../aws/aigram-aws.pem"
USER="ec2-user"

echo "🚀 Starting deployment to $IP..."

# Ensure key permissions
chmod 400 $KEY

echo "📦 Creating archive..."
zip -r backend.zip . -x "node_modules/*" ".git/*" "temp/*" "uploads/*"

echo "📤 Uploading to server..."
scp -i $KEY backend.zip "$USER@$IP:/home/ec2-user/"

echo "🛠️ Setting up on server..."
ssh -i $KEY "$USER@$IP" << 'EOF'
    cd /home/ec2-user
    mkdir -p app
    unzip -o backend.zip -d app/
    cd app
    npm install
    pm2 delete aigram-backend 2>/dev/null || true
    pm2 start server.js --name aigram-backend
    pm2 save
    echo "✅ Deployment successful!"
EOF

rm backend.zip
echo "✨ All done!"
