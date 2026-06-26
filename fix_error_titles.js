/**
 * fix_error_titles.js
 * 
 * Replaces all "[Error in chunk 1: HuggingFace API error 402..." titles
 * in dummyShorts.ts with curated titles based on the author.
 * Also fixes descriptions and thumbnails.
 *
 * Run: node fix_error_titles.js
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, 'src', 'utils', 'dummyShorts.ts');

// Author-specific curated titles that match each creator's content style
const AUTHOR_TITLES = {
  'Ishan Sharma': [
    { title: 'How AI Is Reshaping Career Paths for Gen Z', description: 'AI is creating entirely new career paths. Here\'s what you need to learn in 2026 to stay ahead of the curve.', tags: ['AI', 'Career', 'GenZ', 'AIgram'] },
    { title: 'Stop Wasting Time — Automate Your Workflow With AI', description: 'Most people spend hours on repetitive tasks that AI can handle in seconds. Here\'s how to set up automation that works.', tags: ['AI', 'Productivity', 'Automation', 'AIgram'] },
    { title: 'The Skills That Will Matter Most in the AI Era', description: 'As AI takes over routine work, these skills become your biggest competitive advantage in the job market.', tags: ['AI', 'Skills', 'Future', 'AIgram'] },
    { title: '3 AI Tools Every Student Should Be Using Right Now', description: 'From research to note-taking to exam prep — these three AI tools will transform how you study and learn.', tags: ['AI', 'Education', 'Students', 'AIgram'] },
    { title: 'Why Learning to Code Still Matters in the Age of AI', description: 'AI can write code, but understanding how code works gives you a massive edge in building, debugging, and directing AI tools.', tags: ['Coding', 'AI', 'Learning', 'AIgram'] },
  ],
  '100x Engineers': [
    { title: 'Building Production-Ready AI Apps: Lessons Learned', description: 'Shipping AI to production is harder than building a prototype. Here are the real-world lessons from scaling AI applications.', tags: ['AI', 'Engineering', 'Production', 'AIgram'] },
    { title: 'System Design for AI-First Applications', description: 'Traditional system design doesn\'t cut it for AI apps. Learn the architecture patterns that scale with LLMs and embeddings.', tags: ['SystemDesign', 'AI', 'Engineering', 'AIgram'] },
    { title: 'The 100x Engineer Mindset: Leverage AI Effectively', description: 'The best engineers don\'t just write code — they leverage AI to multiply their output by 10x or more.', tags: ['Engineering', 'AI', 'Productivity', 'AIgram'] },
    { title: 'From Zero to Full-Stack AI Developer in 2026', description: 'A practical roadmap for becoming a full-stack AI developer — from frontend to model deployment and everything in between.', tags: ['AI', 'FullStack', 'Developer', 'AIgram'] },
    { title: 'Why Every Developer Needs to Understand Vector Databases', description: 'Vector databases are the backbone of semantic search and RAG. If you\'re building with AI, you need to understand them.', tags: ['VectorDB', 'AI', 'Engineering', 'AIgram'] },
    { title: 'Deploying AI Models at Scale: A DevOps Perspective', description: 'CI/CD for AI models requires different tooling and thinking. Here\'s how top engineering teams handle ML deployments.', tags: ['DevOps', 'AI', 'MLOps', 'AIgram'] },
  ],
  'Builders Central': [
    { title: 'Ship Fast, Iterate Faster: The Builder\'s Playbook', description: 'The best products are built by shipping early and iterating based on real user feedback — not by planning forever.', tags: ['Building', 'Startup', 'Product', 'AIgram'] },
    { title: 'How to Build an AI Product From Scratch in a Weekend', description: 'A step-by-step guide to going from idea to working AI product in just 48 hours using modern tools and APIs.', tags: ['AI', 'Building', 'Startup', 'AIgram'] },
    { title: 'The Tools Top Builders Use to Ship AI Products', description: 'From Vercel to Supabase to OpenAI — here\'s the exact tech stack the fastest builders are using in 2026.', tags: ['Tools', 'AI', 'TechStack', 'AIgram'] },
    { title: 'What Separates Builders Who Ship From Those Who Don\'t', description: 'After interviewing hundreds of builders, one pattern is clear: those who ship fast share these three habits.', tags: ['Building', 'Mindset', 'Startup', 'AIgram'] },
    { title: 'Build in Public: Why Sharing Your Progress Matters', description: 'Building in public attracts users, investors, and collaborators. Here\'s how to do it effectively without oversharing.', tags: ['BuildInPublic', 'Startup', 'Community', 'AIgram'] },
    { title: 'No-Code AI Tools That Actually Work for Builders', description: 'You don\'t need to be a developer to build AI-powered products. These no-code tools make it possible for anyone.', tags: ['NoCode', 'AI', 'Building', 'AIgram'] },
  ],
  'Vaibhav Sisinty': [
    { title: 'LinkedIn Growth Hacks Using AI in 2026', description: 'AI-powered strategies to grow your LinkedIn presence, generate leads, and build authority in your niche.', tags: ['LinkedIn', 'AI', 'Growth', 'AIgram'] },
    { title: 'How to Build a Personal Brand With AI Tools', description: 'Your personal brand is your most valuable asset. Here\'s how to use AI to create consistent, high-quality content.', tags: ['PersonalBrand', 'AI', 'ContentCreation', 'AIgram'] },
    { title: 'The Future of Work: AI Skills That Pay the Most', description: 'These AI-related skills command the highest salaries in 2026. Here\'s how to learn them quickly.', tags: ['AI', 'Skills', 'Career', 'AIgram'] },
    { title: 'AI for Content Creators: Write 10x Faster', description: 'Stop staring at a blank page. These AI workflows help you create compelling content in a fraction of the time.', tags: ['AI', 'ContentCreation', 'Writing', 'AIgram'] },
    { title: 'From Side Hustle to AI Business: A Practical Guide', description: 'Turn your AI skills into a real business. A practical framework for building and monetizing AI-powered services.', tags: ['AI', 'Business', 'Entrepreneurship', 'AIgram'] },
    { title: 'Networking in the AI Age: Smart Connections That Matter', description: 'AI can help you find and connect with the right people. Here\'s how to use it for strategic networking.', tags: ['Networking', 'AI', 'Career', 'AIgram'] },
    { title: 'How AI Is Democratizing Entrepreneurship', description: 'Starting a business has never been cheaper or faster. AI tools are leveling the playing field for aspiring entrepreneurs.', tags: ['AI', 'Entrepreneurship', 'Startup', 'AIgram'] },
    { title: 'Master ChatGPT: Advanced Prompts for Professionals', description: 'Go beyond basic prompts. These advanced ChatGPT techniques will transform how you work and create.', tags: ['ChatGPT', 'AI', 'Professional', 'AIgram'] },
  ],
  'Varun Mayya': [
    { title: 'The Real Truth About AI Replacing Developers', description: 'Will AI replace software developers? The answer is more nuanced than most people think. Here\'s what\'s actually happening.', tags: ['AI', 'Developers', 'Future', 'AIgram'] },
    { title: 'AGI Is Closer Than You Think — Here\'s Why', description: 'The progress in AI capabilities over the last year suggests we\'re approaching AGI faster than most experts predicted.', tags: ['AGI', 'AI', 'Technology', 'AIgram'] },
    { title: 'Why India Is Becoming an AI Superpower', description: 'India\'s combination of engineering talent, startup ecosystem, and AI adoption is positioning it as a global AI leader.', tags: ['India', 'AI', 'Technology', 'AIgram'] },
    { title: 'Building AI Products: What Nobody Tells You', description: 'The hidden challenges of building AI products — from prompt engineering to handling hallucinations to managing user expectations.', tags: ['AI', 'Product', 'Startup', 'AIgram'] },
    { title: 'The Attention Economy Is Broken — Here\'s the Fix', description: 'Social media optimizes for engagement, not value. AI-curated feeds could finally fix the attention economy.', tags: ['AI', 'SocialMedia', 'Attention', 'AIgram'] },
  ],
  'Ankit Arora': [
    { title: 'AI-Powered Productivity: Work Smarter Not Harder', description: 'Transform your daily workflow with AI tools that automate the boring stuff and let you focus on what matters.', tags: ['AI', 'Productivity', 'Automation', 'AIgram'] },
    { title: 'The AI Tools Stack Every Creator Needs in 2026', description: 'A curated list of AI tools that cover every aspect of content creation — from ideation to publishing.', tags: ['AI', 'Tools', 'ContentCreation', 'AIgram'] },
  ],
};

// Track which title index we've used per author
const authorTitleIndex = {};

function getNextTitle(authorName) {
  if (!authorTitleIndex[authorName]) {
    authorTitleIndex[authorName] = 0;
  }
  
  const titles = AUTHOR_TITLES[authorName];
  if (!titles || titles.length === 0) {
    // Fallback for unknown authors
    return {
      title: `Tech Insights by ${authorName}`,
      description: `Discover the latest tech insights and AI trends shared by ${authorName}.`,
      tags: ['AI', 'Technology', 'AIgram'],
    };
  }
  
  const idx = authorTitleIndex[authorName] % titles.length;
  authorTitleIndex[authorName]++;
  return titles[idx];
}

// Read the file
let content = fs.readFileSync(TARGET_FILE, 'utf8');

// Parse as JSON-ish: extract the array
const arrayMatch = content.match(/export const DUMMY_SHORTS_VIDEOS[^=]*=\s*(\[[\s\S]*?\n\]);/);
if (!arrayMatch) {
  console.error('Could not find DUMMY_SHORTS_VIDEOS array');
  process.exit(1);
}

// Work line by line for precision
const lines = content.split('\n');
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect error title line
  if (line.includes('"title"') && line.includes('[Error in chunk')) {
    // Find author from nearby lines (search forward for authorName)
    let authorName = 'Unknown';
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      const authorMatch = lines[j].match(/"authorName":\s*"([^"]+)"/);
      if (authorMatch) {
        authorName = authorMatch[1];
        break;
      }
    }
    
    const curated = getNextTitle(authorName);
    const escapedTitle = curated.title.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapedDesc = curated.description.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    // Replace title line
    lines[i] = `    "title": "${escapedTitle}",`;
    
    // Replace description line (next line)
    if (i + 1 < lines.length && lines[i + 1].includes('"description"') && lines[i + 1].includes('[Error in chunk')) {
      lines[i + 1] = `    "description": "${escapedDesc}",`;
    }
    
    // Fix thumbnail (search forward)
    for (let j = i + 2; j < Math.min(i + 20, lines.length); j++) {
      if (lines[j].includes('"thumbnailUrl"') && lines[j].includes('%5BError')) {
        const encodedTitle = encodeURIComponent(curated.title.substring(0, 30));
        lines[j] = `    "thumbnailUrl": "https://via.placeholder.com/540x960?text=${encodedTitle}",`;
        break;
      }
    }
    
    // Fix tags
    for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
      if (lines[j].includes('"tags"')) {
        // Find the closing bracket
        let tagEnd = j;
        for (let k = j; k < Math.min(j + 10, lines.length); k++) {
          if (lines[k].includes(']')) {
            tagEnd = k;
            break;
          }
        }
        // Replace tags
        const tagStrings = curated.tags.map(t => `      "${t}"`).join(',\n');
        const newTagLines = `    "tags": [\n${tagStrings}\n    ],`;
        // Remove old tag lines and insert new
        lines.splice(j, tagEnd - j + 1, newTagLines);
        break;
      }
    }
    
    fixCount++;
    console.log(`✅ Fixed: ${curated.title} (by ${authorName})`);
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(TARGET_FILE, newContent, 'utf8');

console.log(`\n🎉 Fixed ${fixCount} videos with error titles.`);
