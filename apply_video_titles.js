/**
 * apply_video_titles.js
 *
 * Immediately updates src/utils/dummyShorts.ts with proper video titles.
 *
 * Strategy (in order):
 *  1. Try the Whisper transcription backend (localhost:3000) for each video
 *  2. If the backend is down/refuses, fall back to curated AI-themed titles
 *     that fit the platform's focus on AI tools, content creation, and tech.
 *
 * Run:  node apply_video_titles.js
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');

const BACKEND      = process.env.WHISPER_BACKEND || 'http://localhost:3000';
const TARGET_FILE  = path.join(__dirname, 'src', 'utils', 'dummyShorts.ts');
const TIMEOUT_MS   = 8000;

// ── Curated fallback content ───────────────────────────────────────────────
// Each entry maps to a videoId (or falls back to positional index).
// Titles & descriptions are deliberately varied and realistic for the platform.
const CURATED = [
  {
    title: 'How AI Is Changing the Way We Create Content',
    description: 'Discover how modern AI tools are reshaping content creation — from writing assistance to fully automated video generation — and what it means for creators.',
    tags: ['AI', 'ContentCreation', 'AITools', 'AIgram'],
  },
  {
    title: '5 ChatGPT Prompts That Actually Work for Marketing',
    description: 'Not all prompts are equal. Here are five battle-tested ChatGPT prompts that consistently produce high-quality marketing copy for any niche.',
    tags: ['ChatGPT', 'PromptEngineering', 'Marketing', 'AIgram'],
  },
  {
    title: 'The Attention Economy — Why You Can\'t Stop Scrolling',
    description: 'Social media platforms are engineered to capture your focus. Learn how the attention economy works and what you can do to reclaim your time.',
    tags: ['SocialMedia', 'DigitalWellbeing', 'Attention', 'AIgram'],
  },
  {
    title: 'Building Your First AI Agent in Under 10 Minutes',
    description: 'A practical, no-fluff walkthrough of spinning up a basic AI agent using LangChain and OpenAI — start building in minutes.',
    tags: ['LLM', 'AIAgent', 'LangChain', 'AIgram'],
  },
  {
    title: 'Dopamine Loops: The Science Behind Social Media Addiction',
    description: 'Neuroscience explains why infinite scrolling feels so compelling. Understanding the dopamine loop is the first step to breaking free.',
    tags: ['Neuroscience', 'SocialMedia', 'DigitalHealth', 'AIgram'],
  },
  {
    title: 'Gemini vs ChatGPT — Real-World Comparison in 60 Seconds',
    description: 'Side-by-side comparison of Google Gemini and OpenAI ChatGPT on everyday tasks: summarisation, code generation, and creative writing.',
    tags: ['Gemini', 'ChatGPT', 'AI', 'AIgram'],
  },
  {
    title: 'Prompt Engineering 101: Write Better AI Instructions',
    description: 'The quality of your AI output depends almost entirely on how you phrase your input. Master these four prompt engineering principles today.',
    tags: ['PromptEngineering', 'AI', 'ChatGPT', 'AIgram'],
  },
  {
    title: 'This Simple Habit Will Double Your Productivity With AI',
    description: 'Start every work session with this five-minute AI routine and watch your output quantity and quality climb — no complex tools required.',
    tags: ['Productivity', 'AI', 'Automation', 'AIgram'],
  },
  {
    title: 'Why Your Feed Shows You Exactly What You Fear',
    description: 'Recommendation algorithms don\'t just show you what you like — they amplify what triggers the strongest emotional response. Here\'s the data.',
    tags: ['Algorithm', 'SocialMedia', 'DataScience', 'AIgram'],
  },
  {
    title: 'Fine-Tuning a Language Model Without Writing Code',
    description: 'Modern platforms like OpenAI\'s fine-tuning API let you customise a model with your own data using just a JSON file and a few clicks.',
    tags: ['LLM', 'FineTuning', 'MachineLearning', 'AIgram'],
  },
  {
    title: 'Screen Time vs. Deep Work — Can You Have Both?',
    description: 'Cal Newport\'s concept of deep work clashes with the always-on social media world. Here\'s how to protect focus blocks even as a creator.',
    tags: ['DeepWork', 'Productivity', 'DigitalWellbeing', 'AIgram'],
  },
  {
    title: 'AI Art in 30 Seconds: Midjourney Prompt Breakdown',
    description: 'A rapid walkthrough of the exact Midjourney v6 prompt syntax that produces cinematic, photorealistic images every single time.',
    tags: ['Midjourney', 'AI', 'AIArt', 'AIgram'],
  },
  {
    title: 'The Algorithm Doesn\'t Care About Your Mental Health',
    description: 'Research shows a direct correlation between heavy social media use and anxiety levels. But why do the platforms keep optimising for more?',
    tags: ['MentalHealth', 'SocialMedia', 'Algorithm', 'AIgram'],
  },
  {
    title: 'Claude vs GPT-4 — Which AI Writes Better Code?',
    description: 'We ran the same 20 coding challenges through Anthropic\'s Claude and OpenAI\'s GPT-4. The results reveal surprising strengths in both.',
    tags: ['Claude', 'ChatGPT', 'Coding', 'AIgram'],
  },
  {
    title: 'How to Use AI for Your Daily News Without Getting Bias',
    description: 'AI can curate news faster than any human editor — but it can also amplify bias. These three techniques keep your feed balanced and diverse.',
    tags: ['AI', 'News', 'MediaLiteracy', 'AIgram'],
  },
  {
    title: 'RAG Explained: Making AI Remember Your Documents',
    description: 'Retrieval-Augmented Generation lets any language model answer questions from your private files without expensive retraining. Here\'s how.',
    tags: ['RAG', 'LLM', 'AI', 'AIgram'],
  },
  {
    title: 'Scroll Fatigue Is Real — And AI Can Help You Fight It',
    description: 'AI-powered tools can filter your feed, summarise content, and surface only what matters — turning endless scrolling into intentional browsing.',
    tags: ['AI', 'DigitalWellbeing', 'Productivity', 'AIgram'],
  },
  {
    title: 'Build a Full REST API With Copilot in 2 Minutes',
    description: 'GitHub Copilot can scaffold, document, and partially test an entire REST API from a single comment. Watch the full flow in real time.',
    tags: ['Coding', 'GitHub', 'AI', 'AIgram'],
  },
  {
    title: 'Your Phone Knows You Better Than You Know Yourself',
    description: 'From keystroke dynamics to scroll patterns, mobile apps collect hundreds of behavioural signals. What are they doing with all that data?',
    tags: ['Privacy', 'DataScience', 'SocialMedia', 'AIgram'],
  },
  {
    title: 'Vector Databases: The Memory Layer Every AI App Needs',
    description: 'Pinecone, Weaviate, Chroma — vector databases are the backbone of modern semantic search and RAG pipelines. A plain-English explainer.',
    tags: ['VectorDB', 'AI', 'MachineLearning', 'AIgram'],
  },
  {
    title: 'Break the Scroll: A 7-Day Digital Detox Challenge',
    description: 'Seven small daily changes that cumulatively cut screen time by up to 40% — no willpower required, just smart environment design.',
    tags: ['DigitalDetox', 'DigitalWellbeing', 'Habit', 'AIgram'],
  },
  {
    title: 'How to Write a System Prompt That Changes Everything',
    description: 'The system prompt is the hidden steering wheel of any AI assistant. These templates instantly make your AI responses more precise and consistent.',
    tags: ['PromptEngineering', 'ChatGPT', 'AI', 'AIgram'],
  },
  {
    title: 'TikTok\'s Algorithm Decoded — What Actually Goes Viral',
    description: 'Former TikTok engineers have revealed the core ranking signals. Here\'s the priority order and what that means for your content strategy.',
    tags: ['TikTok', 'Algorithm', 'ContentCreation', 'AIgram'],
  },
  {
    title: 'n8n + AI: Automate Your Entire Content Pipeline',
    description: 'Connect ChatGPT, Google Docs, and social media APIs with n8n to auto-generate, review, and schedule posts — zero manual work.',
    tags: ['Automation', 'n8n', 'AI', 'AIgram'],
  },
  {
    title: 'The Real Cost of One Hour of Social Media a Day',
    description: 'Compound an hour of daily scrolling over a year: that\'s 15 full days lost. AI tools can recover that time by doing the browsing for you.',
    tags: ['DigitalWellbeing', 'Productivity', 'AI', 'AIgram'],
  },
  {
    title: 'Embeddings Explained: How AI Understands Meaning',
    description: 'Text embeddings convert words into numbers in a way that captures semantic relationships. This short explainer demystifies the concept completely.',
    tags: ['NLP', 'MachineLearning', 'AI', 'AIgram'],
  },
  {
    title: 'Instagram Reels vs YouTube Shorts — Where to Post in 2026',
    description: 'Platform audiences, algorithm differences, and monetisation thresholds compared. The data points to a clear winner for most creators.',
    tags: ['Instagram', 'YouTube', 'ContentCreation', 'AIgram'],
  },
  {
    title: 'Chain-of-Thought Prompting: Get Smarter AI Answers',
    description: 'Asking AI to "think step by step" measurably improves accuracy on complex tasks. Here\'s the research and four ready-to-use templates.',
    tags: ['PromptEngineering', 'ChatGPT', 'AI', 'AIgram'],
  },
  {
    title: 'Infinite Scroll Was Designed to Be Addictive — Here\'s Proof',
    description: 'The inventor of infinite scroll has publicly apologised for its societal impact. A look at the design decision that changed social media forever.',
    tags: ['UXDesign', 'SocialMedia', 'DigitalWellbeing', 'AIgram'],
  },
  {
    title: 'Zero-Shot vs Few-Shot Learning — When to Use Each',
    description: 'Understanding the difference between zero-shot and few-shot prompting saves you tokens and produces far more reliable AI output.',
    tags: ['PromptEngineering', 'LLM', 'AI', 'AIgram'],
  },
  {
    title: 'How AI Personalisation Filters Your Reality',
    description: 'Every personalised feed is a filter bubble. AI determines what news, opinions, and products you see — and that shapes your worldview.',
    tags: ['Algorithm', 'AI', 'FilterBubble', 'AIgram'],
  },
  {
    title: 'Deploy Your AI App to Production in 5 Steps',
    description: 'From local prototype to live URL: containerise with Docker, push to a cloud registry, and deploy with a single command using this guide.',
    tags: ['Deployment', 'AI', 'Coding', 'AIgram'],
  },
  {
    title: 'Reclaiming Focus: AI Tools That Block Digital Distractions',
    description: 'Freedom, Cold Turkey, and AI browser extensions that learn your distraction patterns and block them before you even realise you\'re drifting.',
    tags: ['Productivity', 'AI', 'DigitalWellbeing', 'AIgram'],
  },
  {
    title: 'Multimodal AI: When Your Model Can See, Hear, and Read',
    description: 'GPT-4o and Gemini Ultra accept images, audio, and text in the same prompt. Here\'s what that unlocks for developers and everyday users.',
    tags: ['MultimodalAI', 'GPT4', 'Gemini', 'AIgram'],
  },
  {
    title: 'Content Strategy for Creators Using AI in 2026',
    description: 'The creators growing fastest right now use AI for ideation, scripting, and scheduling — not to replace their voice, but to amplify it.',
    tags: ['ContentCreation', 'AI', 'Strategy', 'AIgram'],
  },
  {
    title: 'LLM Hallucinations — Why AI Makes Stuff Up and How to Stop It',
    description: 'Language models confidently produce false information. Grounding techniques, retrieval augmentation, and verification layers are your defences.',
    tags: ['LLM', 'AI', 'Hallucination', 'AIgram'],
  },
  {
    title: 'Phone Notifications Are Hijacking Your Brain',
    description: 'Every ping derails 23 minutes of concentration. Behavioural psychology explains why, and AI-powered notification managers can help take back control.',
    tags: ['DigitalWellbeing', 'Neuroscience', 'Productivity', 'AIgram'],
  },
  {
    title: 'Cursor AI Editor — Pair Programming Just Got Smarter',
    description: 'Cursor embeds a conversational AI directly into your code editor. See how it rewrites functions, resolves errors, and explains unfamiliar codebases.',
    tags: ['Coding', 'AI', 'DevTools', 'AIgram'],
  },
  {
    title: 'Social Proof Algorithms: Why You See What Others Like',
    description: 'Engagement metrics like likes and shares feed directly into recommendation models. Social proof amplifies popular content — for better or worse.',
    tags: ['Algorithm', 'SocialMedia', 'DataScience', 'AIgram'],
  },
  {
    title: 'Open Source LLMs Are Catching Up to GPT-4 Fast',
    description: 'Llama 3, Mistral, and Phi-3 are closing the gap with proprietary models at a fraction of the cost. The open-source AI landscape in 2026.',
    tags: ['OpenSource', 'LLM', 'AI', 'AIgram'],
  },
  {
    title: 'AI Summarisation: Read Less, Know More',
    description: 'Perplexity, NotebookLM, and ChatGPT can condense a 60-page report into a five-point brief in seconds. Here\'s the right workflow for each.',
    tags: ['AI', 'Productivity', 'Summarisation', 'AIgram'],
  },
  {
    title: 'The Dark Pattern Playbook — UX Tricks That Steal Your Time',
    description: 'Auto-play, variable reward schedules, hidden unsubscribe buttons — dark UX patterns are everywhere in social apps and they\'re by design.',
    tags: ['UXDesign', 'DarkPatterns', 'SocialMedia', 'AIgram'],
  },
  {
    title: 'Model Context Window Explained: Why Size Actually Matters',
    description: 'A larger context window lets the model remember more of your conversation. Here\'s what 128k tokens means in practice for long documents.',
    tags: ['LLM', 'AI', 'ContextWindow', 'AIgram'],
  },
  {
    title: 'Microlearning With AI — Master a Topic in 15-Second Bursts',
    description: 'Short-form video combined with spaced repetition and AI quizzing is the most efficient way to acquire new skills in 2026. Here\'s how.',
    tags: ['Learning', 'AI', 'Microlearning', 'AIgram'],
  },
  {
    title: 'API Rate Limits, Costs & Tokens — What Every Dev Must Know',
    description: 'Sending too many tokens burns money fast. This cheat-sheet covers OpenAI, Anthropic, and Google pricing so you can optimise every request.',
    tags: ['AI', 'API', 'DevTools', 'AIgram'],
  },
  {
    title: 'Reverse Engineering Viral Shorts: What the Top 1% Do Differently',
    description: 'After analysing 10,000 short-form videos, patterns emerge: hook within 2 seconds, single idea, clear call-to-action. Here\'s the breakdown.',
    tags: ['ContentCreation', 'Strategy', 'SocialMedia', 'AIgram'],
  },
  {
    title: 'Building a RAG Chatbot Over Your Own Documents in Minutes',
    description: 'Combine a vector store, an embedding model, and a language model to create a chatbot that answers questions from any PDF, doc, or web page.',
    tags: ['RAG', 'LLM', 'Coding', 'AIgram'],
  },
];
// ─────────────────────────────────────────────────────────────────────────────

/** Very quick connectivity check – resolves true if backend responds */
function isBackendUp() {
  return new Promise((resolve) => {
    const url = new URL(BACKEND + '/api/transcribe');
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
    };
    const req = http.request(options, (res) => {
      resolve(res.statusCode < 500); // 4xx means server is up but route may not exist
    });
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.write('{}');
    req.end();
  });
}

/** POST one video URL to the Whisper backend */
function transcribe(videoUrl) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ videoUrl });
    const url  = new URL(BACKEND + '/api/transcribe');
    const req  = http.request(
      { hostname: url.hostname, port: url.port || 80, path: url.pathname,
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            j.transcript ? resolve(j.transcript) : reject(new Error(j.message || 'no transcript'));
          } catch { reject(new Error('bad JSON')); }
        });
      }
    );
    req.setTimeout(90_000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function titleFromTranscript(t) {
  const s = (t.match(/^[^.!?]{10,80}[.!?]/) || [])[0];
  if (s) return s.trim().replace(/^['"]/,'').replace(/['"]$/,'');
  const s2 = t.trim().substring(0, 65);
  const sp = s2.lastIndexOf(' ');
  return sp > 20 ? s2.substring(0, sp) + '...' : s2 + '...';
}

function descFromTranscript(t) {
  const sentences = (t.match(/[^.!?]+[.!?]+/g) || []).slice(0, 2).join(' ').trim();
  return sentences.length > 20 ? sentences : t.trim().substring(0, 120) + '...';
}

function tagsFromTranscript(t) {
  const lo = t.toLowerCase();
  const map = [
    ['gpt','ChatGPT'],['openai','OpenAI'],['claude','Claude'],['gemini','Gemini'],
    ['llm','LLM'],['prompt','PromptEngineering'],['machine learning','MachineLearning'],
    ['neural','NeuralNetworks'],['python','Python'],['javascript','JavaScript'],
    ['productivity','Productivity'],['automation','Automation'],
    ['social media','SocialMedia'],['content','ContentCreation'],['tutorial','Tutorial'],
  ];
  const tags = map.filter(([k]) => lo.includes(k)).map(([,v]) => v);
  return [...new Set(tags)].slice(0,4).concat(['AIgram']).slice(0,5);
}

function parseCurrentShorts() {
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const m   = src.match(/DUMMY_SHORTS_VIDEOS[^=]*=\s*(\[[\s\S]*?\]);\s*\nexport const generate/);
  if (!m) throw new Error('Cannot parse DUMMY_SHORTS_VIDEOS array from dummyShorts.ts');
  return JSON.parse(m[1]);
}

function writeShorts(videos) {
  const out = `import { Video } from '../types';

export const DUMMY_SHORTS_VIDEOS: Video[] = ${JSON.stringify(videos, null, 2)};

export const generateDummyShorts = (count: number = 5): Video[] => {
  const max = Math.min(count, DUMMY_SHORTS_VIDEOS.length);
  return DUMMY_SHORTS_VIDEOS.slice(0, max);
};
`;
  fs.writeFileSync(TARGET_FILE, out, 'utf8');
}

async function main() {
  console.log('\n──────────────────────────────────────────────');
  console.log('  AIgram – Video Title Updater');
  console.log('──────────────────────────────────────────────\n');

  const videos = parseCurrentShorts();
  console.log(`Loaded ${videos.length} video entries.\n`);

  const backendUp = await isBackendUp();
  console.log(`Whisper backend (${BACKEND}): ${backendUp ? '✅ online' : '❌ offline – using curated titles'}\n`);

  for (let i = 0; i < videos.length; i++) {
    const video   = videos[i];
    const curated = CURATED[i] || CURATED[i % CURATED.length]; // cycle if more videos than curated entries

    process.stdout.write(`[${String(i + 1).padStart(2,'0')}/${videos.length}] `);

    if (backendUp) {
      try {
        const transcript   = await transcribe(video.videoUrl || video.streamUrl);
        const title        = titleFromTranscript(transcript);
        const description  = descFromTranscript(transcript);
        const tags         = tagsFromTranscript(transcript);
        videos[i] = { ...video, title, description, tags,
          thumbnailUrl: `https://via.placeholder.com/540x960?text=${encodeURIComponent(title.substring(0,30))}` };
        console.log(`✅ (transcript) "${title}"`);
        continue;
      } catch (e) {
        process.stdout.write(`⚠️ transcript failed (${e.message}) → `);
      }
    }

    // Curated fallback
    videos[i] = { ...video,
      title:       curated.title,
      description: curated.description,
      tags:        curated.tags,
      thumbnailUrl:`https://via.placeholder.com/540x960?text=${encodeURIComponent(curated.title.substring(0,30))}`,
    };
    console.log(`✅ (curated) "${curated.title}"`);
  }

  writeShorts(videos);
  console.log(`\n✅  Wrote ${videos.length} updated videos → ${TARGET_FILE}\n`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
