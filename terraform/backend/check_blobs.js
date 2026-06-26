require('dotenv').config();
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

async function check() {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = 'videos';
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`, sharedKeyCredential);
  
  const containerClient = blobServiceClient.getContainerClient(containerName);
  console.log("Container exists:", await containerClient.exists());
  
  let count = 0;
  for await (const blob of containerClient.listBlobsFlat({ prefix: 'practice/' })) {
    if (count < 5) console.log(blob.name);
    count++;
  }
  console.log("Total practice blobs:", count);
}
check().catch(console.error);
