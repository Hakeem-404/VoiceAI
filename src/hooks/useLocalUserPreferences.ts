import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { getUserPreferences, saveUserPreferences } from '../services/localDatabaseService';
import { UserPreferences } from '../types';

export function useLocalUserPreferences() {
  const { user } = useSupabaseAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserPreferences(user.id);
      
      if (data) {
        // Convert to UserPreferences format
        const userPrefs: UserPreferences = {
          theme: data.theme as 'light' | 'dark' | 'system',
          voiceSettings: data.voiceSettings,
          notifications: data.notifications,
          language: data.language,
          favoriteMode: data.favoriteMode,
          recentModes: data.recentModes || [],
        };
        
        setPreferences(userPrefs);
      } else {
        // Set default preferences
        const defaultPrefs: UserPreferences = {
          theme: 'system',
          voiceSettings: {
            selectedVoice: 'en-US-Standard-A',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8,
          },
          notifications: {
            practiceReminders: true,
            dailyGoals: true,
            achievements: false,
          },
          language: 'en-US',
          recentModes: [],
        };
        
        setPreferences(defaultPrefs);
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update user preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      // Update local state
      setPreferences(prev => {
        if (!prev) return updates as UserPreferences;
        return { ...prev, ...updates };
      });
      
      // Save to local database
      const currentPrefs = preferences || {};
      const updatedPrefs = { ...currentPrefs, ...updates };
      
      await saveUserPreferences(user.id, updatedPrefs);
      
      return true;
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError(err as Error);
      return false;
    }
  }, [user, preferences]);

  // Set theme
  const setTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    return updatePreferences({ theme });
  }, [updatePreferences]);

  // Set voice settings
  const setVoiceSettings = useCallback(async (voiceSettings: UserPreferences['voiceSettings']) => {
    return updatePreferences({ voiceSettings });
  }, [updatePreferences]);

  // Set notification settings
  const setNotificationSettings = useCallback(async (notifications: UserPreferences['notifications']) => {
    return updatePreferences({ notifications });
  }, [updatePreferences]);

  // Set language
  const setLanguage = useCallback(async (language: string) => {
    return updatePreferences({ language });
  }, [updatePreferences]);

  // Set favorite mode
  const setFavoriteMode = useCallback(async (favoriteMode: string | undefined) => {
    return updatePreferences({ favoriteMode });
  }, [updatePreferences]);

  // Add recent mode
  const addRecentMode = useCallback(async (modeId: string) => {
    if (!preferences) return false;
    
    const recentModes = [
      modeId,
      ...preferences.recentModes.filter(id => id !== modeId)
    ].slice(0, 5);
    
    return updatePreferences({ recentModes });
  }, [preferences, updatePreferences]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user, loadPreferences]);

  return {
    preferences,
    loading,
    error,
    loadPreferences,
    updatePreferences,
    setTheme,
    setVoiceSettings,
    setNotificationSettings,
    setLanguage,
    setFavoriteMode,
    addRecentMode,
  };
}