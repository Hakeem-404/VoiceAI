import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { useDailyChallenges } from './useDailyChallenges';
import { useUserProgress } from './useUserProgress';
import * as supabaseService from '../services/supabaseService';
import { User, UserPreferences, AnalyticsData, DailyChallenge } from '../types';

export function useUserStore() {
  const { user: authUser } = useSupabaseAuth();
  const { challenges, loadChallenges, completeChallenge: completeDbChallenge } = useDailyChallenges();
  const { progress, updateProgress } = useUserProgress();
  
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [favoriteMode, setFavoriteModeState] = useState<string | null>(null);
  const [recentModes, setRecentModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load user data from Supabase
  const loadUserData = useCallback(async () => {
    if (!authUser) return;
    
    setLoading(true);
    
    try {
      // Get user profile from database
      const userProfile = await supabaseService.getUserProfile(authUser.id);
      
      if (userProfile) {
        // Create user object
        const userData: User = {
          id: userProfile.id,
          email: userProfile.email || '',
          name: userProfile.name || '',
          preferences: {
            theme: (userProfile.preferences as any)?.theme || 'system',
            voiceSettings: (userProfile.preferences as any)?.voiceSettings || {
              selectedVoice: 'en-US-Standard-A',
              speed: 1.0,
              pitch: 1.0,
              volume: 0.8,
            },
            notifications: (userProfile.preferences as any)?.notifications || {
              practiceReminders: true,
              dailyGoals: true,
              achievements: false,
            },
            language: (userProfile.preferences as any)?.language || 'en-US',
            favoriteMode: (userProfile.preferences as any)?.favoriteMode || null,
            recentModes: (userProfile.preferences as any)?.recentModes || [],
          },
          subscription: {
            tier: userProfile.subscription_tier as 'free' | 'premium' | 'pro',
            expiresAt: undefined,
            features: [],
          },
          createdAt: new Date(userProfile.created_at),
        };
        
        // Update state
        setUser(userData);
        setThemeState(userData.preferences.theme);
        setFavoriteModeState(userData.preferences.favoriteMode);
        setRecentModes(userData.preferences.recentModes);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);
  
  // Load analytics data
  const loadAnalytics = useCallback(() => {
    if (authUser) {
      // Load real data from database
      loadUserData();
    } else {
      // Use mock data for guest users
      const mockAnalytics: AnalyticsData = {
        totalConversations: 0,
        totalPracticeTime: 0,
        averageScore: 0,
        streakDays: 0,
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
        skillProgress: {
          fluency: 0,
          confidence: 0,
          clarity: 0,
        },
        achievements: [],
        modeStats: {},
      };
      
      setAnalytics(mockAnalytics);
    }
  }, [authUser, loadUserData]);
  
  // Update user preferences
  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!authUser || !user) return;
    
    try {
      // Update local state
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      };
      
      setUser(updatedUser);
      
      // Update in database
      await supabaseService.updateUserPreferences(
        authUser.id,
        {
          ...user.preferences,
          ...preferences,
        }
      );
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, [authUser, user]);
  
  // Set theme
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setThemeState(theme);
    
    if (authUser && user) {
      updatePreferences({ theme });
    }
  }, [authUser, user, updatePreferences]);
  
  // Set favorite mode
  const setFavoriteMode = useCallback((modeId: string) => {
    setFavoriteModeState(modeId);
    
    if (authUser && user) {
      updatePreferences({ favoriteMode: modeId });
    }
  }, [authUser, user, updatePreferences]);
  
  // Add recent mode
  const addRecentMode = useCallback((modeId: string) => {
    const updatedRecentModes = [
      modeId, 
      ...recentModes.filter(id => id !== modeId)
    ].slice(0, 5);
    
    setRecentModes(updatedRecentModes);
    
    if (authUser && user) {
      updatePreferences({ recentModes: updatedRecentModes });
    }
  }, [authUser, user, recentModes, updatePreferences]);
  
  // Load daily challenges
  const loadDailyChallenges = useCallback(() => {
    loadChallenges();
    setDailyChallenges(challenges);
  }, [loadChallenges, challenges]);
  
  // Complete a challenge
  const completeChallenge = useCallback(async (challengeId: string) => {
    if (!authUser) return;
    
    try {
      await completeDbChallenge(challengeId);
      
      // Update local state
      setDailyChallenges(prev => 
        prev.map(c => c.id === challengeId ? { ...c, completed: true } : c)
      );
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    }
  }, [authUser, completeDbChallenge]);
  
  // Update analytics when progress changes
  // useEffect(() => {
  //   if (authUser && progress.length > 0) {
  //     // Call generateAnalytics directly without adding it to dependencies
  //     if (!authUser || !progress.length) return;
  //     
  //     try {
  //       // Calculate total conversations
  //       const totalConversations = progress.reduce(
  //         (sum, p) => sum + (p.total_sessions || 0), 
  //         0
  //       );
  //       
  //       // Calculate total practice time (in minutes)
  //       const totalPracticeTime = progress.reduce(
  //         (sum, p) => sum + (p.total_duration || 0), 
  //         0
  //       ) / 60;
  //       
  //       // Calculate average score
  //       const totalScores = progress.reduce((sum, p) => {
  //         const bestScores = p.best_scores as any || {};
  //         return sum + (bestScores.quality || 0);
  //       }, 0);
  //       
  //       const averageScore = totalScores / progress.length || 0;
  //       
  //       // Get streak days from user profile
  //       const streakDays = user?.streak_days || 0;
  //       
  //       // Generate mock weekly progress for now
  //       const weeklyProgress = [65, 72, 68, 85, 92, 88, 95];
  //       
  //       // Calculate skill progress
  //       const skillProgress = {
  //         fluency: 0,
  //         confidence: 0,
  //         clarity: 0,
  //       };
  //       
  //       let skillCount = 0;
  //       
  //       progress.forEach(p => {
  //         const scores = p.skill_scores as any || {};
  //         if (scores.fluency) {
  //           skillProgress.fluency += scores.fluency;
  //           skillCount++;
  //         }
  //         if (scores.confidence) {
  //           skillProgress.confidence += scores.confidence;
  //           skillCount++;
  //         }
  //         if (scores.clarity) {
  //           skillProgress.clarity += scores.clarity;
  //           skillCount++;
  //         }
  //       });
  //       
  //       if (skillCount > 0) {
  //         skillProgress.fluency = Math.round(skillProgress.fluency / skillCount);
  //         skillProgress.confidence = Math.round(skillProgress.confidence / skillCount);
  //         skillProgress.clarity = Math.round(skillProgress.clarity / skillCount);
  //       }
  //       
  //       // Get achievements from progress
  //       const achievements = progress.flatMap(p => {
  //         const achievementsArray = p.achievements as any[] || [];
  //         return achievementsArray.map(a => ({
  //           id: a.id,
  //           title: a.title,
  //           description: a.description,
  //           icon: a.icon || 'star',
  //           unlockedAt: new Date(a.unlockedAt),
  //           category: a.category || 'conversation',
  //           modeId: p.mode,
  //         }));
  //       });
  //       
  //       // Generate mode stats
  //       const modeStats: Record<string, {
  //         sessionsCompleted: number;
  //         totalTime: number;
  //         averageScore: number;
  //         lastUsed: Date;
  //       }> = {};
  //       
  //       progress.forEach(p => {
  //         const bestScores = p.best_scores as any || {};
  //         modeStats[p.mode] = {
  //           sessionsCompleted: p.total_sessions || 0,
  //           totalTime: Math.round((p.total_duration || 0) / 60),
  //           averageScore: bestScores.quality || 0,
  //           lastUsed: p.last_session_date ? new Date(p.last_session_date) : new Date(),
  //         };
  //       });
  //       
  //       // Create analytics object
  //       const analyticsData: AnalyticsData = {
  //         totalConversations,
  //         totalPracticeTime,
  //         averageScore,
  //         streakDays,
  //         weeklyProgress,
  //         skillProgress,
  //         achievements,
  //         modeStats,
  //       };
  //       
  //       setAnalytics(analyticsData);
  //     } catch (error) {
  //       console.error('Failed to generate analytics:', error);
  //     }
  //   }
  // }, [authUser, progress, user]);
  
  // Update analytics
  const updateAnalytics = useCallback((data: Partial<AnalyticsData>) => {
    if (!analytics) return;
    
    setAnalytics({
      ...analytics,
      ...data,
    });
  }, [analytics]);
  
  // Load initial data
  // useEffect(() => {
  //   if (authUser) {
  //     loadUserData();
  //   }
  // }, [authUser, loadUserData]);
  
  // Update daily challenges when they change
  // useEffect(() => {
  //   setDailyChallenges(challenges);
  // }, [challenges]);
  
  return {
    user,
    theme,
    analytics,
    dailyChallenges,
    favoriteMode,
    recentModes,
    loading,
    setUser,
    updatePreferences,
    setTheme,
    loadAnalytics,
    updateAnalytics,
    setFavoriteMode,
    addRecentMode,
    loadDailyChallenges,
    completeChallenge,
  };
}