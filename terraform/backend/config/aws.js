const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config();

const region = process.env.AWS_REGION || "ap-south-1";

const hasStaticCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const baseClientConfig = hasStaticCredentials
  ? {
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }
  : { region };

let s3Client = null;
let ddbDocClient = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client(baseClientConfig);
    console.log('✓ AWS S3 Client initialized');
  }
  return s3Client;
};

const getDDBDocClient = () => {
  if (!ddbDocClient) {
    const client = new DynamoDBClient(baseClientConfig);
    ddbDocClient = DynamoDBDocumentClient.from(client);
    console.log('✓ AWS DynamoDB Client initialized');
  }
  return ddbDocClient;
};

const validateEnvironment = () => {
  const required = [
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'AWS_DYNAMODB_TABLE'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n✗ Missing required AWS environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    return false;
  }

  console.log('✓ All required AWS environment variables configured');
  return true;
};

module.exports = {
  getS3Client,
  getDDBDocClient,
  validateEnvironment,
  S3_BUCKET: process.env.AWS_S3_BUCKET,
  DYNAMODB_TABLE: process.env.AWS_DYNAMODB_TABLE,
};
