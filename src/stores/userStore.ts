import { create } from 'zustand';
import { User, UserPreferences, AnalyticsData, DailyChallenge } from '../types';
import { useUserStore as useUserHook } from '../hooks/useUserStore';
import { useSupabaseAuth } from '../hooks/useSupabase';
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
    // Update local state
    set({
      user,
      theme: user.preferences.theme,
      favoriteMode: user.preferences.favoriteMode || null,
      recentModes: user.preferences.recentModes || [],
    });
  },

  updatePreferences: (preferences: Partial<UserPreferences>) => {
    // Use the hook implementation instead
    const { updatePreferences } = useUserHook();
    const { user } = get();
    
    if (user) {
      updatePreferences(preferences);
    }
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    // Use the hook implementation instead
    const { setTheme } = useUserHook();
    setTheme(theme);
    
    // Update local state
    set({ theme });
  },

  setFavoriteMode: (modeId: string) => {
    // Use the hook implementation instead
    const { setFavoriteMode } = useUserHook();
    setFavoriteMode(modeId);
    
    // Update local state
    set({ favoriteMode: modeId });
  },

  addRecentMode: (modeId: string) => {
    // Use the hook implementation instead
    const { addRecentMode } = useUserHook();
    addRecentMode(modeId);
    
    // Update local state
    const { recentModes } = get();
    const updatedRecentModes = [modeId, ...recentModes.filter(id => id !== modeId)].slice(0, 5);
    set({ recentModes: updatedRecentModes });
  },

  loadAnalytics: () => {
    // Use the hook implementation instead
    const { loadAnalytics } = useUserHook();
    loadAnalytics();
  },

  updateAnalytics: (data: Partial<AnalyticsData>) => {
    // Use the hook implementation instead
    const { updateAnalytics } = useUserHook();
    updateAnalytics(data);
  },

  loadDailyChallenges: () => {
    // Use the hook implementation instead
    const { loadDailyChallenges } = useUserHook();
    loadDailyChallenges();
  },

  completeChallenge: (challengeId: string) => {
    // Use the hook implementation instead
    const { completeChallenge } = useUserHook();
    completeChallenge(challengeId);
  },
}));