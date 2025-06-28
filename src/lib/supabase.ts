import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Database } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': `voiceai-companion/${Platform.OS}`,
    },
  },
});

// Network status monitoring for mobile
let isOnline = true;
let isInitialized = false;

// Initialize network monitoring
export const initializeNetworkMonitoring = () => {
  if (isInitialized || Platform.OS === 'web') return;
  
  NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? false;
    
    // If we've gone from offline to online, process any queued operations
    if (!wasOnline && isOnline) {
      processOfflineQueue();
    }
  });
  
  isInitialized = true;
};

// Queue for offline operations
interface QueuedOperation {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

let operationQueue: QueuedOperation[] = [];

// Load queue from storage
const loadQueueFromStorage = async () => {
  try {
    const queueData = await AsyncStorage.getItem('supabase_operation_queue');
    if (queueData) {
      operationQueue = JSON.parse(queueData);
    }
  } catch (error) {
    console.warn('Failed to load operation queue:', error);
  }
};

// Save queue to storage
const saveQueueToStorage = async () => {
  try {
    await AsyncStorage.setItem('supabase_operation_queue', JSON.stringify(operationQueue));
  } catch (error) {
    console.warn('Failed to save operation queue:', error);
  }
};

// Add operation to queue
export const queueOperation = async (
  table: string,
  type: 'insert' | 'update' | 'delete',
  data: any
) => {
  const operation: QueuedOperation = {
    id: Date.now().toString(),
    table,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  operationQueue.push(operation);
  await saveQueueToStorage();
  
  // If online, process immediately
  if (isOnline) {
    processOfflineQueue();
  }
};

// Process queued operations
const processOfflineQueue = async () => {
  if (!isOnline || operationQueue.length === 0) return;
  
  const queue = [...operationQueue];
  operationQueue = [];
  
  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'insert':
          await supabase.from(operation.table).insert(operation.data);
          break;
        case 'update':
          await supabase.from(operation.table).update(operation.data.updates)
            .match(operation.data.match);
          break;
        case 'delete':
          await supabase.from(operation.table).delete()
            .match(operation.data);
          break;
      }
    } catch (error) {
      console.error(`Failed to process queued operation:`, error);
      
      // Retry up to 3 times
      if (operation.retryCount < 3) {
        operation.retryCount++;
        operationQueue.push(operation);
      }
    }
  }
  
  await saveQueueToStorage();
};

// Initialize
loadQueueFromStorage();
initializeNetworkMonitoring();

// Optimistic updates helper
export const performOptimisticUpdate = async <T extends object>(
  table: string,
  match: Record<string, any>,
  updates: Partial<T>,
  onSuccess?: () => void,
  onError?: (error: any) => void
) => {
  try {
    // Apply optimistic update locally first
    onSuccess?.();
    
    // Queue or perform the actual update
    if (!isOnline) {
      await queueOperation(table, 'update', { match, updates });
      return;
    }
    
    // Perform actual update
    const { error } = await supabase
      .from(table)
      .update(updates)
      .match(match);
    
    if (error) throw error;
  } catch (error) {
    console.error('Optimistic update failed:', error);
    onError?.(error);
  }
};

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  column: string,
  value: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`${table}:${column}:${value}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `${column}=eq.${value}`,
      },
      callback
    )
    .subscribe();
};

export default supabase;