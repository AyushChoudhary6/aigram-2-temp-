/**
 * Shared transcription service.
 * Used by both /api/transcribe and /api/quiz/generate routes.
 * Handles AWS cache (DynamoDB + S3) + HuggingFace Whisper pipeline.
 */

const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { getS3Client, getDDBDocClient, S3_BUCKET, DYNAMODB_TABLE } = require('../config/aws');

const HF_API_KEY = process.env.HF_API_KEY || process.env.HF_TOKEN;
const HF_WHISPER_MODEL = process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3-turbo';
const HF_INFERENCE_URL = `https://api-inference.huggingface.co/models/${HF_WHISPER_MODEL}`;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // HF Inference API limit is ~10MB per request

// ── Helpers ────────────────────────────────────────────────────────

function hashVideoUrl(url) {
  const parsed = new URL(url);
  const cleanUrl = `${parsed.origin}${parsed.pathname}`;
  return crypto.createHash('sha256').update(cleanUrl).digest('hex').substring(0, 16);
}

async function findExistingTranscript(videoUrl) {
  try {
    const videoUrlHash = hashVideoUrl(videoUrl);
    const ddbDocClient = getDDBDocClient();
    const { Items } = await ddbDocClient.send(new QueryCommand({
      TableName: DYNAMODB_TABLE,
      IndexName: 'videoUrlHash-index',
      KeyConditionExpression: 'videoUrlHash = :hash',
      ExpressionAttributeValues: { ':hash': videoUrlHash },
    }));
    return Items && Items.length > 0 ? Items[0] : null;
  } catch (error) {
    console.error('⚠️ [Transcribe] DynamoDB lookup failed:', error.message);
    return null;
  }
}

async function saveTranscript(videoUrl, transcript, metadata) {
  try {
    const videoUrlHash = hashVideoUrl(videoUrl);
    const timestamp = new Date().toISOString();
    const region = process.env.AWS_REGION || 'ap-south-1';

    const s3Client = getS3Client();
    const s3Key = `transcripts/${videoUrlHash}.txt`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: transcript,
      ContentType: 'text/plain; charset=utf-8',
    }));

    const s3Url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
    const ddbDocClient = getDDBDocClient();
    const doc = {
      id: uuidv4(),
      videoUrlHash,
      videoUrl,
      s3Key,
      s3Url,
      transcript,
      status: 'completed',
      model: metadata.model || HF_WHISPER_MODEL,
      duration: metadata.duration || null,
      processingTime: metadata.processingTime || null,
      characterCount: transcript.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: 'huggingface-whisper',
      type: 'transcript',
    };
    await ddbDocClient.send(new PutCommand({ TableName: DYNAMODB_TABLE, Item: doc }));
    return doc;
  } catch (error) {
    console.error('❌ [Transcribe] Failed to save transcript to AWS:', error.message);
    return null;
  }
}

async function downloadToFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(response.body), fileStream);
  return destPath;
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('ffmpeg-static not found'));
    const args = ['-i', videoPath, '-vn', '-acodec', 'libmp3lame', '-ar', '16000', '-ac', '1', '-b:a', '64k', '-y', audioPath];
    execFile(ffmpegPath, args, { timeout: 120000 }, (error) => {
      if (error) return reject(error);
      resolve(audioPath);
    });
  });
}

/**
 * Transcribe audio using HuggingFace Inference API (Whisper model).
 * Sends raw audio bytes as the request body with appropriate content type.
 */
async function transcribeWithHuggingFace(audioBuffer) {
  if (!HF_API_KEY) throw new Error('HF_API_KEY is not configured on the server');

  console.log(`🤗 [HuggingFace] Sending ${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB to ${HF_WHISPER_MODEL}...`);

  // HuggingFace Inference API accepts raw audio bytes
  const response = await fetch(HF_INFERENCE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'audio/mpeg',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');

    // Handle model loading (503 = model is loading, retry after delay)
    if (response.status === 503) {
      let waitTime = 30;
      try {
        const errData = JSON.parse(errText);
        waitTime = Math.ceil(errData.estimated_time || 30);
      } catch (_) {}
      console.log(`⏳ [HuggingFace] Model is loading, waiting ${waitTime}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

      // Retry once after waiting
      const retryResponse = await fetch(HF_INFERENCE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'audio/mpeg',
        },
        body: audioBuffer,
      });

      if (!retryResponse.ok) {
        const retryErr = await retryResponse.text().catch(() => '');
        console.error(`❌ [HuggingFace] Retry failed - Status ${retryResponse.status}: ${retryErr.substring(0, 300)}`);
        throw new Error(`HuggingFace Error ${retryResponse.status}: ${retryErr.substring(0, 100)}`);
      }

      const retryData = await retryResponse.json();
      return { text: retryData.text || '' };
    }

    console.error(`❌ [HuggingFace] Status ${response.status}: ${errText.substring(0, 300)}`);
    throw new Error(`HuggingFace Error ${response.status}: ${errText.substring(0, 100)}`);
  }

  const data = await response.json();
  return { text: data.text || '' };
}

async function transcribeChunked(audioPath) {
  const stats = fs.statSync(audioPath);
  console.log(`📊 [Transcribe] Audio file size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

  if (stats.size <= MAX_AUDIO_BYTES) {
    console.log('📦 [Transcribe] Audio fits in one request');
    const audioBuffer = fs.readFileSync(audioPath);
    const result = await transcribeWithHuggingFace(audioBuffer);
    return { text: result.text || '', chunks: 1 };
  }

  // Split large audio into 5-minute chunks (shorter for HF's smaller size limit)
  const CHUNK_DURATION_SEC = 300;
  const tmpDir = path.dirname(audioPath);
  const chunkPattern = path.join(tmpDir, 'chunk_%03d.mp3');
  console.log(`✂️  [Transcribe] Splitting into ${CHUNK_DURATION_SEC}s segments...`);

  await new Promise((resolve, reject) => {
    const args = ['-i', audioPath, '-f', 'segment', '-segment_time', String(CHUNK_DURATION_SEC),
      '-acodec', 'libmp3lame', '-ar', '16000', '-ac', '1', '-b:a', '64k', '-y', chunkPattern];
    execFile(ffmpegPath, args, { timeout: 300000 }, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });

  const chunkFiles = fs.readdirSync(tmpDir)
    .filter(f => f.startsWith('chunk_') && f.endsWith('.mp3'))
    .sort()
    .map(f => path.join(tmpDir, f));

  console.log(`📦 [Transcribe] Processing ${chunkFiles.length} audio chunks`);
  const transcripts = [];
  for (let i = 0; i < chunkFiles.length; i++) {
    console.log(`🎙️  [Transcribe] Chunk ${i + 1}/${chunkFiles.length}`);
    const chunkBuffer = fs.readFileSync(chunkFiles[i]);
    const result = await transcribeWithHuggingFace(chunkBuffer);
    if (result.text) transcripts.push(result.text.trim());
  }
  return { text: transcripts.join(' '), chunks: chunkFiles.length };
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Generate a transcript for the given video URL, bypassing cache.
 * Cleans up temp files automatically.
 */
async function generateTranscript(videoUrl) {
  const startTime = Date.now();
  let tmpDir = null;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transcribe-'));
    const videoPath = path.join(tmpDir, 'video.mp4');
    const audioPath = path.join(tmpDir, 'audio.mp3');
    await downloadToFile(videoUrl, videoPath);
    await extractAudio(videoPath, audioPath);
    const result = await transcribeChunked(audioPath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    await saveTranscript(videoUrl, result.text, { processingTime: elapsed });
    console.log(`✅ [Transcribe] Generated in ${elapsed}s (${result.text.length} chars)`);
    return result.text;
  } finally {
    if (tmpDir) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

/**
 * Return transcript for videoUrl — from AWS cache if available, otherwise generate it.
 */
async function getOrGenerateTranscript(videoUrl) {
  console.log(`🔍 [Transcribe] Checking cache for: ${videoUrl.substring(0, 60)}...`);
  const cached = await findExistingTranscript(videoUrl);
  if (cached && cached.transcript) {
    console.log(`⚡ [Transcribe] Cache HIT — returning cached transcript`);
    return { transcript: cached.transcript, cached: true };
  }
  console.log(`🆕 [Transcribe] Cache MISS — generating transcript...`);
  const transcript = await generateTranscript(videoUrl);
  return { transcript, cached: false };
}

module.exports = { getOrGenerateTranscript, generateTranscript, findExistingTranscript, saveTranscript, hashVideoUrl };
