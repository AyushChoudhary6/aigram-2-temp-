/**
 * Upload new creator reels to AWS S3
 * ───────────────────────────────────
 * 1. Downloads each reel via yt-dlp
 * 2. Re-encodes to H.264 via ffmpeg
 * 3. Uploads to S3 at doom-scrolling/hv_<shortcode>.mp4
 *    (matching the videoId / streamUrl already set in dummyShorts.ts)
 *
 * Prerequisites:
 *   - yt-dlp installed and on PATH
 *   - ffmpeg installed and on PATH
 *   - AWS credentials in terraform/backend/.env  (or process env)
 *
 * Usage:
 *   node upload_new_creators_to_s3.js
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'terraform', 'backend', '.env') });

// ── Config ────────────────────────────────────────────────────────────
const REGION  = process.env.AWS_REGION     || 'ap-south-1';
const BUCKET  = process.env.AWS_S3_BUCKET  || 'aigram-practice-videos-2026';
const DL_DIR  = path.join(__dirname, 'assets', 'instagram-downloads', 's3-new-creators');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ── Creator reel list ─────────────────────────────────────────────────
const creators = [
  {
    name: 'Ishan Sharma',
    reels: [
      'https://www.instagram.com/reel/DXJ7KcGicXZ/',
      'https://www.instagram.com/reel/DW9HXjeiWaM/',
      'https://www.instagram.com/reel/DW6K2pnCZWV/',
      'https://www.instagram.com/reel/DW3vdmJCA2w/',
      'https://www.instagram.com/reel/DWy5bgOiMOz/',
      'https://www.instagram.com/reel/DWrPeqziUM3/',
    ],
  },
  {
    name: 'Vaibhav Sisinty',
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
      'https://www.instagram.com/reel/DW1UiShMjWZ/',
    ],
  },
  {
    name: 'Varun Mayya',
    reels: [
      'https://www.instagram.com/reel/DXKI64qAclw/',
      'https://www.instagram.com/reel/DXEvpmwiP0O/',
      'https://www.instagram.com/reel/DW_2TufAS89/',
      'https://www.instagram.com/reel/DW9FQVKASgg/',
      'https://www.instagram.com/reel/DW6r3T9gYrM/',
    ],
  },
  {
    name: 'Builders Central',
    reels: [
      'https://www.instagram.com/reel/DXJLpL8kw9V/',
      'https://www.instagram.com/reel/DXHudNTE7Ro/',
      'https://www.instagram.com/reel/DXFPuftE64e/',
      'https://www.instagram.com/reel/DXEXzmUk2vV/',
      'https://www.instagram.com/reel/DW9gJ6fATSp/',
      'https://www.instagram.com/reel/DW4HcTAk2c1/',
      'https://www.instagram.com/reel/DWzB3ofk-Bi/',
      'https://www.instagram.com/reel/DWx8qBGk1Dt/',
    ],
  },
  {
    name: 'Ai Ankit Arora',
    reels: [
      'https://www.instagram.com/reel/DXI-E02EiNy/',
      'https://www.instagram.com/reel/DW8GX4qCE75/',
    ],
  },
  {
    name: '100x',
    reels: [
      'https://www.instagram.com/reel/DXEwwHKS5i0/',
      'https://www.instagram.com/reel/DXCH6Uzyf-r/',
      'https://www.instagram.com/reel/DW_n-Sny3n5/',
      'https://www.instagram.com/reel/DW9Gf2ZShD_/',
      'https://www.instagram.com/reel/DW6p9EryP0p/',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────
function shortcode(url) {
  const m = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function download(url, outPath) {
  try {
    execSync(`yt-dlp -o "${outPath}" --no-check-certificates "${url}"`, {
      stdio: 'pipe',
      timeout: 120_000,
    });
    return true;
  } catch (e) {
    console.error(`  ✗ Download failed: ${e.message.slice(0, 200)}`);
    return false;
  }
}

function reencodeH264(inPath, outPath) {
  try {
    execSync(
      `ffmpeg -i "${inPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart -y "${outPath}"`,
      { stdio: 'pipe', timeout: 180_000 }
    );
    return true;
  } catch (e) {
    console.error(`  ✗ Re-encode failed: ${e.message.slice(0, 200)}`);
    return false;
  }
}

async function existsInS3(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToS3(filePath, key) {
  const body = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: 'video/mp4',
  }));
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('✗ AWS credentials not found. Add them to terraform/backend/.env');
    process.exit(1);
  }

  fs.mkdirSync(DL_DIR, { recursive: true });

  let total = 0;
  for (const c of creators) total += c.reels.length;
  let idx = 0;
  const skipped = [];
  const uploaded = [];
  const failed = [];

  for (const creator of creators) {
    console.log(`\n══ ${creator.name} (${creator.reels.length} reels) ══`);

    for (const url of creator.reels) {
      idx++;
      const sc = shortcode(url);
      if (!sc) { console.error(`  ✗ Cannot parse shortcode from ${url}`); failed.push(url); continue; }

      const s3Key  = `doom-scrolling/hv_${sc}.mp4`;
      const rawPath  = path.join(DL_DIR, `${sc}_raw.mp4`);
      const h264Path = path.join(DL_DIR, `${sc}_h264.mp4`);

      console.log(`[${idx}/${total}] hv_${sc}`);

      // Skip if already in S3
      if (await existsInS3(s3Key)) {
        console.log(`  ✓ Already in S3, skipping`);
        skipped.push(s3Key);
        continue;
      }

      // Download
      if (!fs.existsSync(rawPath)) {
        console.log('  Downloading...');
        if (!download(url, rawPath)) { failed.push(url); continue; }
      } else {
        console.log('  Already downloaded locally');
      }

      // Re-encode
      if (!fs.existsSync(h264Path)) {
        console.log('  Re-encoding to H.264...');
        if (!reencodeH264(rawPath, h264Path)) { failed.push(url); continue; }
      } else {
        console.log('  Already re-encoded locally');
      }

      // Upload
      console.log(`  Uploading → s3://${BUCKET}/${s3Key}`);
      try {
        await uploadToS3(h264Path, s3Key);
        const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
        console.log(`  ✓ ${publicUrl}`);
        uploaded.push(s3Key);
      } catch (e) {
        console.error(`  ✗ Upload failed: ${e.message}`);
        failed.push(url);
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log(`✓ Uploaded : ${uploaded.length}`);
  console.log(`  Skipped  : ${skipped.length} (already in S3)`);
  console.log(`✗ Failed   : ${failed.length}`);
  if (failed.length) {
    console.log('\nFailed URLs:');
    failed.forEach(u => console.log(' ', u));
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
