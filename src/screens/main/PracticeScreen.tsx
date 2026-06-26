import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Image,
  Keyboard,
  BackHandler,
  KeyboardAvoidingView,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import WebView from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { Asset } from 'expo-asset';
import { useAuth } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuestionCard from '../../components/QuestionCard';
import SpotlightCard from '../../components/SpotlightCard';
import CodeEditor from '../../components/CodeEditor';
import useChat from '../../hooks/useChat';
import { PracticeQuestion, Question, Submission } from '../../types';
import { COLORS, GRADIENTS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { ROUTES, AWS_CONFIG } from '../../constants';
import { practiceVideoService, VideoLevel, UserVideoProgress } from '../../services/practiceVideoService';
import { practicePromptService } from '../../services/practicePromptService';
import { awsVideoUploadService } from '../../services/awsVideoUploadService';
import { geminiTranscriptionService, TranscriptResult, TranscriptStreamCallback, TranscriptStatusCallback } from '../../services/geminiTranscriptionService';
import { videoSourceResolver } from '../../utils/videoSourceResolver';

// Thumbnail imports
const thumbnails = [
  require('../../thumbnails/1.jpg'),
  require('../../thumbnails/2.jpg'),
  require('../../thumbnails/3.jpg'),
  require('../../thumbnails/4.jpg'),
];

const isWeb = Platform.OS === 'web';

// Cross-platform file interface
interface CrossPlatformFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

// Level interface for compatibility
interface Level {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  xp: number;
  proofRequired: string[];
}

type PromptDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface PromptChallenge {
  id: string;
  difficulty: PromptDifficulty;
  category: string;
  title: string;
  duration: string;
  tools: string;
}

type LeaderboardRange = 'all' | 'week' | 'month';

interface PracticeLeaderboardEntry {
  id: string;
  name: string;
  avatarLetter: string;
  level: number;
  completed: number;
  xp: number;
}

interface ToolCard {
  id: string;
  title: string;
  description: string;
  tag: string;
  xp: number;
}

interface ToolSection {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  cards: ToolCard[];
}


// Default arrays - data will be loaded from AWS S3
const defaultVideoLevels: VideoLevel[] = [
  {
    "id": 7,
    "level_number": 7,
    "title": "99% of Beginners Don't Know the Basics of AI",
    "description": "Discover the AI basics that most beginners overlook. Build a solid foundation before diving into advanced topics.",
    "goal": "Watch the video entirely and try to replicate the prompt.",
    "hint": "Focus on the key subjects mentioned in the video.",
    "proof_type": ["video", "screenshot"],
    "xp_reward": 50,
    "skill_category": "AI Basics",
    "video_url": "https://aigram-doomscroll-videos-2026-v2.s3.ap-south-1.amazonaws.com/practice-screen-videos/basics_of_ai.mp4",
    "thumbnail_url": undefined,
    "difficulty": "EASY",
    "tags": ["AI", "Basics", "Beginners", "Practice"]
  },
  {
    "id": 10,
    "level_number": 10,
    "title": "Get Free API Keys for Any AI Model – Unlimited AI Credits",
    "description": "Get free API keys and unlimited credits for Claude, OpenAI, Gemini, and more AI models in 2026.",
    "goal": "Watch the video entirely and try to replicate the prompt.",
    "hint": "Focus on the key subjects mentioned in the video.",
    "proof_type": ["video", "screenshot"],
    "xp_reward": 200,
    "skill_category": "AI Resources",
    "video_url": "https://aigram-doomscroll-videos-2026-v2.s3.ap-south-1.amazonaws.com/practice-screen-videos/get_free_api_keys.mp4",
    "thumbnail_url": undefined,
    "difficulty": "EASY",
    "tags": ["API", "Free", "Claude", "OpenAI", "Gemini", "Practice"]
  },
  {
    "id": 16,
    "level_number": 16,
    "title": "What is Artificial Intelligence? AI Explained in 5 Minutes",
    "description": "A clear, beginner-friendly explanation of what Artificial Intelligence is and how it works.",
    "goal": "Watch the video entirely and try to replicate the prompt.",
    "hint": "Focus on the key subjects mentioned in the video.",
    "proof_type": ["video", "screenshot"],
    "xp_reward": 500,
    "skill_category": "AI Basics",
    "video_url": "https://aigram-doomscroll-videos-2026-v2.s3.ap-south-1.amazonaws.com/practice-screen-videos/what_is_ai.mp4",
    "thumbnail_url": undefined,
    "difficulty": "HARD",
    "tags": ["AI", "Basics", "Explained", "Practice"]
  }
]
const defaultPromptChallenges: PromptChallenge[] = [
  {
    id: 'pc1',
    difficulty: 'easy',
    category: 'Creative Writing',
    title: 'Poem about the Night Sky',
    duration: '2 mins',
    tools: 'ChatGPT, Gemini'
  },
  {
    id: 'pc2',
    difficulty: 'easy',
    category: 'Educational',
    title: 'Explain AI in One Sentence',
    duration: '1 mins',
    tools: 'ChatGPT, Claude'
  },
  {
    id: 'pc3',
    difficulty: 'medium',
    category: 'Health & Fitness',
    title: 'List 3 Healthy Breakfast Options',
    duration: '3 mins',
    tools: 'Any LLM'
  }
];
const defaultPracticeLeaderboardEntries: PracticeLeaderboardEntry[] = [];
const defaultToolSections: ToolSection[] = [
  {
    id: 's1',
    emoji: 'ðŸš€',
    title: 'AI Basics & Concepts',
    subtitle: 'Start your journey with fundamental AI knowledge',
    cards: [
      { id: '7', title: "99% of Beginners Don't Know the Basics of AI", description: "Discover the AI basics most beginners overlook", tag: "Video", xp: 50 },
      { id: '16', title: "What is Artificial Intelligence? AI Explained in 5 Minutes", description: "A clear, beginner-friendly explanation of AI", tag: "Video", xp: 500 },
      { id: '10', title: "Get Free API Keys for Any AI Model", description: "Get unlimited AI credits for top models", tag: "Video", xp: 200 }
    ]
  },
  {
    id: 's2',
    emoji: 'ðŸ› ï¸',
    title: 'Hands-On & No-Code Guides',
    subtitle: 'Build your own AI tools without writing code',
    cards: [
      { id: '8', title: "Build Your Own AI Chatbot in 2 Minutes Without Code", description: "Build a fully functional AI chatbot in 2 minutes", tag: "Video", xp: 100 },
      { id: '11', title: "How to Create Your Own AI Assistant (No Code)", description: "Build a personalized AI assistant without code", tag: "Video", xp: 250 },
      { id: '9', title: "Free AI PDF Summarizer – Generate Summaries in Seconds", description: "Summarize any PDF in seconds with free AI tools", tag: "Video", xp: 150 },
      { id: '15', title: "Training Your Own AI Model Is Not As Hard As You Think", description: "Beginner-friendly guide to training custom AI models", tag: "Video", xp: 450 }
    ]
  },
  {
    id: 's3',
    emoji: 'ðŸ’Ž',
    title: 'Pro Tips & Resources',
    subtitle: 'Get free limits, master formulas, and expert tricks',
    cards: [
      { id: '10', title: "Get Free API Keys for Any AI Model – Unlimited AI Credits", description: "Free API keys for Claude, OpenAI, Gemini and more", tag: "Video", xp: 200 },
      { id: '12', title: "Master the Perfect ChatGPT Prompt Formula (in 8 Minutes)", description: "The exact formula for perfect ChatGPT prompts", tag: "Video", xp: 300 },
      { id: '14', title: "Secrets to Creating Stunning AI Images – Expert Prompts", description: "Expert prompts for stunning Midjourney & DALL-E images", tag: "Video", xp: 400 }
    ]
  },
  {
    id: 's4',
    emoji: '🤖',
    title: 'Advanced AI Agents & Deployment',
    subtitle: 'Master complex AI workflows and model fine-tuning',
    cards: [
      { id: '15', title: "Training Your Own AI Model Is Not As Hard As You Think", description: "Beginner-friendly guide to training custom AI models", tag: "Video", xp: 550 }
    ]
  }
];

const PROMPT_CHALLENGES = [
  {
    id: 1,
    task: "Create an image of a horse flying in the sky",
    keywords: ["horse", "fly", "flying", "sky", "wings", "clouds"],
  },
  {
    id: 2,
    task: "Write a polite email asking for sick leave tomorrow",
    keywords: ["sick", "leave", "tomorrow", "unwell", "absence", "apolog", "doctor", "rest", "ill"],
  },
  {
    id: 3,
    task: "Explain how a microwave works to a 7-year-old",
    keywords: ["microwave", "wave", "water", "heat", "food", "warm", "magic", "box", "child", "kid", "understand"],
  },
  {
    id: 4,
    task: "Write a professional resignation letter with 2 weeks notice",
    keywords: ["resign", "notice", "two weeks", "position", "opportunity", "thank you", "transition", "leave"],
  },
  {
    id: 5,
    task: "Generate a Python script to reverse a string",
    keywords: ["python", "script", "code", "reverse", "string", "function", "def", "return"],
  },
  {
    id: 6,
    task: "Write a catchy Instagram caption for a beach vacation",
    keywords: ["instagram", "caption", "beach", "vacation", "sun", "sand", "ocean", "waves", "paradise", "relax"],
  },
  {
    id: 7,
    task: "Summarize the plot of the movie 'The Matrix' in 3 sentences",
    keywords: ["matrix", "neo", "simulation", "reality", "morpheus", "red pill", "blue pill", "hack", "machine"],
  },
  {
    id: 8,
    task: "Create a 3-day workout plan for a beginner",
    keywords: ["workout", "plan", "beginner", "exercise", "rest", "cardio", "strength", "routine", "day"],
  },
  {
    id: 9,
    task: "Generate a Midjourney prompt for a cyberpunk city at night",
    keywords: ["midjourney", "prompt", "cyberpunk", "city", "night", "neon", "lights", "futuristic", "rain", "dark", "8k", "detailed"],
  },
  {
    id: 10,
    task: "Write a professional LinkedIn connection message to a recruiter",
    keywords: ["linkedin", "message", "recruiter", "connect", "network", "career", "role", "experience", "profile", "interest"],
  },
  {
    id: 11,
    task: "Explain the difference between React and Angular simply",
    keywords: ["react", "angular", "framework", "library", "javascript", "components", "virtual dom", "state", "ui", "comparison"],
  },
  {
    id: 12,
    task: "Draft a short sci-fi story about a robot learning to feel",
    keywords: ["story", "robot", "feel", "emotion", "sci-fi", "learn", "human", "heart", "machine", "consciousness"],
  },
  {
    id: 13,
    task: "Write a recipe for quick 15-minute vegan pasta",
    keywords: ["recipe", "vegan", "pasta", "15 minute", "quick", "ingredients", "instructions", "boil", "sauce", "vegetables"],
  }
];

const PREDEFINED_PROMPTS = [
  {
    trigger: "Write a short poem about the night sky",
    answer: "The stars awake in velvet dark,\nA thousand glowing, quiet sparks.\nThe moon sits high, a silver king,\nWhile shadows dance and crickets sing."
  },
  {
    trigger: "Explain ai in one sentence",
    answer: "Artificial Intelligence is the simulation of human intelligence processes by machines, especially computer systems."
  },
  {
    trigger: "List 3 healthy breakfast options",
    answer: "1. Oatmeal with berries and nuts.\n2. Greek yogurt with honey and chia seeds.\n3. Whole grain toast with avocado and a poached egg."
  },
  {
    trigger: "What is the capital of france",
    answer: "The capital of France is Paris."
  },
  {
    trigger: "How to say hello in spanish",
    answer: "You can say hello in Spanish by saying 'Hola'."
  },
  {
    trigger: "Who painted the mona lisa",
    answer: "The Mona Lisa was painted by Leonardo da Vinci."
  },
  {
    trigger: "What is the square root of 144",
    answer: "The square root of 144 is 12."
  },
  {
    trigger: "Write a haiku about coffee",
    answer: "Warm cup in my hands,\nMorning brew awakes my soul,\nDark magic in a mug."
  },
  {
    trigger: "Name 3 programming languages",
    answer: "1. Python\n2. JavaScript\n3. Java"
  },
  {
    trigger: "How many planets are in the solar system",
    answer: "There are eight planets in the solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune."
  },
  {
    trigger: "Explain quantum physics simply",
    answer: "Quantum physics is the study of matter and energy at the most fundamental level, revealing that everything behaves as both a particle and a wave."
  },
  {
    trigger: "What is the tallest mountain in the world",
    answer: "Mount Everest is the tallest mountain in the world above sea level, at 8,848.86 meters (29,031.7 feet)."
  },
  {
    trigger: "Give me a random fact",
    answer: "Did you know? Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible."
  }
];

const NativeWalkthroughPlayer = ({ source, containerWidth, containerHeight }: { source: string, containerWidth: number, containerHeight: number }) => {
  const player = useVideoPlayer(source, p => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: containerWidth, height: containerHeight, backgroundColor: '#000' }}
      contentFit="contain"
      nativeControls={true}
    />
  );
};

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user, isGuestUser } = useAuth();
  const navigation = useNavigation<any>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate responsive video container dimensions
  const videoContainerDimensions = useMemo(() => {
    const isLandscape = screenWidth > screenHeight;
    const padding = SPACING.lg;
    const maxVideoWidth = isWeb ? 1240 : screenWidth - (padding * 2);
    const maxVideoHeight = isWeb ? 760 : screenHeight - (padding * 2);
    
    // For proper aspect ratio handling
    let containerWidth = Math.min(maxVideoWidth, screenWidth - (padding * 2));
    let containerHeight = maxVideoHeight;
    
    // On mobile landscape, use full available space
    if (!isWeb && isLandscape) {
      containerWidth = screenWidth - (padding * 2);
      containerHeight = screenHeight - (padding * 2);
    }
    
    // On mobile portrait, maintain aspect ratio
    if (!isWeb && !isLandscape) {
      containerWidth = screenWidth - (padding * 2);
      // Allow vertical videos to use more height
      containerHeight = Math.min(screenHeight * 0.9, screenWidth * 1.7);
    }
    
    return { width: containerWidth, height: containerHeight };
  }, [screenWidth, screenHeight]);
  
  // State management
  const [activeMainTab, setActiveMainTab] = useState<"tools" | "prompting" | "leaderboard">("tools");
  const [activeLeaderboardRange, setActiveLeaderboardRange] = useState<LeaderboardRange>('all');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);

  // Filter state
  const [activeDifficulty, setActiveDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [activeCategory, setActiveCategory] = useState<'all' | 'basics' | 'handson' | 'premium'>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategoryView, setSelectedCategoryView] = useState<'basics' | 'handson' | 'premium' | 'advanced' | null>(null);

  // Category transition animation
  const categoryTransitionAnim = useRef(new Animated.Value(1)).current;
  const [pendingCategory, setPendingCategory] = useState<'basics' | 'handson' | 'premium' | 'advanced' | null>(null);

  const animateToCategoryView = useCallback((cat: 'basics' | 'handson' | 'premium' | 'advanced') => {
    categoryTransitionAnim.setValue(1);
    Animated.timing(categoryTransitionAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      setSelectedCategoryView(cat);
      Animated.timing(categoryTransitionAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  }, [categoryTransitionAnim]);

  const animateBackToCategories = useCallback(() => {
    categoryTransitionAnim.setValue(1);
    Animated.timing(categoryTransitionAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      setSelectedCategoryView(null);
      Animated.timing(categoryTransitionAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  }, [categoryTransitionAnim]);

  const categoryLabels: Record<string, string> = {
    all: 'All Categories',
    basics: 'AI Basics & Concepts',
    handson: 'Hands-On Guides',
    premium: 'Premium Content',
  };
  
  const {
    messages: chatMessages,
    input: promptDraft,
    loading: isGenerating,
    error: chatError,
    handleSend: handleSubmitPromptPractice,
    clearChat,
    retryLastMessage,
    setInput: setPromptDraft
  } = useChat();

  // Prompt practice local state (challenge-based evaluation)
  const [promptMessages, setPromptMessages] = useState<Array<{id: string; role: 'user' | 'assistant' | 'system'; content: string; status?: string}>>([]);
  const [promptInput, setPromptInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const promptScrollRef = useRef<ScrollView>(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const evaluatePrompt = useCallback((userPrompt: string, challenge: typeof PROMPT_CHALLENGES[0]) => {
    const lower = userPrompt.toLowerCase();
    const words = lower.split(/\s+/);

    // 1. Keyword match score (0-4 points)
    const matchedKeywords = challenge.keywords.filter(kw => lower.includes(kw));
    const keywordRatio = matchedKeywords.length / challenge.keywords.length;
    const keywordScore = Math.min(4, Math.round(keywordRatio * 4 * 10) / 10);

    // 2. Length & detail score (0-2 points)
    let lengthScore = 0;
    if (words.length >= 5) lengthScore = 0.5;
    if (words.length >= 10) lengthScore = 1;
    if (words.length >= 20) lengthScore = 1.5;
    if (words.length >= 30) lengthScore = 2;

    // 3. Specificity score (0-2 points) — checks for specifics like numbers, adjectives, context
    let specificityScore = 0;
    if (/\d/.test(userPrompt)) specificityScore += 0.5; // contains numbers
    if (/(please|make sure|ensure|include|should|must)/i.test(userPrompt)) specificityScore += 0.5; // instructions
    if (/(tone|style|format|audience|perspective|step|example)/i.test(userPrompt)) specificityScore += 0.5; // prompt craft terms
    if (userPrompt.includes('"') || userPrompt.includes("'") || userPrompt.includes(':')) specificityScore += 0.5; // structured
    specificityScore = Math.min(2, specificityScore);

    // 4. Clarity score (0-2 points) — sentence structure
    let clarityScore = 0;
    const sentences = userPrompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 1) clarityScore += 0.5;
    if (sentences.length >= 2) clarityScore += 0.5;
    if (words.length > 3 && words.length < 100) clarityScore += 0.5; // not too short or too long
    if (!/(.)\1{4,}/.test(userPrompt)) clarityScore += 0.5; // no spammy repetition
    clarityScore = Math.min(2, clarityScore);

    const totalScore = Math.min(10, Math.round((keywordScore + lengthScore + specificityScore + clarityScore) * 10) / 10);

    // Build advice
    const advice: string[] = [];
    if (keywordRatio < 0.4) {
      const missing = challenge.keywords.filter(kw => !lower.includes(kw)).slice(0, 3);
      advice.push(`Try including key concepts like: "${missing.join('", "')}"`);
    }
    if (words.length < 10) {
      advice.push('Add more detail — aim for at least 10-15 words to give the AI enough context.');
    }
    if (specificityScore < 1) {
      advice.push('Be more specific: mention the desired format, tone, audience, or include examples.');
    }
    if (clarityScore < 1.5) {
      advice.push('Use complete sentences and clear structure for better results.');
    }
    if (totalScore >= 8 && advice.length === 0) {
      advice.push('Excellent prompt! Try adding constraints (word count, style) to make it even sharper.');
    }

    return { score: totalScore, advice, matchedKeywords, keywordRatio };
  }, []);

  const handlePromptEvaluate = useCallback(() => {
    const text = promptInput.trim();
    if (!text || isEvaluating) return;

    const challenge = PROMPT_CHALLENGES[currentChallengeIndex];
    const userMsg = {
      id: Date.now().toString() + '_user',
      role: 'user' as const,
      content: text,
    };

    setPromptMessages(prev => [...prev, userMsg]);
    setPromptInput('');
    setIsEvaluating(true);

    // Simulate evaluation delay
    setTimeout(() => {
      const { score, advice } = evaluatePrompt(text, challenge);

      let response = `⭐ Prompt Score: ${score}/10\n\n`;
      response += `📋 Challenge: "${challenge.task}"\n\n`;

      if (score >= 8) {
        response += `🎉 Great job! Your prompt is well-crafted.\n\n`;
      } else if (score >= 5) {
        response += `👍 Good effort! Here's how to improve:\n\n`;
      } else {
        response += `💡 Let's work on this. Here are some tips:\n\n`;
      }

      advice.forEach((tip, i) => {
        response += `${i + 1}. ${tip}\n`;
      });

      if (score >= 7) {
        response += `\n✅ Moving to the next challenge!`;
      } else {
        response += `\nTry again to score 7+ and advance!`;
      }

      const aiMsg = {
        id: Date.now().toString() + '_ai',
        role: 'assistant' as const,
        content: response,
      };

      setPromptMessages(prev => [...prev, aiMsg]);
      setIsEvaluating(false);

      // Auto-advance on score >= 7
      if (score >= 7) {
        setTimeout(() => {
          setCurrentChallengeIndex((prev) => (prev + 1) % PROMPT_CHALLENGES.length);
        }, 2000);
      }

      // Scroll to bottom
      setTimeout(() => {
        promptScrollRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }, 1200);
  }, [promptInput, isEvaluating, currentChallengeIndex, evaluatePrompt]);

  const clearPromptChat = useCallback(() => {
    setPromptMessages([]);
  }, []);

  const [videoLevels, setVideoLevels] = useState<VideoLevel[]>(defaultVideoLevels);
  const [userProgress, setUserProgress] = useState<Record<number, UserVideoProgress>>({});
  const [selectedVideoLevel, setSelectedVideoLevel] = useState<VideoLevel | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [showWalkthroughDialog, setShowWalkthroughDialog] = useState(false);
  const [showVideoPlayerModal, setShowVideoPlayerModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Category mapping: video ID -> category key
  const videoCategoryMap: Record<number, 'basics' | 'handson' | 'premium' | 'advanced'> = useMemo(() => ({
    7: 'basics',   // 99% of Beginners Don't Know the Basics of AI
    10: 'basics',  // Get Free API Keys for Any AI Model
    16: 'basics',  // What is Artificial Intelligence?
  }), []);

  const filteredVideoLevels = useMemo(() => {
    return videoLevels.filter((level) => {
      const diffMatch = activeDifficulty === 'ALL' || level.difficulty === activeDifficulty;
      const catMatch = activeCategory === 'all' || videoCategoryMap[level.id] === activeCategory;
      return diffMatch && catMatch;
    });
  }, [videoLevels, activeDifficulty, activeCategory, videoCategoryMap]);

  const categoryCardsData = useMemo(() => [
    {
      key: 'basics' as const,
      label: 'AI Basics',
      subtitle: 'Fundamentals & concepts',
      thumbnail: thumbnails[0],
      videoCount: videoLevels.filter(v => videoCategoryMap[v.id] === 'basics').length,
    },
    {
      key: 'handson' as const,
      label: 'Hands-On',
      subtitle: 'No-code guides & tools',
      thumbnail: thumbnails[1],
      videoCount: videoLevels.filter(v => videoCategoryMap[v.id] === 'handson').length,
    },
    {
      key: 'premium' as const,
      label: 'Pro Tips',
      subtitle: 'Expert tricks & resources',
      thumbnail: thumbnails[2],
      videoCount: videoLevels.filter(v => videoCategoryMap[v.id] === 'premium').length,
    },
    {
      key: 'advanced' as const,
      label: 'Advanced AI',
      subtitle: 'Agents & Deployment',
      thumbnail: thumbnails[0], // Reuse a thumbnail for now
      videoCount: videoLevels.filter(v => videoCategoryMap[v.id] === 'advanced').length,
    },
  ], [videoLevels, videoCategoryMap]);

  const categoryVideos = useMemo(() => {
    if (!selectedCategoryView) return [];
    return videoLevels.filter(v => videoCategoryMap[v.id] === selectedCategoryView);
  }, [selectedCategoryView, videoLevels, videoCategoryMap]);

  // Bottom sheet animation
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const [sheetVisible, setSheetVisible] = useState(false);
  const screenHeightRef = useRef(screenHeight);
  useEffect(() => { screenHeightRef.current = screenHeight; }, [screenHeight]);

  const openBottomSheet = useCallback(() => {
    setSheetVisible(true);
    sheetAnim.setValue(0);
    backdropAnim.setValue(0);
    dragY.setValue(0);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(sheetAnim, {
        toValue: 1,
        damping: 26,
        stiffness: 220,
        mass: 0.7,
        useNativeDriver: true,
        overshootClamping: true,
      }),
    ]).start();
  }, [sheetAnim, backdropAnim, dragY]);

  const closeBottomSheet = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 230,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(() => {
      dragY.setValue(0);
      setSheetVisible(false);
      setShowWalkthroughDialog(false);
      setShowVideoPlayerModal(false);
      cb?.();
    });
  }, [sheetAnim, backdropAnim, dragY]);

  // PanResponder for drag-to-dismiss on the handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 4,
      onPanResponderMove: (_, gs) => {
        // Only allow dragging downward
        if (gs.dy > 0) {
          dragY.setValue(gs.dy);
          // Fade backdrop proportionally as user drags
          const progress = Math.max(0, 1 - gs.dy / 400);
          backdropAnim.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gs) => {
        // Dismiss if dragged far enough or fast enough
        if (gs.dy > 120 || gs.vy > 0.5) {
          // Snap the rest of the way down
          Animated.parallel([
            Animated.timing(dragY, {
              toValue: screenHeightRef.current,
              duration: 220,
              useNativeDriver: true,
              easing: Easing.in(Easing.cubic),
            }),
            Animated.timing(backdropAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            dragY.setValue(0);
            setSheetVisible(false);
            setShowWalkthroughDialog(false);
            setShowVideoPlayerModal(false);
          });
        } else {
          // Snap back to open
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              damping: 18,
              stiffness: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: (_, gs) => {
        // Snap back if interrupted
        Animated.spring(dragY, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (showWalkthroughDialog) openBottomSheet();
  }, [showWalkthroughDialog]);
  const [localWebVideoUris, setLocalWebVideoUris] = useState<string[]>([]);
  const [webVideosReady, setWebVideosReady] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<CrossPlatformFile | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transcript state
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptVideoTitle, setTranscriptVideoTitle] = useState('');
  const [transcriptCache, setTranscriptCache] = useState<Record<string, string>>({});
  const [transcriptStatus, setTranscriptStatus] = useState('');
  const [transcriptChunkCount, setTranscriptChunkCount] = useState(0);
  const transcriptScrollRef = React.useRef<ScrollView>(null);

  const handleTranscript = async (level: VideoLevel) => {
    // Check cache first
    const cacheKey = level.video_url || `level-${level.id}`;
    if (transcriptCache[cacheKey]) {
      setTranscriptText(transcriptCache[cacheKey]);
      setTranscriptVideoTitle(level.title);
      setTranscriptError(null);
      setTranscriptLoading(false);
      setShowTranscriptModal(true);
      return;
    }

    const videoUrl = level.video_url || getWalkthroughSource(level);
    if (!videoUrl) {
      Alert.alert('Error', 'No video URL available for transcription.');
      return;
    }

    setTranscriptVideoTitle(level.title);
    setTranscriptText('');
    setTranscriptError(null);
    setTranscriptLoading(true);
    setTranscriptStatus('Preparing...');
    setTranscriptChunkCount(0);
    setShowTranscriptModal(true);

    try {
      const result = await geminiTranscriptionService.transcribeVideoStream(
        videoUrl,
        // onChunk: stream text in real-time
        (chunk: string, fullText: string) => {
          setTranscriptText(fullText);
          setTranscriptChunkCount(prev => prev + 1);
          // Auto-scroll to bottom
          setTimeout(() => {
            transcriptScrollRef.current?.scrollToEnd({ animated: false });
          }, 50);
        },
        // onStatus: update loading status
        (status: string, detail?: string) => {
          setTranscriptStatus(detail || status);
        },
      );

      if (result.success) {
        setTranscriptText(result.transcript);
        setTranscriptCache(prev => ({ ...prev, [cacheKey]: result.transcript }));
      } else if (result.error) {
        // If we got partial text, keep it, but also show the error
        if (!result.transcript) {
          setTranscriptError(result.error);
        }
      }
    } catch (error: any) {
      setTranscriptError(error.message || 'Unexpected error during transcription');
    } finally {
      setTranscriptLoading(false);
    }
  };

  // â”€â”€ Quiz state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizTimeLimit, setQuizTimeLimit] = useState(5);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizVideoTitle, setQuizVideoTitle] = useState('');
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizStatus, setQuizStatus] = useState<string | null>(null);
  const quizTimerRef = React.useRef<any>(null);

  // Quiz timer
  useEffect(() => {
    if (showQuizModal && quizTimeLeft > 0) {
      quizTimerRef.current = setInterval(() => {
        setQuizTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(quizTimerRef.current);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(quizTimerRef.current);
    }
  }, [showQuizModal, quizTimeLeft > 0]);

  const handleStartQuiz = async (level: VideoLevel) => {
    setQuizVideoTitle(level.title);
    setShowQuizConfig(true);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedVideoLevel) return;
    const videoUrl = selectedVideoLevel.video_url || getWalkthroughSource(selectedVideoLevel);
    if (!videoUrl) {
      Alert.alert('Error', 'No video URL available for this level.');
      return;
    }

    setShowQuizConfig(false);
    setQuizLoading(true);
    setQuizStatus('Checking for cached transcript...');
    setQuizError(null);
    setQuizAnswers({});
    setQuizCurrentIndex(0);
    setShowQuizModal(true);

    try {
      console.log(`📘 [Quiz] Generating ${quizNumQuestions} questions, ${quizTimeLimit} min`);
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || AWS_CONFIG.BACKEND_URL;
      if (!BACKEND_URL) {
        throw new Error('Backend URL is not configured. Set EXPO_PUBLIC_BACKEND_URL or AWS_CONFIG.BACKEND_URL');
      }

      setQuizStatus('Generating quiz (this may take a minute on first run)...');
      const response = await fetch(`${BACKEND_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          numQuestions: quizNumQuestions,
          timeLimit: quizTimeLimit,
          videoTitle: selectedVideoLevel.title,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success' && data.questions?.length > 0) {
        setQuizQuestions(data.questions);
        setQuizTimeLeft(quizTimeLimit * 60);
        console.log(`✅ [Quiz] ${data.questions.length} questions generated`);
      } else {
        throw new Error('No questions were generated');
      }
    } catch (error: any) {
      console.error('❌ [Quiz] Generation failed:', error.message);
      setQuizError(error.message);
    } finally {
      setQuizLoading(false);
      setQuizStatus('');
    }
  };

    const handleQuizAnswer = (questionId: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleQuizSubmit = () => {
    clearInterval(quizTimerRef.current);
    // Calculate results
    let correct = 0;
    let wrong = 0;
    const details: any[] = [];

    quizQuestions.forEach(q => {
      const userAnswer = quizAnswers[q.id] || '';
      const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      if (isCorrect) correct++;
      else wrong++;
      details.push({
        ...q,
        userAnswer,
        isCorrect,
      });
    });

    const total = quizQuestions.length;
    const score = Math.round((correct / total) * 100);
    const timeUsed = (quizTimeLimit * 60) - quizTimeLeft;

    setQuizResults({
      total, correct, wrong,
      score,
      timeUsed,
      timeLimit: quizTimeLimit * 60,
      efficiency: Math.round((correct / total) * (quizTimeLeft / (quizTimeLimit * 60)) * 100),
      details,
    });

    setShowQuizModal(false);
    setShowQuizResults(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Android back button for bottom sheet and fullscreen video
  useEffect(() => {
    if (!sheetVisible && !showVideoPlayerModal) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showVideoPlayerModal) {
        setShowVideoPlayerModal(false);
        return true;
      }
      if (sheetVisible) {
        closeBottomSheet();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [sheetVisible, showVideoPlayerModal]);

  const isPromptDesktop = screenWidth >= 1024;
  const leaderboardEntries = defaultPracticeLeaderboardEntries;

  // Load video levels and progress
  useEffect(() => {
    loadVideoLevels();
  }, []);

  const loadVideoLevels = async () => {
    setLoading(true);
    try {
      // Video URLs are already embedded in defaultVideoLevels; no dynamic fetch needed.
      setVideoLevels(defaultVideoLevels);
    } catch (error) {
      console.error('Error loading video levels:', error);
      setVideoLevels(defaultVideoLevels);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeClick = (level: VideoLevel) => {
    setSelectedVideoLevel(level);
    setShowWalkthroughDialog(true);
    setShowHint(false);
    setShowVideoPlayerModal(false);
  };

  const handleStartTask = () => {
    // Hidden/Disabled for cloud-only view
  };

  const handlePlayVideo = async () => {
    if (!selectedVideoLevel) return;
    
    setIsResolving(true);
    try {
      const source = getWalkthroughSource(selectedVideoLevel);
      let resolved = source;
      
      // If it's an s3:// URL or a data object, we'd resolve it. But here it's already an HTTP URL.
      if (!source.startsWith('http')) {
        try {
          const result = await videoSourceResolver.resolveVideoSource(source as any, selectedVideoLevel.id.toString());
          if (result.success && result.data) {
            resolved = result.data.url;
          }
        } catch (e) {
          console.log('Resolver error:', e);
        }
      }
      
      setResolvedVideoUrl(resolved);
      
      if (isWeb) {
        // For web, we still open in a new tab for better UX with external links
        window.open(resolved, '_blank');
      } else {
        // Show in-app native video player for mobile
        setShowVideoPlayerModal(true);
      }
    } catch (error) {
      console.error('Error resolving video source:', error);
      Alert.alert(
        'Security Error', 
        'Failed to resolve secure video stream. Please ensure you are logged in and have a stable connection.'
      );
    } finally {
      setIsResolving(false);
    }
  };

  const getWalkthroughSource = (level?: VideoLevel | null): string => {
    if (level?.video_url) {
      return level.video_url;
    }
    
    // Fallback URL if cloud link is not available
    const fallbackVideos = [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
    ];

    if (!level) return fallbackVideos[0];
    return fallbackVideos[(level.level_number - 1) % fallbackVideos.length];
  };

  const getWalkthroughIndex = (level?: VideoLevel | null) => {
    if (!level) return 0;
    return (level.level_number - 1) % 5;
  };

  useEffect(() => {
    if (!isWeb) return;

    let cancelled = false;
    const localUris = [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
    ];

    setLocalWebVideoUris(localUris);
    setWebVideosReady(true);

    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-platform file picker function
  const openFilePicker = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const crossPlatformFile: CrossPlatformFile = {
              uri: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
              size: file.size,
            };
            handleVideoUpload(crossPlatformFile);
          }
        };
        input.click();
      } else {
        // React Native file picker (would use expo-document-picker in real app)
        Alert.alert(
          'File Picker',
          'In a real app, this would open the native file picker using expo-document-picker or react-native-document-picker'
        );
      }
    } catch (error) {
      console.error('Error opening file picker:', error);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  const handleVideoUpload = (file: CrossPlatformFile) => {
    if (file) {
      // For cross-platform compatibility, we'll validate basic properties
      if (file.size > 100 * 1024 * 1024) {
        Alert.alert('Invalid File', 'Video file must be under 100MB');
        return;
      }
      
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        Alert.alert('Invalid File', 'Only MP4, WebM, MOV, and AVI video formats are supported');
        return;
      }
      
      setUploadedVideo(file);
      setVideoPreviewUrl(file.uri);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedVideoLevel || !uploadedVideo) {
      Alert.alert('Missing Video', 'Please upload your screen recording');
      return;
    }
    if (!promptText.trim()) {
      Alert.alert('Missing Description', 'Please describe your approach/prompt used');
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, this would call the API
      // const response = await practiceVideoService.submitVideoProof({
      //   level_id: selectedVideoLevel.id,
      //   video_file: uploadedVideo,
      //   prompt_description: promptText,
      //   metadata: {
      //     duration: 0,
      //     file_size: uploadedVideo.size,
      //     file_type: uploadedVideo.type,
      //   }
      // });

      // Mock success response
      Alert.alert('Success!', `ðŸŽ‰ Nailed it! +${selectedVideoLevel.xp_reward} XP`);
      setShowUploadModal(false);
      setSelectedVideoLevel(null);
    } catch (error) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', 'Failed to submit proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelStatus = (level: VideoLevel) => {
    const progress = userProgress[level.id];
    if (!progress) return "available";
    return progress.status;
  };

  const promptDifficultyMeta: Record<PromptDifficulty, { label: string; dotColor: string }> = {
    easy: { label: 'Easy', dotColor: '#3FD98C' },
    medium: { label: 'Medium', dotColor: '#F6C453' },
    hard: { label: 'Hard', dotColor: '#FF6A45' },
    expert: { label: 'Expert', dotColor: '#F13B75' },
  };


  const completedProgramsCount = Object.values(userProgress).filter((p) => p.status === 'completed').length;
  const currentLevel = Math.max(1, completedProgramsCount + 1);
  const currentXP = Object.values(userProgress)
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.score || 0), 0);
  const doneCount = completedProgramsCount;
  const totalCount = Math.max(videoLevels.length, 50);
  const journeyNodePositions = [
    styles.journeyNodePos1,
    styles.journeyNodePos2,
    styles.journeyNodePos3,
    styles.journeyNodePos4,
    styles.journeyNodePos5,
  ];

  const renderLevel = ({ item }: { item: Level }) => (
    <View style={[
      styles.levelCard,
      item.status === 'current' && styles.currentLevelCard
    ]}>
      <View style={styles.levelHeader}>
        <View style={styles.levelLeft}>
          <View style={[
            styles.levelIcon,
            {
              backgroundColor: item.status === 'completed' ? COLORS.primary + '33' : 
                             item.status === 'current' ? COLORS.primary : COLORS.muted,
            }
          ]}>
            {item.status === 'completed' ? (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
            ) : item.status === 'locked' ? (
              <Ionicons name="lock-closed" size={16} color={COLORS.mutedForeground} />
            ) : (
              <Text style={[styles.levelNumber, { color: COLORS.primaryForeground }]}>
                {item.id}
              </Text>
            )}
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{item.title}</Text>
            <Text style={styles.levelDescription}>{item.description}</Text>
          </View>
        </View>
        <View style={[
          styles.xpBadge,
          { backgroundColor: item.status === 'completed' ? COLORS.primary : COLORS.glassBg }
        ]}>
          <Text style={[
            styles.xpText,
            { color: item.status === 'completed' ? COLORS.primaryForeground : COLORS.foreground }
          ]}>
            +{item.xp} XP
          </Text>
        </View>
      </View>

      {item.status !== 'locked' && (
        <View style={styles.levelContent}>
          <Text style={styles.proofTitle}>Proof Required:</Text>
          <View style={styles.proofList}>
            {item.proofRequired.map((proof, idx) => (
              <View key={idx} style={styles.proofItem}>
                <View style={styles.proofDot} />
                <Text style={styles.proofText}>{proof}</Text>
              </View>
            ))}
          </View>
          {item.status === 'current' && (
            <View style={styles.levelActions}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => setShowUploadModal(true)}
              >
                <Ionicons name="cloud-upload" size={16} color={COLORS.primaryForeground} />
                <Text style={styles.uploadButtonText}>Upload Screenshot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recordButton}>
                <Ionicons name="videocam" size={16} color={COLORS.primary} />
                <Text style={styles.recordButtonText}>Record Screen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 90 }]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Practice Platform</Text>
            <Text style={styles.headerSubtitle}>From beginner to corporate-ready AI generalist</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const renderHeader = () => (
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>{user?.displayName || 'Learner'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>
      </View>
  );

  const renderTabs = () => (
      <View style={styles.categorySelectorWrap}>
        <Text style={styles.categorySelectorTitle}>Select practice type</Text>
        <View style={styles.categorySelectorRow}>
          {([
            { key: 'tools' as const, icon: 'videocam-outline' as const, label: 'Videos' },
            { key: 'prompting' as const, icon: 'bulb-outline' as const, label: 'Prompting' },
            { key: 'leaderboard' as const, icon: 'trophy-outline' as const, label: 'Board' },
          ]).map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryCircle,
                activeMainTab === cat.key && styles.categoryCircleActive,
              ]}
              onPress={() => setActiveMainTab(cat.key)}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={activeMainTab === cat.key ? COLORS.primaryForeground : COLORS.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 90 }]}>
      {activeMainTab === "leaderboard" ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
          {renderTabs()}
          <View style={{ flex: 1 }}>
          <View style={styles.practiceLeaderboardHero}>
            <Text style={styles.practiceLeaderboardTitle}>
              <Ionicons name="trophy-outline" size={24} color="#00D084" /> Leaderboard
            </Text>
            <Text style={styles.practiceLeaderboardSubtitle}>Top AI learners</Text>
          </View>

          <View style={styles.practiceLeaderboardRangeWrap}>
            {[
              { key: 'all' as LeaderboardRange, label: 'All Time' },
              { key: 'week' as LeaderboardRange, label: 'This Week' },
              { key: 'month' as LeaderboardRange, label: 'This Month' },
            ].map((range) => (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.practiceLeaderboardRangeItem,
                  activeLeaderboardRange === range.key && styles.practiceLeaderboardRangeItemActive,
                ]}
                onPress={() => setActiveLeaderboardRange(range.key)}
              >
                <Text
                  style={[
                    styles.practiceLeaderboardRangeText,
                    activeLeaderboardRange === range.key && styles.practiceLeaderboardRangeTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.practiceLeaderboardList}>
            {leaderboardEntries.map((entry, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;
              return (
                <SpotlightCard
                  key={entry.id}
                  style={[
                    styles.practiceLeaderboardCard,
                    isFirst && styles.practiceLeaderboardCardGold,
                    isSecond && styles.practiceLeaderboardCardSilver,
                    isThird && styles.practiceLeaderboardCardBronze,
                  ]}
                  spotlightColor={isFirst ? "rgba(255, 215, 0, 0.2)" : isSecond ? "rgba(192, 192, 192, 0.2)" : isThird ? "rgba(205, 127, 50, 0.2)" : "rgba(255, 255, 255, 0.1)"}
                >
                  <View style={styles.practiceLeaderboardLeft}>
                    <View style={styles.practiceLeaderboardRankWrap}>
                      {rank <= 3 ? (
                        <Ionicons
                          name={rank === 1 ? 'trophy-outline' : rank === 2 ? 'medal-outline' : 'medal'}
                          size={22}
                          color={rank === 1 ? '#E9BE3F' : rank === 2 ? '#9AA3AF' : '#CC7E2A'}
                        />
                      ) : (
                        <Text style={styles.practiceLeaderboardRankText}>{rank}</Text>
                      )}
                    </View>
                    <View style={styles.practiceLeaderboardAvatar}>
                      <Text style={styles.practiceLeaderboardAvatarText}>{entry.avatarLetter}</Text>
                    </View>
                    <View>
                      <Text style={styles.practiceLeaderboardName}>{entry.name}</Text>
                      <Text style={styles.practiceLeaderboardMeta}>
                        <Ionicons name="star-outline" size={12} color="#9AB0C5" /> Level {entry.level}
                        {'  '}
                        <Ionicons name="radio-button-on-outline" size={12} color="#9AB0C5" /> {entry.completed} completed
                      </Text>
                    </View>
                  </View>
                  <View style={styles.practiceLeaderboardXpWrap}>
                    <Text style={styles.practiceLeaderboardXpValue}>{entry.xp}</Text>
                    <Text style={styles.practiceLeaderboardXpLabel}>XP</Text>
                  </View>
                </SpotlightCard>
              );
            })}
          </View>
          </View>
        </ScrollView>
      ) : activeMainTab === "prompting" ? (
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          {renderTabs()}

          {/* Chat Area */}
          <ScrollView 
            ref={promptScrollRef}
            style={styles.chatHistoryContainer} 
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xl }}
          >
            {/* Challenge Card - always visible */}
            <View style={styles.challengeCard}>
              <View style={styles.challengeCardHeader}>
                <View style={styles.challengeLevelPill}>
                  <Ionicons name="bulb" size={14} color="#F6C453" />
                  <Text style={styles.challengeLevelText}>Level {currentChallengeIndex + 1}</Text>
                </View>
                <Text style={styles.challengeCounter}>{currentChallengeIndex + 1} of {PROMPT_CHALLENGES.length}</Text>
                <TouchableOpacity onPress={clearPromptChat} style={styles.challengeClearBtn}>
                  <Ionicons name="refresh-outline" size={16} color="#7A8FA6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.challengeTaskLabel}>Write a prompt for:</Text>
              <Text style={styles.challengeTaskText}>
                "{PROMPT_CHALLENGES[currentChallengeIndex].task}"
              </Text>
              <Text style={styles.challengeHint}>
                Write your best prompt and Xino will rate it out of 10!
              </Text>
            </View>

            {/* Chat messages */}
            {promptMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View key={msg.id} style={[styles.chatBubbleRow, isUser ? styles.chatBubbleRowUser : styles.chatBubbleRowAi]}>
                  {!isUser && (
                    <View style={styles.chatAvatarSmall}>
                      <Ionicons name="sparkles" size={14} color="#00D084" />
                    </View>
                  )}
                  <View style={[
                    styles.chatBubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                  ]}>
                    {!isUser && (
                      <Text style={styles.chatBubbleSender}>Xino</Text>
                    )}
                    <Text style={[
                      styles.chatBubbleText,
                      isUser && styles.chatBubbleTextUser,
                    ]}>
                      {msg.content}
                    </Text>
                  </View>
                  {isUser && (
                    <View style={styles.chatAvatarSmallUser}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                        {(user?.displayName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
            {isEvaluating && (
              <View style={[styles.chatBubbleRow, styles.chatBubbleRowAi]}>
                <View style={styles.chatAvatarSmall}>
                  <Ionicons name="sparkles" size={14} color="#00D084" />
                </View>
                <View style={[styles.chatBubble, styles.aiBubble, styles.generatingBubble]}>
                  <ActivityIndicator size="small" color="#00D084" />
                  <Text style={styles.generatingText}>Xino is evaluating your prompt...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.chatInputContainer}>
            <View style={styles.chatInputWrapper}>
              <TextInput
                value={promptInput}
                onChangeText={setPromptInput}
                placeholder="Write your prompt here..."
                placeholderTextColor="#5F7188"
                multiline
                blurOnSubmit={true}
                returnKeyType="send"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handlePromptEvaluate();
                }}
                style={styles.chatInput}
              />
              <TouchableOpacity onPress={clearPromptChat} style={styles.chatClearBtn}>
                <Ionicons name="document-outline" size={18} color="#5F7188" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chatSendButton, !promptInput.trim() && styles.chatSendButtonDisabled]} 
                onPress={handlePromptEvaluate}
                disabled={!promptInput.trim() || isEvaluating}
              >
                <Ionicons name="arrow-up" size={20} color={promptInput.trim() ? '#fff' : '#5F7188'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderTabs()}

          {/* Hero Challenge Banner */}
          <TouchableOpacity
            style={styles.heroBanner}
            activeOpacity={0.85}
            onPress={() => {
              navigation.navigate(ROUTES.CHALLENGE_DETAIL, {
                currentLevel: currentLevel,
                currentXP: currentXP,
                doneCount: doneCount,
                totalCount: totalCount,
                streakDays: 0,
              });
            }}
          >
            <LinearGradient
              colors={['rgba(0, 208, 132, 0.18)', 'rgba(0, 184, 107, 0.06)']}
              style={styles.heroBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroBannerBadge}>
                <Ionicons name="trophy" size={14} color={COLORS.primary} />
                <Text style={styles.heroBannerBadgeText}>Challenge</Text>
              </View>
              <Text style={styles.heroBannerTitle}>Challenge With{`\n`}AI Coach</Text>
              <View style={styles.heroBannerBottom}>
                <View style={styles.heroBannerAction}>
                  <Text style={styles.heroBannerActionText}>Get Started</Text>
                  <View style={styles.heroBannerPlayBtn}>
                    <Ionicons name="play" size={14} color={COLORS.primaryForeground} />
                  </View>
                </View>
                <View style={styles.heroBannerStats}>
                  <View style={styles.miniPill}>
                    <Ionicons name="star" size={12} color={COLORS.primary} />
                    <Text style={styles.miniPillText}>Lv {currentLevel}</Text>
                  </View>
                  <View style={styles.miniPill}>
                    <Text style={styles.miniPillText}>{currentXP} XP</Text>
                  </View>
                  <View style={[styles.miniPill, styles.miniPillSolid]}>
                    <Text style={styles.miniPillSolidText}>{doneCount}/{totalCount}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Category Cards or Category Videos */}
          {selectedCategoryView === null ? (
            <Animated.View style={[styles.categorySectionWrap, {
              opacity: categoryTransitionAnim,
              transform: [{
                translateY: categoryTransitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-18, 0],
                }),
              }],
            }]}>
              <Text style={styles.categorySectionHeading}>Categories</Text>
              {categoryCardsData.map((cat, index) => (
                <Animated.View key={cat.key} style={{
                  opacity: categoryTransitionAnim,
                  transform: [{
                    translateY: categoryTransitionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 + index * 10, 0],
                    }),
                  }],
                }}>
                  <TouchableOpacity
                    style={styles.categoryCard}
                    activeOpacity={0.85}
                    onPress={() => animateToCategoryView(cat.key)}
                  >
                  <Image
                    source={cat.thumbnail}
                    style={styles.categoryCardImage as any}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={styles.categoryCardOverlay}
                  />
                  <View style={styles.categoryCardContent}>
                    <Text style={styles.categoryCardTitle}>{cat.label}</Text>
                    <Text style={styles.categoryCardSubtitle}>{cat.subtitle}</Text>
                    <View style={styles.categoryCardBadge}>
                      <Ionicons name="videocam" size={12} color={COLORS.primary} />
                      <Text style={styles.categoryCardBadgeText}>{cat.videoCount} videos</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.categoryVideoSection, {
              opacity: categoryTransitionAnim,
              transform: [{
                translateX: categoryTransitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }]}>
              {/* Back to categories */}
              <TouchableOpacity
                style={styles.categoryBackBtn}
                onPress={() => animateBackToCategories()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.foreground} />
                <Text style={styles.categoryBackText}>Categories</Text>
              </TouchableOpacity>

              <Text style={styles.categoryVideoHeading}>
                {categoryLabels[selectedCategoryView]}
              </Text>
              <Text style={styles.categoryVideoCount}>
                {categoryVideos.length} video{categoryVideos.length !== 1 ? 's' : ''}
              </Text>

              {/* Videos for selected category */}
              <View style={styles.categoryVideoList}>
                {categoryVideos.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={styles.categoryVideoCard}
                    activeOpacity={0.85}
                    onPress={() => handleEpisodeClick(level)}
                  >
                    <View style={styles.categoryVideoThumb}>
                      <Image
                        source={thumbnails[(level.id - 1) % thumbnails.length]}
                        style={styles.categoryVideoThumbImage as any}
                        resizeMode="cover"
                      />
                      <View style={styles.categoryVideoPlayIcon}>
                        <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
                      </View>
                    </View>
                    <View style={styles.categoryVideoInfo}>
                      <Text style={styles.categoryVideoTitle} numberOfLines={2}>{level.title}</Text>
                      <View style={styles.categoryVideoMeta}>
                        <View style={[styles.featuredDiffBadge, {
                          backgroundColor: level.difficulty === 'EASY' ? 'rgba(63,217,140,0.15)' :
                            level.difficulty === 'MEDIUM' ? 'rgba(246,196,83,0.15)' : 'rgba(255,106,69,0.15)',
                        }]}>
                          <Text style={[styles.featuredDiffText, {
                            color: level.difficulty === 'EASY' ? '#3FD98C' :
                              level.difficulty === 'MEDIUM' ? '#F6C453' : '#FF6A45',
                          }]}>{level.difficulty}</Text>
                        </View>
                        <View style={styles.categoryVideoXpBadge}>
                          <Text style={styles.categoryVideoXpText}>+{level.xp_reward} XP</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Walkthrough Video Bottom Sheet */}
      {sheetVisible && (
        <View style={styles.bottomSheetOverlay} pointerEvents="box-none">
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => closeBottomSheet()}>
            <Animated.View style={[styles.bottomSheetBackdrop, { opacity: backdropAnim }]} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.bottomSheetContainer,
              {
                transform: [{
                  translateY: Animated.add(
                    sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [screenHeight, 0],
                    }),
                    dragY,
                  ),
                }],
              },
            ]}
          >
            {selectedVideoLevel && (
              <View style={styles.bottomSheetContent}>
                {/* Drag Handle */}
                <View style={styles.sheetHandle} {...panResponder.panHandlers}>
                  <View style={styles.sheetHandleBar} />
                </View>

                {/* Scrollable content */}
                <ScrollView
                  style={styles.sheetScrollArea}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                >
                  <View style={styles.sheetTaskDetails}>
                    {/* Badges */}
                    <View style={styles.sheetPillRow}>
                      <View style={styles.sheetPill}>
                        <Ionicons name="layers-outline" size={11} color={COLORS.primary} />
                        <Text style={styles.sheetPillText}>Step {selectedVideoLevel.level_number}</Text>
                      </View>
                      <View style={styles.sheetPill}>
                        <Ionicons name="flash-outline" size={11} color="#facc15" />
                        <Text style={styles.sheetPillText}>+{selectedVideoLevel.xp_reward} XP</Text>
                      </View>
                      <View style={styles.sheetPill}>
                        <Ionicons name="star-outline" size={11} color={COLORS.primary} />
                        <Text style={styles.sheetPillText}>{selectedVideoLevel.difficulty}</Text>
                      </View>
                      <View style={styles.sheetPill}>
                        <Text style={styles.sheetPillText}>{selectedVideoLevel.skill_category}</Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.sheetTitle}>{selectedVideoLevel.title}</Text>

                    {/* Divider */}
                    <View style={styles.sheetDivider} />

                    {/* Description */}
                    <Text style={styles.sheetDesc}>{selectedVideoLevel.description}</Text>

                    {/* Goal Card */}
                    <View style={styles.sheetGoalCard}>
                      <View style={styles.sheetGoalHeader}>
                        <Ionicons name="flag-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.sheetGoalLabel}>Goal</Text>
                      </View>
                      <Text style={styles.sheetGoalText}>{selectedVideoLevel.goal}</Text>
                    </View>

                    {/* Hint */}
                    <TouchableOpacity
                      style={styles.sheetHintBtn}
                      onPress={() => setShowHint(!showHint)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="help-circle-outline" size={14} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.sheetHintBtnText}>
                        {showHint ? "Hide Hint" : "Need a Hint?"}
                      </Text>
                    </TouchableOpacity>
                    {showHint && (
                      <View style={styles.sheetHintCard}>
                        <Text style={styles.sheetHintText}>{selectedVideoLevel.hint}</Text>
                      </View>
                    )}

                    {/* Divider */}
                    <View style={styles.sheetDivider} />

                    {/* Action buttons */}
                    <TouchableOpacity 
                      style={[styles.sheetBtnPill, isResolving && { opacity: 0.7 }]} 
                      onPress={handlePlayVideo} 
                      activeOpacity={0.85}
                      disabled={isResolving}
                    >
                      {isResolving ? (
                        <ActivityIndicator size="small" color={COLORS.primaryForeground} />
                      ) : (
                        <Ionicons name="play" size={14} color={COLORS.primaryForeground} />
                      )}
                      <Text style={styles.sheetBtnPillText}>
                        {isResolving ? "Securing Stream..." : "Play Video"}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.sheetBtnRow}>
                      <TouchableOpacity
                        style={[styles.sheetBtnPillOutline, { borderColor: 'rgba(16,211,148,0.3)', backgroundColor: 'rgba(16,211,148,0.06)' }]}
                        onPress={() => handleTranscript(selectedVideoLevel)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#00D084" />
                        <Text style={[styles.sheetBtnPillOutlineText, { color: '#00D084' }]}>Transcript</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sheetBtnPillOutline, { borderColor: 'rgba(139,92,246,0.3)', backgroundColor: 'rgba(139,92,246,0.06)' }]}
                        onPress={() => handleStartQuiz(selectedVideoLevel)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="school-outline" size={14} color="#8B5CF6" />
                        <Text style={[styles.sheetBtnPillOutlineText, { color: '#8B5CF6' }]}>Take Quiz</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </View>
      )}

      {/* Fullscreen Video Player - Native in-app player */}
      {!isWeb && showVideoPlayerModal && selectedVideoLevel && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowVideoPlayerModal(false)}
          statusBarTranslucent
        >
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <NativeWalkthroughPlayer
              source={resolvedVideoUrl || getWalkthroughSource(selectedVideoLevel)}
              containerWidth={videoContainerDimensions.width}
              containerHeight={videoContainerDimensions.height}
            />
            <TouchableOpacity
              onPress={() => setShowVideoPlayerModal(false)}
              style={styles.fullscreenVideoClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Fullscreen Video Player - Web only */}
      {isWeb && showVideoPlayerModal && selectedVideoLevel && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 9999,
          elevation: 9999,
        }}>
            <View 
              style={[
                styles.fullscreenVideoCard,
                {
                  width: videoContainerDimensions.width,
                  height: videoContainerDimensions.height,
                  alignSelf: 'center',
                  marginTop: 'auto',
                  marginBottom: 'auto',
                }
              ]}
            >
              {(selectedVideoLevel.video_url || webVideosReady) ? (
                <video
                  src={resolvedVideoUrl || selectedVideoLevel.video_url || localWebVideoUris[getWalkthroughIndex(selectedVideoLevel)]}
                  style={styles.fullscreenWebVideo as any}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <View style={styles.webVideoLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            </View>
          <TouchableOpacity
            onPress={() => setShowVideoPlayerModal(false)}
            style={styles.fullscreenVideoClose}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Dialog */}
      <Modal
        visible={showUploadModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.uploadBackdrop}>
          {selectedVideoLevel && (
            <View style={styles.uploadDialogContainer}>
              {/* Header */}
              <View style={styles.uploadModalHeader}>
                <View>
                  <Text style={styles.uploadModalTitle}>Upload Your Recording</Text>
                  <Text style={styles.uploadModalSubtitle}>
                    Screen record yourself completing: <Text style={styles.uploadTaskName}>{selectedVideoLevel.title}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowUploadModal(false)}
                  style={styles.uploadCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.uploadContent} showsVerticalScrollIndicator={false}>
                {/* Upload Area */}
                <TouchableOpacity
                  style={[
                    styles.uploadArea,
                    videoPreviewUrl ? styles.uploadAreaWithVideo : styles.uploadAreaEmpty
                  ]}
                  onPress={openFilePicker}
                >
                  {videoPreviewUrl ? (
                    <View style={styles.videoPreviewContainer}>
                      <View style={styles.videoPreview}>
                        <Ionicons name="play-circle" size={48} color={COLORS.primary} />
                        <Text style={styles.videoFileName}>
                          {uploadedVideo?.name || 'screen_recording.mp4'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeVideoButton}
                        onPress={() => {
                          setUploadedVideo(null);
                          setVideoPreviewUrl(null);
                        }}
                      >
                        <Text style={styles.removeVideoText}>Remove & Upload Different</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadPrompt}>
                      <View style={styles.uploadIcon}>
                        <Ionicons name="cloud-upload" size={32} color={COLORS.mutedForeground} />
                      </View>
                      <Text style={styles.uploadTitle}>Drop your screen recording here</Text>
                      <Text style={styles.uploadSubtitleText}>or tap to browse (max 100MB)</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Prompt/Description Input */}
                <View style={styles.promptSection}>
                  <Text style={styles.promptLabel}>âœï¸ Your Prompt / Approach</Text>
                  <TextInput
                    style={styles.promptInput}
                    value={promptText}
                    onChangeText={setPromptText}
                    placeholder="Describe the prompt you used or explain your approach to completing this task..."
                    placeholderTextColor={COLORS.mutedForeground}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <Text style={styles.promptHint}>
                    Share the AI prompt you crafted or describe your strategy
                  </Text>
                </View>

                {/* Goal Reminder */}
                <View style={styles.goalReminder}>
                  <Text style={styles.goalReminderText}>
                    <Text style={styles.goalReminderLabel}>ðŸŽ¯ Goal:</Text> {selectedVideoLevel.goal}
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!uploadedVideo || !promptText.trim() || submitting) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmitProof}
                  disabled={!uploadedVideo || !promptText.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color={COLORS.primaryForeground} />
                      <Text style={styles.submitButtonText}>AI is Evaluating...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="color-wand" size={16} color={COLORS.primaryForeground} />
                      <Text style={styles.submitButtonText}>Submit for AI Review</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Transcript Modal */}
      <Modal
        visible={showTranscriptModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTranscriptModal(false)}
      >
        <View style={styles.transcriptBackdrop}>
          <View style={styles.transcriptDialog}>
            {/* Header */}
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptHeaderLeft}>
                <Ionicons name="document-text" size={22} color="#00D084" />
                <Text style={styles.transcriptHeaderTitle} numberOfLines={1}>Transcript</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTranscriptModal(false)}
                style={styles.transcriptCloseBtn}
              >
                <Ionicons name="close" size={22} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Video Title */}
            <Text style={styles.transcriptVideoTitle} numberOfLines={2}>
              {transcriptVideoTitle}
            </Text>

            {/* Content */}
            <ScrollView
              ref={transcriptScrollRef}
              style={styles.transcriptScrollArea}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {transcriptError && !transcriptText ? (
                <View style={styles.transcriptErrorContainer}>
                  <Ionicons name="alert-circle-outline" size={36} color="#E74C3C" />
                  <Text style={styles.transcriptErrorText}>{transcriptError}</Text>
                  <TouchableOpacity
                    style={styles.transcriptRetryBtn}
                    onPress={() => {
                      const level = videoLevels.find(v => v.title === transcriptVideoTitle);
                      if (level) handleTranscript(level);
                    }}
                  >
                    <Text style={styles.transcriptRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : transcriptLoading && !transcriptText ? (
                <View style={styles.transcriptLoadingContainer}>
                  <ActivityIndicator size="large" color="#00D084" />
                  <Text style={styles.transcriptLoadingText}>
                    {transcriptStatus || 'Preparing...'}
                  </Text>
                  <Text style={styles.transcriptLoadingSubtext}>
                    This may take a minute depending on video length
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.transcriptContent} selectable={true}>
                    {transcriptText}
                    {transcriptLoading && (
                      <Text style={styles.transcriptCursor}>â–Š</Text>
                    )}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Status bar while streaming */}
            {transcriptLoading && transcriptText.length > 0 && (
              <View style={styles.transcriptStreamingBar}>
                <View style={styles.transcriptStreamingDot} />
                <Text style={styles.transcriptStreamingText}>
                  {transcriptStatus} â€¢ {transcriptChunkCount} chunks â€¢ {transcriptText.length} chars
                </Text>
              </View>
            )}

            {/* Footer actions */}
            {transcriptText && !transcriptLoading && (
              <View style={styles.transcriptFooter}>
                <TouchableOpacity
                  style={styles.transcriptCopyBtn}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      navigator.clipboard?.writeText(transcriptText).then(() => {
                        Alert.alert('Copied', 'Transcript copied to clipboard!');
                      });
                    }
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color="#00D084" />
                  <Text style={styles.transcriptCopyText}>Copy Transcript</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Quiz Config Modal */}
      <Modal visible={showQuizConfig} animationType="fade" transparent onRequestClose={() => setShowQuizConfig(false)}>
        <View style={styles.transcriptBackdrop}>
          <View style={[styles.transcriptDialog, { maxHeight: 480 }]}>
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptHeaderLeft}>
                <Ionicons name="school" size={22} color="#8B5CF6" />
                <Text style={styles.transcriptHeaderTitle}>Quiz Setup</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQuizConfig(false)} style={styles.transcriptCloseBtn}>
                <Ionicons name="close" size={22} color="#ccc" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <Text style={{ color: '#8892A8', fontSize: 13, marginBottom: 16 }}>{quizVideoTitle}</Text>

              <Text style={{ color: '#E8EEF9', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>Number of Questions</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {[5, 10, 15, 20].map(n => (
                  <TouchableOpacity key={n} onPress={() => setQuizNumQuestions(n)}
                    style={[styles.quizOptionChip, quizNumQuestions === n && styles.quizOptionChipActive]}>
                    <Text style={[styles.quizOptionChipText, quizNumQuestions === n && styles.quizOptionChipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: '#E8EEF9', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>Time Limit (minutes)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {[5, 10, 15, 20].map(t => (
                  <TouchableOpacity key={t} onPress={() => setQuizTimeLimit(t)}
                    style={[styles.quizOptionChip, quizTimeLimit === t && styles.quizOptionChipActive]}>
                    <Text style={[styles.quizOptionChipText, quizTimeLimit === t && styles.quizOptionChipTextActive]}>{t} min</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.quizStartBtn} onPress={handleGenerateQuiz}>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={styles.quizStartBtnText}>Generate & Start Quiz</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Quiz Taking Modal */}
      <Modal visible={showQuizModal} animationType="slide" transparent={false} onRequestClose={() => { clearInterval(quizTimerRef.current); setShowQuizModal(false); }}>
        <View style={{ flex: 1, backgroundColor: '#0B0B0B' }}>
          {quizLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={{ color: '#C0CAE0', fontSize: 16, fontWeight: '600' }}>Generating quiz questions...</Text>
              {quizStatus ? (
                <Text style={{ color: '#8B5CF6', fontSize: 13 }}>{quizStatus}</Text>
              ) : (
                <Text style={{ color: '#5C6782', fontSize: 13 }}>Using AI to create questions from the video</Text>
              )}
            </View>
          ) : quizError ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 }}>
              <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
              <Text style={{ color: '#E74C3C', fontSize: 15, textAlign: 'center' }}>{quizError}</Text>
              <TouchableOpacity style={styles.quizStartBtn} onPress={handleGenerateQuiz}>
                <Text style={styles.quizStartBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                <Text style={{ color: '#8892A8', fontSize: 14 }}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : quizQuestions.length > 0 ? (
            <View style={{ flex: 1 }}>
              {/* Quiz Header */}
              <View style={styles.quizHeader}>
                <TouchableOpacity onPress={() => { clearInterval(quizTimerRef.current); setShowQuizModal(false); }}>
                  <Ionicons name="close" size={24} color="#ccc" />
                </TouchableOpacity>
                <View style={styles.quizProgressRow}>
                  <Text style={styles.quizProgressText}>{quizCurrentIndex + 1} / {quizQuestions.length}</Text>
                  <View style={styles.quizProgressBar}>
                    <View style={[styles.quizProgressFill, { width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }]} />
                  </View>
                </View>
                <View style={[styles.quizTimerBadge, quizTimeLeft < 60 && { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
                  <Ionicons name="time-outline" size={16} color={quizTimeLeft < 60 ? '#E74C3C' : '#00D084'} />
                  <Text style={[styles.quizTimerText, quizTimeLeft < 60 && { color: '#E74C3C' }]}>{formatTime(quizTimeLeft)}</Text>
                </View>
              </View>

              {/* Question */}
              <ScrollView style={{ flex: 1, padding: 20 }}>
                {(() => {
                  const q = quizQuestions[quizCurrentIndex];
                  if (!q) return null;
                  return (
                    <View>
                      <View style={styles.quizTypeBadge}>
                        <Text style={styles.quizTypeBadgeText}>
                          {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'true_false' ? 'True / False' : q.type === 'fill_blank' ? 'Fill in the Blank' : 'Match Pairs'}
                        </Text>
                      </View>
                      <Text style={styles.quizQuestionText}>{q.question}</Text>

                      {/* MCQ Options */}
                      {q.type === 'mcq' && q.options?.map((opt: string, i: number) => {
                        const letter = opt.charAt(0);
                        const isSelected = quizAnswers[q.id] === letter;
                        return (
                          <TouchableOpacity key={i} style={[styles.quizOptionBtn, isSelected && styles.quizOptionBtnSelected]}
                            onPress={() => handleQuizAnswer(q.id, letter)}>
                            <Text style={[styles.quizOptionBtnText, isSelected && styles.quizOptionBtnTextSelected]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}

                      {/* True/False */}
                      {q.type === 'true_false' && ['True', 'False'].map(tf => {
                        const isSelected = quizAnswers[q.id] === tf;
                        return (
                          <TouchableOpacity key={tf} style={[styles.quizOptionBtn, isSelected && styles.quizOptionBtnSelected]}
                            onPress={() => handleQuizAnswer(q.id, tf)}>
                            <Text style={[styles.quizOptionBtnText, isSelected && styles.quizOptionBtnTextSelected]}>{tf}</Text>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Fill Blank */}
                      {q.type === 'fill_blank' && (
                        <TextInput
                          style={styles.quizFillInput}
                          placeholder="Type your answer..."
                          placeholderTextColor="#5C6782"
                          value={quizAnswers[q.id] || ''}
                          onChangeText={text => handleQuizAnswer(q.id, text)}
                        />
                      )}
                    </View>
                  );
                })()}
              </ScrollView>

              {/* Navigation */}
              <View style={styles.quizNavRow}>
                <TouchableOpacity style={[styles.quizNavBtn, quizCurrentIndex === 0 && { opacity: 0.3 }]}
                  disabled={quizCurrentIndex === 0} onPress={() => setQuizCurrentIndex(prev => prev - 1)}>
                  <Ionicons name="chevron-back" size={20} color="#E8EEF9" />
                  <Text style={styles.quizNavBtnText}>Previous</Text>
                </TouchableOpacity>

                {quizCurrentIndex < quizQuestions.length - 1 ? (
                  <TouchableOpacity style={styles.quizNavBtnNext} onPress={() => setQuizCurrentIndex(prev => prev + 1)}>
                    <Text style={styles.quizNavBtnNextText}>Next</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.quizSubmitBtn} onPress={handleQuizSubmit}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.quizSubmitBtnText}>Submit Quiz</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* Quiz Results Modal */}
      <Modal visible={showQuizResults} animationType="fade" transparent onRequestClose={() => setShowQuizResults(false)}>
        <View style={styles.transcriptBackdrop}>
          <View style={[styles.transcriptDialog, { maxHeight: '90%' }]}>
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptHeaderLeft}>
                <Ionicons name="trophy" size={22} color="#F59E0B" />
                <Text style={styles.transcriptHeaderTitle}>Quiz Results</Text>
              </View>
              <TouchableOpacity onPress={() => setShowQuizResults(false)} style={styles.transcriptCloseBtn}>
                <Ionicons name="close" size={22} color="#ccc" />
              </TouchableOpacity>
            </View>

            {quizResults && (
              <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Score Circle */}
                <View style={styles.quizScoreCircle}>
                  <Text style={[styles.quizScoreNumber, { color: quizResults.score >= 70 ? '#00D084' : quizResults.score >= 40 ? '#F59E0B' : '#E74C3C' }]}>
                    {quizResults.score}%
                  </Text>
                  <Text style={styles.quizScoreLabel}>
                    {quizResults.score >= 80 ? 'Excellent!' : quizResults.score >= 60 ? 'Good Job!' : quizResults.score >= 40 ? 'Keep Practicing' : 'Needs Improvement'}
                  </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.quizStatsGrid}>
                  <View style={styles.quizStatCard}>
                    <Ionicons name="checkmark-circle" size={20} color="#00D084" />
                    <Text style={styles.quizStatValue}>{quizResults.correct}</Text>
                    <Text style={styles.quizStatLabel}>Correct</Text>
                  </View>
                  <View style={styles.quizStatCard}>
                    <Ionicons name="close-circle" size={20} color="#E74C3C" />
                    <Text style={styles.quizStatValue}>{quizResults.wrong}</Text>
                    <Text style={styles.quizStatLabel}>Wrong</Text>
                  </View>
                  <View style={styles.quizStatCard}>
                    <Ionicons name="time" size={20} color="#3B82F6" />
                    <Text style={styles.quizStatValue}>{formatTime(quizResults.timeUsed)}</Text>
                    <Text style={styles.quizStatLabel}>Time Used</Text>
                  </View>
                  <View style={styles.quizStatCard}>
                    <Ionicons name="flash" size={20} color="#F59E0B" />
                    <Text style={styles.quizStatValue}>{quizResults.efficiency}%</Text>
                    <Text style={styles.quizStatLabel}>Efficiency</Text>
                  </View>
                </View>

                {/* Detailed Answers */}
                <Text style={{ color: '#E8EEF9', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>Detailed Review</Text>
                {quizResults.details.map((d: any, idx: number) => (
                  <View key={idx} style={[styles.quizDetailCard, { borderLeftColor: d.isCorrect ? '#00D084' : '#E74C3C' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#8892A8', fontSize: 12, fontWeight: '600' }}>
                        Q{idx + 1} â€¢ {d.type === 'mcq' ? 'MCQ' : d.type === 'true_false' ? 'True/False' : d.type === 'fill_blank' ? 'Fill Blank' : 'Match'}
                      </Text>
                      <Ionicons name={d.isCorrect ? 'checkmark-circle' : 'close-circle'} size={18} color={d.isCorrect ? '#00D084' : '#E74C3C'} />
                    </View>
                    <Text style={{ color: '#C8D2E4', fontSize: 14, marginBottom: 8 }}>{d.question}</Text>
                    {!d.isCorrect && (
                      <View>
                        <Text style={{ color: '#E74C3C', fontSize: 12, marginBottom: 2 }}>Your answer: {d.userAnswer || '(no answer)'}</Text>
                        <Text style={{ color: '#00D084', fontSize: 12, marginBottom: 4 }}>Correct answer: {d.correctAnswer}</Text>
                      </View>
                    )}
                    <Text style={{ color: '#6B7A99', fontSize: 12, fontStyle: 'italic' }}>{d.explanation}</Text>
                  </View>
                ))}

                {/* Improvement Areas */}
                {quizResults.wrong > 0 && (
                  <View style={styles.quizImprovementBox}>
                    <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '700', marginBottom: 8 }}>ðŸ’¡ Key Improvement Areas</Text>
                    {quizResults.details.filter((d: any) => !d.isCorrect).map((d: any, idx: number) => (
                      <Text key={idx} style={{ color: '#C8D2E4', fontSize: 13, marginBottom: 4 }}>â€¢ {d.explanation}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Guest User Upgrade Prompt */}
      {isGuestUser() && (
        <View style={styles.upgradePrompt}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.primary + '10']}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.upgradeContent}>
              <Ionicons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.upgradeText}>
                Register to track progress and compete on leaderboards
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerContent: {
    gap: SPACING.xs,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#F6FBFF',
    lineHeight: 50,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    color: '#9CB6B7',
    marginTop: 4,
  },
  heroPillsRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  heroPillOutline: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(231, 238, 248, 0.25)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroPillText: {
    color: '#F5FAFF',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '600',
  },
  heroPillSolid: {
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPillSolidText: {
    color: '#F5FAFF',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  progressGradient: {
    padding: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.xs,
  },
  progressLevel: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  trophyIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  nextLevelText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  levelsSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  levelCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  currentLevelCard: {
    borderColor: COLORS.ring,
    ...SHADOWS.glow,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: SPACING.sm,
  },
  levelIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  levelInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  levelTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  levelDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    lineHeight: 20,
  },
  xpBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  xpText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  levelContent: {
    paddingLeft: 44,
    gap: SPACING.sm,
  },
  proofTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
    color: COLORS.foreground,
  },
  proofList: {
    gap: SPACING.xs,
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  proofDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  proofText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  levelActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primaryForeground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  recordButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  walkthroughBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  walkthroughDialog: {
    width: '90%',
    maxWidth: 700,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 235, 244, 0.45)',
    backgroundColor: '#0E0E0E',
    position: 'relative',
    ...SHADOWS.card,
  },
  closeButtonAbsolute: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Sheet Styles
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9000,
    elevation: 9000,
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    // Glassmorphism
    backgroundColor: 'rgba(14, 22, 28, 0.72)',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 50,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any : {}),
  },
  bottomSheetContent: {
    flex: 1,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    // Large hit area so thumb can easily grab it
    paddingHorizontal: 80,
    cursor: 'grab',
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  sheetScrollArea: {
    flex: 1,
  },
  sheetTaskDetails: {
    paddingHorizontal: 22,
    paddingTop: 4,
    gap: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  sheetDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 2,
  },
  sheetGoalCard: {
    padding: 14,
    backgroundColor: 'rgba(0, 208, 132, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.15)',
    gap: 8,
  },
  sheetGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetGoalLabel: {
    fontSize: 12,
    fontWeight: '600' as any,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sheetGoalText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 19,
  },
  sheetHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  sheetHintBtnText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500' as any,
  },
  sheetHintCard: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sheetHintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 19,
  },
  sheetPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sheetPillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500' as any,
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetBtnPillText: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: COLORS.primaryForeground,
  },
  sheetBtnPillOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  sheetBtnPillOutlineText: {
    fontSize: 13,
    fontWeight: '600' as any,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  uploadOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  uploadOptionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  uploadOptionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  upgradePrompt: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  upgradeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.foreground,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  upgradeButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.primaryForeground,
  },
  // New styles for Netflix-style UI
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  tabsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 12,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: '#213247',
  },
  activeTab: {
    backgroundColor: '#00D084',
    borderColor: '#00D084',
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: '#F6FBFF',
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  activeTabText: {
    color: '#05160F',
  },
  journeyContent: {
    paddingBottom: 24,
  },
  journeyProgressWrap: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 10,
  },
  journeyProgressBadge: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  journeyProgressText: {
    color: '#F4FAFF',
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  journeyMap: {
    minHeight: 620,
    marginHorizontal: SPACING.md,
    marginTop: 4,
    marginBottom: 78,
    position: 'relative',
  },
  journeyHeroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: '50%',
    top: 40,
    marginLeft: -120,
    backgroundColor: 'rgba(17, 216, 168, 0.09)',
    shadowColor: '#14DDA9',
    shadowOpacity: 0.35,
    shadowRadius: 52,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  journeyNodeCard: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  journeyNodePos1: {
    left: '50%',
    marginLeft: -53,
    top: 76,
  },
  journeyNodePos2: {
    left: '59%',
    marginLeft: -53,
    top: 210,
  },
  journeyNodePos3: {
    left: '65%',
    marginLeft: -53,
    top: 336,
  },
  journeyNodePos4: {
    left: '58%',
    marginLeft: -53,
    top: 466,
  },
  journeyNodePos5: {
    left: '48%',
    marginLeft: -53,
    top: 592,
  },
  journeyNodeCardActive: {
    backgroundColor: '#00D084',
    borderColor: '#2FE2AB',
    shadowColor: '#11DAA5',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  journeyNodeCardLocked: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A3A4E',
  },
  journeyNodeText: {
    fontSize: TYPOGRAPHY.fontSizes['5xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#04161A',
  },
  journeyBottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.md,
    marginHorizontal: SPACING.md,
    height: 90,
    borderRadius: 22,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#223449',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  journeyDockItem: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  journeyDockItemActive: {
    backgroundColor: '#00D084',
  },
  practiceLeaderboardHero: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  practiceLeaderboardTitle: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    color: '#F3F9FF',
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  practiceLeaderboardSubtitle: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#9DB2C7',
  },
  practiceLeaderboardRangeWrap: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  practiceLeaderboardRangeItem: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceLeaderboardRangeItemActive: {
    backgroundColor: '#0E0E0E',
  },
  practiceLeaderboardRangeText: {
    color: '#9BB1C5',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  practiceLeaderboardRangeTextActive: {
    color: '#F5FAFF',
  },
  practiceLeaderboardList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  practiceLeaderboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22354A',
    backgroundColor: '#1A1A1A',
    minHeight: 92,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceLeaderboardCardGold: {
    borderColor: '#9D7930',
    backgroundColor: '#2A2200',
  },
  practiceLeaderboardCardSilver: {
    borderColor: '#4A5567',
    backgroundColor: '#222222',
  },
  practiceLeaderboardCardBronze: {
    borderColor: '#7B4A24',
    backgroundColor: '#2A1500',
  },
  practiceLeaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  practiceLeaderboardRankWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceLeaderboardRankText: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    color: '#AFC3D7',
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  practiceLeaderboardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceLeaderboardAvatarText: {
    color: '#03231D',
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  practiceLeaderboardName: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    color: '#F6FBFF',
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  practiceLeaderboardMeta: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#9BB0C5',
  },
  practiceLeaderboardXpWrap: {
    alignItems: 'flex-end',
  },
  practiceLeaderboardXpValue: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    color: '#F5FAFF',
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  practiceLeaderboardXpLabel: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#9FB3C8',
  },
  promptingHero: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  promptingHeroTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#F6FBFF',
  },
  promptingHeroSubtitle: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: '#A8BCD0',
  },
  promptingDifficultyRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: SPACING.sm,
  },
  promptingDifficultyChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  promptingDifficultyChip: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24364C',
    backgroundColor: '#0B0B0B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptingDifficultyChipActive: {
    backgroundColor: '#00B86B',
    borderColor: '#00B86B',
  },
  promptingChipDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  promptingDifficultyChipText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#F2F8FF',
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  promptingDifficultyChipTextActive: {
    color: '#03130D',
  },
  promptingProgressBadge: {
    height: 30,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#22354A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  promptingProgressBadgeText: {
    color: '#E8F2FC',
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  promptingMainGrid: {
    paddingTop: 0,
    gap: 0,
  },
  promptingMainGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptingLeftPane: {
    gap: SPACING.md,
  },
  promptingLeftPaneDesktop: {
    flex: 1,
    maxWidth: '49%',
  },
  promptingRightPane: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1A2D42',
    backgroundColor: '#111111',
    padding: SPACING.md,
  },
  promptingRightPaneDesktop: {
    flex: 1,
    maxWidth: '49%',
  },
  promptingSectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#F3F9FF',
  },
  promptChallengeCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1B2A3D',
    backgroundColor: '#161616',
    padding: SPACING.md,
  },
  promptChallengeCardActive: {
    borderColor: '#1ED79A',
    backgroundColor: '#161616',
  },
  promptChallengeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  promptChallengeTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  promptChallengeDifficultyPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(63, 217, 140, 0.45)',
    backgroundColor: 'rgba(63, 217, 140, 0.2)',
  },
  promptChallengeDifficultyText: {
    color: '#65ECB0',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    textTransform: 'lowercase',
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  promptChallengeCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#5E7288',
    backgroundColor: '#111111',
  },
  promptChallengeCategoryText: {
    color: '#F2F7FD',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  promptChallengeTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#FFFFFF',
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  promptChallengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  promptChallengeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptChallengeMetaText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#96A9BF',
  },
  promptComposerTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    color: '#F8FCFF',
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    marginBottom: SPACING.md,
  },
  promptComposerInputWrap: {
    minHeight: 250,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1B2D41',
    backgroundColor: '#0E0E0E',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  promptComposerInput: {
    minHeight: 220,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#E9F2FC',
    textAlignVertical: 'top',
  },
  promptComposerFooter: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptComposerCount: {
    color: '#93A8BF',
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
  promptComposerHint: {
    color: '#B0C2D4',
    fontSize: TYPOGRAPHY.fontSizes.base,
  },
  promptComposerActionRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  promptSubmitButton: {
    flex: 1,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#00B86B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  promptSubmitButtonText: {
    color: '#041610',
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  promptResetButton: {
    minWidth: 118,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#27384B',
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  promptResetButtonText: {
    color: '#A3B3C7',
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  sectionsContainer: {
    paddingTop: SPACING.md,
    paddingBottom: 108,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#F7FBFF',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#9BB6BD',
  },
  episodesScrollView: {
    paddingLeft: SPACING.md,
  },
  episodesContainer: {
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    paddingBottom: 24, // Prevents clipping of bottom borders/shadows during horizontal scroll
  },
  episodeCard: {
    width: 300, // Make it wider, more rectangle looking
    height: 260, 
    marginRight: isWeb ? 0 : 16, // If gap 16 is used on web, don't double space
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#1F3348',
    ...SHADOWS.card,
  },
  completedEpisodeCard: {
    borderColor: COLORS.primary + '50',
    ...SHADOWS.glow,
  },
  episodeThumbnail: {
    height: 116,
    position: 'relative',
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  thumbnailGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '90',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  completionBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  episodeNumber: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: '#0B0B0B',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 3,
    borderRadius: 8,
  },
  episodeNumberText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#F6FBFF',
  },
  episodeXpBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: '#00D084',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 3,
    borderRadius: 8,
  },
  episodeXpText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#04160F',
  },
  episodeInfo: {
    padding: SPACING.lg,
    flex: 1,
    justifyContent: 'flex-start',
    gap: SPACING.xs,
  },
  episodeTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#F7FCFF',
    lineHeight: 24,
  },
  episodeDescription: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: '#9CB8BE',
    lineHeight: 20,
  },
  episodeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DEE8F8',
  },
  episodeBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: '#F6FBFF',
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  // Modal dialog styles
  videoPlayerArea: {
    height: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  videoPlayerBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoPlayerGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenVideoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  fullscreenVideoCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignSelf: 'center',
    overflow: 'hidden', // Added to keep borders rounded for controls
  },
  fullscreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenWebVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  webVideoLoading: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  fullscreenVideoClose: {
    position: 'absolute',
    top: 55,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fullscreenVideoCloseNative: {
    position: 'absolute',
    top: 40,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 999,
    elevation: 10,
  },
  aiAvatarContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  aiAvatarText: {
    alignItems: 'flex-start',
    gap: SPACING.xs,
    maxWidth: '100%',
  },
  aiAvatarTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
    textAlign: 'left',
  },
  aiAvatarSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.foreground,
    textAlign: 'left',
    lineHeight: 22,
  },
  videoCloseButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 14, 25, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(231, 238, 248, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDetailsContainer: {
    flexShrink: 1, // Let it shrink up to the parent's maxHeight but expand properly without collapsing!
    backgroundColor: '#0B0B0B',
  },
  taskDetails: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  taskHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dialogEpisodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
  },
  dialogEpisodeBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: '#F2F7FF',
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  dialogCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7EEF8',
    backgroundColor: 'transparent',
  },
  dialogCategoryBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: '#F2F7FF',
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  xpRewardBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(18, 219, 163, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(18, 219, 163, 0.35)',
    marginLeft: 'auto',
  },
  xpRewardText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: '#00D084',
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  taskTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  taskDescription: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.mutedForeground,
    lineHeight: 24,
  },
  goalCard: {
    padding: SPACING.md,
    backgroundColor: 'rgba(7, 49, 43, 0.26)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(18, 219, 163, 0.28)',
  },
  goalCardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  goalCardText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.foreground,
    lineHeight: 20,
  },
  hintSection: {
    gap: SPACING.xs,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  hintButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.foreground,
  },
  hintCard: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(28, 35, 48, 0.7)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(231, 238, 248, 0.12)',
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  feedbackCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
  },
  feedbackTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  feedbackText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    lineHeight: 20,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  startTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(18, 219, 163, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(18, 219, 163, 0.35)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  playWalkthroughButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: '#00D084',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.glow,
  },
  playWalkthroughText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#02120D',
  },
  startTaskButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#BFFFEA',
  },
  uploadBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  uploadDialogContainer: {
    width: '90%',
    maxWidth: 550,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 235, 244, 0.45)',
    backgroundColor: '#0E0E0E',
    ...SHADOWS.card,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadModalTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  uploadModalSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    lineHeight: 20,
  },
  uploadCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  uploadSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  uploadTaskName: {
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  uploadContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  uploadAreaEmpty: {
    borderColor: '#00D084',
    backgroundColor: 'rgba(27, 197, 141, 0.05)',
  },
  uploadAreaWithVideo: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  videoPreviewContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  videoPreview: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  videoFileName: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  removeVideoButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  removeVideoText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
  },
  uploadPrompt: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(27, 197, 141, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  uploadSubtitleText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
  },
  promptSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  promptLabel: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  promptInput: {
    minHeight: 120,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#00D084',
    backgroundColor: 'rgba(27, 197, 141, 0.05)',
    color: COLORS.foreground,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    textAlignVertical: 'top',
  },
  promptHint: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.mutedForeground,
  },
  goalReminder: {
    padding: SPACING.md,
    backgroundColor: 'rgba(27, 197, 141, 0.08)',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: '#00D084',
  },
  goalReminderText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.foreground,
    lineHeight: 20,
  },
  goalReminderLabel: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#00D084',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.glow,
  },
  submitButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#04160F',
  },
  // Tools tab styles
  toolsHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  toolsTitle: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#F6FBFF',
  },
  toolsSubtitle: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: '#9CB6B7',
  },
  stepsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1A4645',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  stepCardNumber: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCardNumberText: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#051F1B',
  },
  stepCardContent: {
    flex: 1,
  },
  stepCardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#F6FBFF',
  },
  stepCardXP: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#00D084',
  },
  stepCardXPText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#00D084',
  },
  stepCardChevron: {
    marginLeft: SPACING.xs,
  },
  currentBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#00D084',
    backgroundColor: 'transparent',
  },
  currentBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: '#00D084',
  },
  promptAnswerContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#182C42',
  },
  promptAnswerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  promptAnswerLoadingText: {
    color: '#96A9BF',
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  promptAnswerTitle: {
    color: '#F6FBFF',
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  promptAnswerText: {
    color: '#CED8E4',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    lineHeight: 22,
  },
  // Chat Interface Styles
  chatHistoryContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  promptGreetingWrap: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  promptGreetingTitle: {
    fontSize: 28,
    fontWeight: '800' as any,
    color: '#F6FBFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  promptGreetingSubtitle: {
    fontSize: 15,
    color: '#7A8FA6',
    lineHeight: 22,
  },
  promptSuggestionsWrap: {
    gap: 10,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promptSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  promptSuggestionTitle: {
    fontSize: 14,
    fontWeight: '700' as any,
    color: '#E8F2FC',
    marginBottom: 2,
  },
  promptSuggestionSubtitle: {
    fontSize: 12,
    color: '#6B7D93',
  },
  promptLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 83, 0.2)',
    marginTop: SPACING.xs,
  },
  promptLevelText: {
    color: '#F6C453',
    fontSize: 12,
    fontWeight: '600' as any,
  },
  challengeCard: {
    backgroundColor: '#131A22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 83, 0.15)',
    padding: 18,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  challengeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(246, 196, 83, 0.12)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  challengeLevelText: {
    color: '#F6C453',
    fontSize: 12,
    fontWeight: '700' as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeCounter: {
    color: '#5F7188',
    fontSize: 12,
    marginLeft: 'auto',
  },
  challengeClearBtn: {
    marginLeft: 10,
    padding: 4,
  },
  challengeTaskLabel: {
    color: '#7A8FA6',
    fontSize: 13,
    marginBottom: 6,
  },
  challengeTaskText: {
    color: '#F6FBFF',
    fontSize: 17,
    fontWeight: '600' as any,
    lineHeight: 24,
    marginBottom: 10,
  },
  challengeHint: {
    color: '#00D084',
    fontSize: 12,
    fontWeight: '500' as any,
    opacity: 0.8,
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
    gap: SPACING.lg,
    opacity: 0.8,
  },
  emptyChatText: {
    color: '#64748B',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
  },
  chatBubbleRowUser: {
    justifyContent: 'flex-end',
  },
  chatBubbleRowAi: {
    justifyContent: 'flex-start',
  },
  chatAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  chatAvatarSmallUser: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  chatBubbleWrap: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  userBubbleWrap: {
    alignItems: 'flex-end',
  },
  aiBubbleWrap: {
    alignItems: 'flex-start',
  },
  chatBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#00B86B',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#1A1E24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 6,
  },
  chatBubbleSender: {
    fontSize: 11,
    color: '#7A8FA6',
    fontWeight: '600' as any,
    marginBottom: 4,
  },
  chatBubbleSenderUser: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as any,
    marginBottom: 4,
    textAlign: 'right',
  },
  chatBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  chatBubbleHeaderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700' as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chatBubbleText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  generatingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 48,
  },
  generatingText: {
    color: '#00D084',
    fontSize: 13,
    fontWeight: '500' as any,
  },
  chatInputContainer: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  chatInputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    minHeight: 50,
    paddingBottom: 6,
  },
  chatInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: 120,
    lineHeight: 20,
  },
  chatClearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    marginLeft: 4,
  },
  chatSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    marginLeft: 4,
  },
  chatSendButtonDisabled: {
    backgroundColor: '#1E1E1E',
  },
  chatInputHint: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Transcript styles
  transcriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 211, 148, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 211, 148, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  transcriptButtonText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transcriptDialog: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '85%',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    overflow: 'hidden',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F2E',
  },
  transcriptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  transcriptHeaderTitle: {
    color: '#E8EEF9',
    fontSize: 18,
    fontWeight: '700',
  },
  transcriptCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptVideoTitle: {
    color: '#8892A8',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  transcriptScrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transcriptLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  transcriptLoadingText: {
    color: '#C0CAE0',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptLoadingSubtext: {
    color: '#5C6782',
    fontSize: 13,
  },
  transcriptErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  transcriptErrorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
  },
  transcriptRetryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00D084',
    marginTop: 8,
  },
  transcriptRetryText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptContent: {
    color: '#C8D2E4',
    fontSize: 14,
    lineHeight: 24,
    paddingTop: 8,
  },
  transcriptFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1A1F2E',
  },
  transcriptCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 211, 148, 0.12)',
  },
  transcriptCopyText: {
    color: '#00D084',
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptCursor: {
    color: '#00D084',
    fontSize: 16,
    fontWeight: '700',
  },
  transcriptStreamingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 211, 148, 0.06)',
    borderTopWidth: 1,
    borderTopColor: '#1A1F2E',
    gap: 8,
  },
  transcriptStreamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D084',
  },
  transcriptStreamingText: {
    color: '#6B8A7F',
    fontSize: 12,
    fontWeight: '500',
  },

  // â”€â”€ Quiz Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  quizButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  quizOptionChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#161616',
    minWidth: 60,
    alignItems: 'center',
  },
  quizOptionChipActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  quizOptionChipText: {
    color: '#8892A8',
    fontSize: 14,
    fontWeight: '600',
  },
  quizOptionChipTextActive: {
    color: '#8B5CF6',
  },
  quizStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  quizStartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F2E',
  },
  quizProgressRow: {
    flex: 1,
    marginHorizontal: 16,
    gap: 4,
  },
  quizProgressText: {
    color: '#8892A8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  quizProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  quizTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,211,148,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quizTimerText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '700',
  },
  quizTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  quizTypeBadgeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  quizQuestionText: {
    color: '#E8EEF9',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 24,
  },
  quizOptionBtn: {
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  quizOptionBtnSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  quizOptionBtnText: {
    color: '#C8D2E4',
    fontSize: 15,
  },
  quizOptionBtnTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  quizFillInput: {
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingVertical: 14,
    paddingHorizontal: 18,
    color: '#E8EEF9',
    fontSize: 16,
  },
  quizNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#1A1F2E',
  },
  quizNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quizNavBtnText: {
    color: '#E8EEF9',
    fontSize: 14,
  },
  quizNavBtnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  quizNavBtnNextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quizSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00D084',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  quizSubmitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  quizScoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#1E1E1E',
    alignSelf: 'center',
    marginBottom: 20,
  },
  quizScoreNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  quizScoreLabel: {
    color: '#8892A8',
    fontSize: 13,
    fontWeight: '600',
  },
  quizStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  quizStatCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  quizStatValue: {
    color: '#E8EEF9',
    fontSize: 20,
    fontWeight: '700',
  },
  quizStatLabel: {
    color: '#8892A8',
    fontSize: 11,
    fontWeight: '500',
  },
  quizDetailCard: {
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
  },
  quizImprovementBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    padding: 16,
    marginTop: 16,
  },

  // â”€â”€ New Design Styles (Reference Layout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.primaryForeground,
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.mutedForeground,
  },
  greetingName: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.25)',
  },
  heroBannerGradient: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  heroBannerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 208, 132, 0.15)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroBannerBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.primary,
  },
  heroBannerTitle: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
    lineHeight: 34,
    marginTop: SPACING.xs,
  },
  heroBannerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  heroBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroBannerActionText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
  },
  heroBannerPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  miniPill: {
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(231, 238, 248, 0.2)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniPillText: {
    color: '#F5FAFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  miniPillSolid: {
    backgroundColor: '#1E1E1E',
    borderColor: '#334155',
  },
  miniPillSolidText: {
    color: '#F5FAFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },

  // Category Selector
  categorySelectorWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  categorySelectorTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.md,
  },
  categorySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Skills Section
  filterSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.mutedForeground,
    textTransform: 'uppercase' as any,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(8, 208, 163, 0.15)',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.mutedForeground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryDropdownText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.foreground,
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    zIndex: 20,
    ...SHADOWS.card,
  },
  categoryDropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryDropdownItemActive: {
    backgroundColor: 'rgba(8, 208, 163, 0.1)',
  },
  categoryDropdownItemText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.mutedForeground,
  },
  categoryDropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
  },

  // Category Cards Section
  categorySectionWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
    gap: SPACING.md,
  },
  categorySectionHeading: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  categoryCard: {
    height: 160,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  } as any,
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  categoryCardTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: '#FFFFFF',
  },
  categoryCardSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  categoryCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryCardBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  // Category Video List Section
  categoryVideoSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 120,
  },
  categoryBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  categoryBackText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.foreground,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
  },
  categoryVideoHeading: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold as any,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  categoryVideoCount: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.lg,
  },
  categoryVideoList: {
    gap: SPACING.md,
  },
  categoryVideoCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  categoryVideoThumb: {
    width: 130,
    height: 100,
    position: 'relative',
  },
  categoryVideoThumbImage: {
    width: '100%',
    height: '100%',
  },
  categoryVideoPlayIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryVideoInfo: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  categoryVideoTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
    color: COLORS.foreground,
    lineHeight: 18,
  },
  categoryVideoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  categoryVideoXpBadge: {
    backgroundColor: 'rgba(0,208,132,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryVideoXpText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
  featuredDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  featuredDiffText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold as any,
  },
});


