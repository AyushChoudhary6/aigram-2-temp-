/**
 * Quiz Generation Route
 * Uses HuggingFace text generation model to create quiz questions from a transcript.
 *
 * Endpoint: POST /api/quiz/generate
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getOrGenerateTranscript } = require('../services/transcription');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ────────────────────────────────────────────────────────────────────
// Helper: Call Groq chat completion API
// ────────────────────────────────────────────────────────────────────
async function generateText(prompt, maxTokens = 4096) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured on the server');

  console.log(`🤖 [Quiz] Calling Groq (${GROQ_CHAT_MODEL})...`);

  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq error ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('Groq returned empty response');

  console.log(`✅ [Quiz] Groq response received (${content.length} chars)`);
  return content;
}

// ────────────────────────────────────────────────────────────────────
// Helper: Build prompt for quiz generation
// ────────────────────────────────────────────────────────────────────
function buildQuizPrompt(transcript, numQuestions, questionTypes) {
  const typesStr = questionTypes.join(', ');

  return `You are a quiz generator. Given the following video transcript, generate exactly ${numQuestions} quiz questions.

RULES:
- Generate a mix of these question types: ${typesStr}
- Each question MUST be based on information from the transcript
- For MCQ: provide exactly 4 options (A, B, C, D) with one correct answer
- For true_false: the statement should be clearly true or false based on the transcript
- For fill_blank: use ___ for the blank, answer should be 1-3 words
- For match_pair: provide 4 pairs to match (items and their matches)
- Return ONLY valid JSON array, no other text before or after

TRANSCRIPT:
${transcript.substring(0, 3000)}

Generate exactly ${numQuestions} questions as a JSON array with this format:
[
  {
    "id": 1,
    "type": "mcq",
    "question": "What is...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A",
    "explanation": "Brief explanation why this is correct"
  },
  {
    "id": 2,
    "type": "true_false",
    "question": "Statement here",
    "correctAnswer": "True",
    "explanation": "Brief explanation"
  },
  {
    "id": 3,
    "type": "fill_blank",
    "question": "The ___ is used to...",
    "correctAnswer": "word",
    "explanation": "Brief explanation"
  },
  {
    "id": 4,
    "type": "match_pair",
    "question": "Match the following:",
    "pairs": [
      {"left": "Item 1", "right": "Match 1"},
      {"left": "Item 2", "right": "Match 2"},
      {"left": "Item 3", "right": "Match 3"},
      {"left": "Item 4", "right": "Match 4"}
    ],
    "correctAnswer": "1-1,2-2,3-3,4-4",
    "explanation": "Brief explanation"
  }
]

Output ONLY the JSON array:`;
}

// ────────────────────────────────────────────────────────────────────
// Helper: Parse quiz JSON from model output (with fallback)
// ────────────────────────────────────────────────────────────────────
function parseQuizJson(rawText, numQuestions) {
  // Try to find JSON array in the output
  let jsonStr = rawText.trim();

  // Extract JSON array if surrounded by other text
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      // Validate and normalize each question
      return parsed.slice(0, numQuestions).map((q, i) => ({
        id: q.id || i + 1,
        type: ['mcq', 'true_false', 'fill_blank', 'match_pair'].includes(q.type) ? q.type : 'mcq',
        question: q.question || `Question ${i + 1}`,
        options: q.options || [],
        pairs: q.pairs || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || 'No explanation provided.',
      }));
    }
  } catch (e) {
    console.error('⚠️ [Quiz] JSON parse failed, attempting repair...');
  }

  // Fallback: try to fix common JSON issues
  try {
    // Remove trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    // Fix unquoted keys
    jsonStr = jsonStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, numQuestions).map((q, i) => ({
        id: q.id || i + 1,
        type: ['mcq', 'true_false', 'fill_blank', 'match_pair'].includes(q.type) ? q.type : 'mcq',
        question: q.question || `Question ${i + 1}`,
        options: q.options || [],
        pairs: q.pairs || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || 'No explanation provided.',
      }));
    }
  } catch (e2) {
    console.error('❌ [Quiz] JSON repair also failed');
  }

  // Last resort: generate basic MCQ questions from transcript
  console.log('🔧 [Quiz] Falling back to basic question generation');
  return generateFallbackQuestions(numQuestions);
}

function generateFallbackQuestions(num) {
  const questions = [];
  for (let i = 0; i < num; i++) {
    questions.push({
      id: i + 1,
      type: 'mcq',
      question: `Question ${i + 1} could not be generated. Please try again.`,
      options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
      correctAnswer: 'A',
      explanation: 'This is a fallback question due to generation error.',
    });
  }
  return questions;
}

// ────────────────────────────────────────────────────────────────────
// POST /api/quiz/generate
// Body: { videoUrl: string, numQuestions: number, timeLimit: number, videoTitle: string }
//   videoUrl is required. Transcript is fetched from AWS cache or generated automatically.
// ────────────────────────────────────────────────────────────────────
router.post('/generate', async (req, res, next) => {
  const startTime = Date.now();
  const requestId = uuidv4().substring(0, 8);

  try {
    const { videoUrl, numQuestions = 10, timeLimit = 10, videoTitle } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        error: 'Missing videoUrl',
        message: 'videoUrl is required to generate a quiz.',
      });
    }

    // ── Step 1: Get transcript (from cache or generate) ──────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 [Quiz][${requestId}] Starting quiz generation`);
    console.log(`   Video: ${videoUrl.substring(0, 60)}...`);

    const { transcript, cached: transcriptFromCache } = await getOrGenerateTranscript(videoUrl);
    console.log(`   Transcript: ${transcript.length} chars (${transcriptFromCache ? 'from cache' : 'freshly generated'})`);

    if (!transcript || transcript.trim().length < 50) {
      return res.status(400).json({
        error: 'Transcript too short',
        message: 'Could not generate a usable transcript from this video.',
      });
    }

    const clampedNum = Math.min(Math.max(numQuestions, 3), 20);
    const questionTypes = ['mcq', 'true_false', 'fill_blank'];

    console.log(`   Questions: ${clampedNum}, Time limit: ${timeLimit} min, Model: ${GROQ_CHAT_MODEL}`);

    // ── Step 2: Build prompt and generate quiz ─────────────────────
    const prompt = buildQuizPrompt(transcript, clampedNum, questionTypes);

    const rawOutput = await generateText(prompt, 4096);
    console.log(`📨 [Quiz][${requestId}] Raw output length: ${rawOutput.length} chars`);

    // Parse the output
    const questions = parseQuizJson(rawOutput, clampedNum);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ [Quiz][${requestId}] COMPLETE`);
    console.log(`   ├─ Questions generated: ${questions.length}`);
    console.log(`   ├─ Types: ${[...new Set(questions.map(q => q.type))].join(', ')}`);
    console.log(`   └─ Time: ${elapsed}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.status(200).json({
      status: 'success',
      quizId: uuidv4(),
      videoTitle: videoTitle || 'Unknown',
      numQuestions: questions.length,
      timeLimit,
      questions,
      model: GROQ_CHAT_MODEL,
      processingTime: `${elapsed}s`,
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ [Quiz][${requestId}] FAILED after ${elapsed}s: ${error.message}`);
    next(error);
  }
});

// ────────────────────────────────────────────────────────────────────
// GET /api/quiz/status
// ────────────────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    model: GROQ_CHAT_MODEL,
    apiKeyConfigured: !!GROQ_API_KEY,
  });
});

module.exports = router;
