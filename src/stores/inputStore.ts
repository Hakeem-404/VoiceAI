import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InputMode = 'voice' | 'text' | 'hybrid';

export interface TextDraft {
  id: string;
  text: string;
  timestamp: Date;
  title?: string;
  tags?: string[];
  mode?: string;
  documentContext?: {
    jobDescription?: string;
    cvContent?: string;
  };
}

export interface InputState {
  inputMode: InputMode;
  currentText: string;
  suggestions: string[];
  inputHistory: string[];
  isTextInputVisible: boolean;
  quickActions: string[];
  savedDrafts: TextDraft[];
  documentData: {
    jobDescription: string;
    cvContent: string;
    lastModified: Date | null;
    isValid: boolean;
  };
  
  // Actions
  setInputMode: (mode: InputMode) => void;
  setCurrentText: (text: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  addToHistory: (text: string) => void;
  setTextInputVisible: (visible: boolean) => void;
  clearCurrentText: () => void;
  getRecentSuggestions: () => string[];
  saveDraft: (text: string, title?: string, tags?: string[], documentContext?: any) => void;
  loadDrafts: () => Promise<void>;
  deleteDraft: (id: string) => void;
  updateDocumentData: (data: Partial<InputState['documentData']>) => void;
}

export const useInputStore = create<InputState>((set, get) => ({
  inputMode: 'voice',
  currentText: '',
  suggestions: [],
  inputHistory: [],
  isTextInputVisible: false,
  quickActions: [
    'Tell me about yourself',
    'What are your strengths?',
    'Describe a challenge you faced',
    'Why do you want this job?',
    'Where do you see yourself in 5 years?',
  ],
  savedDrafts: [],
  documentData: {
    jobDescription: '',
    cvContent: '',
    lastModified: null,
    isValid: false,
  },

  setInputMode: (inputMode) => set({ inputMode }),
  
  setCurrentText: (currentText) => set({ currentText }),
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  addToHistory: (text) => {
    const { inputHistory } = get();
    const newHistory = [text, ...inputHistory.filter(item => item !== text)].slice(0, 20);
    set({ inputHistory: newHistory });
    
    // Save to AsyncStorage
    AsyncStorage.setItem('input_history', JSON.stringify(newHistory))
      .catch(err => console.error('Failed to save input history:', err));
  },
  
  setTextInputVisible: (isTextInputVisible) => set({ isTextInputVisible }),
  
  clearCurrentText: () => set({ currentText: '' }),
  
  getRecentSuggestions: () => {
    const { inputHistory, quickActions } = get();
    return [...inputHistory.slice(0, 3), ...quickActions.slice(0, 2)];
  },
  
  saveDraft: (text, title, tags, documentContext) => {
    if (!text.trim()) return;
    
    const { savedDrafts } = get();
    const newDraft: TextDraft = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      title: title || `Draft ${new Date().toLocaleString()}`,
      tags,
      documentContext,
    };
    
    const updatedDrafts = [newDraft, ...savedDrafts].slice(0, 20); // Keep last 20 drafts
    set({ savedDrafts: updatedDrafts });
    
    // Save to AsyncStorage
    AsyncStorage.setItem('saved_drafts', JSON.stringify(updatedDrafts))
      .catch(err => console.error('Failed to save drafts:', err));
  },
  
  loadDrafts: async () => {
    try {
      // Load drafts
      const draftsJson = await AsyncStorage.getItem('saved_drafts');
      if (draftsJson) {
        const drafts = JSON.parse(draftsJson);
        set({ savedDrafts: drafts.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        }))});
      }
      
      // Load input history
      const historyJson = await AsyncStorage.getItem('input_history');
      if (historyJson) {
        set({ inputHistory: JSON.parse(historyJson) });
      }
      
      // Load document data
      const documentJson = await AsyncStorage.getItem('document_data');
      if (documentJson) {
        const docData = JSON.parse(documentJson);
        set({ 
          documentData: {
            ...docData,
            lastModified: docData.lastModified ? new Date(docData.lastModified) : null,
          }
        });
      }
    } catch (error) {
      console.error('Failed to load input data:', error);
    }
  },
  
  deleteDraft: (id) => {
    const { savedDrafts } = get();
    const updatedDrafts = savedDrafts.filter(draft => draft.id !== id);
    set({ savedDrafts: updatedDrafts });
    
    // Update AsyncStorage
    AsyncStorage.setItem('saved_drafts', JSON.stringify(updatedDrafts))
      .catch(err => console.error('Failed to update drafts:', err));
  },
  
  updateDocumentData: (data) => {
    const { documentData } = get();
    const updatedData = {
      ...documentData,
      ...data,
      lastModified: new Date(),
    };
    
    // Update isValid if both fields have content
    if (data.jobDescription || data.cvContent) {
      const hasJobDesc = data.jobDescription ? data.jobDescription.length > 50 : documentData.jobDescription.length > 50;
      const hasCv = data.cvContent ? data.cvContent.length > 100 : documentData.cvContent.length > 100;
      updatedData.isValid = hasJobDesc && hasCv;
    }
    
    set({ documentData: updatedData });
    
    // Save to AsyncStorage
    AsyncStorage.setItem('document_data', JSON.stringify(updatedData))
      .catch(err => console.error('Failed to save document data:', err));
  },
}));