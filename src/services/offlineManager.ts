import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getData, saveData, STORAGE_KEYS } from '../lib/asyncStorage';
import { 
  addToSyncQueue, 
  getLocalConversations, 
  getLocalConversationWithMessages,
  saveLocalConversation,
  saveLocalMessage,
  getUserPreferences,
  saveUserPreferences,
  getUserProgress,
  saveUserProgress
} from './localDatabaseService';
import { processSyncQueue } from './syncService';
import { useSupabaseAuth } from '../hooks/useSupabase';
import * as supabaseService from './supabaseService';

// Offline mode state
let isOfflineMode = false;
let isOnline = true;
let networkType: string | undefined = undefined;

// Offline listeners
const offlineListeners: ((status: OfflineStatus) => void)[] = [];

// Offline status
export interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  networkType?: string;
  lastSyncTime?: Date;
  pendingOperations: number;
}

// Current offline status
let currentOfflineStatus: OfflineStatus = {
  isOnline: true,
  isOfflineMode: false,
  pendingOperations: 0
};

// Initialize network monitoring
export const initializeOfflineManager = async () => {
  // Load offline mode preference
  const offlineMode = await getData(STORAGE_KEYS.OFFLINE_MODE);
  isOfflineMode = offlineMode === true;
  
  // Load last sync time
  const lastSync = await getData<string>(STORAGE_KEYS.LAST_SYNC);
  if (lastSync) {
    currentOfflineStatus.lastSyncTime = new Date(lastSync);
  }
  
  if (Platform.OS === 'web') {
    // For web, use navigator.onLine
    isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      isOnline = true;
      updateOfflineStatus({ isOnline });
      
      // Sync if not in offline mode
      if (!isOfflineMode) {
        processSyncQueue();
      }
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
      updateOfflineStatus({ isOnline });
    });
  } else {
    // For native platforms, use NetInfo
    NetInfo.addEventListener(state => {
      isOnline = state.isConnected ?? true;
      networkType = state.type;
      
      updateOfflineStatus({ isOnline, networkType });
      
      // Sync if online and not in offline mode
      if (isOnline && !isOfflineMode) {
        processSyncQueue();
      }
    });
  }
  
  // Update initial status
  updateOfflineStatus({ isOnline, isOfflineMode, networkType });
};

// Add an offline listener
export const addOfflineListener = (listener: (status: OfflineStatus) => void) => {
  offlineListeners.push(listener);
  // Immediately notify with current status
  listener(currentOfflineStatus);
  return () => {
    const index = offlineListeners.indexOf(listener);
    if (index !== -1) {
      offlineListeners.splice(index, 1);
    }
  };
};

// Update offline status and notify listeners
const updateOfflineStatus = (updates: Partial<OfflineStatus>) => {
  currentOfflineStatus = { ...currentOfflineStatus, ...updates };
  
  // Notify all listeners
  offlineListeners.forEach(listener => {
    listener(currentOfflineStatus);
  });
};

// Set offline mode
export const setOfflineMode = async (enabled: boolean): Promise<void> => {
  isOfflineMode = enabled;
  await saveData(STORAGE_KEYS.OFFLINE_MODE, enabled);
  updateOfflineStatus({ isOfflineMode });
  
  // If turning off offline mode and we're online, sync
  if (!enabled && isOnline) {
    processSyncQueue();
  }
};

// Get current offline status
export const getOfflineStatus = (): OfflineStatus => {
  return { ...currentOfflineStatus };
};

// Fetch and store conversations for offline use
export const prepareOfflineData = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Fetch conversations from Supabase
    const conversations = await supabaseService.getConversations(userId, 50);
    
    // Save each conversation locally
    for (const conversation of conversations) {
      // Convert to local format
      const localConversation = {
        id: conversation.id,
        mode: {
          id: conversation.mode,
          name: conversation.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: '',
          icon: '',
          systemPrompt: '',
          category: 'social',
          difficulty: 'beginner',
          estimatedDuration: 0,
          color: { primary: '#6366F1', secondary: '#8B5CF6', gradient: ['#6366F1', '#8B5CF6'] },
          features: [],
          topics: [],
          aiPersonalities: [],
          sessionTypes: {
            quick: { duration: 0, description: '' },
            standard: { duration: 0, description: '' },
            extended: { duration: 0, description: '' }
          }
        },
        title: conversation.title || `${conversation.mode.replace('-', ' ')} - ${new Date(conversation.created_at).toLocaleDateString()}`,
        duration: conversation.duration_seconds,
        messages: [],
        createdAt: new Date(conversation.created_at),
        updatedAt: new Date(conversation.updated_at),
        bookmarks: [],
        highlights: [],
        isBookmarked: conversation.is_bookmarked,
        feedback: conversation.feedback_summary,
        sharingSettings: conversation.sharing_settings,
        configuration: {
          customSettings: {
            jobDescription: conversation.job_description,
            cvContent: conversation.cv_text,
            personalizedQuestions: conversation.personalized_questions
          }
        }
      };
      
      // Save conversation locally
      await saveLocalConversation(localConversation, userId);
      
      // Fetch messages for this conversation
      const messages = await supabaseService.getMessages(conversation.id);
      
      // Save each message locally
      for (const message of messages) {
        await saveLocalMessage(conversation.id, {
          id: message.id,
          role: message.role as 'user' | 'assistant' | 'system',
          content: message.content,
          timestamp: new Date(message.timestamp),
          audio_url: message.audio_url,
          message_index: message.message_index,
          feedback_data: message.feedback_data,
          is_highlighted: message.is_highlighted
        });
      }
    }
    
    // Fetch user progress
    const progress = await supabaseService.getUserProgress(userId);
    
    // Save progress locally
    for (const item of progress) {
      await saveUserProgress(userId, item.mode, item);
    }
    
    // Fetch user profile
    const profile = await supabaseService.getUserProfile(userId);
    
    // Save preferences locally
    if (profile) {
      await saveUserPreferences(userId, profile.preferences || {});
    }
    
    // Update last sync time
    const now = new Date();
    await saveData(STORAGE_KEYS.LAST_SYNC, now.toISOString());
    updateOfflineStatus({ lastSyncTime: now });
    
    return true;
  } catch (error) {
    console.error('Error preparing offline data:', error);
    return false;
  }
};

// Check if we need to sync based on time and settings
export const shouldSync = async (): Promise<boolean> => {
  // If offline mode is enabled, don't sync
  if (isOfflineMode) return false;
  
  // If we're not online, don't sync
  if (!isOnline) return false;
  
  // Check network preferences
  const networkPreferences = await getData(STORAGE_KEYS.NETWORK_PREFERENCES);
  if (networkPreferences?.wifiOnly && networkType !== 'wifi') {
    return false;
  }
  
  // Check last sync time
  const lastSync = await getData<string>(STORAGE_KEYS.LAST_SYNC);
  if (!lastSync) return true; // Never synced before
  
  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  
  // Get sync frequency from preferences (default to 15 minutes)
  const syncFrequency = networkPreferences?.syncFrequency || 15 * 60 * 1000;
  
  return now - lastSyncTime > syncFrequency;
};

// Create a conversation in offline mode
export const createOfflineConversation = async (
  conversation: any,
  userId?: string
): Promise<string> => {
  try {
    // Save locally
    const localId = await saveLocalConversation(conversation, userId);
    
    // Add to sync queue if user is logged in
    if (userId) {
      await addToSyncQueue(
        'create',
        'conversation',
        localId,
        conversation,
        'normal'
      );
      
      // Update pending operations count
      updatePendingOperationsCount();
    }
    
    return localId;
  } catch (error) {
    console.error('Error creating offline conversation:', error);
    throw error;
  }
};

// Add a message in offline mode
export const addOfflineMessage = async (
  conversationId: string,
  message: any
): Promise<string> => {
  try {
    // Save locally
    const localId = await saveLocalMessage(conversationId, message);
    
    // Add to sync queue
    const { user } = useSupabaseAuth.getState();
    if (user) {
      await addToSyncQueue(
        'create',
        'message',
        localId,
        {
          ...message,
          conversation_id: conversationId
        },
        'high'
      );
      
      // Update pending operations count
      updatePendingOperationsCount();
    }
    
    return localId;
  } catch (error) {
    console.error('Error adding offline message:', error);
    throw error;
  }
};

// Update pending operations count
const updatePendingOperationsCount = async () => {
  try {
    const pendingOps = await getPendingOperationsCount();
    updateOfflineStatus({ pendingOperations: pendingOps });
  } catch (error) {
    console.error('Error updating pending operations count:', error);
  }
};

// Get pending operations count
const getPendingOperationsCount = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Return 0 on web platform since database is not available
    if (!db) {
      resolve(0);
      return;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending";',
        [],
        (_, result) => {
          resolve(result.rows.item(0).count);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Get database from localDatabaseService
const getDatabase = () => {
  // This is a workaround to avoid circular dependencies
  return require('./localDatabaseService').getDatabase();
};

// Initialize the offline manager when this module is imported
initializeOfflineManager().catch(error => {
  console.error('Offline manager initialization error:', error);
});