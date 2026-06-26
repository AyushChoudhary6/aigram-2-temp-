require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');

async function uploadVideos() {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_BLOB_CONTAINER_NAME;
  
  const cosmosEndpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const cosmosKey = process.env.AZURE_COSMOS_KEY;
  const databaseId = process.env.AZURE_COSMOS_DATABASE;
  const containerId = process.env.AZURE_COSMOS_CONTAINER;

  console.log('Connecting to Azure Blob and Cosmos...');
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
  const database = cosmosClient.database(databaseId);
  const cosmosContainer = database.container(containerId);

  const videosDir = path.join(__dirname, '../../videos');
  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4'));

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(videosDir, fileName);
    
    // Exact folder name we filter by on the frontend
    const folder = 'practice arena videos';
    const videoId = uuidv4();
    const blobName = `${folder}/${Date.now()}_${videoId}_${fileName}`;
    
    console.log(`\n[${i+1}/${files.length}] Uploading ${fileName} to ${blobName}...`);
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: 'video/mp4' }
    });

    const blobUrl = blockBlobClient.url;
    
    console.log(`Saving metadata for ${fileName} to Cosmos DB...`);
    const metadata = {
      id: videoId,
      videoId: videoId,
      userId: 'system-practice',
      originalName: fileName,
      blobUrl: blobUrl,
      uploadedAt: new Date().toISOString(),
      blobName: blobName,
      title: `Practice Video ${i+1}`,
      description: 'Official practice arena video',
      duration: 0,
      thumbnail: null,
      tags: ['practice', 'arena'],
      status: 'uploaded'
    };

    await cosmosContainer.items.create(metadata);
    console.log(`✅ Success for ${fileName}`);
  }
}

uploadVideos().then(() => {
  console.log('\nAll videos uploaded successfully!');
  process.exit(0);
}).catch(err => {
  console.error('\nError during upload:', err);
  process.exit(1);
});
