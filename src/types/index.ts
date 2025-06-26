import { ConversationMessage } from '../../types/api';

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  subscription: SubscriptionStatus;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  voiceSettings: VoiceSettings;
  notifications: NotificationSettings;
  language: string;
  favoriteMode?: string;
  recentModes: string[];
}

export interface VoiceSettings {
  selectedVoice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface NotificationSettings {
  practiceReminders: boolean;
  dailyGoals: boolean;
  achievements: boolean;
}

export interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro';
  expiresAt?: Date;
  features: string[];
}

export interface Conversation {
  id: string;
  mode: ConversationMode;
  title: string;
  duration: number;
  messages: ConversationMessage[];
  feedback?: FeedbackData;
  createdAt: Date;
  updatedAt: Date;
  bookmarks?: ConversationBookmark[];
  highlights?: ConversationHighlight[];
}

export interface DocumentData {
  jobDescription: string;
  cvContent: string;
  analysisResult?: DocumentAnalysis;
}

export interface DocumentAnalysis {
  jobDescription: {
    requirements: string[];
    skills: string[];
    experience: string;
    responsibilities: string[];
    companyInfo: string;
    culture: string[];
  };
  cv: {
    skills: string[];
    experience: string[];
    achievements: string[];
    education: string[];
    technologies: string[];
  };
  analysis: {
    matchScore: number;
    strengths: string[];
    gaps: string[];
    focusAreas: string[];
    difficulty: 'junior' | 'mid' | 'senior' | 'executive';
    recommendations: string[];
    interviewQuestions?: {
      technical: string[];
      behavioral: string[];
      situational: string[];
      gapFocused: string[];
    };
  };
}

export interface ConversationBookmark {
  id: string;
  messageId: string;
  note?: string;
  timestamp: Date;
}

export interface ConversationHighlight {
  id: string;
  messageId: string;
  text: string;
  color: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  audioUrl?: string;
  duration?: number;
  timestamp: Date;
}

export interface ConversationMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  category: 'social' | 'critical-thinking' | 'creativity' | 'professional' | 'presentation' | 'education';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  color: {
    primary: string;
    secondary: string;
    gradient: string[];
  };
  features: string[];
  topics: string[];
  aiPersonalities: string[];
  sessionTypes: {
    quick: { duration: number; description: string };
    standard: { duration: number; description: string };
    extended: { duration: number; description: string };
  };
}

export interface ModeConfiguration {
  modeId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sessionType: 'quick' | 'standard' | 'extended';
  selectedTopics: string[];
  aiPersonality: string;
  customSettings?: Record<string, any>;
}

export interface FeedbackData {
  scores: {
    fluency: number;
    clarity: number;
    confidence: number;
    pace: number;
    overall: number;
    engagement?: number;
    relevance?: number;
    structure?: number;
    persuasiveness?: number;
    creativity?: number;
    criticalThinking?: number;
    emotionalIntelligence?: number;
    vocabularyUsage?: number;
    grammarAccuracy?: number;
    culturalAwareness?: number;
    professionalCommunication?: number;
  };
  strengths: string[];
  improvements: string[];
  analytics: {
    wordsPerMinute: number;
    pauseCount: number;
    fillerWords: number;
    questionCount?: number;
    topicChanges?: number;
    responseTime?: number;
    complexSentences?: number;
    technicalTerms?: number;
    emotionalTone?: 'positive' | 'neutral' | 'negative';
    speakingTime?: number;
    listeningTime?: number;
  };
  modeSpecific?: {
    generalChat?: {
      conversationFlow: number;
      topicExploration: number;
      empathyScore: number;
      curiosityLevel: number;
    };
    debate?: {
      argumentStrength: number;
      evidenceUsage: number;
      counterArgumentHandling: number;
      logicalConsistency: number;
    };
    brainstorm?: {
      ideaCount: number;
      uniqueIdeas: number;
      ideaQuality: number;
      buildingOnIdeas: number;
    };
    interview?: {
      questionRelevance: number;
      answerCompleteness: number;
      professionalDemeanor: number;
      technicalAccuracy: number;
    };
    presentation?: {
      structureQuality: number;
      audienceEngagement: number;
      messageClarity: number;
      deliveryStyle: number;
    };
    languageLearning?: {
      grammarAccuracy: number;
      vocabularyRange: number;
      pronunciationScore: number;
      fluencyProgress: number;
    };
  };
  tips: string[];
  nextSteps: string[];
  progressTracking?: {
    previousScore?: number;
    improvement?: number;
    consistentStrengths: string[];
    persistentChallenges: string[];
  };
}

export interface PracticeSession {
  id: string;
  type: 'daily' | 'challenge' | 'custom';
  title: string;
  description: string;
  exercises: Exercise[];
  progress: number;
  completedAt?: Date;
}

export interface Exercise {
  id: string;
  type: 'speaking' | 'listening' | 'pronunciation';
  prompt: string;
  duration: number;
  completed: boolean;
  score?: number;
}

export interface AnalyticsData {
  totalConversations: number;
  totalPracticeTime: number;
  averageScore: number;
  streakDays: number;
  weeklyProgress: number[];
  skillProgress: {
    fluency: number;
    confidence: number;
    clarity: number;
  };
  achievements: Achievement[];
  modeStats: Record<string, {
    sessionsCompleted: number;
    totalTime: number;
    averageScore: number;
    lastUsed: Date;
  }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'conversation' | 'practice' | 'streak' | 'improvement' | 'mode-specific';
  modeId?: string;
}

export interface DailyChallenge {
  id: string;
  modeId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  reward: {
    points: number;
    badge?: string;
  };
  expiresAt: Date;
  completed: boolean;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

export interface AudioVisualizationData {
  levels: number[];
  maxLevel: number;
  isRecording: boolean;
}

export interface ConversationSession {
  id: string;
  modeId: string;
  configuration: ModeConfiguration;
  startTime: Date;
  endTime?: Date;
  isPaused: boolean;
  pausedAt?: Date;
  totalPauseTime: number;
  messages: ConversationMessage[];
  bookmarks: ConversationBookmark[];
  highlights: ConversationHighlight[];
}

export interface FeedbackMetrics {
  speakingPace: number; // words per minute
  pauseFrequency: number; // pauses per minute
  fillerWordFrequency: number; // filler words per minute
  responseTime: number; // average time to respond in seconds
  questionFrequency: number; // questions asked per minute
  sentenceComplexity: number; // average words per sentence
  vocabularyDiversity: number; // unique words / total words
  topicRelevance: number; // 0-100 score
  emotionalTone: number; // -100 to 100 (negative to positive)
  engagementLevel: number; // 0-100 score
  speakingListeningRatio: number; // ratio of speaking time to listening time
}

export interface RealTimeFeedback {
  type: 'pace' | 'volume' | 'filler' | 'engagement' | 'question' | 'clarity';
  message: string;
  severity: 'info' | 'suggestion' | 'warning';
  timestamp: Date;
}

export interface FeedbackSummary {
  overallScore: number;
  keyStrengths: string[];
  improvementAreas: string[];
  modeSpecificInsights: string[];
  compareToPrevious?: {
    overallChange: number;
    improvedAreas: string[];
    declinedAreas: string[];
  };
  nextStepSuggestions: string[];
}