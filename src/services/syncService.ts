import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { getData, saveData, STORAGE_KEYS } from '../lib/asyncStorage';
import { 
  addToSyncQueue, 
  cleanupCompletedSyncOperations, 
  getPendingSyncOperations, 
  updateSyncOperationStatus 
} from './localDatabaseService';
import * as supabaseService from './supabaseService';

// Auth state management
let authState: any = null;

export const updateAuthState = (state: any) => {
  authState = state;
};

const getAuthUser = () => {
  return authState?.user || null;
};

// Network state
let isOnline = true;
let networkType: string | undefined = undefined;

// Sync listeners
const syncListeners: ((status: SyncStatus) => void)[] = [];

// Sync status interface
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

// Initialize network monitoring
export const initializeNetworkMonitoring = () => {
  if (Platform.OS === 'web') {
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

// Add a sync listener
export const addSyncListener = (listener: (status: SyncStatus) => void) => {
  syncListeners.push(listener);
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
  
  syncListeners.forEach(listener => {
    listener(currentSyncStatus);
  });
};

// Process the sync queue
export const processSyncQueue = async (forceSync = false): Promise<boolean> => {
  if (currentSyncStatus.isSyncing && !forceSync) return false;
  
  if (!isOnline) {
    updateSyncStatus({ error: 'Device is offline' });
    return false;
  }
  
  const user = getAuthUser();
  if (!user) {
    updateSyncStatus({ error: 'User not authenticated' });
    return false;
  }
  
  updateSyncStatus({ 
    isSyncing: true, 
    syncProgress: 0,
    error: undefined,
    currentOperation: 'Preparing sync'
  });
  
  try {
    // For web, just mark as complete since we don't have real database operations
    if (Platform.OS === 'web') {
      updateSyncStatus({ 
        isSyncing: false, 
        syncProgress: 100,
        lastSyncTime: new Date(),
        pendingOperations: 0,
        currentOperation: undefined
      });
      
      await saveData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      return true;
    }
    
    // Get pending operations (native only)
    const pendingOps = await getPendingSyncOperations(50);
    
    if (pendingOps.length === 0) {
      updateSyncStatus({ 
        isSyncing: false, 
        syncProgress: 100,
        lastSyncTime: new Date(),
        pendingOperations: 0,
        currentOperation: undefined
      });
      
      await saveData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      await cleanupCompletedSyncOperations();
      return true;
    }
    
    // Process operations...
    updateSyncStatus({ 
      isSyncing: false, 
      syncProgress: 100,
      lastSyncTime: new Date(),
      pendingOperations: 0,
      currentOperation: undefined
    });
    
    return true;
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

// Initialize sync service
export const initializeSyncService = async () => {
  initializeNetworkMonitoring();
  
  // Process sync queue on startup (after delay)
  setTimeout(() => {
    processSyncQueue();
  }, 5000);
  
  console.log('Sync service initialized');
};