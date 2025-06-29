import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { Conversation, Message } from '../types';
import { ConversationMode } from '../types';
import { getModeById } from '../constants/conversationModes';

export function useConversationPersistence() {
  const { user } = useSupabaseAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(syncService.isOnline());

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get conversations from local storage
      const localConversations = await storageService.getConversations();
      setConversations(localConversations);
      
      // If user is authenticated and online, sync with server
      if (user && syncService.isOnline()) {
        await syncService.syncAll();
        
        // Reload from local storage after sync
        const updatedConversations = await storageService.getConversations();
        setConversations(updatedConversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create conversation
  const createConversation = useCallback(async (
    mode: ConversationMode,
    title?: string,
    initialMessages: Message[] = []
  ): Promise<Conversation> => {
    try {
      const now = new Date();
      const conversationId = `local_${Date.now()}`;
      
      const newConversation: Conversation = {
        id: conversationId,
        mode,
        title: title || `${mode.name} - ${now.toLocaleDateString()}`,
        duration: 0,
        messages: initialMessages,
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
      if (user && syncService.isOnline()) {
        const syncedConversation = await syncService.saveConversation(
          user.id,
          newConversation
        );
        
        // Update state with synced conversation
        setConversations(prev => 
          prev.map(c => c.id === newConversation.id ? syncedConversation : c)
        );
        
        return syncedConversation;
      }
      
      return newConversation;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      throw err;
    }
  }, [user]);

  // Add message to conversation
  const addMessage = useCallback(async (
    conversationId: string,
    message: Message
  ): Promise<Conversation> => {
    try {
      // Get conversation
      const conversation = await storageService.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
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
      if (user && syncService.isOnline()) {
        await syncService.addMessageToConversation(
          user.id,
          conversationId,
          message
        );
      }
      
      return updatedConversation;
    } catch (err) {
      console.error('Failed to add message:', err);
      throw err;
    }
  }, [user]);

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
      if (user && syncService.isOnline()) {
        await syncService.saveConversation(
          user.id,
          updatedConversation
        );
      }
      
      return updatedConversation;
    } catch (err) {
      console.error('Failed to update conversation:', err);
      throw err;
    }
  }, [user]);

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
      if (user && syncService.isOnline()) {
        await syncService.deleteConversation(
          user.id,
          conversationId
        );
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [user]);

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
      if (user && syncService.isOnline()) {
        await syncService.toggleConversationBookmark(
          user.id,
          conversationId,
          isBookmarked
        );
      }
      
      return updatedConversation;
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      throw err;
    }
  }, [user]);

  // Get conversation by ID
  const getConversation = useCallback(async (
    conversationId: string
  ): Promise<Conversation | null> => {
    try {
      return await storageService.getConversation(conversationId);
    } catch (err) {
      console.error('Failed to get conversation:', err);
      throw err;
    }
  }, []);

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

  // Load initial data
  useEffect(() => {
    loadConversations();
    
    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(syncService.isOnline());
    };
    
    // Set up interval to check online status
    const interval = setInterval(checkOnlineStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    isOnline,
    createConversation,
    addMessage,
    updateConversation,
    deleteConversation,
    toggleBookmark,
    getConversation,
    searchConversations,
    loadConversations,
  };
}