import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { 
  getLocalConversations, 
  getLocalConversationWithMessages, 
  saveLocalConversation, 
  saveLocalMessage, 
  deleteLocalConversation, 
  toggleLocalConversationBookmark 
} from '../services/localDatabaseService';
import { createOfflineConversation, addOfflineMessage } from '../services/offlineManager';
import { Conversation, ConversationMode, Message } from '../types';
import { ConversationMessage } from '../../types/api';

export function useLocalConversations() {
  const { user } = useSupabaseAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Load conversations
  const loadConversations = useCallback(async (
    limit = 20,
    offset = 0,
    filters?: {
      mode?: string;
      isBookmarked?: boolean;
      searchQuery?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLocalConversations(
        user?.id,
        limit,
        offset,
        filters
      );
      
      setConversations(data);
    } catch (err) {
      console.error('Failed to load local conversations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load conversation with messages
  const loadConversationWithMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const conversation = await getLocalConversationWithMessages(conversationId);
      
      if (conversation) {
        setCurrentConversation(conversation);
      }
      
      return conversation;
    } catch (err) {
      console.error('Failed to load conversation with messages:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (
    mode: ConversationMode,
    configuration?: any
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const sessionId = Date.now().toString();
      const createdAt = new Date();
      
      const newConversation: Conversation = {
        id: `local_${sessionId}`,
        mode,
        title: `${mode.name} - ${createdAt.toLocaleDateString()}`,
        duration: 0,
        messages: [],
        createdAt,
        updatedAt: createdAt,
        bookmarks: [],
        highlights: [],
        configuration,
      };
      
      // Save to local database
      const localId = await createOfflineConversation(newConversation, user?.id);
      
      // Update the ID
      newConversation.id = localId;
      
      // Update state
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      return newConversation;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add message to conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    audioUrl?: string
  ) => {
    try {
      // Create message object
      const message: ConversationMessage = {
        id: `local_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
        audio_url: audioUrl,
        message_index: currentConversation?.messages.length || 0
      };
      
      // Save to local database
      await addOfflineMessage(conversationId, message);
      
      // Update current conversation if it's the active one
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...prev.messages, message],
            updatedAt: new Date()
          };
        });
      }
      
      return message;
    } catch (err) {
      console.error('Failed to add message:', err);
      throw err;
    }
  }, [currentConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await deleteLocalConversation(id);
      
      // Update state
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [currentConversation]);

  // Toggle conversation bookmark
  const toggleBookmark = useCallback(async (
    id: string,
    isBookmarked: boolean
  ) => {
    try {
      await toggleLocalConversationBookmark(id, isBookmarked);
      
      // Update state
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, isBookmarked } : c
      ));
      
      // Update current conversation if it's the one being bookmarked
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return { ...prev, isBookmarked };
        });
      }
      
      return true;
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      throw err;
    }
  }, [currentConversation]);

  // Search conversations
  const searchConversations = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await getLocalConversations(
        user?.id,
        50, // Larger limit for search
        0,
        { searchQuery: query }
      );
      
      return results;
    } catch (err) {
      console.error('Failed to search conversations:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    error,
    loadConversations,
    loadConversationWithMessages,
    createConversation,
    addMessage,
    deleteConversation,
    toggleBookmark,
    searchConversations,
    setCurrentConversation,
  };
}