import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import * as supabaseService from '../services/supabaseService';
import { Conversation, FeedbackData } from '../types';

export function useProgressPersistence() {
  const { user: authUser } = useSupabaseAuth();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  // Load user progress
  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (authUser) {
        // User is authenticated, get progress from Supabase
        const userProgress = await supabaseService.getUserProgress(authUser.id);
        
        // Update state
        setProgress(userProgress);
        
        // Get user profile for streak days
        const userProfile = await supabaseService.getUserProfile(authUser.id);
        if (userProfile) {
          setStreakDays(userProfile.streak_days || 0);
        }
        
        // Save to local storage for offline access
        await storageService.updateAppConfig({ userProgress, streakDays: userProfile?.streak_days || 0 });
      } else {
        // User is not authenticated, check local storage
        const appConfig = await storageService.getAppConfig();
        
        if (appConfig.userProgress) {
          setProgress(appConfig.userProgress);
        }
        
        if (appConfig.streakDays !== undefined) {
          setStreakDays(appConfig.streakDays);
        }
      }
    } catch (err) {
      console.error('Failed to load user progress:', err);
      setError(err as Error);
      
      // Try to load from local storage as fallback
      try {
        const appConfig = await storageService.getAppConfig();
        
        if (appConfig.userProgress) {
          setProgress(appConfig.userProgress);
        }
        
        if (appConfig.streakDays !== undefined) {
          setStreakDays(appConfig.streakDays);
        }
      } catch (localErr) {
        console.error('Failed to load local progress data:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Update progress after conversation
  const updateProgressAfterConversation = useCallback(async (
    conversation: Conversation,
    feedback?: FeedbackData
  ) => {
    try {
      if (!authUser) {
        // For guest users, just store basic stats locally
        const appConfig = await storageService.getAppConfig();
        
        const totalConversations = (appConfig.totalConversations || 0) + 1;
        const totalDuration = (appConfig.totalDuration || 0) + conversation.duration;
        
        await storageService.updateAppConfig({
          totalConversations,
          totalDuration,
          lastConversationDate: new Date().toISOString(),
        });
        
        return;
      }
      
      // For authenticated users, update progress on server
      
      // Get existing progress for this mode
      const existingProgress = progress.find(p => p.mode === conversation.mode.id);
      
      if (existingProgress) {
        // Update existing progress
        const updates = {
          total_sessions: existingProgress.total_sessions + 1,
          total_duration: existingProgress.total_duration + conversation.duration,
          last_session_date: new Date().toISOString(),
        };
        
        // Update skill scores if feedback is available
        if (feedback) {
          const skillScores = {
            ...(existingProgress.skill_scores || {}),
            fluency: feedback.scores.fluency,
            clarity: feedback.scores.clarity,
            confidence: feedback.scores.confidence,
          };
          
          // Update best scores if better than previous
          const bestScores = {
            ...(existingProgress.best_scores || {}),
          };
          
          if (!bestScores.overall || feedback.scores.overall > bestScores.overall) {
            bestScores.overall = feedback.scores.overall;
          }
          
          updates.skill_scores = skillScores;
          updates.best_scores = bestScores;
        }
        
        // Update on server
        await supabaseService.updateUserProgress(
          authUser.id,
          conversation.mode.id,
          updates
        );
        
        // Update local state
        setProgress(prev => 
          prev.map(p => p.mode === conversation.mode.id ? { ...p, ...updates } : p)
        );
      } else {
        // Create new progress entry
        const newProgress = {
          user_id: authUser.id,
          mode: conversation.mode.id,
          total_sessions: 1,
          total_duration: conversation.duration,
          last_session_date: new Date().toISOString(),
          streak_count: 0,
        };
        
        // Add skill scores if feedback is available
        if (feedback) {
          newProgress.skill_scores = {
            fluency: feedback.scores.fluency,
            clarity: feedback.scores.clarity,
            confidence: feedback.scores.confidence,
          };
          
          newProgress.best_scores = {
            overall: feedback.scores.overall,
          };
        }
        
        // Create on server
        const createdProgress = await supabaseService.updateUserProgress(
          authUser.id,
          conversation.mode.id,
          newProgress
        );
        
        // Update local state
        setProgress(prev => [...prev, createdProgress]);
      }
      
      // Update user's last_active timestamp
      await supabaseService.updateUserProfile(
        authUser.id,
        { last_active: new Date().toISOString() }
      );
      
      // Save to local storage for offline access
      await loadProgress();
    } catch (err) {
      console.error('Failed to update progress after conversation:', err);
      throw err;
    }
  }, [authUser, progress, loadProgress]);

  // Add achievement
  const addAchievement = useCallback(async (
    mode: string,
    achievement: {
      id: string;
      title: string;
      description: string;
      icon: string;
      category: string;
    }
  ) => {
    try {
      if (!authUser) {
        // For guest users, just store achievements locally
        const appConfig = await storageService.getAppConfig();
        
        const achievements = [...(appConfig.achievements || [])];
        
        // Check if achievement already exists
        if (!achievements.some(a => a.id === achievement.id)) {
          achievements.push({
            ...achievement,
            unlockedAt: new Date().toISOString(),
            modeId: mode,
          });
          
          await storageService.updateAppConfig({ achievements });
        }
        
        return;
      }
      
      // For authenticated users, update achievements on server
      
      // Get existing progress for this mode
      const existingProgress = progress.find(p => p.mode === mode);
      
      if (existingProgress) {
        // Get existing achievements
        const achievements = [...(existingProgress.achievements || [])];
        
        // Check if achievement already exists
        if (!achievements.some(a => a.id === achievement.id)) {
          // Add new achievement
          achievements.push({
            ...achievement,
            unlockedAt: new Date().toISOString(),
          });
          
          // Update on server
          await supabaseService.updateUserProgress(
            authUser.id,
            mode,
            { achievements }
          );
          
          // Update local state
          setProgress(prev => 
            prev.map(p => p.mode === mode ? { ...p, achievements } : p)
          );
        }
      } else {
        // Create new progress entry with achievement
        const newProgress = {
          user_id: authUser.id,
          mode,
          total_sessions: 0,
          total_duration: 0,
          achievements: [{
            ...achievement,
            unlockedAt: new Date().toISOString(),
          }],
        };
        
        // Create on server
        const createdProgress = await supabaseService.updateUserProgress(
          authUser.id,
          mode,
          newProgress
        );
        
        // Update local state
        setProgress(prev => [...prev, createdProgress]);
      }
      
      // Save to local storage for offline access
      await loadProgress();
    } catch (err) {
      console.error('Failed to add achievement:', err);
      throw err;
    }
  }, [authUser, progress, loadProgress]);

  // Get progress for mode
  const getProgressForMode = useCallback((mode: string) => {
    return progress.find(p => p.mode === mode) || null;
  }, [progress]);

  // Get all achievements
  const getAllAchievements = useCallback(() => {
    return progress.flatMap(p => {
      const achievements = p.achievements || [];
      return achievements.map(a => ({
        ...a,
        modeId: p.mode,
      }));
    });
  }, [progress]);

  // Load initial data
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Sync with server when auth state changes
  useEffect(() => {
    if (authUser) {
      syncService.syncAll();
    }
  }, [authUser]);

  return {
    progress,
    loading,
    error,
    streakDays,
    updateProgressAfterConversation,
    addAchievement,
    getProgressForMode,
    getAllAchievements,
    loadProgress,
  };
}