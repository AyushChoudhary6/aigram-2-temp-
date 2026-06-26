/**
 * Azure Service Configuration
 * Initializes Azure Blob Storage and Cosmos DB clients
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');

let blobServiceClient = null;
let cosmosDbClient = null;

/**
 * Initialize Blob Storage Client
 */
const initBlobClient = () => {
  if (!blobServiceClient) {
    const { StorageSharedKeyCredential } = require('@azure/storage-blob');
    
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    if (!accountName || !accountKey) {
      throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME or AZURE_STORAGE_ACCOUNT_KEY environment variables');
    }
    
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
    
    blobServiceClient = new (require('@azure/storage-blob').BlobServiceClient)(blobServiceUrl, sharedKeyCredential);
    console.log('✓ Blob Storage Client initialized');
  }
  return blobServiceClient;
};

/**
 * Get Blob Container Client
 */
const getBlobContainerClient = () => {
  const client = initBlobClient();
  return client.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);
};

/**
 * Get Blob Service Client
 */
const getBlobClient = () => {
  return initBlobClient();
};

/**
 * Initialize Cosmos DB Client
 */
const initCosmosClient = () => {
  if (!cosmosDbClient) {
    cosmosDbClient = new CosmosClient({
      endpoint: process.env.AZURE_COSMOS_ENDPOINT,
      key: process.env.AZURE_COSMOS_KEY,
      consistencyLevel: 'Session'
    });
    console.log('✓ Cosmos DB Client initialized');
  }
  return cosmosDbClient;
};

/**
 * Get Cosmos DB Client
 */
const getCosmosClient = () => {
  return initCosmosClient();
};

/**
 * Test Azure Connections
 */
const testConnections = async () => {
  try {
    // Test Blob Storage
    console.log('\nTesting Azure Blob Storage...');
    try {
      const containerClient = getBlobContainerClient();
      const properties = await containerClient.getProperties();
      console.log('✓ Blob Storage connected successfully');
      console.log(`  Container: ${process.env.AZURE_BLOB_CONTAINER_NAME}`);
      console.log(`  Access Type: ${properties.publicAccess || 'Private'}`);
    } catch (error) {
      console.error('✗ Blob Storage connection failed:', error.message);
    }

    // Test Cosmos DB
    console.log('\nTesting Azure Cosmos DB...');
    try {
      const client = getCosmosClient();
      const { database } = await client.databases.readAll().fetchNext();
      console.log('✓ Cosmos DB connected successfully');
      console.log(`  Database: ${process.env.AZURE_COSMOS_DATABASE}`);
      console.log(`  Endpoint: ${process.env.AZURE_COSMOS_ENDPOINT}`);
    } catch (error) {
      console.error('✗ Cosmos DB connection failed:', error.message);
    }
  } catch (error) {
    console.error('Error testing connections:', error);
  }
};

// Validate required environment variables
const validateEnvironment = () => {
  const required = [
    'AZURE_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_KEY',
    'AZURE_BLOB_CONTAINER_NAME',
    'AZURE_COSMOS_ENDPOINT',
    'AZURE_COSMOS_KEY',
    'AZURE_COSMOS_DATABASE',
    'AZURE_COSMOS_CONTAINER'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n✗ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nPlease configure these variables in .env file');
    return false;
  }

  console.log('✓ All required environment variables configured');
  return true;
};

module.exports = {
  initBlobClient,
  initCosmosClient,
  getBlobClient,
  getBlobContainerClient,
  getCosmosClient,
  testConnections,
  validateEnvironment
};
