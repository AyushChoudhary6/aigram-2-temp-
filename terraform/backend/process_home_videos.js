
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const BUCKET = process.env.AWS_S3_BUCKET;
const TABLE = process.env.AWS_DYNAMODB_TABLE;

const creators = [
  {
    name: '100x Engineers',
    ig: '100xengineers',
    reels: [
      'https://www.instagram.com/reel/DRemomjiXQ6/',
      'https://www.instagram.com/reel/DXJ3sfBCexN/',
      'https://www.instagram.com/reel/DXHks47CWof/',
      'https://www.instagram.com/reel/DXHTSAjiVKg/',
      'https://www.instagram.com/reel/DXExW6hiSs4/',
      'https://www.instagram.com/reel/DXCaHkbiX7E/',
      'https://www.instagram.com/reel/DXCLTvQidjm/',
      'https://www.instagram.com/reel/DW_rCHPie1a/',
      'https://www.instagram.com/reel/DW9JJPwiT11/',
      'https://www.instagram.com/reel/DW88nhjCREC/',
      'https://www.instagram.com/reel/DW6la-Bidas/'
    ]
  },
  {
    name: 'Vaibhav Sisinty',
    ig: 'vaibhavsisinty',
    x: 'vaibhavsisinty',
    reels: [
      'https://www.instagram.com/reel/DIEc5iVJLKX/',
      'https://www.instagram.com/reel/DXHRSyFgY46/',
      'https://www.instagram.com/reel/DXE7d-_goU3/',
      'https://www.instagram.com/reel/DXCDTAcAv9e/',
      'https://www.instagram.com/reel/DW_kzJYABlZ/',
      'https://www.instagram.com/reel/DW-2PXBgGCC/',
      'https://www.instagram.com/reel/DW85mwUg_Mf/',
      'https://www.instagram.com/reel/DW6qDr6A9GE/',
      'https://www.instagram.com/reel/DW4JAcLgUub/',
      'https://www.instagram.com/reel/DW3wKReAU77/',
      'https://www.instagram.com/reel/DW1UiShMjWZ/'
    ]
  },
  {
    name: 'Varun Mayya',
    ig: 'thevarunmayya',
    x: 'waitin4agi_',
    reels: [
      'https://www.instagram.com/reel/DXKI64qAclw/',
      'https://www.instagram.com/reel/DXEvpmwiP0O/',
      'https://www.instagram.com/reel/DW_2TufAS89/',
      'https://www.instagram.com/reel/DW9FQVKASgg/',
      'https://www.instagram.com/reel/DW6r3T9gYrM/'
    ]
  },
  {
    name: 'Builder Central',
    ig: 'builders.central',
    reels: [
      'https://www.instagram.com/reel/DXJLpL8kw9V/',
      'https://www.instagram.com/reel/DXHudNTE7Ro/',
      'https://www.instagram.com/reel/DXFPuftE64e/',
      'https://www.instagram.com/reel/DXEXzmUk2vV/',
      'https://www.instagram.com/reel/DW9gJ6fATSp/',
      'https://www.instagram.com/reel/DW4HcTAk2c1/',
      'https://www.instagram.com/reel/DWzB3ofk-Bi/',
      'https://www.instagram.com/reel/DWx8qBGk1Dt/'
    ]
  },
  {
    name: 'Ai Ankit Arora',
    ig: 'ai_ankitarora',
    x: 'aiankitarora',
    reels: [
      'https://www.instagram.com/reel/DXI-E02EiNy/',
      'https://www.instagram.com/reel/DW8GX4qCE75/'
    ]
  }
];

async function processVideo(url, creator) {
  const videoId = crypto.randomUUID();
  const tempFile = path.join(__dirname, `temp_${videoId}.mp4`);
  
  console.log(`\n--- Processing: ${url} ---`);
  
  try {
    // 1. Download using yt-dlp
    console.log(`Downloading ${url}...`);
    execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --output "${tempFile}" "${url}"`, { stdio: 'inherit' });
    
    if (!fs.existsSync(tempFile)) {
      throw new Error('Download failed: File not found');
    }

    const stats = fs.statSync(tempFile);
    console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    // 2. Upload to S3
    const s3Key = `home-screen-videos/${videoId}.mp4`;
    console.log(`Uploading to S3: s3://${BUCKET}/${s3Key}...`);
    const fileContent = fs.readFileSync(tempFile);
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'video/mp4'
    }));

    // 3. Store Metadata in DynamoDB
    const blobUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    console.log(`Updating DynamoDB: ${TABLE}...`);
    
    const metadata = {
      id: videoId,
      videoId,
      title: `${creator.name} Reel`,
      description: `Exploring AI with ${creator.name}. Check out the full reel on Instagram.`,
      authorName: creator.name,
      instagramHandle: creator.ig,
      twitterHandle: creator.x || '',
      videoUrl: blobUrl,
      blobUrl: blobUrl,
      folder: 'home-screen-videos',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: Math.floor(Math.random() * 5000) + 100,
      viewCount: Math.floor(Math.random() * 50000) + 1000,
      tags: ['AI', creator.name.replace(/\s+/g, ''), 'Reel']
    };

    await ddbClient.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall(metadata)
    }));

    console.log(`Successfully processed: ${videoId}`);
    
    // Cleanup
    fs.unlinkSync(tempFile);
    
  } catch (error) {
    console.error(`Error processing ${url}:`, error.message);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

async function main() {
  console.log(`Starting Home Screen Video Migration to AWS S3...`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Table: ${TABLE}`);

  for (const creator of creators) {
    console.log(`\n=========================================`);
    console.log(`Creator: ${creator.name}`);
    console.log(`=========================================`);
    for (const reel of creator.reels) {
      await processVideo(reel, creator);
    }
  }
  
  console.log(`\nMigration Complete!`);
}

main().catch(console.error);
