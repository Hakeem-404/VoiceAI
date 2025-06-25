import { create } from 'zustand';
import { DocumentData } from '../types';

export type InputMode = 'voice' | 'text' | 'hybrid';

export interface InputState {
  inputMode: InputMode;
  currentText: string;
  suggestions: string[];
  inputHistory: string[];
  isTextInputVisible: boolean;
  quickActions: string[];
  documentData: DocumentData;
  
  // Actions
  setInputMode: (mode: InputMode) => void;
  setCurrentText: (text: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  addToHistory: (text: string) => void;
  setTextInputVisible: (visible: boolean) => void;
  clearCurrentText: () => void;
  getRecentSuggestions: () => string[];
  updateDocumentData: (data: Partial<DocumentData>) => void;
  clearDocumentData: () => void;
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
  documentData: {
    jobDescription: '',
    cvContent: '',
    analysisResult: undefined,
  },

  setInputMode: (inputMode) => set({ inputMode }),
  setCurrentText: (currentText) => set({ currentText }),
  setSuggestions: (suggestions) => set({ suggestions }),
  addToHistory: (text) => {
    const { inputHistory } = get();
    const newHistory = [text, ...inputHistory.filter(item => item !== text)].slice(0, 20);
    set({ inputHistory: newHistory });
  },
  setTextInputVisible: (isTextInputVisible) => set({ isTextInputVisible }),
  clearCurrentText: () => set({ currentText: '' }),
  getRecentSuggestions: () => {
    const { inputHistory, quickActions } = get();
    return [...inputHistory.slice(0, 3), ...quickActions.slice(0, 2)];
  },
  updateDocumentData: (data) => {
    set((state) => ({
      documentData: {
        ...state.documentData,
        ...data,
      },
    }));
  },
  clearDocumentData: () => {
    set({
      documentData: {
        jobDescription: '',
        cvContent: '',
        analysisResult: undefined,
      },
    });
  },
}));