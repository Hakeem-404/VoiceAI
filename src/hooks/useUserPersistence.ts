import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { User, UserPreferences } from '../types';
import * as supabaseService from '../services/supabaseService';

export function useUserPersistence() {
  const { user: authUser } = useSupabaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  // Load user data
  const loadUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (authUser) {
        // User is authenticated, get profile from Supabase
        const userProfile = await supabaseService.getUserProfile(authUser.id);
        
        if (userProfile) {
          // Create user object from profile
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
          
          // Save to local storage
          await storageService.saveCurrentUser(userData);
          
          // Update state
          setUser(userData);
          setThemeState(userData.preferences.theme);
        } else {
          // Profile doesn't exist, create it
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || '',
            preferences: {
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
              favoriteMode: null,
              recentModes: [],
            },
            subscription: {
              tier: 'free',
              expiresAt: undefined,
              features: [],
            },
            createdAt: new Date(),
          };
          
          // Create profile on server
          await supabaseService.updateUserProfile(
            authUser.id,
            {
              email: userData.email,
              name: userData.name,
              preferences: userData.preferences,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
            }
          );
          
          // Save to local storage
          await storageService.saveCurrentUser(userData);
          
          // Update state
          setUser(userData);
          setThemeState(userData.preferences.theme);
        }
      } else {
        // User is not authenticated, check local storage
        const localUser = await storageService.getCurrentUser();
        
        if (localUser) {
          // Use local user data
          setUser(localUser);
          setThemeState(localUser.preferences.theme);
        } else {
          // No local user data
          setUser(null);
          setThemeState('system');
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError(err as Error);
      
      // Try to load from local storage as fallback
      try {
        const localUser = await storageService.getCurrentUser();
        
        if (localUser) {
          setUser(localUser);
          setThemeState(localUser.preferences.theme);
        }
      } catch (localErr) {
        console.error('Failed to load local user data:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Update user preferences
  const updatePreferences = useCallback(async (
    userId: string,
    preferences: Partial<UserPreferences>
  ) => {
    try {
      if (!user) return;
      
      // Update local user object
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      };
      
      // Update theme if it's in the preferences
      if (preferences.theme) {
        setThemeState(preferences.theme);
      }
      
      // Save to local storage
      await storageService.saveCurrentUser(updatedUser);
      
      // Update state
      setUser(updatedUser);
      
      // Sync with server if authenticated and online
      if (authUser && syncService.isOnline()) {
        await syncService.syncUserPreferences(
          userId,
          updatedUser.preferences
        );
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  }, [user, authUser]);

  // Set theme
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setThemeState(theme);
    
    if (user) {
      updatePreferences(user.id, { theme });
    }
  }, [user, updatePreferences]);

  // Add recent mode
  const addRecentMode = useCallback(async (modeId: string) => {
    if (!user) return;
    
    try {
      // Get current recent modes
      const currentModes = user.preferences.recentModes || [];
      
      // Add new mode to the beginning and remove duplicates
      const updatedModes = [modeId, ...currentModes.filter(id => id !== modeId)].slice(0, 5);
      
      // Update preferences
      await updatePreferences(user.id, { recentModes: updatedModes });
      
      // Also update in local storage for quick access
      await storageService.addRecentMode(modeId);
    } catch (err) {
      console.error('Failed to add recent mode:', err);
    }
  }, [user, updatePreferences]);

  // Set favorite mode
  const setFavoriteMode = useCallback(async (modeId: string | null) => {
    if (!user) return;
    
    try {
      // Update preferences
      await updatePreferences(user.id, { favoriteMode: modeId });
    } catch (err) {
      console.error('Failed to set favorite mode:', err);
    }
  }, [user, updatePreferences]);

  // Clear user data (for sign out)
  const clearUserData = useCallback(async () => {
    try {
      // Clear user from local storage
      await storageService.clearCurrentUser();
      
      // Update state
      setUser(null);
      setThemeState('system');
    } catch (err) {
      console.error('Failed to clear user data:', err);
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Sync with server when auth state changes
  useEffect(() => {
    if (authUser) {
      syncService.syncAll();
    }
  }, [authUser]);

  return {
    user,
    loading,
    error,
    theme,
    updatePreferences,
    setTheme,
    addRecentMode,
    setFavoriteMode,
    clearUserData,
    loadUserData,
  };
}