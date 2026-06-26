// GamifiedPracticeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');

// --- DATA ---

const TOPIC_TITLE = "AI, Machine Learning, Deep Learning and Generative AI Explained";

const QUESTIONS = [
  {
    type: 'MCQ',
    label: 'MULTIPLE CHOICE',
    question: 'What is the broad goal of Artificial Intelligence (AI) as described in the video?',
    options: [
      'To build robots that can walk',
      'To simulate something that matches or exceeds human intelligence',
      'To store large amounts of data securely',
      'To replace all computer programmers',
    ],
    correctIndex: 1,
    feedback: 'Correct! AI aims to simulate human intelligence, giving computers the ability to learn, infer, and reason.'
  },
  {
    type: 'FILL_BLANK',
    label: 'FILL IN THE BLANK',
    sentenceParts: ['Machine learning is particularly good at making predictions and spotting ', ', which is highly useful in cybersecurity.'],
    blanks: ['outliers'],
    chips: ['outliers', 'deepfakes', 'passwords', 'networks'],
    feedback: 'Correct! Machine learning easily spots outliers or anomalies when a pattern is broken.'
  },
  {
    type: 'MATCHING',
    label: 'MATCH THE PAIRS',
    left: ['Expert Systems', 'Machine Learning', 'Generative AI'],
    right: ['1980s and 1990s', 'Popularized in the 2010s', 'The most recent explosion'],
    pairs: {
      'Expert Systems': '1980s and 1990s',
      'Machine Learning': 'Popularized in the 2010s',
      'Generative AI': 'The most recent explosion'
    },
    feedback: 'All matched! AI has evolved from early expert systems to ML, and now the boom of Gen AI.'
  },
  {
    type: 'MCQ',
    label: 'MULTIPLE CHOICE',
    question: 'Why is "Deep Learning" referred to as "deep"?',
    options: [
      'It requires deep thinking by the user',
      'It is buried deep in the computer\'s hard drive',
      'It uses multiple layers of neural networks',
      'It only analyzes deep ocean data',
    ],
    correctIndex: 2,
    feedback: 'Correct! Deep learning uses multiple layers of artificial neural networks to process information.'
  },
  {
    type: 'FILL_BLANK',
    label: 'FILL IN THE BLANK',
    sentenceParts: ['Deep learning uses ', ' networks to simulate and mimic the way the human brain works.'],
    blanks: ['neural'],
    chips: ['neural', 'social', 'generative', 'foundation'],
    feedback: 'Correct! Neural networks attempt to model the brain, sometimes making the output unpredictable.'
  },
  {
    type: 'MATCHING',
    label: 'MATCH THE PAIRS',
    left: ['AI', 'Machine Learning', 'Generative AI'],
    right: ['Broad simulation of intelligence', 'Finding patterns in data', 'Creating entirely new content'],
    pairs: {
      'AI': 'Broad simulation of intelligence',
      'Machine Learning': 'Finding patterns in data',
      'Generative AI': 'Creating entirely new content'
    },
    feedback: 'Correct! They are nested: Gen AI is a type of ML, and ML is a type of AI.'
  },
  {
    type: 'MCQ',
    label: 'MULTIPLE CHOICE',
    question: 'How does the speaker differentiate a Large Language Model (LLM) from basic phone autocomplete?',
    options: [
      'An LLM is much smaller',
      'An LLM predicts whole sentences, paragraphs, or documents',
      'An LLM only predicts emojis',
      'There is no difference at all',
    ],
    correctIndex: 1,
    feedback: 'Correct! While autocomplete predicts the next word, an LLM predicts larger chunks making an exponential leap in capability.'
  },
  {
    type: 'FILL_BLANK',
    label: 'FILL IN THE BLANK',
    sentenceParts: ['Large language models are an example of what the video calls ', ' models, which serve as the basis for generative AI.'],
    blanks: ['foundation'],
    chips: ['foundation', 'expert', 'database', 'predictive'],
    feedback: 'Correct! Foundation models are massive models that serve as the base for generating new content.'
  },
  {
    type: 'MATCHING',
    label: 'MATCH THE PAIRS',
    left: ['Chatbots', 'Deepfakes', 'Cybersecurity'],
    right: ['Large Language Models', 'Audio and Video models', 'Spotting data outliers'],
    pairs: {
      'Chatbots': 'Large Language Models',
      'Deepfakes': 'Audio and Video models',
      'Cybersecurity': 'Spotting data outliers'
    },
    feedback: 'All matched! Different AI and ML disciplines power different real-world applications.'
  },
  {
    type: 'MCQ',
    label: 'MULTIPLE CHOICE',
    question: 'According to the video, what recently caused the AI adoption curve to go "straight to the moon"?',
    options: [
      'The invention of computers',
      'Expert systems in the 1980s',
      'Foundation models and Generative AI',
      'Basic machine learning in the 2010s',
    ],
    correctIndex: 2,
    feedback: 'Correct! The recent explosion in Generative AI and foundation models caused massive widespread adoption.'
  },
  {
    type: 'PROMPT_PRACTICE',
    label: 'PROMPT PRACTICE',
    topic: 'Machine Learning and AI Fundamentals',
    feedback: 'You successfully completed the prompt practice!'
  }
];

// --- API ---

const fetchScenario = async (topic: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Write a prompt asking an AI to explain " + topic + " to a 5-year-old child without using any technical jargon.");
    }, 1500);
  });
};

const evaluatePrompt = async (prompt: string, topic: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ score: 8, advice: "Decent prompt! To improve, add clear context and specify the expected format of the response." });
    }, 2000);
  });
};

// --- COMPONENTS ---

export default function GamifiedPracticeScreen() {
  const [slideIndex, setSlideIndex] = useState(0); // 0 = Intro, 1-10 = Qs, 11 = Results
  const totalSlides = QUESTIONS.length + 2; 

  // Animation for Progress Bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: slideIndex / (totalSlides - 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [slideIndex]);

  const handleNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (slideIndex < totalSlides - 1) setSlideIndex(slideIndex + 1);
  };

  const currentQuestionNumber = slideIndex > 0 && slideIndex <= QUESTIONS.length ? slideIndex : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      {slideIndex > 0 && slideIndex < totalSlides - 1 && (
        <View style={styles.header}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[
              styles.progressBarFill, 
              { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
            ]} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.stepCounter}>{currentQuestionNumber} / {QUESTIONS.length}</Text>
            <View style={styles.xpBadge}><Text style={styles.xpText}>+50 XP</Text></View>
          </View>
        </View>
      )}

      {/* CONTENT AREA */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {slideIndex === 0 && <IntroSlide onNext={handleNext} />}
        {slideIndex > 0 && slideIndex <= QUESTIONS.length && (
          <QuestionRouter 
            key={slideIndex}
            question={QUESTIONS[slideIndex - 1]} 
            onCorrect={handleNext} 
            isLast={slideIndex === QUESTIONS.length}
          />
        )}
        {slideIndex === totalSlides - 1 && <ResultsSlide />}
      </ScrollView>

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomNav}>
        <BottomTab label="Learn" icon="book" active={false} />
        <BottomTab label="Practice" icon="play" active={true} />
        <BottomTab label="Library" icon="folder" active={false} />
        <BottomTab label="Profile" icon="user" active={false} />
      </View>
    </SafeAreaView>
  );
}

// -- SLIDE: INTRO --
function IntroSlide({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.slideContainer}>
      <Text style={styles.introTitle}>{TOPIC_TITLE}</Text>
      <Text style={styles.introDesc}>10 challenges based on the video. Answer correctly to earn XP.</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>QUESTIONS</Text>
          <Text style={styles.statValue}>10</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>XP TO EARN</Text>
          <Text style={styles.statValue}>500</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TYPE</Text>
          <Text style={styles.statValue}>Mixed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>EST. TIME</Text>
          <Text style={styles.statValue}>~4 min</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Start practice</Text>
      </TouchableOpacity>
    </View>
  );
}

// -- ROUTER FOR QUESTIONS --
function QuestionRouter({ question, onCorrect, isLast }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Automatically fade in when mounted
  useEffect(() => { 
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.slideContainer, { opacity: fadeAnim }]}>
      <Text style={styles.qLabel}>{question.label}</Text>
      
      {question.type === 'MCQ' && <MCQQuestion q={question} onCorrect={onCorrect} isLast={isLast} />}
      {question.type === 'FILL_BLANK' && <FillBlankQuestion q={question} onCorrect={onCorrect} isLast={isLast} />}
      {question.type === 'MATCHING' && <MatchingQuestion q={question} onCorrect={onCorrect} isLast={isLast} />}
      {question.type === 'PROMPT_PRACTICE' && <PromptPracticeQuestion q={question} onCorrect={onCorrect} isLast={isLast} />}
    </Animated.View>
  );
}

// -- MCQ --
function MCQQuestion({ q, onCorrect, isLast }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  
  const handleSelect = (idx: number) => {
    if (selected !== null) return; // Prevent changing answer
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(idx);
  };

  const isComplete = selected !== null;
  const isCorrectChoice = selected === q.correctIndex;

  return (
    <>
      <Text style={styles.qText}>{q.question}</Text>
      <View style={styles.mcqOptions}>
        {q.options.map((opt: string, idx: number) => {
          const isSelected = selected === idx;
          const isCorrectAns = idx === q.correctIndex;
          
          let stateStyle = {};
          let letterStyle = {};
          if (isComplete) {
            if (isCorrectAns) {
              stateStyle = styles.optCorrect;
              letterStyle = styles.letterCircleCorrect;
            } else if (isSelected) {
              stateStyle = styles.optWrong;
              letterStyle = styles.letterCircleWrong;
            }
          }

          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.mcqOption, stateStyle]} 
              activeOpacity={0.8}
              onPress={() => handleSelect(idx)}
            >
              <View style={[styles.letterCircle, letterStyle]}>
                <Text style={styles.letterText}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text style={styles.optText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isComplete && (
        <FeedBackBox 
          isCorrect={isCorrectChoice} 
          message={isCorrectChoice ? q.feedback : 'Incorrect. The correct answer was highlighted.'} 
        />
      )}

      {isComplete && isCorrectChoice && (
        <TouchableOpacity style={styles.nextBtn} onPress={onCorrect}>
          <Text style={styles.nextBtnText}>{isLast ? 'See results' : 'Next challenge'}</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// -- FILL IN THE BLANK --
function FillBlankQuestion({ q, onCorrect, isLast }: any) {
  const [filled, setFilled] = useState<string[]>(Array(q.blanks.length).fill(null));
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);

  const handleChipSelect = (chip: string) => {
    const nextBlankIdx = filled.findIndex(b => b === null);
    if (nextBlankIdx === -1) return;

    if (q.blanks[nextBlankIdx] === chip) {
      // Correct
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newFilled = [...filled];
      newFilled[nextBlankIdx] = chip;
      setFilled(newFilled);
    } else {
      // Wrong
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setWrongFlash(nextBlankIdx);
      setTimeout(() => setWrongFlash(null), 800);
    }
  };

  const isComplete = filled.every(b => b !== null);

  return (
    <>
      <View style={styles.fibSentenceCard}>
        <Text style={styles.fibText}>
          {q.sentenceParts.map((part: string, i: number) => {
            const val = filled[i];
            const isFlashing = wrongFlash === i;
            
            if (i >= q.blanks.length) return <Text key={i}>{part}</Text>;
            
            return (
              <React.Fragment key={i}>
                <Text>{part}</Text>
                <View style={[styles.fibBlank, val ? styles.fibBlankFilled : {}, isFlashing ? styles.fibBlankWrong : {}]}>
                  <Text style={[styles.fibBlankText, isFlashing ? {color: '#f08090'} : {}]}>{val || '          '}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </Text>
      </View>

      <View style={styles.fibChipsContainer}>
        {q.chips.map((chip: string, i: number) => {
          const isUsed = filled.includes(chip);
          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.fibChip, isUsed && styles.fibChipDisabled]}
              onPress={() => !isUsed && handleChipSelect(chip)}
              activeOpacity={0.8}
            >
              <Text style={styles.fibChipText}>{chip}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isComplete && <FeedBackBox isCorrect={true} message={q.feedback} />}
      {isComplete && (
        <TouchableOpacity style={styles.nextBtn} onPress={onCorrect}>
          <Text style={styles.nextBtnText}>{isLast ? 'See results' : 'Next challenge'}</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// -- MATCHING --
function MatchingQuestion({ q, onCorrect, isLast }: any) {
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [flashWrong, setFlashWrong] = useState(false);

  const totalPairs = q.left.length;
  const isComplete = Object.keys(matched).length === totalPairs;

  const handleLeft = (item: string) => {
    if (matched[item] || isComplete) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedLeft(item);
  };

  const handleRight = (item: string) => {
    if (!selectedLeft || Object.values(matched).includes(item) || isComplete) return;
    
    // Check match
    if (q.pairs[selectedLeft] === item) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMatched({ ...matched, [selectedLeft]: item });
      setSelectedLeft(null);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFlashWrong(true);
      setTimeout(() => setFlashWrong(false), 700);
      setSelectedLeft(null);
    }
  };

  return (
    <>
      <View style={styles.matchingColumns}>
        <View style={styles.matchCol}>
          {q.left.map((item: string) => {
            const isMatched = !!matched[item];
            const isSelected = selectedLeft === item;
            return (
              <TouchableOpacity 
                key={item}
                style={[
                  styles.matchCardLeft,
                  isSelected && styles.matchCardSelected,
                  isMatched && styles.matchCardMatched,
                  flashWrong && isSelected && styles.matchCardWrong
                ]}
                onPress={() => handleLeft(item)}
              >
                <Text style={styles.matchText}>{item}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.matchCol}>
          {q.right.map((item: string) => {
            const isMatched = Object.values(matched).includes(item);
            return (
              <TouchableOpacity 
                key={item}
                style={[
                  styles.matchCardRight,
                  isMatched && styles.matchCardMatched,
                  flashWrong && !isMatched && selectedLeft && styles.matchCardWrong
                ]}
                onPress={() => handleRight(item)}
              >
                <Text style={styles.matchText}>{item}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {isComplete && <FeedBackBox isCorrect={true} message={q.feedback} />}
      {isComplete && (
        <TouchableOpacity style={styles.nextBtn} onPress={onCorrect}>
          <Text style={styles.nextBtnText}>{isLast ? 'See results' : 'Next challenge'}</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// -- PROMPT PRACTICE --
function PromptPracticeQuestion({ q, onCorrect, isLast }: any) {
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{score: number, advice: string} | null>(null);
  const [scenario, setScenario] = useState<string | null>(null);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  const handleStartPrompting = async () => {
    setIsGeneratingScenario(true);
    const generatedScenario = await fetchScenario(q.topic);
    setScenario(generatedScenario);
    setIsGeneratingScenario(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleSubmit = async () => {
    if (!promptText.trim() || !scenario) return;
    setIsSubmitting(true);
    const res = await evaluatePrompt(promptText, scenario);
    setResult(res);
    setIsSubmitting(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  return (
    <>
      {!scenario && !isGeneratingScenario && (
        <View style={[styles.promptTopicCard, { alignItems: 'center', paddingVertical: 40 }]}>
          <Text style={styles.promptTopicLabel}>AI CHALLENGE</Text>
          <Text style={[styles.promptTopicText, { textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 }]}>
            Ready to test your prompt engineering skills on the topic of "{q.topic}"?
          </Text>
          <TouchableOpacity style={[styles.primaryBtn, {width: '100%'}]} onPress={handleStartPrompting}>
            <Text style={styles.primaryBtnText}>Generate Scenario</Text>
          </TouchableOpacity>
        </View>
      )}

      {isGeneratingScenario && (
        <View style={styles.evaluatingBox}>
          <ActivityIndicator color="#00D084" />
          <Text style={styles.evaluatingText}>Generating your scenario...</Text>
        </View>
      )}

      {scenario && (
        <>
          <View style={styles.promptTopicCard}>
            <Text style={styles.promptTopicLabel}>TUTORIAL SCENARIO</Text>
            <Text style={styles.promptTopicText}>{scenario}</Text>
          </View>

          {!result && (
            <TextInput
              style={styles.promptInput}
              multiline
              placeholder="Write your prompt here..."
              placeholderTextColor="#8090b0"
              value={promptText}
              onChangeText={setPromptText}
              editable={!isSubmitting}
            />
          )}

          {isSubmitting && (
            <View style={styles.evaluatingBox}>
              <ActivityIndicator color="#00D084" />
              <Text style={styles.evaluatingText}>Executing LLM evaluation...</Text>
            </View>
          )}

          {result && (
            <View style={styles.promptResultBox}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Efficiency Score:</Text>
                <Text style={[styles.scoreValue, result.score >= 7 ? {color: '#00D084'} : {color: '#f08090'}]}>
                  {result.score}/10
                </Text>
              </View>
              <Text style={styles.adviceLabel}>Advice for improvement:</Text>
              <Text style={styles.adviceText}>{result.advice}</Text>
            </View>
          )}

          {(!result && !isSubmitting) && (
            <TouchableOpacity style={[styles.primaryBtn, {marginTop: 20}]} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>Evaluate Prompt</Text>
            </TouchableOpacity>
          )}

          {result && (
            <TouchableOpacity style={styles.nextBtn} onPress={onCorrect}>
              <Text style={styles.nextBtnText}>{isLast ? 'See results' : 'Next challenge'}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </>
  );
}

// -- RESULTS --
function ResultsSlide() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.slideContainer}>
      <Text style={styles.trophy}>ðŸ†</Text>
      <Text style={styles.resultsTitle}>Session complete!</Text>
      <Text style={styles.resultsSubtitle}>{TOPIC_TITLE}</Text>

      <View style={styles.xpResultCard}>
        <Text style={styles.xpResultNumber}>500</Text>
        <Text style={styles.xpResultLabel}>XP earned this session</Text>
      </View>

      <View style={styles.resultsStatsRow}>
        <View style={styles.resStatBox}>
          <Text style={styles.resStatVal}>10/10</Text>
          <Text style={styles.resStatLab}>Correct</Text>
        </View>
        <View style={styles.resStatBox}>
          <Text style={styles.resStatVal}>100%</Text>
          <Text style={styles.resStatLab}>Accuracy</Text>
        </View>
        <View style={styles.resStatBox}>
          <Text style={styles.resStatVal}>5ðŸ”¥</Text>
          <Text style={styles.resStatLab}>Streak</Text>
        </View>
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakDots}>
           {[1,2,3,4,5].map(i => <View key={`g-${i}`} style={styles.streakDotActive}/>)}
           {[6,7].map(i => <View key={`d-${i}`} style={styles.streakDotDark}/>)}
        </View>
        <Text style={styles.streakText}>5-day streak â€” keep it up!</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
        <Text style={styles.primaryBtnText}>Practice again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.outlineBtnText}>Back to video</Text>
      </TouchableOpacity>
    </View>
  );
}

// -- MISC COMPONENTS --
function FeedBackBox({ isCorrect, message }: { isCorrect: boolean, message: string }) {
  return (
    <View style={[styles.feedbackBox, isCorrect ? styles.fbCorrect : styles.fbWrong]}>
      <Text style={[styles.feedbackText, isCorrect ? {color:'#00D084'} : {color:'#f08090'}]}>
        {message}
      </Text>
    </View>
  );
}

function BottomTab({ label, icon, active }: {label:string, icon:string, active:boolean}) {
  return (
    <View style={styles.tab}>
      <View style={[styles.tabIconPlaceholder, active ? {backgroundColor:'#00D084'} : {}]} />
      <Text style={[styles.tabLabel, active ? styles.tabLabelActive : {}]}>{label}</Text>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00D084',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCounter: {
    color: '#8090b0',
    fontSize: 13,
    fontWeight: '600',
  },
  xpBadge: {
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00c878',
  },
  xpText: {
    color: '#00D084',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  slideContainer: {
    flex: 1,
    marginTop: 10,
  },
  
  // Intro Slide
  introTitle: {
    color: '#e0e4f0',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introDesc: {
    color: '#8090b0',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#161616',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statLabel: {
    color: '#8090b0',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: '#e0e4f0',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#00D084',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  primaryBtnText: {
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  outlineBtnText: {
    color: '#e0e4f0',
    fontSize: 16,
    fontWeight: '600',
  },

  // Questions Shared
  qLabel: {
    color: '#00D084',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qText: {
    color: '#e0e4f0',
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#00D084',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  nextBtnText: {
    color: '#0B0B0B',
    fontSize: 15,
    fontWeight: 'bold',
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
  },
  fbCorrect: {
    backgroundColor: '#111111',
    borderLeftColor: '#00D084',
  },
  fbWrong: {
    backgroundColor: '#2a0d10',
    borderLeftColor: '#e05060',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // MCQ
  mcqOptions: {
    gap: 12,
  },
  mcqOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 12,
  },
  optCorrect: {
    backgroundColor: '#111111',
    borderColor: '#00c878',
  },
  optWrong: {
    backgroundColor: '#2a0d10',
    borderColor: '#e05060',
  },
  letterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  letterCircleCorrect: {
    backgroundColor: '#00c878',
  },
  letterCircleWrong: {
    backgroundColor: '#e05060',
  },
  letterText: {
    color: '#e0e4f0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  optText: {
    flex: 1,
    color: '#e0e4f0',
    fontSize: 14,
  },

  // Fill in Blank
  fibSentenceCard: {
    backgroundColor: '#161616',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 24,
  },
  fibText: {
    color: '#e0e4f0',
    fontSize: 15,
    lineHeight: 28,
  },
  fibBlank: {
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#8090b0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
    minWidth: 80,
  },
  fibBlankFilled: {
    borderStyle: 'solid',
    borderColor: '#00c878',
    backgroundColor: '#111111',
  },
  fibBlankWrong: {
    borderStyle: 'solid',
    borderColor: '#e05060',
    backgroundColor: '#2a0d10',
  },
  fibBlankText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fibChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fibChip: {
    backgroundColor: '#161616',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginRight: 8,
    marginBottom: 8,
  },
  fibChipDisabled: {
    opacity: 0.3,
  },
  fibChipText: {
    color: '#e0e4f0',
    fontSize: 13,
    fontWeight: '500',
  },

  // Matching
  matchingColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchCol: {
    width: '48%',
    gap: 12,
  },
  matchCardLeft: {
    backgroundColor: '#1c1b33', // Purple tint
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a264a',
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: 12,
  },
  matchCardRight: {
    backgroundColor: '#161616', // Default
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: 12,
  },
  matchCardSelected: {
    borderColor: '#00D084',
  },
  matchCardMatched: {
    backgroundColor: '#111111',
    borderColor: '#00c878',
  },
  matchCardWrong: {
    backgroundColor: '#2a0d10',
    borderColor: '#e05060',
  },
  matchText: {
    color: '#e0e4f0',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Results
  trophy: {
    fontSize: 64,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  resultsTitle: {
    color: '#e0e4f0',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    color: '#8090b0',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  xpResultCard: {
    backgroundColor: '#161616',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00c878',
    marginBottom: 16,
  },
  xpResultNumber: {
    color: '#00D084',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  xpResultLabel: {
    color: '#8090b0',
    fontSize: 13,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  resultsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  resStatBox: {
    flex: 1,
    backgroundColor: '#161616',
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resStatVal: {
    color: '#e0e4f0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resStatLab: {
    color: '#8090b0',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  streakDotActive: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#00D084',
  },
  streakDotDark: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#1A1A1A',
  },
  streakText: {
    color: '#e0e4f0',
    fontSize: 13,
    fontWeight: '500',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0B0B0B',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingVertical: 12,
    paddingBottom: 24, // safe area padding offset
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#8090b0',
    borderRadius: 4,
    marginBottom: 4,
  },
  tabLabel: {
    color: '#8090b0',
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#00D084',
  },

  // Prompt Practice
  promptTopicCard: {
    backgroundColor: '#161616',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 20,
  },
  promptTopicLabel: {
    color: '#8090b0',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promptTopicText: {
    color: '#e0e4f0',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  promptInput: {
    backgroundColor: '#1c1b33',
    color: '#e0e4f0',
    fontSize: 15,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2a264a',
    padding: 16,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  evaluatingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginTop: 10,
  },
  evaluatingText: {
    color: '#00D084',
    marginTop: 12,
    fontWeight: '600',
  },
  promptResultBox: {
    backgroundColor: '#161616',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginTop: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  scoreLabel: {
    color: '#e0e4f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  adviceLabel: {
    color: '#8090b0',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  adviceText: {
    color: '#e0e4f0',
    fontSize: 15,
    lineHeight: 22,
  },
});



