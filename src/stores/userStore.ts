import { create } from 'zustand';
import { User, UserPreferences, AnalyticsData } from '../types';

interface UserState {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  analytics: AnalyticsData | null;
  
  // Actions
  setUser: (user: User) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadAnalytics: () => void;
  updateAnalytics: (data: Partial<AnalyticsData>) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  theme: 'system',
  analytics: null,

  setUser: (user: User) => {
    set({ user, theme: user.preferences.theme });
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

  loadAnalytics: () => {
    // Mock analytics data
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
      ],
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
}));