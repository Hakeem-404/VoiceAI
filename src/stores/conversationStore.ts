import { create } from 'zustand';
import { Conversation, ConversationMode, RecordingState, ConversationSession, ModeConfiguration, ConversationBookmark, ConversationHighlight, DocumentAnalysis, FeedbackData } from '../types';
import { ConversationMessage } from '../../types/api';
import { feedbackService } from '../services/feedbackService';

interface ConversationState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  currentMode: ConversationMode | null;
  recordingState: RecordingState;
  isProcessing: boolean;
  audioLevels: number[];
  currentSession: ConversationSession | null;
  lastFeedback: FeedbackData | null;
  
  // Actions
  startConversation: (mode: ConversationMode, configuration?: ModeConfiguration) => void;
  endConversation: () => Promise<FeedbackData | null>;
  pauseSession: () => void;
  resumeSession: () => void;
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  addBookmark: (messageId: string, note?: string) => void;
  addHighlight: (messageId: string, text: string, color: string) => void;
  setRecordingState: (state: RecordingState) => void;
  setProcessing: (processing: boolean) => void;
  updateAudioLevels: (levels: number[]) => void;
  saveConversation: (conversation: Conversation) => void;
  loadConversations: () => void;
  deleteConversation: (id: string) => void;
  switchMode: (mode: ConversationMode) => void;
  generateFeedback: (conversation: Conversation) => Promise<FeedbackData | null>;
  clearLastFeedback: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  currentConversation: null,
  conversations: [],
  currentMode: null,
  recordingState: 'idle',
  isProcessing: false,
  audioLevels: [],
  currentSession: null,
  lastFeedback: null,

  startConversation: (mode: ConversationMode, configuration?: ModeConfiguration) => {
    const sessionId = Date.now().toString();
    const conversationId = `${sessionId}_conversation`;
    
    const newConversation: Conversation = {
      id: conversationId,
      mode,
      title: `${mode.name} - ${new Date().toLocaleDateString()}`,
      duration: 0,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      bookmarks: [],
      highlights: [],
    };

    const newSession: ConversationSession = {
      id: sessionId,
      modeId: mode.id,
      configuration: configuration || {
        modeId: mode.id,
        difficulty: mode.difficulty,
        sessionType: 'standard',
        selectedTopics: mode.topics.slice(0, 2),
        aiPersonality: mode.aiPersonalities[0],
      },
      startTime: new Date(),
      isPaused: false,
      totalPauseTime: 0,
      messages: [],
      bookmarks: [],
      highlights: [],
    };
    
    set({
      currentConversation: newConversation,
      currentMode: mode,
      currentSession: newSession,
      recordingState: 'idle',
      lastFeedback: null,
    });
  },

  endConversation: async () => {
    const { currentConversation, currentSession, conversations } = get();
    if (currentConversation && currentSession) {
      const endTime = new Date();
      const totalDuration = Math.floor((endTime.getTime() - currentSession.startTime.getTime() - currentSession.totalPauseTime) / 1000);
      
      const updatedConversation = {
        ...currentConversation,
        duration: totalDuration,
        updatedAt: endTime,
        bookmarks: currentSession.bookmarks,
        highlights: currentSession.highlights,
      };
      
      // Generate feedback before ending the conversation
      let feedback: FeedbackData | null = null;
      try {
        feedback = await feedbackService.generateFeedback(updatedConversation);
        console.log('Generated feedback for conversation:', updatedConversation.id);
      } catch (error) {
        console.error('Failed to generate feedback:', error);
      }
      
      set({
        conversations: [updatedConversation, ...conversations],
        currentConversation: null,
        currentMode: null,
        currentSession: null,
        recordingState: 'idle',
        lastFeedback: feedback,
      });
      
      return feedback;
    }
    return null;
  },

  generateFeedback: async (conversation: Conversation) => {
    try {
      const feedback = await feedbackService.generateFeedback(conversation);
      set({ lastFeedback: feedback });
      return feedback;
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      return null;
    }
  },

  clearLastFeedback: () => {
    set({ lastFeedback: null });
  },

  pauseSession: () => {
    const { currentSession } = get();
    if (currentSession && !currentSession.isPaused) {
      set({
        currentSession: {
          ...currentSession,
          isPaused: true,
          pausedAt: new Date(),
        }
      });
    }
  },

  resumeSession: () => {
    const { currentSession } = get();
    if (currentSession && currentSession.isPaused && currentSession.pausedAt) {
      const pauseDuration = new Date().getTime() - currentSession.pausedAt.getTime();
      set({
        currentSession: {
          ...currentSession,
          isPaused: false,
          pausedAt: undefined,
          totalPauseTime: currentSession.totalPauseTime + pauseDuration,
        }
      });
    }
  },

  addMessage: (messageData) => {
    const { currentConversation, currentSession } = get();
    if (!currentConversation || !currentSession) return;

    const newMessage: ConversationMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date(),
      role: messageData.role === 'ai' ? 'assistant' : messageData.role,
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date(),
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, newMessage],
    };

    set({ 
      currentConversation: updatedConversation,
      currentSession: updatedSession,
    });
  },

  addBookmark: (messageId: string, note?: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const newBookmark: ConversationBookmark = {
      id: Date.now().toString(),
      messageId,
      note,
      timestamp: new Date(),
    };

    set({
      currentSession: {
        ...currentSession,
        bookmarks: [...currentSession.bookmarks, newBookmark],
      }
    });
  },

  addHighlight: (messageId: string, text: string, color: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const newHighlight: ConversationHighlight = {
      id: Date.now().toString(),
      messageId,
      text,
      color,
      timestamp: new Date(),
    };

    set({
      currentSession: {
        ...currentSession,
        highlights: [...currentSession.highlights, newHighlight],
      }
    });
  },

  switchMode: (mode: ConversationMode) => {
    const { currentConversation, currentSession } = get();
    if (!currentConversation || !currentSession) return;

    // Update current conversation and session with new mode
    const updatedConversation = {
      ...currentConversation,
      mode,
      title: `${mode.name} - ${new Date().toLocaleDateString()}`,
      updatedAt: new Date(),
    };

    const updatedSession = {
      ...currentSession,
      modeId: mode.id,
      configuration: {
        ...currentSession.configuration,
        modeId: mode.id,
      },
    };

    set({
      currentConversation: updatedConversation,
      currentMode: mode,
      currentSession: updatedSession,
    });
  },

  setRecordingState: (state: RecordingState) => {
    set({ recordingState: state });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  updateAudioLevels: (levels: number[]) => {
    set({ audioLevels: levels });
  },

  saveConversation: (conversation: Conversation) => {
    const { conversations } = get();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      const updatedConversations = [...conversations];
      updatedConversations[existingIndex] = conversation;
      set({ conversations: updatedConversations });
    } else {
      set({ conversations: [conversation, ...conversations] });
    }
  },

  loadConversations: () => {
    // In a real app, this would load from secure storage
    // For now, we'll use mock data
    const mockConversations: Conversation[] = [];
    set({ conversations: mockConversations });
  },

  deleteConversation: (id: string) => {
    const { conversations } = get();
    set({
      conversations: conversations.filter(c => c.id !== id)
    });
  },
}));