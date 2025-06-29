import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { Conversation, ConversationMode, User, UserPreferences } from '../types';
import { getModeById } from '../constants/conversationModes';

export function useDataPersistence() {
  const { user: authUser } = useSupabaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isOnline, setIsOnline] = useState(syncService.isOnline());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      try {
        // Load user data
        await loadUserData();
        
        // Load conversations
        await loadConversations();
        
        // Load progress
        await loadProgress();
        
        // Load last sync time
        const timestamp = await storageService.getLastSync();
        if (timestamp > 0) {
          setLastSyncTime(new Date(timestamp));
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Set up interval to check online status
    const interval = setInterval(() => {
      setIsOnline(syncService.isOnline());
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Sync when auth state changes
  useEffect(() => {
    if (authUser) {
      syncService.syncAll();
    }
  }, [authUser]);

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      if (authUser) {
        // User is authenticated, get profile from Supabase
        const userProfile = await syncService.getUserProfile(authUser.id);
        
        if (userProfile) {
          setUser(userProfile);
          setThemeState(userProfile.preferences.theme);
        }
      } else {
        // User is not authenticated, check local storage
        const localUser = await storageService.getCurrentUser();
        
        if (localUser) {
          setUser(localUser);
          setThemeState(localUser.preferences.theme);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      
      // Try to load from local storage as fallback
      try {
        const localUser = await storageService.getCurrentUser();
        
        if (localUser) {
          setUser(localUser);
          setThemeState(localUser.preferences.theme);
        }
      } catch (localError) {
        console.error('Failed to load local user data:', localError);
      }
    }
  }, [authUser]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      // Get conversations from local storage
      const localConversations = await storageService.getConversations();
      setConversations(localConversations);
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline) {
        await syncService.syncConversations(authUser.id);
        
        // Reload from local storage after sync
        const updatedConversations = await storageService.getConversations();
        setConversations(updatedConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [authUser, isOnline]);

  // Load progress
  const loadProgress = useCallback(async () => {
    try {
      if (authUser && isOnline) {
        // User is authenticated and online, get progress from server
        const userProgress = await syncService.getUserProgress(authUser.id);
        setProgress(userProgress);
        
        // Get user profile for streak days
        const userProfile = await syncService.getUserProfile(authUser.id);
        if (userProfile) {
          setStreakDays(userProfile.streak_days || 0);
        }
      } else {
        // Get from local storage
        const appConfig = await storageService.getAppConfig();
        
        if (appConfig.userProgress) {
          setProgress(appConfig.userProgress);
        }
        
        if (appConfig.streakDays !== undefined) {
          setStreakDays(appConfig.streakDays);
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      
      // Try to load from local storage as fallback
      try {
        const appConfig = await storageService.getAppConfig();
        
        if (appConfig.userProgress) {
          setProgress(appConfig.userProgress);
        }
        
        if (appConfig.streakDays !== undefined) {
          setStreakDays(appConfig.streakDays);
        }
      } catch (localError) {
        console.error('Failed to load local progress data:', localError);
      }
    }
  }, [authUser, isOnline]);

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
      if (authUser && isOnline) {
        await syncService.updateUserPreferences(userId, updatedUser.preferences);
      } else {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, [user, authUser, isOnline]);

  // Set theme
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setThemeState(theme);
    
    if (user) {
      updatePreferences(user.id, { theme });
    }
  }, [user, updatePreferences]);

  // Create conversation
  const createConversation = useCallback(async (
    mode: ConversationMode,
    options?: { title?: string }
  ): Promise<Conversation> => {
    try {
      const now = new Date();
      const conversationId = `local_${Date.now()}`;
      
      const newConversation: Conversation = {
        id: conversationId,
        mode,
        title: options?.title || `${mode.name} - ${now.toLocaleDateString()}`,
        duration: 0,
        messages: [],
        createdAt: now,
        updatedAt: now,
        bookmarks: [],
        highlights: [],
      };
      
      // Save to local storage
      await storageService.saveConversation(newConversation);
      
      // Update state
      setConversations(prev => [newConversation, ...prev]);
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline) {
        const syncedConversation = await syncService.saveConversation(
          authUser.id,
          newConversation
        );
        
        // Update state with synced conversation
        setConversations(prev => 
          prev.map(c => c.id === newConversation.id ? syncedConversation : c)
        );
        
        return syncedConversation;
      } else if (authUser) {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
      
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }, [authUser, isOnline]);

  // Add message to conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'ai',
    content: string,
    audioUrl?: string
  ): Promise<Conversation> => {
    try {
      // Get conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Create message
      const message: any = {
        id: `msg_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
        audioUrl,
      };
      
      // Add message to conversation
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: new Date(),
      };
      
      // Save to local storage
      await storageService.saveConversation(updatedConversation);
      
      // Update state
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updatedConversation : c)
      );
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline) {
        await syncService.addMessageToConversation(
          authUser.id,
          conversationId,
          message
        );
      } else if (authUser) {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }, [authUser, isOnline]);

  // Update conversation
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> => {
    try {
      // Get conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Update conversation
      const updatedConversation = {
        ...conversation,
        ...updates,
        updatedAt: new Date(),
      };
      
      // Save to local storage
      await storageService.saveConversation(updatedConversation);
      
      // Update state
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updatedConversation : c)
      );
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline) {
        await syncService.saveConversation(
          authUser.id,
          updatedConversation
        );
      } else if (authUser) {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Failed to update conversation:', error);
      throw error;
    }
  }, [authUser, isOnline]);

  // Delete conversation
  const deleteConversation = useCallback(async (
    conversationId: string
  ): Promise<void> => {
    try {
      // Delete from local storage
      await storageService.deleteConversation(conversationId);
      
      // Update state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline && !conversationId.startsWith('local_')) {
        await syncService.deleteConversation(
          authUser.id,
          conversationId
        );
      } else if (authUser && !conversationId.startsWith('local_')) {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [authUser, isOnline]);

  // Toggle conversation bookmark
  const toggleBookmark = useCallback(async (
    conversationId: string,
    isBookmarked: boolean
  ): Promise<Conversation> => {
    try {
      // Get conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Update conversation
      const updatedConversation = {
        ...conversation,
        isBookmarked,
        updatedAt: new Date(),
      };
      
      // Save to local storage
      await storageService.saveConversation(updatedConversation);
      
      // Update state
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? updatedConversation : c)
      );
      
      // If user is authenticated and online, sync with server
      if (authUser && isOnline && !conversationId.startsWith('local_')) {
        await syncService.toggleConversationBookmark(
          authUser.id,
          conversationId,
          isBookmarked
        );
      } else if (authUser && !conversationId.startsWith('local_')) {
        // Add to pending changes
        setPendingChanges(prev => prev + 1);
      }
      
      return updatedConversation;
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      throw error;
    }
  }, [authUser, isOnline]);

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
    } catch (error) {
      console.error('Failed to add recent mode:', error);
    }
  }, [user, updatePreferences]);

  // Search conversations
  const searchConversations = useCallback((
    query: string
  ): Conversation[] => {
    if (!query.trim()) return conversations;
    
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) ||
      c.mode.name.toLowerCase().includes(lowerQuery) ||
      c.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
  }, [conversations]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      return { success: false, error: 'Device is offline' };
    }
    
    try {
      await syncService.syncAll();
      setLastSyncTime(new Date());
      setPendingChanges(0);
      
      // Reload data
      await loadUserData();
      await loadConversations();
      await loadProgress();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to force sync:', error);
      return { success: false, error: 'Sync failed' };
    }
  }, [isOnline, loadUserData, loadConversations, loadProgress]);

  return {
    // User data
    user,
    theme,
    updatePreferences,
    setTheme,
    addRecentMode,
    
    // Conversation data
    conversations,
    createConversation,
    addMessage,
    updateConversation,
    deleteConversation,
    toggleBookmark,
    searchConversations,
    loadConversations,
    
    // Progress data
    progress,
    streakDays,
    loadProgress,
    
    // Sync status
    isOnline,
    lastSyncTime,
    pendingChanges,
    forceSync,
    
    // Loading state
    loading,
  };
}