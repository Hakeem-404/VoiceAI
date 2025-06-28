import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import { useConversationDatabase } from './useConversationDatabase';
import { Conversation, ConversationMode, Message, FeedbackData } from '../types';
import { ConversationMessage } from '../../types/api';
import { claudeFeedbackService } from '../services/claudeFeedbackService';

export function useConversationStore() {
  const { user } = useSupabaseAuth();
  const { 
    conversations: dbConversations, 
    loading, 
    loadConversations,
    createConversation: createDbConversation,
    addMessage: addDbMessage,
    deleteConversation: deleteDbConversation,
    toggleBookmark: toggleDbBookmark
  } = useConversationDatabase();
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [lastFeedback, setLastFeedback] = useState<FeedbackData | null>(null);
  
  // Sync conversations from database
  useEffect(() => {
    if (dbConversations.length > 0) {
      setConversations(dbConversations);
    }
  }, [dbConversations]);
  
  // Start a new conversation
  const startConversation = useCallback(async (
    mode: ConversationMode,
    configuration?: any
  ) => {
    try {
      // Create conversation in database if user is authenticated
      let conversationId = `local_${Date.now()}`;
      let createdAt = new Date();
      
      if (user) {
        const dbConversation = await createDbConversation(
          mode.id,
          `${mode.name} - ${new Date().toLocaleDateString()}`,
          configuration?.customSettings?.jobDescription,
          configuration?.customSettings?.cvContent,
          configuration?.customSettings?.personalizedQuestions
        );
        
        if (dbConversation) {
          conversationId = dbConversation.id;
          createdAt = dbConversation.createdAt;
        }
      }
      
      // Create local conversation object
      const newConversation: Conversation = {
        id: conversationId,
        mode,
        title: `${mode.name} - ${new Date().toLocaleDateString()}`,
        duration: 0,
        messages: [],
        createdAt,
        updatedAt: createdAt,
        bookmarks: [],
        highlights: [],
      };
      
      // Set as current conversation
      setCurrentConversation(newConversation);
      
      // Add to conversations list if not already there
      setConversations(prev => {
        if (!prev.some(c => c.id === newConversation.id)) {
          return [newConversation, ...prev];
        }
        return prev;
      });
      
      return newConversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return null;
    }
  }, [user, createDbConversation]);
  
  // End the current conversation
  const endConversation = useCallback(async () => {
    if (!currentConversation) return null;
    
    try {
      // Calculate duration
      const duration = Math.floor(
        (new Date().getTime() - currentConversation.createdAt.getTime()) / 1000
      );
      
      // Generate feedback
      let feedback: FeedbackData | null = null;
      try {
        feedback = await claudeFeedbackService.generateFeedback(currentConversation);
        setLastFeedback(feedback);
      } catch (error) {
        console.error('Failed to generate feedback:', error);
      }
      
      // Update conversation with duration and feedback
      const updatedConversation = {
        ...currentConversation,
        duration,
        feedback,
        updatedAt: new Date()
      };
      
      // Update conversations list
      setConversations(prev => 
        prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
      );
      
      // Clear current conversation
      setCurrentConversation(null);
      
      return updatedConversation;
    } catch (error) {
      console.error('Failed to end conversation:', error);
      return null;
    }
  }, [currentConversation]);
  
  // Add a message to the current conversation
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    audioUrl?: string
  ) => {
    if (!currentConversation) return null;
    
    try {
      // Create message object
      const message: Message = {
        id: `msg_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
        audioUrl
      };
      
      // Add to database if user is authenticated
      if (user && currentConversation.id.startsWith('local_') === false) {
        await addDbMessage(
          currentConversation.id,
          role === 'ai' ? 'assistant' : role,
          content,
          currentConversation.messages.length,
          audioUrl
        );
      }
      
      // Update current conversation
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, message],
        updatedAt: new Date()
      };
      
      setCurrentConversation(updatedConversation);
      
      // Update conversations list
      setConversations(prev => 
        prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
      );
      
      return message;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }, [currentConversation, user, addDbMessage]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      // Delete from database if user is authenticated
      if (user && id.startsWith('local_') === false) {
        await deleteDbConversation(id);
      }
      
      // Remove from conversations list
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }, [currentConversation, user, deleteDbConversation]);
  
  // Toggle conversation bookmark
  const toggleBookmark = useCallback(async (
    id: string,
    isBookmarked: boolean
  ) => {
    try {
      // Update in database if user is authenticated
      if (user && id.startsWith('local_') === false) {
        await toggleDbBookmark(id, isBookmarked);
      }
      
      // Update conversations list
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, isBookmarked } : c
      ));
      
      return true;
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      return false;
    }
  }, [user, toggleDbBookmark]);
  
  // Load conversations from database
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);
  
  return {
    currentConversation,
    conversations,
    loading,
    lastFeedback,
    startConversation,
    endConversation,
    addMessage,
    deleteConversation,
    toggleBookmark,
    setLastFeedback: (feedback: FeedbackData | null) => setLastFeedback(feedback),
  };
}