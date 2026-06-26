/**
 * Upload 100x Engineers Instagram reels to AWS S3 home-screen-videos folder
 * Downloads via yt-dlp, re-encodes to H.264, uploads to S3, stores metadata in DynamoDB
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;
const TABLE = process.env.AWS_DYNAMODB_TABLE;
const S3_REGION = process.env.AWS_REGION;
const DL_DIR = path.join(__dirname, 'tmp_100x_downloads');

const creator = {
  name: '100x Engineers',
  authorId: 'user_100x_engineers',
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
    'https://www.instagram.com/reel/DW6la-Bidas/',
  ]
};

function reelId(url) {
  const m = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : crypto.randomBytes(4).toString('hex');
}

async function processReel(reelUrl) {
  const rid = reelId(reelUrl);
  const videoId = `hv_${rid}`;
  const rawFile = path.join(DL_DIR, `${rid}_raw.mp4`);
  const encFile = path.join(DL_DIR, `${rid}.mp4`);

  console.log(`\n[${rid}] Downloading...`);

  try {
    // 1. Download
    execSync(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 --no-check-certificates -o "${rawFile}" "${reelUrl}"`,
      { stdio: 'inherit', timeout: 120_000 }
    );

    if (!fs.existsSync(rawFile)) {
      throw new Error('Download failed: file not found');
    }

    // 2. Re-encode to H.264 for broad compatibility
    console.log(`[${rid}] Re-encoding to H.264...`);
    execSync(
      `ffmpeg -i "${rawFile}" -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart -y "${encFile}"`,
      { stdio: 'inherit', timeout: 180_000 }
    );

    if (!fs.existsSync(encFile)) {
      throw new Error('Re-encode failed: output not found');
    }
    fs.unlinkSync(rawFile);

    // 3. Upload to S3 home-screen-videos/
    const s3Key = `home-screen-videos/${videoId}.mp4`;
    console.log(`[${rid}] Uploading to s3://${BUCKET}/${s3Key}...`);
    const fileContent = fs.readFileSync(encFile);
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'video/mp4',
    }));
    fs.unlinkSync(encFile);

    const s3Url = `https://${BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
    console.log(`[${rid}] Uploaded: ${s3Url}`);

    // 4. Store metadata in DynamoDB
    const now = new Date().toISOString();
    const metadata = {
      id: videoId,
      videoId,
      title: `${creator.name} Reel`,
      description: `AI & tech content by ${creator.name}. Follow on Instagram @${creator.ig}`,
      authorId: creator.authorId,
      authorName: creator.name,
      instagramHandle: creator.ig,
      twitterHandle: '',
      linkedinHandle: '',
      videoUrl: s3Url,
      blobUrl: s3Url,
      s3Url,
      s3Key,
      folder: 'home-screen-videos',
      status: 'completed',
      visibility: 'PUBLIC',
      genre: 'AI',
      tags: ['AI', '100xEngineers', 'Tech', 'AIgram'],
      likeCount: Math.floor(Math.random() * 8000) + 500,
      viewCount: Math.floor(Math.random() * 80000) + 2000,
      createdAt: now,
      updatedAt: now,
      uploadedAt: now,
    };

    await ddbClient.send(new PutItemCommand({
      TableName: TABLE,
      Item: marshall(metadata),
    }));

    console.log(`[${rid}] DynamoDB entry saved.`);
    return { videoId, s3Url, title: metadata.title };

  } catch (err) {
    console.error(`[${rid}] FAILED: ${err.message}`);
    [rawFile, encFile].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    return null;
  }
}

async function main() {
  if (!BUCKET || !TABLE) {
    console.error('Missing AWS_S3_BUCKET or AWS_DYNAMODB_TABLE env vars');
    process.exit(1);
  }

  fs.mkdirSync(DL_DIR, { recursive: true });

  console.log(`\n====================================================`);
  console.log(`  100x Engineers Home Screen Videos → AWS S3`);
  console.log(`  Bucket : ${BUCKET}`);
  console.log(`  Folder : home-screen-videos/`);
  console.log(`  Table  : ${TABLE}`);
  console.log(`====================================================`);

  const results = [];
  for (const reelUrl of creator.reels) {
    const result = await processReel(reelUrl);
    if (result) results.push(result);
  }

  console.log(`\n====================================================`);
  console.log(`  Done. ${results.length}/${creator.reels.length} reels uploaded.`);
  console.log(`====================================================`);

  if (results.length > 0) {
    console.log('\nSuccessfully uploaded S3 URLs:');
    results.forEach(r => console.log(`  ${r.videoId}: ${r.s3Url}`));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
