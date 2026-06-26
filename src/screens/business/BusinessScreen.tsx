import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Asset } from 'expo-asset';
import { User } from '../../types';
import BusinessDashboard from '../../components/BusinessDashboard';

interface BusinessScreenProps {
  user: User;
}

interface BusinessProgram {
  id: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  modules: number;
  progress: number;
  category: string;
  skills: string[];
  isLocked: boolean;
  price?: number;
}

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnail: string;
  isWatched: boolean;
  progress: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  lessons: number;
  rating: number;
  reviews: number;
  category: string;
  thumbnail: any;
  videoPath?: number;
  featured?: boolean;
  price?: number;
  isPro?: boolean;
}

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Small helper to avoid calling useVideoPlayer conditionally inside render functions
const NativeVideoPlayer = ({ source }: { source: string }) => {
  const player = useVideoPlayer(source, p => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="contain"
      nativeControls={true}
    />
  );
};

const BusinessScreen: React.FC<BusinessScreenProps> = ({ user }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"journey" | "learn" | "dashboard">("journey");
  const [programs, setPrograms] = useState<BusinessProgram[]>([]);
  const [lessons, setLessons] = useState<VideoLesson[]>([]);
  const [courses, setCourses] = useState<{ [key: string]: Course[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLevelTooltip, setShowLevelTooltip] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<BusinessProgram | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFullscreenVideoModal, setShowFullscreenVideoModal] = useState(false);
  const [fullscreenWebVideoUri, setFullscreenWebVideoUri] = useState<string | null>(null);
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBusinessData();
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [floatingAnim]);

  const loadBusinessData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      // Generate 100 business program levels
      const levelTitles: string[] = [
        'AI Business Fundamentals',
        'AI Product Development',
        'AI Marketing & Growth',
        'AI Business Analytics',
        'Prompt Engineering Mastery',
        'AI Customer Support',
        'AI Sales Automation',
        'AI Content Strategy',
        'Chatbot Development',
        'AI-Powered SEO',
        'AI Email Marketing',
        'AI Social Media',
        'AI Lead Generation',
        'AI Data Pipelines',
        'AI Copywriting',
        'AI Video Production',
        'AI Voice Assistants',
        'AI Pricing Strategy',
        'AI A/B Testing',
        'AI Personalization',
        'Machine Learning Basics',
        'NLP for Business',
        'Computer Vision Apps',
        'AI Ethics & Compliance',
        'AI Team Building',
        'AI Vendor Selection',
        'AI Budget Planning',
        'AI Risk Management',
        'AI Legal Frameworks',
        'AI Data Privacy',
        'AI Cloud Infrastructure',
        'AI API Integration',
        'AI Workflow Automation',
        'AI CRM Systems',
        'AI Supply Chain',
        'AI Inventory Management',
        'AI Financial Modeling',
        'AI Fraud Detection',
        'AI Recommendation Engines',
        'AI Sentiment Analysis',
        'AI Competitive Intelligence',
        'AI Market Research',
        'AI Product Roadmapping',
        'AI User Onboarding',
        'AI Retention Strategy',
        'AI Churn Prediction',
        'AI Revenue Optimization',
        'AI Partnership Strategy',
        'AI Fundraising Prep',
        'AI Pitch Deck Creation',
        'AI Investor Relations',
        'AI Board Reporting',
        'AI OKR Management',
        'AI Hiring Automation',
        'AI Employee Training',
        'AI Performance Reviews',
        'AI Knowledge Base',
        'AI Documentation',
        'AI Quality Assurance',
        'AI Deployment Pipelines',
        'AI Monitoring & Alerts',
        'AI Scaling Strategies',
        'AI Multi-Tenant Architecture',
        'AI Microservices',
        'AI Event-Driven Systems',
        'AI Real-Time Analytics',
        'AI Dashboard Design',
        'AI Reporting Automation',
        'AI Forecasting Models',
        'AI Demand Planning',
        'AI Dynamic Pricing',
        'AI Loyalty Programs',
        'AI Referral Systems',
        'AI Marketplace Building',
        'AI Platform Strategy',
        'AI White-Label Solutions',
        'AI Consulting Practice',
        'AI Agency Model',
        'AI SaaS Metrics',
        'AI Unit Economics',
        'AI Growth Loops',
        'AI Network Effects',
        'AI Community Building',
        'AI Developer Relations',
        'AI Open Source Strategy',
        'AI Enterprise Sales',
        'AI Government Contracts',
        'AI Healthcare Solutions',
        'AI EdTech Applications',
        'AI FinTech Integration',
        'AI Real Estate Tools',
        'AI E-Commerce Optimization',
        'AI Travel & Hospitality',
        'AI Media & Entertainment',
        'AI Sports Analytics',
        'AI Agriculture Tech',
        'AI Energy Optimization',
        'AI Smart Cities',
        'AI Autonomous Systems',
        'AI Mastery & Leadership',
      ];

      const categories = ['Fundamentals', 'Product', 'Marketing', 'Analytics', 'Engineering', 'Operations', 'Strategy', 'Growth', 'Leadership', 'Industry'];
      const skillSets = [
        ['AI Strategy', 'Business Planning', 'Market Analysis'],
        ['Product Management', 'AI Integration', 'User Experience'],
        ['Growth Hacking', 'AI Marketing', 'Customer Acquisition'],
        ['Data Analysis', 'Business Intelligence', 'KPI Tracking'],
        ['Prompt Design', 'Chain-of-Thought', 'Few-Shot Learning'],
        ['Automation', 'Workflow Design', 'Process Optimization'],
        ['Sales Funnel', 'Lead Scoring', 'CRM Integration'],
        ['Content Creation', 'Brand Voice', 'Distribution Strategy'],
        ['NLP', 'Dialog Systems', 'User Intent Mapping'],
        ['Technical SEO', 'Content Optimization', 'Link Building'],
      ];

      const mockPrograms: BusinessProgram[] = levelTitles.map((title, i) => {
        const id = String(i + 1);
        const lvl: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' =
          i < 20 ? 'BEGINNER' : i < 60 ? 'INTERMEDIATE' : 'ADVANCED';
        const weeks = Math.min(4 + Math.floor(i / 10), 12);
        return {
          id,
          title,
          description: `Level ${id} — ${title}`,
          level: lvl,
          duration: `${weeks} weeks`,
          modules: 6 + Math.floor(i / 5),
          progress: i === 0 ? 65 : 0,
          category: categories[i % categories.length],
          skills: skillSets[i % skillSets.length],
          isLocked: i > 0, // only level 1 unlocked
          ...(i > 1 ? { price: 99 + i * 10 } : {}),
        };
      });

      // Mock video lessons data
      const mockLessons: VideoLesson[] = [
        {
          id: '1',
          title: 'Introduction to AI Business Models',
          description: 'Understanding different AI business models and revenue streams',
          duration: '15:30',
          instructor: 'Sarah Chen',
          category: 'Fundamentals',
          difficulty: 'BEGINNER',
          thumbnail: 'https://via.placeholder.com/300x200',
          isWatched: true,
          progress: 100,
        },
        {
          id: '2',
          title: 'Building Your AI MVP',
          description: 'Step-by-step guide to creating your first AI product',
          duration: '22:45',
          instructor: 'Michael Rodriguez',
          category: 'Product',
          difficulty: 'INTERMEDIATE',
          thumbnail: 'https://via.placeholder.com/300x200',
          isWatched: false,
          progress: 45,
        },
        {
          id: '3',
          title: 'AI Ethics in Business',
          description: 'Implementing ethical AI practices in your business',
          duration: '18:20',
          instructor: 'Dr. Emily Watson',
          category: 'Ethics',
          difficulty: 'INTERMEDIATE',
          thumbnail: 'https://via.placeholder.com/300x200',
          isWatched: false,
          progress: 0,
        },
        {
          id: '4',
          title: 'Scaling AI Operations',
          description: 'Best practices for scaling AI systems and teams',
          duration: '28:15',
          instructor: 'Alex Thompson',
          category: 'Operations',
          difficulty: 'ADVANCED',
          thumbnail: 'https://via.placeholder.com/300x200',
          isWatched: false,
          progress: 0,
        },
      ];

      // Mock courses data organized by category
      const mockCourses: { [key: string]: Course[] } = {
        featured: [
          {
            id: 'f1',
            title: 'Solopreneur Starter Kit',
            description: 'Everything you need to launch your AI-powered business in 7 days',
            duration: '2.5 hours',
            durationMinutes: 150,
            lessons: 12,
            rating: 4.9,
            reviews: 2340,
            category: 'Featured',
            thumbnail: require('../../thumbnails/1.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
            featured: true,
          },
        ],
        shopify: [
          {
            id: 's1',
            title: 'Setting Up Your Shopify Store with AI',
            description: 'Launch your e-commerce store with AI automation',
            duration: '12 min',
            durationMinutes: 12,
            lessons: 1,
            rating: 4.9,
            reviews: 540,
            category: 'Shopify',
            thumbnail: require('../../thumbnails/2.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: 's2',
            title: 'AI Product Photography Hacks',
            description: 'Create stunning product photos with AI',
            duration: '8 min',
            durationMinutes: 8,
            lessons: 1,
            rating: 4.8,
            reviews: 1230,
            category: 'Shopify',
            thumbnail: require('../../thumbnails/3.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: 's3',
            title: 'Automated Customer Support Bot',
            description: 'Deploy an AI customer support system',
            duration: '15 min',
            durationMinutes: 15,
            lessons: 1,
            rating: 4.7,
            reviews: 890,
            category: 'Shopify',
            thumbnail: require('../../thumbnails/4.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
            isPro: true,
          },
        ],
        coding: [
          {
            id: 'c1',
            title: 'Vibe Coding with Lovable',
            description: 'Build apps without traditional coding',
            duration: '4 hours',
            durationMinutes: 240,
            lessons: 20,
            rating: 4.8,
            reviews: 1560,
            category: 'Development',
            thumbnail: require('../../thumbnails/1.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: 'c2',
            title: 'No-Code AI Integration',
            description: 'Integrate AI into your apps without coding',
            duration: '3 hours',
            durationMinutes: 180,
            lessons: 15,
            rating: 4.6,
            reviews: 980,
            category: 'Development',
            thumbnail: require('../../thumbnails/2.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            id: 'c3',
            title: 'Advanced Prompt Engineering',
            description: 'Master prompt engineering techniques',
            duration: '5 hours',
            durationMinutes: 300,
            lessons: 25,
            rating: 4.9,
            reviews: 2100,
            category: 'Development',
            thumbnail: require('../../thumbnails/3.jpg'),
            videoPath: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
        ],
      };

      setPrograms(mockPrograms);
      setLessons(mockLessons);
      setCourses(mockCourses);

    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBusinessData(false);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return '#28a745';
      case 'INTERMEDIATE':
        return '#ffc107';
      case 'ADVANCED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Generate steps for a level based on its ID and category
  const generateLevelSteps = (program: BusinessProgram) => {
    const numSteps = 4 + (parseInt(program.id) % 3); // 4-6 steps per level
    const stepsTemplates = [
      ['Create', 'Research', 'Design', 'Build', 'Deploy', 'Optimize'],
      ['Plan', 'Setup', 'Configure', 'Integrate', 'Test', 'Launch'],
      ['Understand', 'Implement', 'Automate', 'Monitor', 'Analyze', 'Scale'],
      ['Learn', 'Practice', 'Apply', 'Document', 'Review', 'Master'],
      ['Define', 'Develop', 'Validate', 'Refine', 'Release', 'Support'],
    ];

    const stepVerbs = stepsTemplates[parseInt(program.id) % stepsTemplates.length];
    const steps = [];

    for (let i = 0; i < numSteps; i++) {
      const verb = stepVerbs[i] || stepVerbs[0];
      steps.push({
        id: String(i + 1),
        number: i + 1,
        title: `${verb} ${program.category}`,
        xp: 50 + (i * 10),
        isCompleted: false,
        isCurrent: i === 0 && !program.isLocked,
      });
    }

    return steps;
  };

  const renderProgramCard = ({ item }: { item: BusinessProgram }) => (
    <TouchableOpacity style={styles.programCard}>
      <View style={styles.programNumberContainer}>
        <Text style={styles.programNumber}>{item.id}</Text>
        {item.isLocked && (
          <View style={styles.programLockIcon}>
            <Ionicons name="lock-closed" size={20} color="#999999" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLessonCard = ({ item }: { item: VideoLesson }) => (
    <TouchableOpacity style={styles.lessonCard}>
      <View style={styles.lessonThumbnail}>
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="play-circle" size={32} color="white" />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
        {item.isWatched && (
          <View style={styles.watchedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
          </View>
        )}
      </View>

      <View style={styles.lessonContent}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.lessonDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.lessonMeta}>
          <View style={styles.instructorInfo}>
            <Ionicons name="person-circle" size={16} color="#6c757d" />
            <Text style={styles.instructorName}>{item.instructor}</Text>
          </View>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        {item.progress > 0 && !item.isWatched && (
          <View style={styles.lessonProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}% watched</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderJourneyTab = () => {
    const allPrograms = [...programs];
    const currentLevel = allPrograms.find(p => !p.isLocked) || allPrograms[0];

    const interpolateY = floatingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });

    // Snake path offsets: each level steps progressively,
    // then snakes back. Pattern: center → right → more-right → center-right → center → left …
    const getHorizontalOffset = (index: number): number => {
      const pattern = [0, 0.28, 0.42, 0.35, 0.18, 0, -0.18, -0.35, -0.42, -0.28];
      const i = index % pattern.length;
      return pattern[i] * (width - 140);
    };

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.journeyScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
          />
        }
      >
        <View style={styles.journeyTopSpacing} />

        <View style={styles.levelPathContainer}>
          {/* Subtle centre path line */}
          <View style={styles.pathLineContainer}>
            <View style={styles.pathLine} />
          </View>

          {allPrograms.map((program, index) => {
            const isCurrent = program.id === currentLevel?.id;
            const isLocked = program.isLocked;
            const offsetX = getHorizontalOffset(index);

            // Vary vertical gap slightly so it doesn't feel robotic
            const extraGap = index === 0 ? 0 : (index % 3 === 0 ? 12 : index % 2 === 0 ? -6 : 0);

            return (
              <View
                key={program.id}
                style={[
                  styles.levelRow,
                  { marginLeft: offsetX, marginTop: index === 0 ? 0 : 36 + extraGap },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedLevel(program)}
                  style={[
                    styles.levelCard,
                    isCurrent && styles.levelCardCurrent,
                    isLocked && styles.levelCardLocked,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.levelCardInner,
                      isCurrent && { transform: [{ translateY: interpolateY }] },
                    ]}
                  >
                    {isCurrent ? (
                      <Text style={styles.levelNumberCurrent}>{program.id}</Text>
                    ) : isLocked ? (
                      <Ionicons name="lock-closed" size={36} color="#555555" />
                    ) : (
                      <Text style={styles.levelNumber}>{program.id}</Text>
                    )}
                  </Animated.View>
                </TouchableOpacity>

                {/* Tooltip */}
                {isLocked && showLevelTooltip === program.id && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Complete previous level to unlock
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.journeyBottomSpacing} />
      </ScrollView>
    );
  };

  const renderLearnTab = () => {
    const featuredCourses = courses.featured || [];
    const shopifyCourses = courses.shopify || [];
    const codingCourses = courses.coding || [];

    const renderFeaturedCard = (course: Course) => (
      <TouchableOpacity 
        key={course.id} 
        style={styles.featuredCard}
        onPress={() => {
          setShowFullscreenVideoModal(false);
          setSelectedCourse(course);
        }}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#00D084" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
          <Text style={styles.featuredTitle}>{course.title}</Text>
          <Text style={styles.featuredDescription}>{course.description}</Text>
          <View style={styles.featuredMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="book" size={14} color="#888" />
              <Text style={styles.metaText}>{course.lessons} lessons</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color="#888" />
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{course.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );

    const renderCourseCard = (course: Course) => (
      <TouchableOpacity 
        key={course.id} 
        style={styles.courseCard}
        onPress={() => {
          setShowFullscreenVideoModal(false);
          setSelectedCourse(course);
        }}
      >
        <View style={styles.courseThumbnail}>
          {course.thumbnail ? (
            <Image
              source={course.thumbnail}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <Ionicons name="image" size={24} color="rgba(0, 208, 132, 0.3)" />
            </View>
          )}
          <View style={styles.durationBadgeSmall}>
            <Text style={styles.durationBadgeSmallText}>{course.duration}</Text>
          </View>
          {course.isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Pro</Text>
            </View>
          )}
        </View>
        <View style={styles.courseContent}>
          <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
          <View style={styles.courseRating}>
            <Ionicons name="star" size={12} color="#FFB800" />
            <Text style={styles.ratingValue}>{course.rating}</Text>
            <Text style={styles.ratingCount}>• {course.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <ScrollView 
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
          />
        }
      >
        {/* Featured Section */}
        {featuredCourses.length > 0 && (
          <View style={styles.featuredSection}>
            {featuredCourses.map(renderFeaturedCard)}
          </View>
        )}

        {/* Shopify Empire Section */}
        <View style={styles.courseSection}>
          <View style={styles.sectionHeading}>
            <Ionicons name="shopping-bag" size={20} color="#00D084" style={styles.sectionIcon} />
            <Text style={styles.sectionTitleLarge}>Shopify Empire</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color="#00D084" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Build your e-commerce store from scratch</Text>
          <FlatList
            data={shopifyCourses}
            renderItem={({ item }) => renderCourseCard(item)}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesList}
          />
        </View>

        {/* Coding & Development Section */}
        <View style={styles.courseSection}>
          <View style={styles.sectionHeading}>
            <Ionicons name="code-slash" size={20} color="#00D084" style={styles.sectionIcon} />
            <Text style={styles.sectionTitleLarge}>Vibe Coding with Lovable</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color="#00D084" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Build apps without traditional coding</Text>
          <FlatList
            data={codingCourses}
            renderItem={({ item }) => renderCourseCard(item)}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesList}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  const renderDashboardTab = () => (
    <BusinessDashboard 
      onNavigateToSection={(section, data) => {
        console.log('Navigate to section:', section, data);
      }}
    />
  );

  const renderCourseModal = () => {
    if (!selectedCourse) return null;
    const localVideoSource = selectedCourse.videoPath ?? 'https://www.w3schools.com/html/mov_bbb.mp4';
    
    const handleOpenFullscreenPlayer = () => {
      if (isWeb) {
        if (typeof localVideoSource === 'number') {
          const asset = Asset.fromModule(localVideoSource);
          const uri = asset?.localUri || asset?.uri || '';
          setFullscreenWebVideoUri(uri || null);
        } else {
          setFullscreenWebVideoUri((localVideoSource as any)?.uri || null);
        }
      }
      setShowFullscreenVideoModal(true);
    };

    return (
      <>
        <Modal
          visible={selectedCourse !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowFullscreenVideoModal(false);
            setFullscreenWebVideoUri(null);
            setSelectedCourse(null);
          }}
        >
          <View style={styles.courseModalOverlay}>
            <View style={styles.courseModalContainer}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.courseCloseButton}
                onPress={() => {
                  setShowFullscreenVideoModal(false);
                  setFullscreenWebVideoUri(null);
                  setSelectedCourse(null);
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Header Badges */}
              <View style={styles.courseModalHeader}>
                <View style={styles.courseModalBadge}>
                  <Text style={styles.courseModalBadgeText}>{selectedCourse.category}</Text>
                </View>
                <View style={styles.courseModalDurationBadge}>
                  <Ionicons name="time" size={14} color="#999" />
                  <Text style={styles.courseModalDurationText}>{selectedCourse.duration}</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.courseModalTitle}>{selectedCourse.title}</Text>

              {/* Video Preview Area */}
              <View style={styles.videoPlayerContainer}>
                <View style={styles.videoPlaceholder}>
                  <Image
                    source={selectedCourse.thumbnail}
                    style={styles.videoPlaceholderImage}
                    resizeMode="cover"
                  />
                  <View style={styles.videoPlaceholderOverlay}>
                    <TouchableOpacity
                      style={styles.watchButton}
                      onPress={handleOpenFullscreenPlayer}
                    >
                      <Ionicons name="play" size={24} color="#1a1f2e" />
                      <Text style={styles.watchButtonText}>Watch Lesson</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Description */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.courseModalDescriptionScroll}>
                <Text style={styles.courseModalDescription}>
                  {selectedCourse.description}
                </Text>

                {/* Rating */}
                <View style={styles.courseModalRating}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.courseModalRatingValue}>{selectedCourse.rating}</Text>
                  <Text style={styles.courseModalRatingText}>rating</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showFullscreenVideoModal && selectedCourse !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullscreenVideoModal(false)}
        >
          <View style={styles.fullscreenPlayerOverlay}>
            <View style={styles.fullscreenPlayerContainer}>
              {isWeb ? (
                fullscreenWebVideoUri ? (
                  <video
                    key={fullscreenWebVideoUri}
                    src={fullscreenWebVideoUri}
                    style={styles.fullscreenWebVideo as any}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <NativeVideoPlayer source={localVideoSource} />
                )
              ) : (
                <NativeVideoPlayer source={localVideoSource} />
              )}
              <TouchableOpacity
                style={styles.fullscreenCloseButton}
                onPress={() => {
                  setShowFullscreenVideoModal(false);
                  setFullscreenWebVideoUri(null);
                }}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 90 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D084" />
          <Text style={styles.loadingText}>Loading business content...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 90 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Business Builder</Text>
        <Text style={styles.subtitle}>Master AI business skills step by step</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journey' && styles.activeTab]}
          onPress={() => setActiveTab('journey')}
        >
          <Ionicons name="map" size={16} color={activeTab === 'journey' ? '#FFFFFF' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'journey' && styles.activeTabText]}>Journey</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'learn' && styles.activeTab]}
          onPress={() => setActiveTab('learn')}
        >
          <Ionicons name="play-circle" size={16} color={activeTab === 'learn' ? '#FFFFFF' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'learn' && styles.activeTabText]}>Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="bar-chart" size={16} color={activeTab === 'dashboard' ? '#FFFFFF' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Status Badge */}
      <View style={styles.statusBadgeContainer}>
        <View style={styles.statusBadge}>
          <Ionicons name="trending-up" size={14} color="#00D084" />
          <Text style={styles.statusBadgeText}>0 Programs Done</Text>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'journey' && renderJourneyTab()}
      {activeTab === 'learn' && renderLearnTab()}
      {activeTab === 'dashboard' && renderDashboardTab()}

      {/* Level Detail Modal */}
      <Modal
        visible={selectedLevel !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedLevel(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedLevel(null)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header with Category and Duration */}
            <View style={styles.modalHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{selectedLevel?.category}</Text>
              </View>
              <View style={styles.durationBadge2}>
                <Ionicons name="time" size={14} color="#666" />
                <Text style={styles.durationBadgeText}>{selectedLevel?.duration}</Text>
              </View>
            </View>

            {/* Level Title */}
            <Text style={styles.modalTitle}>{selectedLevel?.title}</Text>

            {/* Description */}
            <Text style={styles.modalDescription}>{selectedLevel?.description}</Text>

            {/* Steps Section */}
            <Text style={styles.stepsHeading}>Steps to Complete</Text>

            <ScrollView
              style={styles.stepsContainer}
              showsVerticalScrollIndicator={true}
            >
              {selectedLevel && generateLevelSteps(selectedLevel).map((step) => (
                <View
                  key={step.id}
                  style={[
                    styles.stepItem,
                    selectedLevel.isLocked && styles.stepItemLocked,
                  ]}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  
                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        selectedLevel.isLocked && styles.stepTitleLocked,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text
                      style={[
                        styles.stepXp,
                        selectedLevel.isLocked && styles.stepXpLocked,
                      ]}
                    >
                      +{step.xp} XP
                    </Text>
                  </View>

                  {step.isCurrent && !selectedLevel.isLocked && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Course Modal */}
      {renderCourseModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2e',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '400',
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00D084',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#00D084',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#252d3d',
    borderWidth: 1,
    borderColor: '#333d52',
  },
  activeTab: {
    backgroundColor: '#2d3548',
    borderWidth: 1.5,
    borderColor: '#00D084',
  },
  tabText: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  journeyScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  journeyTopSpacing: {
    height: 16,
  },
  journeyBottomSpacing: {
    height: 80,
  },
  levelPathContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 400,
  },
  pathLineContainer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 0,
  },
  pathLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
  },
  levelRow: {
    alignSelf: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  levelCard: {
    width: 110,
    height: 110,
    borderRadius: 22,
    backgroundColor: '#2a3040',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#3a4458',
  },
  levelCardCurrent: {
    width: 130,
    height: 130,
    borderRadius: 26,
    backgroundColor: '#00D084',
    borderColor: 'rgba(0, 208, 132, 0.6)',
    borderWidth: 2,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  levelCardLocked: {
    opacity: 0.75,
  },
  levelCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: '#666',
    letterSpacing: -1,
  },
  levelNumberCurrent: {
    fontSize: 52,
    fontWeight: '800',
    color: '#1a1f2e',
    letterSpacing: -1,
  },
  tooltip: {
    position: 'absolute',
    top: -36,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 208, 132, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 20,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999999',
  },
  tabContent: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#2d3548',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3d4858',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D084',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D084',
    marginRight: 4,
  },
  programsList: {
    paddingHorizontal: 16,
  },
  programCard: {
    backgroundColor: '#2d3548',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d4858',
    padding: 16,
    marginRight: 12,
    width: width * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  programNumberContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  programNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#00D084',
  },
  programLockIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#3d4858',
    padding: 8,
    borderRadius: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  programDescription: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3d4858',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D084',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#999999',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillTag: {
    backgroundColor: '#3d4858',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 10,
    color: '#00D084',
    fontWeight: '500',
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeButton: {
    backgroundColor: '#00D084',
  },
  lockedButton: {
    backgroundColor: '#3d4858',
    borderWidth: 1,
    borderColor: '#4d5868',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#1a1f2e',
  },
  lockedButtonText: {
    color: '#999999',
  },
  learningStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2d3548',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d4858',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2d3548',
  },
  filterText: {
    fontSize: 14,
    color: '#00D084',
    marginLeft: 4,
  },
  lessonsList: {
    paddingHorizontal: 16,
  },
  lessonCard: {
    backgroundColor: '#2d3548',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3d4858',
    overflow: 'hidden',
  },
  lessonThumbnail: {
    height: 120,
    backgroundColor: '#3d4858',
    position: 'relative',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  watchedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00D084',
    borderRadius: 12,
    padding: 4,
  },
  lessonContent: {
    padding: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorName: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#00D084',
    fontWeight: '500',
  },
  lessonProgress: {
    marginTop: 8,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#1f2936',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    padding: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: '#00D084',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1f2e',
    textTransform: 'uppercase',
  },
  durationBadge2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 20,
    marginBottom: 24,
  },
  stepsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  stepsContainer: {
    maxHeight: 350,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 55, 75, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.15)',
  },
  stepItemLocked: {
    opacity: 0.6,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepTitleLocked: {
    color: '#888',
  },
  stepXp: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00D084',
  },
  stepXpLocked: {
    color: '#666',
  },
  currentBadge: {
    backgroundColor: 'rgba(0, 208, 132, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00D084',
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D084',
  },
  // Learn Tab Styles
  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  featuredCard: {
    backgroundColor: '#2d3548',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3d4858',
    marginBottom: 12,
    overflow: 'hidden',
  },
  featuredContent: {
    gap: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00D084',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  courseSection: {
    paddingBottom: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: '#00D084',
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#777',
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontWeight: '400',
  },
  coursesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  courseCard: {
    width: 160,
    backgroundColor: '#2d3548',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3d4858',
    overflow: 'hidden',
  },
  courseThumbnail: {
    height: 100,
    backgroundColor: '#3d4858',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  thumbnailFallback: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
  },
  durationBadgeSmall: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadgeSmallText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFB800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 9,
    color: '#000',
    fontWeight: '700',
  },
  courseContent: {
    padding: 12,
    gap: 8,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  courseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
  },
  ratingCount: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
  // Course Modal Styles
  courseModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  courseModalContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#1f2936',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    position: 'relative',
  },
  courseCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  courseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  courseModalBadge: {
    backgroundColor: '#00D084',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  courseModalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1f2e',
    textTransform: 'uppercase',
  },
  courseModalDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  courseModalDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  courseModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  videoPlayerContainer: {
    height: 280,
    backgroundColor: '#2d3548',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoPlaceholderImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  videoPlaceholderOverlay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 18, 29, 0.42)',
  },
  watchButton: {
    backgroundColor: '#00D084',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  lessonVideoWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  lessonVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenPlayerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPlayerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenWebVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    objectFit: 'contain',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseModalDescriptionScroll: {
    maxHeight: 200,
  },
  courseModalDescription: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 22,
    marginBottom: 16,
  },
  courseModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  courseModalRatingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB800',
  },
  courseModalRatingText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
});

export default BusinessScreen;
