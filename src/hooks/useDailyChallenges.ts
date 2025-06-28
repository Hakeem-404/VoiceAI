import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import * as supabaseService from '../services/supabaseService';

export function useDailyChallenges() {
  const { user } = useSupabaseAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load daily challenges
  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get active challenges
      const challengesData = await supabaseService.getDailyChallenges(true);
      setChallenges(challengesData);
      
      // If user is logged in, get their challenge progress
      if (user) {
        const userChallengesData = await supabaseService.getUserChallenges(user.id);
        setUserChallenges(userChallengesData);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Complete a challenge
  const completeChallenge = useCallback(async (challengeId: string) => {
    if (!user) return null;
    
    try {
      const data = await supabaseService.completeChallenge(
        user.id,
        challengeId
      );
      
      // Update user challenges list
      setUserChallenges(prev => {
        const index = prev.findIndex(uc => uc.challenge_id === challengeId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      
      return data;
    } catch (err) {
      console.error('Failed to complete challenge:', err);
      throw err;
    }
  }, [user]);

  // Check if a challenge is completed
  const isChallengeCompleted = useCallback((challengeId: string) => {
    return userChallenges.some(uc => 
      uc.challenge_id === challengeId && uc.completed
    );
  }, [userChallenges]);

  // Get user's active challenges
  const getActiveChallenges = useCallback(() => {
    // Combine challenges with user progress
    return challenges.map(challenge => {
      const userChallenge = userChallenges.find(uc => 
        uc.challenge_id === challenge.id
      );
      
      return {
        ...challenge,
        completed: userChallenge?.completed || false,
        completedAt: userChallenge?.completed_at ? new Date(userChallenge.completed_at) : undefined
      };
    });
  }, [challenges, userChallenges]);

  // Load initial data
  useEffect(() => {
    loadChallenges();
    
    // Refresh challenges every hour
    const interval = setInterval(() => {
      loadChallenges();
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadChallenges]);

  return {
    challenges: getActiveChallenges(),
    loading,
    error,
    loadChallenges,
    completeChallenge,
    isChallengeCompleted,
  };
}