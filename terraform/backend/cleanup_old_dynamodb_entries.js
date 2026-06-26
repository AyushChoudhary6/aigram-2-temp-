/**
 * Cleanup script: Removes old UUID-based DynamoDB entries from home-screen-videos folder.
 * Keeps only the `hv_` prefixed entries uploaded by the 100x Engineers upload script.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE = process.env.AWS_DYNAMODB_TABLE || "aigram-videos-metadata";

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const ddb = DynamoDBDocumentClient.from(client);

async function cleanup() {
  console.log(`Scanning DynamoDB table: ${TABLE} for folder=home-screen-videos...`);

  const { Items } = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "folder = :f",
    ExpressionAttributeValues: { ":f": "home-screen-videos" }
  }));

  if (!Items || Items.length === 0) {
    console.log('No items found.');
    return;
  }

  console.log(`Found ${Items.length} total items in home-screen-videos.`);

  // Keep only hv_ prefixed entries (using the actual `id` primary key)
  const toDelete = Items.filter(item => {
    const id = item.id || item.videoId;
    return !id || !id.startsWith('hv_');
  });

  const toKeep = Items.filter(item => {
    const id = item.id || item.videoId;
    return id && id.startsWith('hv_');
  });

  console.log(`\nKeeping ${toKeep.length} hv_ entries:`);
  toKeep.forEach(item => console.log(`  ✓ ${item.id || item.videoId} — ${item.authorName}`));

  console.log(`\nDeleting ${toDelete.length} old UUID entries:`);
  toDelete.forEach(item => console.log(`  ✗ ${item.id || item.videoId} — ${item.authorName}`));

  if (toDelete.length === 0) {
    console.log('\nNothing to delete. Already clean!');
    return;
  }

  console.log('\nProceeding with deletion...');
  let deleted = 0;
  for (const item of toDelete) {
    const primaryKey = item.id; // DynamoDB table hash key is `id`
    try {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { id: primaryKey }
      }));
      console.log(`  Deleted: ${primaryKey}`);
      deleted++;
    } catch (err) {
      console.error(`  Failed to delete ${primaryKey}: ${err.message}`);
    }
  }

  console.log(`\nDone! Deleted ${deleted}/${toDelete.length} old entries.`);
  console.log(`${toKeep.length} clean hv_ entries remain in home-screen-videos.`);
}

cleanup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
