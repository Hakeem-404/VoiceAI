import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import * as supabaseService from '../services/supabaseService';
import { ConversationMessage } from '../../types/api';
import { Conversation, DocumentAnalysis } from '../types';

export function useConversationDatabase() {
  const { user } = useSupabaseAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load conversations
  const loadConversations = useCallback(async (
    limit = 20,
    offset = 0,
    filters?: {
      mode?: string;
      isBookmarked?: boolean;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getConversations(
        user.id,
        limit,
        offset,
        filters
      );
      
      // Transform to app Conversation type
      const appConversations: Conversation[] = data.map(conv => ({
        id: conv.id,
        mode: {
          id: conv.mode,
          name: conv.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
        title: conv.title || `${conv.mode.replace('-', ' ')} - ${new Date(conv.created_at).toLocaleDateString()}`,
        duration: conv.duration_seconds,
        messages: [],
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        bookmarks: [],
        highlights: [],
      }));
      
      setConversations(appConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load conversation with messages
  const loadConversationWithMessages = useCallback(async (conversationId: string) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getConversationById(conversationId);
      
      // Transform messages to app ConversationMessage type
      const messages: ConversationMessage[] = data.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Transform to app Conversation type
      const conversation: Conversation = {
        id: data.id,
        mode: {
          id: data.mode,
          name: data.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
        title: data.title || `${data.mode.replace('-', ' ')} - ${new Date(data.created_at).toLocaleDateString()}`,
        duration: data.duration_seconds,
        messages,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        bookmarks: [],
        highlights: [],
      };
      
      return conversation;
    } catch (err) {
      console.error('Failed to load conversation with messages:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new conversation
  const createConversation = useCallback(async (
    mode: string,
    title: string,
    jobDescription?: string,
    cvText?: string,
    personalizedQuestions?: any[]
  ) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.createConversation(
        user.id,
        mode,
        title,
        jobDescription,
        cvText,
        personalizedQuestions
      );
      
      // Transform to app Conversation type
      const conversation: Conversation = {
        id: data.id,
        mode: {
          id: data.mode,
          name: data.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
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
        title: data.title || `${data.mode.replace('-', ' ')} - ${new Date(data.created_at).toLocaleDateString()}`,
        duration: 0,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        bookmarks: [],
        highlights: [],
      };
      
      // Update conversations list
      setConversations(prev => [conversation, ...prev]);
      
      return conversation;
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
    messageIndex: number,
    audioUrl?: string
  ) => {
    if (!user) return null;
    
    try {
      const data = await supabaseService.addMessage(
        conversationId,
        role,
        content,
        messageIndex,
        audioUrl
      );
      
      // Transform to app ConversationMessage type
      const message: ConversationMessage = {
        id: data.id,
        role: data.role as 'user' | 'assistant' | 'system',
        content: data.content,
        timestamp: new Date(data.timestamp)
      };
      
      return message;
    } catch (err) {
      console.error('Failed to add message:', err);
      throw err;
    }
  }, [user]);

  // Save document analysis
  const saveDocumentAnalysis = useCallback(async (
    conversationId: string,
    jobDescription: string,
    cvText: string,
    analysis: DocumentAnalysis
  ) => {
    if (!user) return null;
    
    try {
      const data = await supabaseService.saveDocumentAnalysis(
        user.id,
        conversationId,
        jobDescription,
        cvText,
        analysis
      );
      
      return data;
    } catch (err) {
      console.error('Failed to save document analysis:', err);
      throw err;
    }
  }, [user]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return false;
    
    try {
      await supabaseService.deleteConversation(conversationId);
      
      // Update conversations list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [user]);

  // Toggle conversation bookmark
  const toggleBookmark = useCallback(async (
    conversationId: string,
    isBookmarked: boolean
  ) => {
    if (!user) return false;
    
    try {
      await supabaseService.toggleConversationBookmark(
        conversationId,
        isBookmarked
      );
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isBookmarked } 
          : conv
      ));
      
      return true;
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      throw err;
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    loadConversationWithMessages,
    createConversation,
    addMessage,
    saveDocumentAnalysis,
    deleteConversation,
    toggleBookmark,
  };
}