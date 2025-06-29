import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { storageService } from './storageService';
import * as supabaseService from './supabaseService';
import { Conversation, Message, User, UserPreferences } from '../types';
import { useSupabaseAuth } from '../hooks/useSupabase';

// Network status
let isOnline = true;
let isInitialized = false;

// Initialize network monitoring
const initNetworkMonitoring = () => {
  if (isInitialized) return;
  
  if (Platform.OS !== 'web') {
    NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      isOnline = state.isConnected ?? false;
      
      // If we've gone from offline to online, process sync
      if (wasOffline && isOnline) {
        syncService.syncAll();
      }
    });
  } else {
    // For web, use window.navigator.onLine
    isOnline = navigator.onLine;
    window.addEventListener('online', () => {
      isOnline = true;
      syncService.syncAll();
    });
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }
  
  isInitialized = true;
};

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    initNetworkMonitoring();
    this.setupPeriodicSync();
  }
  
  // Set up periodic sync
  private setupPeriodicSync() {
    // Sync every 5 minutes if online
    this.syncInterval = setInterval(() => {
      if (isOnline) {
        this.syncAll();
      }
    }, 5 * 60 * 1000);
  }
  
  // Sync all data
  async syncAll() {
    if (this.isSyncing || !isOnline) return;
    
    this.isSyncing = true;
    
    try {
      const user = await storageService.getCurrentUser();
      
      // Only sync if user is authenticated
      if (user && user.id) {
        await this.syncUserData(user);
        await this.syncConversations(user.id);
        await this.syncUserProgress(user.id);
        
        // Update last sync timestamp
        await storageService.saveLastSync(Date.now());
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  // Sync user data
  private async syncUserData(user: User) {
    try {
      // Get user profile from Supabase
      const userProfile = await supabaseService.getUserProfile(user.id);
      
      if (userProfile) {
        // Update local user data with server data
        const updatedUser: User = {
          ...user,
          email: userProfile.email || user.email,
          name: userProfile.name || user.name,
          preferences: {
            ...user.preferences,
            ...(userProfile.preferences as any || {}),
          },
          subscription: {
            tier: userProfile.subscription_tier as 'free' | 'premium' | 'pro',
            expiresAt: undefined,
            features: [],
          },
        };
        
        // Save updated user to local storage
        await storageService.saveCurrentUser(updatedUser);
      } else {
        // User profile doesn't exist on server, create it
        await supabaseService.updateUserProfile(user.id, {
          email: user.email,
          name: user.name,
          preferences: user.preferences,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to sync user data:', error);
      throw error;
    }
  }
  
  // Sync conversations
  private async syncConversations(userId: string) {
    try {
      // Get local conversations
      const localConversations = await storageService.getConversations();
      
      // Get server conversations
      const serverConversations = await supabaseService.getConversations(userId, 100, 0);
      
      // Create map of server conversations by ID
      const serverConversationMap = new Map(
        serverConversations.map(c => [c.id, c])
      );
      
      // Process local conversations
      for (const localConv of localConversations) {
        // Skip local-only conversations
        if (localConv.id.startsWith('local_')) {
          // If it has messages, create it on the server
          if (localConv.messages.length > 0) {
            try {
              const serverConv = await supabaseService.createConversation(
                userId,
                localConv.mode.id,
                localConv.title,
                undefined,
                undefined,
                undefined
              );
              
              // Add messages to server conversation
              for (const msg of localConv.messages) {
                await supabaseService.addMessage(
                  serverConv.id,
                  msg.role === 'ai' ? 'assistant' : msg.role,
                  msg.content,
                  parseInt(msg.id),
                  msg.audioUrl
                );
              }
              
              // Update local conversation with server ID
              const updatedLocalConv = {
                ...localConv,
                id: serverConv.id,
              };
              
              // Update local storage
              await storageService.saveConversation(updatedLocalConv);
            } catch (error) {
              console.error('Failed to create server conversation:', error);
            }
          }
          continue;
        }
        
        // Check if local conversation exists on server
        const serverConv = serverConversationMap.get(localConv.id);
        
        if (serverConv) {
          // Local conversation exists on server, check which is newer
          const localUpdated = new Date(localConv.updatedAt).getTime();
          const serverUpdated = new Date(serverConv.updated_at).getTime();
          
          if (serverUpdated > localUpdated) {
            // Server is newer, get full conversation with messages
            const fullServerConv = await supabaseService.getConversationById(localConv.id);
            
            // Convert to app Conversation type
            const updatedConv: Conversation = {
              id: fullServerConv.id,
              mode: {
                id: fullServerConv.mode,
                name: fullServerConv.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
              title: fullServerConv.title || `${fullServerConv.mode.replace('-', ' ')} - ${new Date(fullServerConv.created_at).toLocaleDateString()}`,
              duration: fullServerConv.duration_seconds,
              messages: fullServerConv.messages.map(m => ({
                id: m.id,
                role: m.role === 'assistant' ? 'ai' : m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
                audioUrl: m.audio_url,
              })),
              createdAt: new Date(fullServerConv.created_at),
              updatedAt: new Date(fullServerConv.updated_at),
              bookmarks: [],
              highlights: [],
              isBookmarked: fullServerConv.is_bookmarked,
              feedback: fullServerConv.feedback_summary as any || null,
            };
            
            // Update local storage
            await storageService.saveConversation(updatedConv);
          } else {
            // Local is newer, update server
            await supabaseService.updateConversation(localConv.id, {
              title: localConv.title,
              duration_seconds: localConv.duration,
              updated_at: new Date().toISOString(),
              is_bookmarked: localConv.isBookmarked || false,
            });
          }
          
          // Remove from server map to track processed conversations
          serverConversationMap.delete(localConv.id);
        } else {
          // Local conversation doesn't exist on server, create it
          try {
            const serverConv = await supabaseService.createConversation(
              userId,
              localConv.mode.id,
              localConv.title,
              undefined,
              undefined,
              undefined
            );
            
            // Add messages to server conversation
            for (const msg of localConv.messages) {
              await supabaseService.addMessage(
                serverConv.id,
                msg.role === 'ai' ? 'assistant' : msg.role,
                msg.content,
                parseInt(msg.id),
                msg.audioUrl
              );
            }
            
            // Update local conversation with server ID
            const updatedLocalConv = {
              ...localConv,
              id: serverConv.id,
            };
            
            // Update local storage
            await storageService.saveConversation(updatedLocalConv);
          } catch (error) {
            console.error('Failed to create server conversation:', error);
          }
        }
      }
      
      // Process remaining server conversations (not in local storage)
      for (const [id, serverConv] of serverConversationMap.entries()) {
        // Get full conversation with messages
        const fullServerConv = await supabaseService.getConversationById(id);
        
        // Convert to app Conversation type
        const newConv: Conversation = {
          id: fullServerConv.id,
          mode: {
            id: fullServerConv.mode,
            name: fullServerConv.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
          title: fullServerConv.title || `${fullServerConv.mode.replace('-', ' ')} - ${new Date(fullServerConv.created_at).toLocaleDateString()}`,
          duration: fullServerConv.duration_seconds,
          messages: fullServerConv.messages.map(m => ({
            id: m.id,
            role: m.role === 'assistant' ? 'ai' : m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            audioUrl: m.audio_url,
          })),
          createdAt: new Date(fullServerConv.created_at),
          updatedAt: new Date(fullServerConv.updated_at),
          bookmarks: [],
          highlights: [],
          isBookmarked: fullServerConv.is_bookmarked,
          feedback: fullServerConv.feedback_summary as any || null,
        };
        
        // Add to local storage
        const localConversations = await storageService.getConversations();
        await storageService.saveConversations([...localConversations, newConv]);
      }
    } catch (error) {
      console.error('Failed to sync conversations:', error);
      throw error;
    }
  }
  
  // Sync user progress
  private async syncUserProgress(userId: string) {
    try {
      // Get user progress from server
      const progress = await supabaseService.getUserProgress(userId);
      
      // Store progress data in app config
      await storageService.updateAppConfig({ userProgress: progress });
    } catch (error) {
      console.error('Failed to sync user progress:', error);
      throw error;
    }
  }
  
  // Sync user preferences
  async syncUserPreferences(userId: string, preferences: UserPreferences) {
    try {
      if (!isOnline) {
        // Store locally and add to sync queue
        await storageService.saveUserPreferences(preferences);
        return;
      }
      
      // Update preferences on server
      await supabaseService.updateUserPreferences(userId, preferences);
      
      // Update local storage
      await storageService.saveUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to sync user preferences:', error);
      
      // Store locally even if server update fails
      await storageService.saveUserPreferences(preferences);
      throw error;
    }
  }
  
  // Save conversation with sync
  async saveConversation(userId: string | undefined, conversation: Conversation) {
    try {
      // Always save locally first
      await storageService.saveConversation(conversation);
      
      // If user is not authenticated or offline, just keep locally
      if (!userId || !isOnline) {
        return conversation;
      }
      
      // If conversation has a local ID, create on server
      if (conversation.id.startsWith('local_')) {
        try {
          // Create conversation on server
          const serverConv = await supabaseService.createConversation(
            userId,
            conversation.mode.id,
            conversation.title,
            undefined,
            undefined,
            undefined
          );
          
          // Add messages to server conversation
          for (const msg of conversation.messages) {
            await supabaseService.addMessage(
              serverConv.id,
              msg.role === 'ai' ? 'assistant' : msg.role,
              msg.content,
              parseInt(msg.id),
              msg.audioUrl
            );
          }
          
          // Update local conversation with server ID
          const updatedConversation = {
            ...conversation,
            id: serverConv.id,
          };
          
          // Update local storage
          await storageService.saveConversation(updatedConversation);
          
          return updatedConversation;
        } catch (error) {
          console.error('Failed to create conversation on server:', error);
          return conversation;
        }
      } else {
        // Update existing conversation on server
        try {
          await supabaseService.updateConversation(conversation.id, {
            title: conversation.title,
            duration_seconds: conversation.duration,
            message_count: conversation.messages.length,
            updated_at: new Date().toISOString(),
            is_bookmarked: conversation.isBookmarked || false,
          });
          
          return conversation;
        } catch (error) {
          console.error('Failed to update conversation on server:', error);
          return conversation;
        }
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }
  
  // Delete conversation with sync
  async deleteConversation(userId: string | undefined, conversationId: string) {
    try {
      // Always delete locally first
      await storageService.deleteConversation(conversationId);
      
      // If user is not authenticated or offline, just delete locally
      if (!userId || !isOnline || conversationId.startsWith('local_')) {
        return;
      }
      
      // Delete from server
      try {
        await supabaseService.deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation from server:', error);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }
  
  // Add message to conversation with sync
  async addMessageToConversation(
    userId: string | undefined,
    conversationId: string,
    message: Message
  ) {
    try {
      // Get local conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Add message to local conversation
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: new Date(),
      };
      
      // Save locally
      await storageService.saveConversation(updatedConversation);
      
      // If user is not authenticated or offline, just keep locally
      if (!userId || !isOnline || conversationId.startsWith('local_')) {
        return updatedConversation;
      }
      
      // Add message to server conversation
      try {
        await supabaseService.addMessage(
          conversationId,
          message.role === 'ai' ? 'assistant' : message.role,
          message.content,
          conversation.messages.length,
          message.audioUrl
        );
        
        return updatedConversation;
      } catch (error) {
        console.error('Failed to add message to server conversation:', error);
        return updatedConversation;
      }
    } catch (error) {
      console.error('Failed to add message to conversation:', error);
      throw error;
    }
  }
  
  // Toggle conversation bookmark with sync
  async toggleConversationBookmark(
    userId: string | undefined,
    conversationId: string,
    isBookmarked: boolean
  ) {
    try {
      // Get local conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Update local conversation
      const updatedConversation = {
        ...conversation,
        isBookmarked,
        updatedAt: new Date(),
      };
      
      // Save locally
      await storageService.saveConversation(updatedConversation);
      
      // If user is not authenticated or offline, just keep locally
      if (!userId || !isOnline || conversationId.startsWith('local_')) {
        return updatedConversation;
      }
      
      // Update server conversation
      try {
        await supabaseService.toggleConversationBookmark(
          conversationId,
          isBookmarked
        );
        
        return updatedConversation;
      } catch (error) {
        console.error('Failed to toggle bookmark on server:', error);
        return updatedConversation;
      }
    } catch (error) {
      console.error('Failed to toggle conversation bookmark:', error);
      throw error;
    }
  }
  
  // Check if online
  isOnline() {
    return isOnline;
  }
  
  // Clean up
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();