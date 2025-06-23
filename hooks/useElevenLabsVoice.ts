import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { elevenLabsService, VoicePersonality } from '@/services/elevenLabsService';
import { audioPlayerService } from '@/services/audioPlayerService';

interface UseElevenLabsVoiceOptions {
  conversationMode: string;
  autoPlay?: boolean;
  queueMode?: 'immediate' | 'next' | 'queue';
}

interface VoiceState {
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
  currentPersonality: VoicePersonality | null;
  usageStats: any;
}

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions) {
  const { conversationMode, autoPlay = true, queueMode = 'immediate' } = options;

  const [state, setState] = useState<VoiceState>({
    isGenerating: false,
    isPlaying: false,
    error: null,
    currentPersonality: null,
    usageStats: null
  });

  useEffect(() => {
    // Load voice personality for the conversation mode
    const personality = elevenLabsService.getVoicePersonalityForMode(conversationMode);
    setState(prev => ({ ...prev, currentPersonality: personality }));

    // Load usage stats
    const stats = elevenLabsService.getUsageStats();
    setState(prev => ({ ...prev, usageStats: stats }));

    // Set up audio player callback
    audioPlayerService.setStatusUpdateCallback((playbackState) => {
      setState(prev => ({ ...prev, isPlaying: playbackState.isPlaying }));
    });

    return () => {
      audioPlayerService.setStatusUpdateCallback(() => {});
    };
  }, [conversationMode]);

  const generateAndPlaySpeech = useCallback(async (
    text: string,
    title?: string
  ): Promise<{ audioUrl: string; cached: boolean }> => {
    if (!elevenLabsService.isConfigured()) {
      throw new Error('ElevenLabs not configured. Please set your API key.');
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Generate speech
      const result = await elevenLabsService.generateSpeech(text, conversationMode);
      
      // Add to audio player queue based on mode
      if (autoPlay) {
        switch (queueMode) {
          case 'immediate':
            await audioPlayerService.playImmediate(result.audioUrl, text, conversationMode);
            break;
          case 'next':
            await audioPlayerService.playNext(result.audioUrl, text, conversationMode, title);
            break;
          case 'queue':
            await audioPlayerService.addToQueue(result.audioUrl, text, conversationMode, title);
            break;
        }
      }

      // Update usage stats
      const stats = elevenLabsService.getUsageStats();
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        usageStats: stats
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Speech generation failed';
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [conversationMode, autoPlay, queueMode]);

  const generateSpeechOnly = useCallback(async (
    text: string
  ): Promise<{ audioUrl: string; cached: boolean }> => {
    if (!elevenLabsService.isConfigured()) {
      throw new Error('ElevenLabs not configured. Please set your API key.');
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const result = await elevenLabsService.generateSpeech(text, conversationMode);
      
      // Update usage stats
      const stats = elevenLabsService.getUsageStats();
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        usageStats: stats
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Speech generation failed';
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [conversationMode]);

  const previewVoicePersonality = useCallback(async (
    personality: VoicePersonality,
    previewText?: string
  ) => {
    const text = previewText || getDefaultPreviewText(conversationMode);
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Temporarily use the preview personality
      const originalPersonality = state.currentPersonality;
      setState(prev => ({ ...prev, currentPersonality: personality }));

      const { audioUrl } = await elevenLabsService.generateSpeech(
        text,
        conversationMode,
        { voice_settings: personality.settings }
      );

      await audioPlayerService.playImmediate(audioUrl, text, conversationMode);

      // Restore original personality
      setState(prev => ({ 
        ...prev, 
        currentPersonality: originalPersonality,
        isGenerating: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice preview failed';
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [conversationMode, state.currentPersonality]);

  const updateVoicePersonality = useCallback((personality: VoicePersonality) => {
    elevenLabsService.updateVoicePersonality(personality.id, personality);
    setState(prev => ({ ...prev, currentPersonality: personality }));
  }, []);

  const stopCurrentPlayback = useCallback(async () => {
    await audioPlayerService.stop();
  }, []);

  const pauseCurrentPlayback = useCallback(async () => {
    await audioPlayerService.pause();
  }, []);

  const resumeCurrentPlayback = useCallback(async () => {
    await audioPlayerService.play();
  }, []);

  const clearAudioQueue = useCallback(() => {
    audioPlayerService.clearQueue();
  }, []);

  const getAvailableVoices = useCallback(async () => {
    try {
      return await elevenLabsService.getAvailableVoices();
    } catch (error) {
      console.error('Failed to fetch available voices:', error);
      return [];
    }
  }, []);

  const checkUsageLimits = useCallback(() => {
    const stats = elevenLabsService.getUsageStats();
    const isNearLimit = stats.usagePercentage > 80;
    const isOverLimit = stats.usagePercentage >= 100;
    
    return {
      isNearLimit,
      isOverLimit,
      remainingCharacters: stats.remainingCharacters,
      usagePercentage: stats.usagePercentage
    };
  }, []);

  return {
    // State
    isGenerating: state.isGenerating,
    isPlaying: state.isPlaying,
    error: state.error,
    currentPersonality: state.currentPersonality,
    usageStats: state.usageStats,

    // Actions
    generateAndPlaySpeech,
    generateSpeechOnly,
    previewVoicePersonality,
    updateVoicePersonality,
    stopCurrentPlayback,
    pauseCurrentPlayback,
    resumeCurrentPlayback,
    clearAudioQueue,

    // Utilities
    getAvailableVoices,
    checkUsageLimits,
    isConfigured: elevenLabsService.isConfigured(),
    serviceStatus: elevenLabsService.getStatus(),

    // Audio player controls
    audioPlayerService,
  };
}

function getDefaultPreviewText(conversationMode: string): string {
  const previewTexts = {
    'general-chat': "Hi there! I'm excited to have a conversation with you. What would you like to talk about today?",
    'debate-challenge': "I appreciate your perspective, but I'd like to challenge that point. Have you considered the counterargument?",
    'idea-brainstorm': "That's a fantastic idea! What if we took it a step further and combined it with emerging technology?",
    'interview-practice': "Thank you for that response. Can you give me a specific example of how you handled a challenging situation?",
    'presentation-prep': "Your main points are clear and well-structured. Consider adding more enthusiasm to engage your audience.",
    'language-learning': "Excellent pronunciation! Let's practice some more complex sentences to build your confidence."
  };

  return previewTexts[conversationMode as keyof typeof previewTexts] || previewTexts['general-chat'];
}