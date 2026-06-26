/**
 * Video Transcription Route
 * Delegates to services/transcription.js which handles caching + HuggingFace Whisper pipeline.
 */

const express = require('express');
const router = express.Router();
const { getOrGenerateTranscript, generateTranscript } = require('../services/transcription');

router.post('/', async (req, res, next) => {
  const startTime = Date.now();
  const { videoUrl, forceRegenerate } = req.body;
  if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });

  try {
    let transcript, cached;

    if (forceRegenerate) {
      transcript = await generateTranscript(videoUrl);
      cached = false;
    } else {
      ({ transcript, cached } = await getOrGenerateTranscript(videoUrl));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    res.status(200).json({
      status: 'success',
      transcript,
      cached,
      processingTime: `${elapsed}s`,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    provider: 'huggingface-whisper',
    model: process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3-turbo',
    apiKeyConfigured: !!(process.env.HF_API_KEY || process.env.HF_TOKEN),
  });
});

module.exports = router;
