import { create } from 'zustand';
import { Conversation, Message, ConversationMode, RecordingState } from '../types';

interface ConversationState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  currentMode: ConversationMode | null;
  recordingState: RecordingState;
  isProcessing: boolean;
  audioLevels: number[];
  
  // Actions
  startConversation: (mode: ConversationMode) => void;
  endConversation: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setRecordingState: (state: RecordingState) => void;
  setProcessing: (processing: boolean) => void;
  updateAudioLevels: (levels: number[]) => void;
  saveConversation: (conversation: Conversation) => void;
  loadConversations: () => void;
  deleteConversation: (id: string) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  currentConversation: null,
  conversations: [],
  currentMode: null,
  recordingState: 'idle',
  isProcessing: false,
  audioLevels: [],

  startConversation: (mode: ConversationMode) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      mode,
      title: `${mode.name} - ${new Date().toLocaleDateString()}`,
      duration: 0,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set({
      currentConversation: newConversation,
      currentMode: mode,
      recordingState: 'idle',
    });
  },

  endConversation: () => {
    const { currentConversation, conversations } = get();
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        updatedAt: new Date(),
      };
      
      set({
        conversations: [updatedConversation, ...conversations],
        currentConversation: null,
        currentMode: null,
        recordingState: 'idle',
      });
    }
  },

  addMessage: (messageData) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      updatedAt: new Date(),
    };

    set({ currentConversation: updatedConversation });
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