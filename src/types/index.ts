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
  textInputPreferences?: TextInputPreferences;
}

export interface TextInputPreferences {
  defaultMode: 'voice' | 'text' | 'hybrid';
  autoSaveDrafts: boolean;
  spellCheckEnabled: boolean;
  suggestionsEnabled: boolean;
  formatOnPaste: boolean;
  maxHistoryItems: number;
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
  messages: Message[];
  feedback?: FeedbackData;
  createdAt: Date;
  updatedAt: Date;
  bookmarks?: ConversationBookmark[];
  highlights?: ConversationHighlight[];
  documents?: DocumentData;
}

export interface DocumentData {
  jobDescription?: string;
  cvContent?: string;
  analysisResults?: any;
  generatedQuestions?: any[];
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
  inputMode?: 'voice' | 'text' | 'hybrid';
  documentContext?: {
    jobDescription?: boolean;
    cvContent?: boolean;
    analysisResults?: boolean;
  };
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
  };
  strengths: string[];
  improvements: string[];
  analytics: {
    wordsPerMinute: number;
    pauseCount: number;
    fillerWords: number;
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

export type RecordingState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

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
  messages: Message[];
  bookmarks: ConversationBookmark[];
  highlights: ConversationHighlight[];
  documents?: DocumentData;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Cultural' | 'Experience';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  relevance: 'High' | 'Medium' | 'Low';
  reasoning: string;
  preparationTip?: string;
  followUpQuestions?: string[];
  expectedDuration?: number;
}

export interface DocumentAnalysisResult {
  jobRequirements: {
    technicalSkills: string[];
    softSkills: string[];
    experienceLevel: string;
    education: string;
    certifications: string[];
    responsibilities: string[];
  };
  candidateProfile: {
    strengths: string[];
    gaps: string[];
    experienceLevel: string;
    uniqueQualifications: string[];
    relevantExperience: string[];
  };
  matchAnalysis: {
    overallScore: number;
    technicalMatch: number;
    experienceMatch: number;
    skillsMatch: number;
    culturalFit: number;
  };
  recommendations: string[];
  interviewStrategy: {
    focusAreas: string[];
    questionsToExpect: string[];
    preparationTips: string[];
  };
}