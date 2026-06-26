import Constants from 'expo-constants';

const _expoExtra = (Constants.expoConfig || (Constants as any).manifest)?.extra || {};

// HuggingFace API key from .env (EXPO_PUBLIC_HF_API_KEY) or expo-constants extra
const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY || _expoExtra.EXPO_PUBLIC_HF_API_KEY;
if (!HF_API_KEY) {
  throw new Error('HuggingFace API key is not configured. Set EXPO_PUBLIC_HF_API_KEY in .env');
}
const HF_WHISPER_MODEL = 'openai/whisper-large-v3-turbo';
const HF_INFERENCE_URL = `https://api-inference.huggingface.co/models/${HF_WHISPER_MODEL}`;

export interface TranscriptResult {
  success: boolean;
  transcript: string;
  error?: string;
  duration?: string;
  model?: string;
  processingTime?: string;
}

export type TranscriptStreamCallback = (chunk: string, fullText: string) => void;
export type TranscriptStatusCallback = (status: string, detail?: string) => void;

/**
 * Maps raw error messages to user-friendly strings.
 */
function friendlyErrorMessage(raw: string): string {
  if (raw.includes('ENOSPC') || raw.includes('no space left on device')) {
    return 'The transcription server is temporarily out of storage. Please try again in a few minutes.';
  }
  if (raw.includes('ECONNREFUSED') || raw.includes('ENOTFOUND') || raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return 'Cannot reach the transcription server. Please check your connection and try again.';
  }
  if (raw.includes('ETIMEDOUT') || raw.includes('timeout') || raw.includes('TIMEOUT')) {
    return 'The transcription request timed out. The video may be too long — please try again.';
  }
  if (raw.includes('401') || raw.includes('Unauthorized') || raw.includes('Invalid token')) {
    return 'HuggingFace API key is invalid. Please check your configuration.';
  }
  if (raw.includes('429') || raw.includes('Too Many Requests') || raw.includes('RATE_LIMIT')) {
    return 'Too many requests to HuggingFace API. Please wait a moment and try again.';
  }
  return raw;
}

/**
 * Helper: delay for a given number of milliseconds.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch the video/audio from a URL as a blob.
 */
async function fetchAudioBlob(videoUrl: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const contentType = blob.type || 'application/octet-stream';

  return { blob, contentType };
}

/**
 * Call the HuggingFace Whisper Inference API with audio bytes.
 * Handles model-loading retry (503 status).
 */
async function callHuggingFaceWhisper(
  audioBlob: Blob,
  contentType: string,
  maxRetries = 3,
): Promise<string> {
  let retriesLeft = maxRetries;

  while (true) {
    const controller = new AbortController();
    // 2-minute timeout for the Whisper API call
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(HF_INFERENCE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': contentType,
        },
        body: audioBlob,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ── Handle model loading (503) with retry ────────────────
      if (response.status === 503) {
        let retryAfter = 20; // default wait in seconds
        try {
          const errorData = await response.json();
          if (errorData.estimated_time) {
            retryAfter = Math.ceil(errorData.estimated_time);
          }
        } catch {}
        retryAfter = Math.min(retryAfter, 60); // cap at 60 seconds

        if (retriesLeft > 0) {
          retriesLeft--;
          await delay(retryAfter * 1000);
          continue; // retry
        }
        throw new Error('MODEL_LOADING');
      }

      // ── Handle other errors ──────────────────────────────────
      if (response.status === 401) throw new Error('401 Unauthorized: Invalid API key');
      if (response.status === 429) throw new Error('429 RATE_LIMIT');
      if (response.status === 400) throw new Error('400 Bad Request');
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HuggingFace API error ${response.status}: ${errText.substring(0, 200)}`);
      }

      // ── Parse response ───────────────────────────────────────
      const data = await response.json();

      // Whisper returns { text: "..." } or [{ text: "..." }]
      let transcript = '';
      if (data.text) {
        transcript = data.text;
      } else if (Array.isArray(data) && data[0]?.text) {
        transcript = data[0].text;
      } else if (data.generated_text) {
        transcript = data.generated_text;
      } else {
        throw new Error('EMPTY_RESPONSE');
      }

      return transcript.trim();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw error;
    }
  }
}

/**
 * Whisper-powered video transcription via direct HuggingFace Inference API.
 * No backend server required — calls HuggingFace directly from the frontend.
 */
export const geminiTranscriptionService = {
  /**
   * Transcribe a video using HuggingFace Whisper directly from the frontend.
   * Provides real-time status updates via callbacks.
   *
   * @param videoUrl   - URL of the video to transcribe
   * @param onChunk    - Called when transcript text is received (chunk, fullText)
   * @param onStatus   - Called with status updates for the loading UI
   * @returns Final TranscriptResult once complete
   */
  async transcribeVideoStream(
    videoUrl: string,
    onChunk: TranscriptStreamCallback,
    onStatus: TranscriptStatusCallback,
  ): Promise<TranscriptResult> {
    const startTime = Date.now();

    try {
      // ── Step 1: Notify UI ──────────────────────────────────────
      onStatus('sending', 'Downloading video audio for transcription...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 [Whisper] Starting transcription');
      console.log('🔗 [Whisper] Video URL:', videoUrl);
      console.log('🤖 [Whisper] Using HuggingFace model:', HF_WHISPER_MODEL);

      // ── Step 2: Fetch the video as audio blob ──────────────────
      console.log('📥 [Whisper] Downloading video audio...');
      onStatus('downloading', 'Downloading video... This may take a moment.');

  const { blob, contentType } = await fetchAudioBlob(videoUrl);
  const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
  console.log(`📦 [Whisper] Downloaded: ${sizeMB} MB (content-type: ${contentType})`);

      // ── Step 3: Send to HuggingFace Whisper API ──────────────
      console.log('📡 [Whisper] Sending to HuggingFace Whisper API...');
      onStatus('processing', `Whisper AI is transcribing (${sizeMB} MB audio)... This may take a minute.`);

      const transcript = await callHuggingFaceWhisper(blob, contentType);

      console.log('✅ [Whisper] Transcript received from HuggingFace API');

      // ── Step 4: Stream result word-by-word (typing effect) ─────
      onStatus('streaming', 'Rendering transcript...');
      const words = transcript.split(' ');
      const chunkSize = 8; // words per chunk
      let delivered = '';

      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
        delivered += chunk;
        onChunk(chunk, delivered.trim());

        // Small delay between chunks for the typing effect
        if (i + chunkSize < words.length) {
          await delay(20);
        }
      }

      // ── Step 5: Done ───────────────────────────────────────────
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [Whisper] COMPLETE');
      console.log(`   ├─ Transcript: ${transcript.length} chars`);
      console.log(`   ├─ Words: ${words.length}`);
      console.log(`   ├─ Model: ${HF_WHISPER_MODEL}`);
      console.log(`   └─ Total time: ${totalTime}s`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      onStatus('complete', `Transcript generated in ${totalTime}s`);

      return {
        success: true,
        transcript: transcript,
        duration: totalTime + 's',
        model: HF_WHISPER_MODEL,
        processingTime: totalTime + 's',
      };
    } catch (error: any) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`❌ [Whisper] FAILED after ${totalTime}s`);
      console.error(`   └─ Error: ${error.message}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      onStatus('error', friendlyErrorMessage(error.message));

      return {
        success: false,
        transcript: '',
        error: friendlyErrorMessage(error.message || 'Failed to transcribe video'),
      };
    }
  },
};
