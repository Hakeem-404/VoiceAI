import { create } from 'zustand';
import { User, UserPreferences, AnalyticsData, DailyChallenge } from '../types';

interface UserState {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  analytics: AnalyticsData | null;
  dailyChallenges: DailyChallenge[];
  favoriteMode: string | null;
  recentModes: string[];
  
  // Actions
  setUser: (user: User) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadAnalytics: () => void;
  updateAnalytics: (data: Partial<AnalyticsData>) => void;
  setFavoriteMode: (modeId: string) => void;
  addRecentMode: (modeId: string) => void;
  loadDailyChallenges: () => void;
  completeChallenge: (challengeId: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  theme: 'system',
  analytics: null,
  dailyChallenges: [],
  favoriteMode: null,
  recentModes: [],

  setUser: (user: User) => {
    set({ 
      user, 
      theme: user.preferences.theme,
      favoriteMode: user.preferences.favoriteMode || null,
      recentModes: user.preferences.recentModes || [],
    });
  },

  updatePreferences: (preferences: Partial<UserPreferences>) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
      },
    };

    set({ user: updatedUser });
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          theme,
        },
      };
      set({ user: updatedUser });
    }
  },

  setFavoriteMode: (modeId: string) => {
    set({ favoriteMode: modeId });
    
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          favoriteMode: modeId,
        },
      };
      set({ user: updatedUser });
    }
  },

  addRecentMode: (modeId: string) => {
    const { recentModes } = get();
    const updatedRecentModes = [modeId, ...recentModes.filter(id => id !== modeId)].slice(0, 5);
    
    set({ recentModes: updatedRecentModes });
    
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          recentModes: updatedRecentModes,
        },
      };
      set({ user: updatedUser });
    }
  },

  loadAnalytics: () => {
    // Mock analytics data with mode-specific stats
    const mockAnalytics: AnalyticsData = {
      totalConversations: 45,
      totalPracticeTime: 1200, // in minutes
      averageScore: 8.3,
      streakDays: 7,
      weeklyProgress: [65, 72, 68, 85, 92, 88, 95],
      skillProgress: {
        fluency: 78,
        confidence: 82,
        clarity: 75,
      },
      achievements: [
        {
          id: '1',
          title: 'First Conversation',
          description: 'Completed your first AI conversation',
          icon: 'star',
          unlockedAt: new Date(),
          category: 'conversation',
        },
        {
          id: '2',
          title: '7-Day Streak',
          description: 'Practiced for 7 days in a row',
          icon: 'flame',
          unlockedAt: new Date(),
          category: 'streak',
        },
        {
          id: '3',
          title: 'Debate Master',
          description: 'Completed 10 debate challenges',
          icon: 'trophy',
          unlockedAt: new Date(),
          category: 'mode-specific',
          modeId: 'debate-challenge',
        },
      ],
      modeStats: {
        'general-chat': {
          sessionsCompleted: 15,
          totalTime: 300,
          averageScore: 8.5,
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        'debate-challenge': {
          sessionsCompleted: 8,
          totalTime: 240,
          averageScore: 7.8,
          lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        'interview-practice': {
          sessionsCompleted: 12,
          totalTime: 480,
          averageScore: 8.9,
          lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        'presentation-prep': {
          sessionsCompleted: 6,
          totalTime: 150,
          averageScore: 8.2,
          lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        'idea-brainstorm': {
          sessionsCompleted: 3,
          totalTime: 90,
          averageScore: 9.1,
          lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        'language-learning': {
          sessionsCompleted: 1,
          totalTime: 30,
          averageScore: 7.5,
          lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
    };

    set({ analytics: mockAnalytics });
  },

  updateAnalytics: (data: Partial<AnalyticsData>) => {
    const { analytics } = get();
    if (!analytics) return;

    set({
      analytics: {
        ...analytics,
        ...data,
      },
    });
  },

  loadDailyChallenges: () => {
    const mockChallenges: DailyChallenge[] = [
      {
        id: '1',
        modeId: 'debate-challenge',
        title: 'Climate Change Debate',
        description: 'Argue for renewable energy solutions',
        difficulty: 'intermediate',
        reward: { points: 100, badge: 'Climate Advocate' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '2',
        modeId: 'presentation-prep',
        title: 'Elevator Pitch Challenge',
        description: 'Perfect your 30-second pitch',
        difficulty: 'beginner',
        reward: { points: 50 },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '3',
        modeId: 'idea-brainstorm',
        title: 'Innovation Sprint',
        description: 'Generate 10 creative solutions',
        difficulty: 'advanced',
        reward: { points: 150, badge: 'Innovation Master' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
    ];

    set({ dailyChallenges: mockChallenges });
  },

  completeChallenge: (challengeId: string) => {
    const { dailyChallenges } = get();
    const updatedChallenges = dailyChallenges.map(challenge =>
      challenge.id === challengeId
        ? { ...challenge, completed: true }
        : challenge
    );

    set({ dailyChallenges: updatedChallenges });
  },
}));