import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Conversation, Message, User, UserPreferences } from '../types';

// Storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  CURRENT_USER: 'current_user',
  CONVERSATIONS: 'conversations',
  CONVERSATION_DRAFTS: 'conversation_drafts',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
  APP_CONFIG: 'app_config',
  RECENT_MODES: 'recent_modes',
};

// Queue item for offline operations
interface QueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'conversation' | 'message' | 'user' | 'preference';
  data: any;
  timestamp: number;
  retryCount: number;
}

// Network status
let isOnline = true;

// Initialize network monitoring
const initNetworkMonitoring = () => {
  if (Platform.OS !== 'web') {
    NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      isOnline = state.isConnected ?? false;
      
      // If we've gone from offline to online, process sync queue
      if (wasOffline && isOnline) {
        processSyncQueue();
      }
    });
  } else {
    // For web, use window.navigator.onLine
    isOnline = navigator.onLine;
    window.addEventListener('online', () => {
      isOnline = true;
      processSyncQueue();
    });
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }
};

// Storage service
class StorageService {
  private syncQueue: QueueItem[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.loadSyncQueue();
    initNetworkMonitoring();
  }

  // Load sync queue from storage
  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  // Save sync queue to storage
  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Add item to sync queue
  async addToSyncQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: QueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();

    // If online, process queue immediately
    if (isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.isProcessingQueue || !isOnline || this.syncQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      const queue = [...this.syncQueue];
      this.syncQueue = [];

      for (const item of queue) {
        try {
          // Process item based on entity and operation
          // This would call the appropriate Supabase service methods
          console.log(`Processing sync item: ${item.entity} - ${item.operation}`);
          
          // In a real implementation, this would call the appropriate service
          // For example: await supabaseService.createConversation(item.data);
        } catch (error) {
          console.error(`Failed to process sync item ${item.id}:`, error);
          
          // If retry count is less than 3, add back to queue
          if (item.retryCount < 3) {
            this.syncQueue.push({
              ...item,
              retryCount: item.retryCount + 1,
            });
          }
        }
      }
    } finally {
      await this.saveSyncQueue();
      this.isProcessingQueue = false;
    }
  }

  // User preferences
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  // Current user
  async saveCurrentUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save current user:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async clearCurrentUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Failed to clear current user:', error);
      throw error;
    }
  }

  // Conversations
  async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
      throw error;
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);
      
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      await this.saveConversations(conversations);
      
      // Add to sync queue if it's a local ID
      if (conversation.id.startsWith('local_')) {
        await this.addToSyncQueue({
          operation: 'create',
          entity: 'conversation',
          data: conversation,
        });
      } else {
        await this.addToSyncQueue({
          operation: 'update',
          entity: 'conversation',
          data: conversation,
        });
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const conversations = await this.getConversations();
      return conversations.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const updatedConversations = conversations.filter(c => c.id !== id);
      await this.saveConversations(updatedConversations);
      
      // Add to sync queue if it's not a local ID
      if (!id.startsWith('local_')) {
        await this.addToSyncQueue({
          operation: 'delete',
          entity: 'conversation',
          data: { id },
        });
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // Conversation drafts
  async saveConversationDraft(conversationId: string, messages: Message[]): Promise<void> {
    try {
      const drafts = await this.getConversationDrafts();
      drafts[conversationId] = messages;
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save conversation draft:', error);
      throw error;
    }
  }

  async getConversationDrafts(): Promise<Record<string, Message[]>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_DRAFTS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get conversation drafts:', error);
      return {};
    }
  }

  async getConversationDraft(conversationId: string): Promise<Message[] | null> {
    try {
      const drafts = await this.getConversationDrafts();
      return drafts[conversationId] || null;
    } catch (error) {
      console.error('Failed to get conversation draft:', error);
      return null;
    }
  }

  async deleteConversationDraft(conversationId: string): Promise<void> {
    try {
      const drafts = await this.getConversationDrafts();
      delete drafts[conversationId];
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to delete conversation draft:', error);
      throw error;
    }
  }

  // Recent modes
  async saveRecentModes(modes: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_MODES, JSON.stringify(modes));
    } catch (error) {
      console.error('Failed to save recent modes:', error);
      throw error;
    }
  }

  async getRecentModes(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_MODES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get recent modes:', error);
      return [];
    }
  }

  async addRecentMode(modeId: string): Promise<string[]> {
    try {
      const modes = await this.getRecentModes();
      const updatedModes = [modeId, ...modes.filter(id => id !== modeId)].slice(0, 5);
      await this.saveRecentModes(updatedModes);
      return updatedModes;
    } catch (error) {
      console.error('Failed to add recent mode:', error);
      throw error;
    }
  }

  // App configuration
  async saveAppConfig(config: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save app config:', error);
      throw error;
    }
  }

  async getAppConfig(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get app config:', error);
      return {};
    }
  }

  async updateAppConfig(updates: Record<string, any>): Promise<Record<string, any>> {
    try {
      const config = await this.getAppConfig();
      const updatedConfig = { ...config, ...updates };
      await this.saveAppConfig(updatedConfig);
      return updatedConfig;
    } catch (error) {
      console.error('Failed to update app config:', error);
      throw error;
    }
  }

  // Last sync timestamp
  async saveLastSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Failed to save last sync:', error);
      throw error;
    }
  }

  async getLastSync(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Failed to get last sync:', error);
      return 0;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();