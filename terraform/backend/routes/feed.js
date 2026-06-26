
const express = require('express');
const { ListObjectsV2Command, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getS3Client, S3_BUCKET } = require('../config/aws');

const router = express.Router();

// ── Hardcoded creator metadata keyed by S3 filename prefix ──────────
// We embed this so the feed works without DynamoDB.
const CREATOR_META = {
  // ─── Varun Mayya ───
  'hv_DXBJo5sA8Ka': { authorName: 'Varun Mayya', instagramHandle: 'vaaborin', twitterHandle: 'vaaborin', genre: 'AI', tags: ['AI', 'Startups', 'Tech'] },
  'hv_DW_OhMXilra': { authorName: 'Varun Mayya', instagramHandle: 'vaaborin', twitterHandle: 'vaaborin', genre: 'AI', tags: ['AI', 'Startups', 'Tech'] },
  'hv_DW7x4fWBimF': { authorName: 'Varun Mayya', instagramHandle: 'vaaborin', twitterHandle: 'vaaborin', genre: 'AI', tags: ['AI', 'Startups', 'Tech'] },
  'hv_DXEQHBisnfj': { authorName: 'Varun Mayya', instagramHandle: 'vaaborin', twitterHandle: 'vaaborin', genre: 'AI', tags: ['AI', 'Tech', 'Innovation'] },
  'hv_DW2mbMosXHa': { authorName: 'Varun Mayya', instagramHandle: 'vaaborin', twitterHandle: 'vaaborin', genre: 'AI', tags: ['AI', 'Startups', 'Tech'] },
  // ─── Builder Central ───
  'hv_DXJLpL8kw9V': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'NoCode', 'Builders'] },
  'hv_DXHudNTE7Ro': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Automation', 'Builders'] },
  'hv_DXFPuftE64e': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Tools', 'Builders'] },
  'hv_DXEXzmUk2vV': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Development', 'Builders'] },
  'hv_DW9gJ6fATSp': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'SaaS', 'Builders'] },
  'hv_DW4HcTAk2c1': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Startup', 'Builders'] },
  'hv_DWzB3ofk-Bi': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Growth', 'Builders'] },
  'hv_DWx8qBGk1Dt': { authorName: 'Builder Central', instagramHandle: 'builders.central', twitterHandle: 'builderscentral', genre: 'AI', tags: ['AI', 'Product', 'Builders'] },
  // ─── Ankit Arora ───
  'hv_DXI-E02EiNy': { authorName: 'Ankit Arora', instagramHandle: 'ai_ankitarora', twitterHandle: 'aiankitarora', genre: 'AI', tags: ['AI', 'Tutorial', 'AIgram'] },
  'hv_DW8GX4qCE75': { authorName: 'Ankit Arora', instagramHandle: 'ai_ankitarora', twitterHandle: 'aiankitarora', genre: 'AI', tags: ['AITools', 'Productivity', 'AIgram'] },
  // ─── 100x Engineers ───
  'hv_DRemomjiXQ6': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DQ4GVv5Axjf': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DQz1dkwAHmv': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DQNEJVKgYcV': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DP9j1BzAn7z': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DPRYyOdA0E6': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DPHYDXXAlBG': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DOuT_RGgUO_': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
  'hv_DOkaVwwAQPo': { authorName: '100x Engineers', instagramHandle: '100xengineers', twitterHandle: '100xEngineers', genre: 'Tech', tags: ['AI', 'Engineers', '100x'] },
};

// Cache the S3 listing for 5 minutes to avoid hammering AWS on every request
let cachedFeed = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * List all .mp4 files in the doom-scrolling folder of S3,
 * enrich with creator metadata, and return.
 */
async function fetchVideosFromS3() {
  const s3 = getS3Client();
  const bucketName = S3_BUCKET;
  const prefix = 'doom-scrolling/';
  const region = process.env.AWS_REGION || 'ap-south-1';

  const { Contents } = await s3.send(new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  }));

  if (!Contents || Contents.length === 0) return [];

  const videos = Contents
    .filter(obj => obj.Key.endsWith('.mp4'))
    .map((obj, idx) => {
      const filename = obj.Key.replace(prefix, '').replace('.mp4', '');
      const meta = CREATOR_META[filename] || {};
      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${obj.Key}`;

      return {
        videoId: filename,
        title: meta.authorName
          ? `${meta.authorName} — AI Reel`
          : filename.replace(/^hv_/, '').replace(/[_-]/g, ' '),
        description: `Content by ${meta.authorName || 'Aigram Creator'}`,
        authorId: `user_${(meta.authorName || 'unknown').replace(/\s+/g, '_').toLowerCase()}`,
        authorName: meta.authorName || 'Aigram Creator',
        genre: meta.genre || 'AI',
        tags: meta.tags || ['AI', 'Content'],
        duration: 45,
        viewCount: Math.floor(Math.random() * 200000) + 10000,
        likeCount: Math.floor(Math.random() * 25000) + 1000,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        createdAt: obj.LastModified ? obj.LastModified.toISOString() : new Date().toISOString(),
        thumbnailUrl: '',
        videoUrl: s3Url,
        streamUrl: s3Url,
        instagramHandle: meta.instagramHandle || '',
        twitterHandle: meta.twitterHandle || '',
        linkedinHandle: meta.linkedinHandle || '',
      };
    });

  // Shuffle so the feed isn't always the same order
  for (let i = videos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [videos[i], videos[j]] = [videos[j], videos[i]];
  }

  return videos;
}

/**
 * GET /api/feed
 * Returns the video feed from S3 directly (no DynamoDB needed)
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 0, size = 10 } = req.query;
    const limit = parseInt(size);
    const offset = parseInt(page) * limit;

    // Use cached data if fresh enough
    const now = Date.now();
    if (!cachedFeed || now - cacheTimestamp > CACHE_TTL_MS) {
      console.log('🔄 Refreshing S3 video feed cache...');
      cachedFeed = await fetchVideosFromS3();
      cacheTimestamp = now;
      console.log(`✅ Cached ${cachedFeed.length} videos from S3`);
    }

    const videos = cachedFeed;
    const paginatedVideos = videos.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        content: paginatedVideos,
        totalElements: videos.length,
        totalPages: Math.ceil(videos.length / limit),
        last: offset + limit >= videos.length,
        number: parseInt(page),
        size: limit
      }
    });
  } catch (error) {
    console.error('Error fetching feed from S3:', error);
    next(error);
  }
});

/**
 * GET /api/feed/personalized
 */
router.get('/personalized', async (req, res, next) => {
  // Redirect to main feed
  res.redirect('/api/feed' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''));
});

module.exports = router;
