import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import * as supabaseService from '../services/supabaseService';

export function useUserProgress(mode?: string) {
  const { user } = useSupabaseAuth();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load user progress
  const loadProgress = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getUserProgress(user.id, mode);
      setProgress(data);
    } catch (err) {
      console.error('Failed to load user progress:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, mode]);

  // Update user progress
  const updateProgress = useCallback(async (
    mode: string,
    updates: any
  ) => {
    if (!user) return null;
    
    try {
      const data = await supabaseService.updateUserProgress(
        user.id,
        mode,
        updates
      );
      
      // Update progress list
      setProgress(prev => {
        const index = prev.findIndex(p => p.mode === mode);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      
      return data;
    } catch (err) {
      console.error('Failed to update progress:', err);
      throw err;
    }
  }, [user]);

  // Update skill scores
  const updateSkillScores = useCallback(async (
    mode: string,
    skillScores: Record<string, number>
  ) => {
    if (!user) return null;
    
    try {
      // Get existing progress
      const existingProgress = progress.find(p => p.mode === mode);
      
      // Merge with existing skill scores
      const updatedScores = {
        ...(existingProgress?.skill_scores || {}),
        ...skillScores
      };
      
      // Update progress
      return updateProgress(mode, { skill_scores: updatedScores });
    } catch (err) {
      console.error('Failed to update skill scores:', err);
      throw err;
    }
  }, [user, progress, updateProgress]);

  // Add achievement
  const addAchievement = useCallback(async (
    mode: string,
    achievement: {
      id: string;
      title: string;
      description: string;
      icon: string;
      unlockedAt: string;
    }
  ) => {
    if (!user) return null;
    
    try {
      // Get existing progress
      const existingProgress = progress.find(p => p.mode === mode);
      
      // Get existing achievements
      const existingAchievements = existingProgress?.achievements || [];
      
      // Check if achievement already exists
      if (existingAchievements.some((a: any) => a.id === achievement.id)) {
        return existingProgress;
      }
      
      // Add new achievement
      const updatedAchievements = [...existingAchievements, achievement];
      
      // Update progress
      return updateProgress(mode, { achievements: updatedAchievements });
    } catch (err) {
      console.error('Failed to add achievement:', err);
      throw err;
    }
  }, [user, progress, updateProgress]);

  // Update session stats
  const updateSessionStats = useCallback(async (
    mode: string,
    sessionDuration: number,
    qualityScore: number
  ) => {
    if (!user) return null;
    
    try {
      // Get existing progress
      const existingProgress = progress.find(p => p.mode === mode);
      
      // Calculate updates
      const updates = {
        total_sessions: (existingProgress?.total_sessions || 0) + 1,
        total_duration: (existingProgress?.total_duration || 0) + sessionDuration,
        last_session_date: new Date().toISOString()
      };
      
      // Update best scores if applicable
      const bestScores = existingProgress?.best_scores || {};
      if (!bestScores.quality || qualityScore > bestScores.quality) {
        bestScores.quality = qualityScore;
      }
      
      // Update progress
      return updateProgress(mode, {
        ...updates,
        best_scores: bestScores
      });
    } catch (err) {
      console.error('Failed to update session stats:', err);
      throw err;
    }
  }, [user, progress, updateProgress]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user, loadProgress]);

  return {
    progress,
    loading,
    error,
    loadProgress,
    updateProgress,
    updateSkillScores,
    addAchievement,
    updateSessionStats,
  };
}