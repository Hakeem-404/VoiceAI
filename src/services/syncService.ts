import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getData, saveData, STORAGE_KEYS } from '../lib/asyncStorage';
import { 
  addToSyncQueue, 
  cleanupCompletedSyncOperations, 
  getPendingSyncOperations, 
  updateSyncOperationStatus 
} from './localDatabaseService';
import * as supabaseService from './supabaseService';
import supabase from '../lib/supabase';

// Background sync task name
const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Network state
let isOnline = true;
let networkType: string | undefined = undefined;
let isBackgroundSyncRegistered = false;

// Sync listeners
const syncListeners: ((status: SyncStatus) => void)[] = [];

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  networkType?: string;
  isSyncing: boolean;
  lastSyncTime?: Date;
  pendingOperations: number;
  syncProgress: number;
  currentOperation?: string;
  error?: string;
}

// Current sync status
let currentSyncStatus: SyncStatus = {
  isOnline: true,
  isSyncing: false,
  pendingOperations: 0,
  syncProgress: 0
};

// Get current user
const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};

// Initialize network monitoring
export const initializeNetworkMonitoring = () => {
  if (Platform.OS === 'web') {
    // For web, use navigator.onLine
    isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      isOnline = true;
      updateSyncStatus({ isOnline });
      processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
      updateSyncStatus({ isOnline });
    });
  } else {
    // For native platforms, use NetInfo
    NetInfo.addEventListener(state => {
      isOnline = state.isConnected ?? true;
      networkType = state.type;
      
      updateSyncStatus({ isOnline, networkType });
      
      if (isOnline) {
        processSyncQueue();
      }
    });
  }
};

// Register background sync task
export const registerBackgroundSync = async () => {
  if (Platform.OS === 'web' || isBackgroundSyncRegistered) return;
  
  try {
    // Define the task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;
        
        const result = await performSync();
        
        return result 
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error('Background sync error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    
    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    isBackgroundSyncRegistered = true;
    console.log('Background sync registered');
  } catch (error) {
    console.error('Error registering background sync:', error);
  }
};

// Unregister background sync task
export const unregisterBackgroundSync = async () => {
  if (Platform.OS === 'web' || !isBackgroundSyncRegistered) return;
  
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    isBackgroundSyncRegistered = false;
    console.log('Background sync unregistered');
  } catch (error) {
    console.error('Error unregistering background sync:', error);
  }
};

// Add a sync listener
export const addSyncListener = (listener: (status: SyncStatus) => void) => {
  syncListeners.push(listener);
  // Immediately notify with current status
  listener(currentSyncStatus);
  return () => {
    const index = syncListeners.indexOf(listener);
    if (index !== -1) {
      syncListeners.splice(index, 1);
    }
  };
};

// Update sync status and notify listeners
const updateSyncStatus = (updates: Partial<SyncStatus>) => {
  currentSyncStatus = { ...currentSyncStatus, ...updates };
  
  // Notify all listeners
  syncListeners.forEach(listener => {
    listener(currentSyncStatus);
  });
};

// Process the sync queue
export const processSyncQueue = async (forceSync = false): Promise<boolean> => {
  // Skip sync on web platform since there's no local database
  if (Platform.OS === 'web') {
    console.log('Sync not available on web platform');
    return false;
  }
  
  // Check if we're already syncing
  if (currentSyncStatus.isSyncing && !forceSync) return false;
  
  // Check if we're online
  if (!isOnline) {
    updateSyncStatus({ error: 'Device is offline' });
    return false;
  }
  
  // Get user from auth state
  const user = await getCurrentUser();
  if (!user) {
    updateSyncStatus({ error: 'User not authenticated' });
    return false;
  }
  
  // Check sync preferences
  const syncPreferences = await getData(STORAGE_KEYS.NETWORK_PREFERENCES);
  if (
    syncPreferences?.wifiOnly && 
    networkType !== 'wifi' && 
    !forceSync
  ) {
    updateSyncStatus({ error: 'Sync is set to WiFi only' });
    return false;
  }
  
  // Start syncing
  updateSyncStatus({ 
    isSyncing: true, 
    syncProgress: 0,
    error: undefined,
    currentOperation: 'Preparing sync'
  });
  
  try {
    // Get pending operations
    const pendingOps = await getPendingSyncOperations(50);
    
    if (pendingOps.length === 0) {
      updateSyncStatus({ 
        isSyncing: false, 
        syncProgress: 100,
        lastSyncTime: new Date(),
        pendingOperations: 0,
        currentOperation: undefined
      });
      
      // Save last sync time
      await saveData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      // Clean up completed operations
      await cleanupCompletedSyncOperations();
      
      return true;
    }
    
    updateSyncStatus({ 
      pendingOperations: pendingOps.length,
      currentOperation: 'Processing sync queue'
    });
    
    // Process each operation
    let successCount = 0;
    
    for (let i = 0; i < pendingOps.length; i++) {
      const op = pendingOps[i];
      
      // Update progress
      updateSyncStatus({ 
        syncProgress: Math.round((i / pendingOps.length) * 100),
        currentOperation: `Syncing ${op.entityType} (${i + 1}/${pendingOps.length})`
      });
      
      // Mark as in progress
      await updateSyncOperationStatus(op.id, 'in_progress');
      
      try {
        // Process based on entity type and operation
        let success = false;
        
        switch (op.entityType) {
          case 'conversation':
            success = await syncConversation(op);
            break;
          case 'message':
            success = await syncMessage(op);
            break;
          case 'user_progress':
            success = await syncUserProgress(op);
            break;
          case 'user_preferences':
            success = await syncUserPreferences(op);
            break;
        }
        
        // Update status
        if (success) {
          await updateSyncOperationStatus(op.id, 'completed');
          successCount++;
        } else {
          await updateSyncOperationStatus(op.id, 'failed', 'Sync operation failed');
        }
      } catch (error) {
        console.error(`Error processing sync operation ${op.id}:`, error);
        await updateSyncOperationStatus(
          op.id, 
          'failed', 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
    
    // Update final status
    updateSyncStatus({ 
      isSyncing: false, 
      syncProgress: 100,
      lastSyncTime: new Date(),
      pendingOperations: pendingOps.length - successCount,
      currentOperation: undefined
    });
    
    // Save last sync time
    await saveData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    
    return successCount > 0;
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus({ 
      isSyncing: false, 
      error: error instanceof Error ? error.message : 'Unknown sync error',
      currentOperation: undefined
    });
    return false;
  }
};

// Perform sync (for background tasks)
const performSync = async (): Promise<boolean> => {
  try {
    return await processSyncQueue();
  } catch (error) {
    console.error('Perform sync error:', error);
    return false;
  }
};

// Sync a conversation
const syncConversation = async (operation: any): Promise<boolean> => {
  const { operationType, data, entityId } = operation;
  
  try {
    switch (operationType) {
      case 'create':
      case 'update':
        // Create or update conversation in Supabase
        await supabaseService.updateConversation(entityId, data);
        return true;
        
      case 'delete':
        // Delete conversation from Supabase
        await supabaseService.deleteConversation(entityId);
        return true;
        
      default:
        console.error(`Unknown operation type: ${operationType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error syncing conversation ${entityId}:`, error);
    throw error;
  }
};

// Sync a message
const syncMessage = async (operation: any): Promise<boolean> => {
  const { operationType, data, entityId } = operation;
  
  try {
    switch (operationType) {
      case 'create':
      case 'update':
        // Create or update message in Supabase
        await supabaseService.addMessage(
          data.conversation_id,
          data.role,
          data.content,
          data.message_index,
          data.audio_url
        );
        return true;
        
      case 'delete':
        // Delete message from Supabase (not implemented in supabaseService)
        console.warn('Message deletion not implemented in supabaseService');
        return true;
        
      default:
        console.error(`Unknown operation type: ${operationType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error syncing message ${entityId}:`, error);
    throw error;
  }
};

// Sync user progress
const syncUserProgress = async (operation: any): Promise<boolean> => {
  const { operationType, data, entityId } = operation;
  
  try {
    switch (operationType) {
      case 'create':
      case 'update':
        // Create or update user progress in Supabase
        await supabaseService.updateUserProgress(
          data.user_id,
          data.mode,
          data
        );
        return true;
        
      case 'delete':
        // Delete user progress from Supabase (not implemented in supabaseService)
        console.warn('User progress deletion not implemented in supabaseService');
        return true;
        
      default:
        console.error(`Unknown operation type: ${operationType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error syncing user progress ${entityId}:`, error);
    throw error;
  }
};

// Sync user preferences
const syncUserPreferences = async (operation: any): Promise<boolean> => {
  const { operationType, data, entityId } = operation;
  
  try {
    switch (operationType) {
      case 'create':
      case 'update':
        // Create or update user preferences in Supabase
        await supabaseService.updateUserPreferences(
          data.user_id,
          data
        );
        return true;
        
      case 'delete':
        // Delete user preferences from Supabase (not implemented in supabaseService)
        console.warn('User preferences deletion not implemented in supabaseService');
        return true;
        
      default:
        console.error(`Unknown operation type: ${operationType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error syncing user preferences ${entityId}:`, error);
    throw error;
  }
};

// Initialize sync service
export const initializeSyncService = async () => {
  // Initialize network monitoring
  initializeNetworkMonitoring();
  
  // Register background sync task (skip on web)
  if (Platform.OS !== 'web') {
    await registerBackgroundSync();
  }
  
  // Process sync queue on startup (skip on web since no local database)
  if (Platform.OS !== 'web') {
    setTimeout(() => {
      processSyncQueue();
    }, 5000); // Wait 5 seconds to allow app to initialize
  }
};

// Initialize the sync service when this module is imported
initializeSyncService().catch(error => {
  console.error('Sync service initialization error:', error);
});