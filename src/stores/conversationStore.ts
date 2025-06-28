import { create } from 'zustand';
import { Conversation, ConversationMode, RecordingState, ConversationSession, ModeConfiguration, ConversationBookmark, ConversationHighlight, DocumentAnalysis, FeedbackData } from '../types';
import { ConversationMessage } from '../../types/api';
import { claudeFeedbackService } from '../services/claudeFeedbackService';
import * as supabaseService from '../services/supabaseService';

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
  setCurrentConversation: (conversation: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentMode: (mode: ConversationMode | null) => void;
  createConversation: (mode: ConversationMode, configuration?: ModeConfiguration) => Conversation;
  endCurrentConversation: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  addMessageToSession: (message: ConversationMessage) => void;
  addBookmark: (messageId: string, note?: string) => void;
  addHighlight: (messageId: string, text: string, color: string) => void;
  setRecordingState: (state: RecordingState) => void;
  setProcessing: (processing: boolean) => void;
  updateAudioLevels: (levels: number[]) => void;
  saveConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
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

  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setConversations: (conversations) => set({ conversations }),
  setCurrentMode: (mode) => set({ currentMode: mode }),

  createConversation: (mode: ConversationMode, configuration?: ModeConfiguration) => {
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
      startTime: createdAt,
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
    
    // Add to conversations list
    const { conversations } = get();
    set({ conversations: [newConversation, ...conversations] });
    
    return newConversation;
  },

  endCurrentConversation: () => {
    const { currentConversation, currentSession } = get();
    
    if (!currentConversation) return;
    
    // Calculate duration
    const duration = Math.floor(
      (new Date().getTime() - currentConversation.createdAt.getTime()) / 1000
    );
    
    // Update conversation with duration
    const updatedConversation = {
      ...currentConversation,
      duration,
      updatedAt: new Date()
    };
    
    // Update conversations list
    const { conversations } = get();
    const updatedConversations = conversations.map(c => 
      c.id === updatedConversation.id ? updatedConversation : c
    );
    
    set({
      conversations: updatedConversations,
      currentConversation: null,
      currentMode: null,
      currentSession: null,
      recordingState: 'idle',
    });
  },

  generateFeedback: async (conversation: Conversation) => {
    try {
      const feedback = await claudeFeedbackService.generateFeedback(conversation);
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

  addMessageToSession: (message) => {
    const { currentSession, currentConversation } = get();
    if (!currentSession || !currentConversation) return;

    // Update session
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message],
    };

    // Update conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, message],
      updatedAt: new Date(),
    };

    set({ 
      currentSession: updatedSession,
      currentConversation: updatedConversation
    });

    // Update conversations list
    const { conversations } = get();
    const updatedConversations = conversations.map(c =>
      c.id === updatedConversation.id ? updatedConversation : c
    );
    set({ conversations: updatedConversations });
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

  removeConversation: (id: string) => {
    const { conversations, currentConversation } = get();
    
    // Remove from conversations list
    const updatedConversations = conversations.filter(c => c.id !== id);
    set({ conversations: updatedConversations });
    
    // Clear current conversation if it's the one being deleted
    if (currentConversation?.id === id) {
      set({
        currentConversation: null,
        currentMode: null,
        currentSession: null,
        recordingState: 'idle',
      });
    }
  },
}));