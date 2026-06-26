const fs = require('fs');
const content = fs.readFileSync('src/screens/main/PracticeScreen.tsx', 'utf8');
const start = content.indexOf('const defaultToolSections: ToolSection[] = [');
const end = content.indexOf('const PROMPT_CHALLENGES = [');

const replacement = `const defaultToolSections: ToolSection[] = [
  {
    id: 's1',
    emoji: '🚀',
    title: 'AI Basics & Concepts',
    subtitle: 'Start your journey with fundamental AI knowledge',
    cards: [
      { id: 'e1', title: "99% of Beginners Don t Know the Basics of AI", description: "Practice clip 1", tag: "Video", xp: 50 },
      { id: 'e10', title: "What is Artificial Intelligence? In 5 Minutes", description: "Practice clip 10", tag: "Video", xp: 500 },
      { id: 'e7', title: "Prompt Engineering Fundamentals", description: "Practice clip 7", tag: "Video", xp: 350 }
    ]
  },
  {
    id: 's2',
    emoji: '🛠️',
    title: 'Hands-On & No-Code Guides',
    subtitle: 'Build your own AI tools without writing code',
    cards: [
      { id: 'e2', title: "Build your own AI chatbot in 2 minutes", description: "Practice clip 2", tag: "Video", xp: 100 },
      { id: 'e5', title: "How to Create Your Own AI Assistant (No Code)", description: "Practice clip 5", tag: "Video", xp: 250 },
      { id: 'e3', title: "Free AI PDF Summarizer - Generate Summaries in Seconds", description: "Practice clip 3", tag: "Video", xp: 150 },
      { id: 'e9', title: "Training Your Own AI Model Is Not As Hard As You Think", description: "Practice clip 9", tag: "Video", xp: 450 }
    ]
  },
  {
    id: 's3',
    emoji: '💎',
    title: 'Pro Tips & Resources',
    subtitle: 'Get free limits, master formulas, and expert tricks',
    cards: [
      { id: 'e4', title: "Get Free API Keys for Any AI Model", description: "Practice clip 4", tag: "Video", xp: 200 },
      { id: 'e6', title: "Master the Perfect ChatGPT Prompt Formula", description: "Practice clip 6", tag: "Video", xp: 300 },
      { id: 'e8', title: "Secrets to Creating Stunning AI Images", description: "Practice clip 8", tag: "Video", xp: 400 }
    ]
  }
];

`;

fs.writeFileSync('src/screens/main/PracticeScreen.tsx', content.substring(0, start) + replacement + content.substring(end));
console.log('Fixed array');