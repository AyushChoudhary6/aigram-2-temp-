const fs = require('fs');

// Direct old→new title/description replacements
const replacements = [
  // 100x Engineers (11 reels)
  { oldTitle: "100x Engineers — Reel 4", newTitle: "Why 10x engineers are a myth — but 100x teams aren't", oldDesc: "Content by 100x Engineers", newDesc: "The real secret behind high-performing engineering teams" },
  { oldTitle: "100x Engineers — Reel 5", newTitle: "The one skill every engineer ignores (and it's not coding)", oldDesc: "Content by 100x Engineers", newDesc: "Communication is the ultimate force multiplier" },
  { oldTitle: "100x Engineers — Reel 6", newTitle: "Stop grinding LeetCode — do this instead", oldDesc: "Content by 100x Engineers", newDesc: "How top engineers actually land FAANG offers" },
  { oldTitle: "100x Engineers — Reel 7", newTitle: "AI will replace 80% of coding jobs — here's what to do", oldDesc: "Content by 100x Engineers", newDesc: "The skills that will keep you relevant in 2026" },
  { oldTitle: "100x Engineers — Reel 8", newTitle: "The biggest mistake new developers make", oldDesc: "Content by 100x Engineers", newDesc: "Why building projects beats collecting certificates" },
  { oldTitle: "100x Engineers — Reel 9", newTitle: "How I went from 0 to $100K as a self-taught developer", oldDesc: "Content by 100x Engineers", newDesc: "My unconventional path into tech" },
  { oldTitle: "100x Engineers — Reel 10", newTitle: "Cursor AI just changed coding forever — here's proof", oldDesc: "Content by 100x Engineers", newDesc: "AI-powered IDE that writes code faster than you" },
  { oldTitle: "100x Engineers — Reel 11", newTitle: "The tech stack that every startup needs in 2026", oldDesc: "Content by 100x Engineers", newDesc: "Lean, fast, and AI-native from day one" },
  { oldTitle: "100x Engineers — Reel 1", newTitle: "Why most engineers will never get promoted", oldDesc: "Content by 100x Engineers", newDesc: "The uncomfortable truth about career growth in tech" },
  { oldTitle: "100x Engineers — Reel 2", newTitle: "This GitHub trick saves 3 hours every week", oldDesc: "Content by 100x Engineers", newDesc: "Automate your workflow like a senior engineer" },
  { oldTitle: "100x Engineers — Reel 3", newTitle: "5 tools that replaced my entire dev team", oldDesc: "Content by 100x Engineers", newDesc: "Building faster with AI-powered development" },

  // Builders Central (8 reels)
  { oldTitle: "Builders Central — Reel 1", newTitle: "I built a $1M product in 30 days — here's how", oldDesc: "Content by Builders Central", newDesc: "Speed is the ultimate competitive advantage" },
  { oldTitle: "Builders Central — Reel 2", newTitle: "The founder mistake that kills 90% of startups", oldDesc: "Content by Builders Central", newDesc: "It's not about the idea — it's about execution" },
  { oldTitle: "Builders Central — Reel 3", newTitle: "Why solo founders are winning in 2026", oldDesc: "Content by Builders Central", newDesc: "AI tools have leveled the playing field" },
  { oldTitle: "Builders Central — Reel 4", newTitle: "Your MVP should take 2 weeks, not 2 months", oldDesc: "Content by Builders Central", newDesc: "Ship fast, learn faster, iterate always" },
  { oldTitle: "Builders Central — Reel 5", newTitle: "How I got my first 1000 users with $0 marketing", oldDesc: "Content by Builders Central", newDesc: "Organic growth strategies that actually work" },
  { oldTitle: "Builders Central — Reel 6", newTitle: "The business model every AI startup should copy", oldDesc: "Content by Builders Central", newDesc: "Why usage-based pricing wins in the AI era" },
  { oldTitle: "Builders Central — Reel 7", newTitle: "Stop building features nobody asked for", oldDesc: "Content by Builders Central", newDesc: "Talk to your users before writing a single line of code" },
  { oldTitle: "Builders Central — Reel 8", newTitle: "3 ideas that can make you ₹1 crore this year", oldDesc: "Content by Builders Central", newDesc: "Untapped opportunities in the Indian tech ecosystem" },

  // Varun Mayya (5 reels)
  { oldTitle: "Varun Mayya — Reel 1", newTitle: "AGI is closer than you think — and nobody's ready", oldDesc: "Content by Varun Mayya", newDesc: "Why the next 2 years will change everything" },
  { oldTitle: "Varun Mayya — Reel 2", newTitle: "I tested every AI model so you don't have to", oldDesc: "Content by Varun Mayya", newDesc: "GPT-4o vs Claude vs Gemini — the honest comparison" },
  { oldTitle: "Varun Mayya — Reel 3", newTitle: "The AI agent revolution is here — are you building?", oldDesc: "Content by Varun Mayya", newDesc: "Why autonomous agents are the next platform shift" },
  { oldTitle: "Varun Mayya — Reel 4", newTitle: "Why India will lead the next wave of AI startups", oldDesc: "Content by Varun Mayya", newDesc: "The cost advantage nobody is talking about" },
  { oldTitle: "Varun Mayya — Reel 5", newTitle: "This AI trick makes you 10x more productive", oldDesc: "Content by Varun Mayya", newDesc: "How I use AI to compress 8 hours into 2" },

  // Vaibhav Sisinty (11 reels)
  { oldTitle: "Vaibhav Sisinty — Reel 1", newTitle: "How I grew to 1M followers on LinkedIn", oldDesc: "Content by Vaibhav Sisinty", newDesc: "The content framework that changed everything" },
  { oldTitle: "Vaibhav Sisinty — Reel 2", newTitle: "Your LinkedIn profile is losing you opportunities", oldDesc: "Content by Vaibhav Sisinty", newDesc: "Fix these 5 things today" },
  { oldTitle: "Vaibhav Sisinty — Reel 3", newTitle: "The AI skill that will make you irreplaceable", oldDesc: "Content by Vaibhav Sisinty", newDesc: "It's not prompt engineering — it's something bigger" },
  { oldTitle: "Vaibhav Sisinty — Reel 4", newTitle: "Why you should start a personal brand right now", oldDesc: "Content by Vaibhav Sisinty", newDesc: "The compound effect of building in public" },
  { oldTitle: "Vaibhav Sisinty — Reel 5", newTitle: "ChatGPT can write your resume — but should it?", oldDesc: "Content by Vaibhav Sisinty", newDesc: "The do's and don'ts of AI-powered job applications" },
  { oldTitle: "Vaibhav Sisinty — Reel 6", newTitle: "3 side hustles that actually pay in 2026", oldDesc: "Content by Vaibhav Sisinty", newDesc: "Leverage AI to build income streams" },
  { oldTitle: "Vaibhav Sisinty — Reel 7", newTitle: "The networking hack that landed me my dream job", oldDesc: "Content by Vaibhav Sisinty", newDesc: "How one LinkedIn message changed my career" },
  { oldTitle: "Vaibhav Sisinty — Reel 8", newTitle: "Stop chasing jobs — make opportunities chase you", oldDesc: "Content by Vaibhav Sisinty", newDesc: "How personal branding flips the script" },
  { oldTitle: "Vaibhav Sisinty — Reel 9", newTitle: "This free AI tool is better than $500 courses", oldDesc: "Content by Vaibhav Sisinty", newDesc: "Why self-learners are winning the career game" },
  { oldTitle: "Vaibhav Sisinty — Reel 10", newTitle: "The resume trick that gets you interviews instantly", oldDesc: "Content by Vaibhav Sisinty", newDesc: "Hiring managers don't want to tell you this" },
  { oldTitle: "Vaibhav Sisinty — Reel 11", newTitle: "How to learn any skill in 30 days using AI", oldDesc: "Content by Vaibhav Sisinty", newDesc: "The accelerated learning framework" },

  // Ishan Sharma (6 reels)
  { oldTitle: "Ishan Sharma — Reel 1", newTitle: "OpenAI just dropped something insane — let me explain", oldDesc: "Content by Ishan Sharma", newDesc: "Breaking down the latest AI announcement" },
  { oldTitle: "Ishan Sharma — Reel 2", newTitle: "This 19-year-old built a $10M AI startup", oldDesc: "Content by Ishan Sharma", newDesc: "The Gen Z founder who's disrupting education" },
  { oldTitle: "Ishan Sharma — Reel 3", newTitle: "Why every student needs to learn AI right now", oldDesc: "Content by Ishan Sharma", newDesc: "The jobs of tomorrow require skills of today" },
  { oldTitle: "Ishan Sharma — Reel 4", newTitle: "I replaced my entire workflow with AI tools", oldDesc: "Content by Ishan Sharma", newDesc: "From writing to coding to design — all AI" },
  { oldTitle: "Ishan Sharma — Reel 5", newTitle: "The dark side of AI nobody talks about", oldDesc: "Content by Ishan Sharma", newDesc: "Deepfakes, job loss, and what we can do" },
  { oldTitle: "Ishan Sharma — Reel 6", newTitle: "Google vs OpenAI — who's actually winning?", oldDesc: "Content by Ishan Sharma", newDesc: "The AI race explained in 60 seconds" },
];

let content = fs.readFileSync('src/utils/dummyShorts.ts', 'utf8');
let titleCount = 0;
let descCount = 0;

for (const r of replacements) {
  // Replace title (exact match)
  const oldTitleStr = `"title": "${r.oldTitle}"`;
  const newTitleStr = `"title": "${r.newTitle}"`;
  if (content.includes(oldTitleStr)) {
    content = content.replace(oldTitleStr, newTitleStr);
    titleCount++;
  } else {
    console.log(`WARNING: Title not found: "${r.oldTitle}"`);
  }
}

// Descriptions need special handling since "Content by X" appears multiple times
// We replace them by finding the pattern: newTitle on the line before the description
for (const r of replacements) {
  const pattern = `"title": "${r.newTitle}",\n    "description": "${r.oldDesc}"`;
  const replacement = `"title": "${r.newTitle}",\n    "description": "${r.newDesc}"`;
  if (content.includes(pattern)) {
    content = content.replace(pattern, replacement);
    descCount++;
  } else {
    console.log(`WARNING: Description not found near: "${r.newTitle}"`);
  }
}

fs.writeFileSync('src/utils/dummyShorts.ts', content, 'utf8');
console.log(`Updated ${titleCount} titles and ${descCount} descriptions`);
