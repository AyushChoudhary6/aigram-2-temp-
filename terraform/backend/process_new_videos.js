require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const urls = [
  "https://youtu.be/w0H1-b044KY?si=BCVHCsButyuKocgd",
  "https://youtu.be/lS8TmrfGAnE?si=U7IV-bH_fTHtp3Ro",
  "https://youtu.be/LGqaSsSLz68?si=jiYVddnfcBNzkfw6",
  "https://youtu.be/wlpBCazAY9Q?si=YSumRIj6sXewYhnE",
  "https://youtu.be/R8h_gpSpEVU?si=rOSe-crkIvxx0n_j",
  "https://youtu.be/CcrC5zSv1iA?si=PYP8W_gLITzmZc02"
];

async function run() {
  const region = process.env.AWS_REGION || "ap-south-1";
  const bucketName = process.env.AWS_S3_BUCKET;
  const tableName = process.env.AWS_DYNAMODB_TABLE;

  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };

  const s3Client = new S3Client({ region, credentials });
  const ddbClient = new DynamoDBClient({ region, credentials });
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  const frontendVideoObjects = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const uniqueId = Date.now();
    console.log(`\n=========================================`);
    console.log(`Processing ${i+1}/${urls.length}: ${url}`);

    try {
      console.log('Fetching metadata with yt-dlp...');
      const metadataJson = execSync(`yt-dlp --dump-json "${url}"`).toString();
      const metadata = JSON.parse(metadataJson);
      
      const title = metadata.title;
      const description = (metadata.description || '').substring(0, 300);
      const duration = metadata.duration;
      const thumbnail = metadata.thumbnail;
      
      console.log(`Downloading video: ${title}`);
      const tempFile = path.resolve(__dirname, `v_${uniqueId}_${i}.mp4`);
      
      execSync(`yt-dlp -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" -o "${tempFile}" "${url}"`, {stdio: 'inherit'});

      console.log('Waiting for file release...');
      await new Promise(r => setTimeout(r, 2000));

      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const videoId = uuidv4();
      const s3Key = `practice/${uniqueId}_${videoId}_${safeTitle}.mp4`;
      
      console.log(`Uploading to AWS S3: ${s3Key}`);
      const fileStream = fs.createReadStream(tempFile);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: "video/mp4"
      }));

      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
      console.log(`S3 URL: ${s3Url}`);
      
      console.log(`Saving metadata to DynamoDB...`);
      const dbMetadata = {
        id: videoId,
        videoId: videoId,
        userId: 'system-practice',
        originalName: `${safeTitle}.mp4`,
        s3Url: s3Url,
        uploadedAt: new Date().toISOString(),
        s3Key: s3Key,
        title: title,
        description: description,
        duration: duration,
        thumbnail: thumbnail,
        tags: ['practice', 'arena'],
        status: 'uploaded'
      };

      await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: dbMetadata
      }));

      frontendVideoObjects.push({
        id: 11 + i,
        level_number: 11 + i,
        title: title,
        description: description,
        goal: "Watch the video entirely and try to replicate the prompt.",
        hint: "Focus on the key subjects mentioned in the video.",
        proof_type: ["video", "screenshot"],
        xp_reward: (11 + i) * 50,
        skill_category: "AI Concepts",
        video_url: s3Url,
        thumbnail_url: thumbnail,
        difficulty: i < 2 ? "EASY" : (i < 4 ? "MEDIUM" : "HARD"),
        tags: ["AI", "Practice"]
      });

      console.log(`Cleanup...`);
      try { fs.unlinkSync(tempFile); } catch(e) { console.log('Could not delete temp file, skipping.'); }
      console.log(`✅ Success: ${title}`);
    } catch (err) {
      console.error(`❌ Error processing ${url}:`, err.message);
    }
  }

  if (frontendVideoObjects.length > 0) {
    fs.writeFileSync('frontend_videos.json', JSON.stringify(frontendVideoObjects, null, 2));
    console.log(`\nAll done! ${frontendVideoObjects.length} videos processed.`);
  }
}

run().catch(console.error);
