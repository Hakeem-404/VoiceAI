import { create } from 'zustand';
import { User, UserPreferences, AnalyticsData, DailyChallenge } from '../types';
import * as supabaseService from '../services/supabaseService';

interface UserState {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  analytics: AnalyticsData | null;
  dailyChallenges: DailyChallenge[];
  favoriteMode: string | null;
  recentModes: string[];
  
  // Actions
  setUser: (user: User) => void;
  updatePreferences: (userId: string, preferences: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadAnalytics: () => void;
  updateAnalytics: (data: Partial<AnalyticsData>) => void;
  setFavoriteMode: (modeId: string) => void;
  addRecentMode: (modeId: string) => void;
  loadDailyChallenges: () => void;
  completeChallenge: (challengeId: string, userId?: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  theme: 'system',
  analytics: null,
  dailyChallenges: [],
  favoriteMode: null,
  recentModes: [],

  setUser: (user: User) => {
    // Update local state
    set({
      user,
      theme: user.preferences.theme,
      favoriteMode: user.preferences.favoriteMode || null,
      recentModes: user.preferences.recentModes || [],
    });
  },

  updatePreferences: async (userId: string, preferences: Partial<UserPreferences>) => {
    const { user } = get();
    
    if (!user) return;
    
    try {
      // Update local state
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      };
      
      set({ user: updatedUser });
      
      // Update in database
      await supabaseService.updateUserPreferences(userId, {
        ...user.preferences,
        ...preferences,
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
  },

  setFavoriteMode: (modeId: string) => {
    set({ favoriteMode: modeId });
  },

  addRecentMode: (modeId: string) => {
    const { recentModes } = get();
    const updatedRecentModes = [modeId, ...recentModes.filter(id => id !== modeId)].slice(0, 5);
    set({ recentModes: updatedRecentModes });
  },

  loadAnalytics: () => {
    // This method is now just a placeholder
    // The actual logic should be handled in the component using the hook
    console.log('loadAnalytics called - implement in component');
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
    // This method is now just a placeholder
    // The actual logic should be handled in the component using the hook
    console.log('loadDailyChallenges called - implement in component');
  },

  completeChallenge: async (challengeId: string, userId?: string) => {
    if (!userId) return;
    
    try {
      // Update challenge completion in database
      await supabaseService.completeChallenge(userId, challengeId);
      
      // Update local state
      set((state) => ({
        dailyChallenges: state.dailyChallenges.map(c => 
          c.id === challengeId ? { ...c, completed: true } : c
        )
      }));
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    }
  },
}));