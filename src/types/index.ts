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
  category: 'interview' | 'presentation' | 'casual' | 'business' | 'learning';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
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
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'conversation' | 'practice' | 'streak' | 'improvement';
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

export interface AudioVisualizationData {
  levels: number[];
  maxLevel: number;
  isRecording: boolean;
}