import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Star, 
  TrendingUp, 
  Zap, 
  Filter,
  Search,
  Settings,
  Trophy,
  Target,
  Calendar,
  Send,
  Mic,
  Square,
  RotateCcw,
  X,
  MessageSquare,
  Volume2,
  VolumeX,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useVoiceStore } from '@/src/stores/voiceStore';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useUserStore } from '@/src/stores/userStore';
import { conversationModes } from '@/src/constants/conversationModes';
import { voiceService } from '@/src/services/voiceService';
import { speechRecognitionService } from '@/services/speechRecognitionService';
import { supabaseClaudeAPI } from '@/services/supabaseClaudeAPI';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { ModeSelectionCard } from '@/components/ModeSelectionCard';
import { ModeConfigurationModal } from '@/components/ModeConfigurationModal';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { TextInputSystem } from '@/components/TextInputSystem';
import { GestureHandler } from '@/components/GestureHandler';
import { PermissionHandler } from '@/components/PermissionHandler';
import { VoicePersonalitySelector } from '@/components/VoicePersonalitySelector';
import { AudioPlayerControls } from '@/components/AudioPlayerControls';
import { InterviewSetupScreen } from '@/components/InterviewSetupScreen';
import { ConversationMode, ModeConfiguration, DailyChallenge, DocumentAnalysis } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';
import { ConversationContext, ConversationMessage } from '@/types/api';
import { ClaudeFeedbackModal } from '@/components/ClaudeFeedbackModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    currentConversation,
    currentMode,
    recordingState,
    isProcessing,
    startConversation,
    endConversation,
    addMessage,
    setRecordingState,
    setProcessing,
    lastFeedback,
    clearLastFeedback,
    generateFeedback,
  } = useConversationStore();

  const {
    isRecording,
    audioLevel,
    setIsRecording,
    setAudioLevel,
    setRecording,
    resetVoiceState,
  } = useVoiceStore();

  const {
    inputMode,
    currentText,
    isTextInputVisible,
    documentData,
    setInputMode,
    setTextInputVisible,
    clearCurrentText,
    updateDocumentData,
  } = useInputStore();

  const { permissions, voiceSettings } = useSettingsStore();
  const { user, analytics } = useUserStore();

  // ElevenLabs voice integration
  const {
    isGenerating: isGeneratingVoice,
    isPlaying: isPlayingVoice,
    error: voiceError,
    currentPersonality,
    generateAndPlaySpeech,
    stopCurrentPlayback,
    pauseCurrentPlayback,
    resumeCurrentPlayback,
    isConfigured: isElevenLabsConfigured,
    checkUsageLimits,
  } = useElevenLabsVoice({
    conversationMode: currentMode?.id || 'general-chat',
    autoPlay: true,
    queueMode: 'immediate'
  });

  const [recordButtonState, setRecordButtonState] = useState<'idle' | 'recording' | 'processing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPermissionHandler, setShowPermissionHandler] = useState(true);
  const [selectedMode, setSelectedMode] = useState<ConversationMode | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [showVoicePersonalitySelector, setShowVoicePersonalitySelector] = useState(false);
  const [showAudioPlayerControls, setShowAudioPlayerControls] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const [showInterviewSetup, setShowInterviewSetup] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Mock user preferences for favorites and recent modes
  const [favoriteMode, setFavoriteMode] = useState<string>('general-chat');
  const [recentModes, setRecentModes] = useState<string[]>(['interview-practice', 'presentation-prep']);

  useEffect(() => {
    if (permissions.microphone === 'granted') {
      setShowPermissionHandler(false);
    }
    loadDailyChallenges();
    
    // Check Supabase configuration
    const status = supabaseClaudeAPI.getConfigStatus();
    setIsSupabaseConfigured(status.configured);

    // Check speech recognition support
    setSpeechRecognitionSupported(speechRecognitionService.isSupported());
    console.log('Speech recognition supported:', speechRecognitionService.isSupported());

    // Check ElevenLabs usage limits
    if (isElevenLabsConfigured) {
      const usageLimits = checkUsageLimits();
      if (usageLimits.isNearLimit) {
        console.warn('Approaching ElevenLabs usage limit:', usageLimits.usagePercentage + '%');
      }
    }
  }, [permissions.microphone, isElevenLabsConfigured]);

  const loadDailyChallenges = () => {
    // Mock daily challenges
    const mockChallenges: DailyChallenge[] = [
      {
        id: '1',
        modeId: 'debate-challenge',
        title: 'Climate Change Debate',
        description: 'Argue for renewable energy solutions',
        difficulty: 'intermediate',
        reward: { points: 100, badge: 'Climate Advocate' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '2',
        modeId: 'presentation-prep',
        title: 'Elevator Pitch Challenge',
        description: 'Perfect your 30-second pitch',
        difficulty: 'beginner',
        reward: { points: 50 },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
    ];
    setDailyChallenges(mockChallenges);
  };

  const handleModeSelect = (mode: ConversationMode) => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Configuration Required',
        'Supabase is not properly configured. Please check your environment variables and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (permissions.microphone === 'denied' && inputMode === 'voice') {
      setInputMode('text');
    }
    
    // Special handling for interview practice mode
    if (mode.id === 'interview-practice') {
      setSelectedMode(mode);
      setShowInterviewSetup(true);
      return;
    }
    
    setSelectedMode(mode);
    setShowConfigModal(true);
    setError(null);
  };

  const handleModeStart = (configuration: ModeConfiguration) => {
    const mode = conversationModes.find(m => m.id === configuration.modeId);
    if (!mode) return;

    // Update recent modes
    setRecentModes(prev => [mode.id, ...prev.filter(id => id !== mode.id)].slice(0, 3));
    
    // Start conversation with Claude API integration
    startConversation(mode, configuration);
    setShowConfigModal(false);
    setError(null);
    setConversationMessages([]);
    
    // Generate initial quick replies for the mode
    generateQuickRepliesForMode(mode.id);
  };

  const handleInterviewQuickStart = () => {
    const mode = conversationModes.find(m => m.id === 'interview-practice');
    if (!mode) return;
    
    startConversation(mode);
    setShowInterviewSetup(false);
    setError(null);
    setConversationMessages([]);
    generateQuickRepliesForMode(mode.id);
  };

  const handleInterviewDocumentSelect = (type: 'job' | 'cv') => {
    setActiveDocument(type);
    setTextInputVisible(true);
  };

  const handleInterviewContinue = () => {
    if (documentData.analysisResult) {
      // Start interview with the analysis data
      const mode = conversationModes.find(m => m.id === 'interview-practice');
      if (!mode) return;
      
      startConversation(mode, {
        modeId: 'interview-practice',
        difficulty: (documentData.analysisResult.analysis.difficulty === 'junior' ? 'beginner' : 
                    documentData.analysisResult.analysis.difficulty === 'executive' ? 'advanced' : 'intermediate') || 'intermediate',
        sessionType: 'standard',
        selectedTopics: documentData.analysisResult.analysis.focusAreas.slice(0, 3) || mode.topics.slice(0, 3),
        aiPersonality: 'Professional',
        customSettings: {
          documentAnalysis: documentData.analysisResult,
          jobDescription: documentData.jobDescription,
          cvContent: documentData.cvContent,
        },
      });
      setShowInterviewSetup(false);
      setError(null);
      setConversationMessages([]);
      generateQuickRepliesForMode(mode.id);
    } else {
      // Start regular interview if no analysis
      const mode = conversationModes.find(m => m.id === 'interview-practice');
      if (!mode) return;
      
      startConversation(mode);
      setShowInterviewSetup(false);
      setError(null);
      setConversationMessages([]);
      generateQuickRepliesForMode(mode.id);
    }
  };

  const [activeDocument, setActiveDocument] = useState<'job' | 'cv' | null>(null);

  const generateQuickRepliesForMode = (modeId: string) => {
    const modeQuickReplies = {
      'general-chat': [
        "Tell me about yourself",
        "What's your favorite hobby?",
        "How was your day?",
      ],
      'debate-challenge': [
        "I believe climate change is urgent",
        "Technology will solve our problems",
        "Education should be free for all",
      ],
      'idea-brainstorm': [
        "Let's solve traffic congestion",
        "How can we improve remote work?",
        "What's the future of entertainment?",
      ],
      'interview-practice': [
        "Tell me about yourself",
        "What are your strengths?",
        "Why do you want this job?",
      ],
      'presentation-prep': [
        "I want to present quarterly results",
        "Help me pitch a new product",
        "I need to explain our strategy",
      ],
      'language-learning': [
        "Let's practice basic conversation",
        "Help me with pronunciation",
        "Teach me common phrases",
      ],
    };

    setQuickReplies(modeQuickReplies[modeId as keyof typeof modeQuickReplies] || []);
  };

  const createConversationContext = (): ConversationContext => {
    return {
      messages: conversationMessages,
      mode: currentMode?.id || 'general-chat',
      sessionId: currentConversation?.id || Date.now().toString(),
      metadata: {
        startTime: currentConversation?.createdAt || new Date(),
        lastActivity: new Date(),
        messageCount: conversationMessages.length,
        totalTokens: 0,
      },
    };
  };

  const sendMessageToClaude = async (content: string) => {
    if (!currentMode || !isSupabaseConfigured) return;

    setIsLoadingResponse(true);
    setError(null);

    try {
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      const updatedMessages = [...conversationMessages, userMessage];
      setConversationMessages(updatedMessages);
      addMessage(userMessage);

      // Create conversation context
      const context: ConversationContext = {
        messages: updatedMessages,
        mode: currentMode.id,
        sessionId: currentConversation?.id || Date.now().toString(),
        metadata: {
          startTime: currentConversation?.createdAt || new Date(),
          lastActivity: new Date(),
          messageCount: updatedMessages.length,
          totalTokens: 0,
        },
      };

      // Send to Claude API via Supabase
      const response = await supabaseClaudeAPI.sendMessage(content, context);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const assistantMessage = response.data;
        setConversationMessages(prev => [...prev, assistantMessage]);
        addMessage(assistantMessage);

        // Generate and play voice response if enabled and configured
        if (voicePlaybackEnabled && isElevenLabsConfigured) {
          try {
            await generateAndPlaySpeech(
              assistantMessage.content,
              `${currentMode.name} Response`
            );
          } catch (voiceError) {
            console.warn('Voice generation failed:', voiceError);
            // Continue without voice - don't break the conversation flow
          }
        }

        // Generate new quick replies based on the response
        await generateContextualQuickReplies(context, assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const generateContextualQuickReplies = async (context: ConversationContext, lastResponse: string) => {
    try {
      const replies = await supabaseClaudeAPI.generateQuickReplies(context, 3);
      setQuickReplies(replies);
    } catch (error) {
      console.warn('Failed to generate quick replies:', error);
      // Fallback to mode-specific quick replies
      generateQuickRepliesForMode(context.mode);
    }
  };

  const handleVoiceRecord = async () => {
    if (!currentConversation || !isSupabaseConfigured) return;

    try {
      if (!isRecording) {
        // Start recording and speech recognition
        setRecordButtonState('recording');
        setIsRecording(true);
        setError(null);
        setTranscriptionText('');

        // Check if speech recognition is supported
        if (!speechRecognitionService.isSupported()) {
          console.warn('Speech recognition not supported, using audio recording only');
          // Fall back to audio recording without transcription
          await startAudioRecordingOnly();
          return;
        }

        // Request speech recognition permissions
        const hasPermission = await speechRecognitionService.requestPermissions();
        if (!hasPermission) {
          console.warn('Speech recognition permission denied, using audio recording only');
          await startAudioRecordingOnly();
          return;
        }

        // Start speech recognition
        setIsTranscribing(true);
        speechRecognitionService.clearTranscript();
        
        const recognitionStarted = await speechRecognitionService.startListening(
          (result) => {
            console.log('Speech recognition result:', result);
            setTranscriptionText(result.transcript);
            
            // Don't auto-stop on final result, let user control when to stop
            if (result.isFinal) {
              console.log('Final speech result received:', result.transcript);
            }
          },
          (error) => {
            console.error('Speech recognition error:', error);
            setError(`Speech recognition failed: ${error}`);
            setRecordButtonState('error');
            setIsRecording(false);
            setIsTranscribing(false);
            resetVoiceState();
          },
          {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            // 30 second timeout
          }
        );

        if (!recognitionStarted) {
          throw new Error('Failed to start speech recognition');
        }

        // Also start audio recording for visual feedback
        if (permissions.microphone === 'granted') {
          const recording = await voiceService.startRecording(
            (level) => setAudioLevel(level),
            (detected) => {
              // Voice activity detection logic
              if (voiceSettings.enableVoiceActivityDetection) {
                // Auto-stop after silence if enabled
                if (!detected && voiceSettings.autoStopAfterSilence) {
                  setTimeout(() => {
                    if (isRecording) {
                      handleVoiceRecord(); // Stop recording
                    }
                  }, voiceSettings.silenceThreshold);
                }
              }
            }
          );
          if (recording) {
            setRecording(recording);
          }
        }

      } else {
        // Stop recording and speech recognition
        setRecordButtonState('processing');
        setIsRecording(false);
        setIsTranscribing(false);

        // Stop speech recognition and get final transcript
        speechRecognitionService.stopListening();
        
        // Get the final transcript
        const finalTranscript = speechRecognitionService.getFinalTranscript() || 
                               speechRecognitionService.getCurrentTranscript() ||
                               transcriptionText.trim();

        // Stop audio recording
        if (permissions.microphone === 'granted') {
          await voiceService.stopRecording();
        }

        console.log('Final transcript captured:', finalTranscript);

        if (finalTranscript) {
          console.log('Using transcribed text:', finalTranscript);
          await sendMessageToClaude(finalTranscript);
        } else {
          // No transcription was captured
          console.warn('No transcription captured');
          setError('No speech was detected. Please try speaking more clearly or use text input.');
        }

        setRecordButtonState('idle');
        setProcessing(false);
        resetVoiceState();
        setTranscriptionText('');
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setRecordButtonState('error');
      setError(error instanceof Error ? error.message : 'Failed to process voice input');
      setIsRecording(false);
      setIsTranscribing(false);
      setProcessing(false);
      resetVoiceState();
      setTranscriptionText('');
      
      // Stop speech recognition on error
      speechRecognitionService.stopListening();
    }
  };

  const startAudioRecordingOnly = async () => {
    // Fallback for when speech recognition is not available
    if (permissions.microphone === 'granted') {
      const recording = await voiceService.startRecording(
        (level) => setAudioLevel(level),
        (detected) => {
          if (voiceSettings.enableVoiceActivityDetection) {
            if (!detected && voiceSettings.autoStopAfterSilence) {
              setTimeout(() => {
                if (isRecording) {
                  handleVoiceRecord();
                }
              }, voiceSettings.silenceThreshold);
            }
          }
        }
      );
      if (recording) {
        setRecording(recording);
      }
    } else {
      // Mock recording for demo when no microphone access
      setTimeout(() => {
        if (isRecording) {
          handleVoiceRecord();
        }
      }, 3000);
    }
  };

  const handleTextSend = async (text: string) => {
    if (!currentConversation || !isSupabaseConfigured) return;

    await sendMessageToClaude(text);
  };

  const handleQuickReply = async (reply: string) => {
    if (!currentConversation || !isSupabaseConfigured) return;

    await sendMessageToClaude(reply);
  };

  const handleVoicePlaybackToggle = async () => {
    if (isPlayingVoice) {
      if (voicePlaybackEnabled) {
        await pauseCurrentPlayback();
      } else {
        await resumeCurrentPlayback();
      }
    }
    setVoicePlaybackEnabled(!voicePlaybackEnabled);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate loading new challenges and data
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadDailyChallenges();
    setRefreshing(false);
  };

  const filteredModes = conversationModes.filter(mode => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'favorites') return mode.id === favoriteMode;
    if (filterCategory === 'recent') return recentModes.includes(mode.id);
    return mode.category === filterCategory;
  });

  const categories = [
    { id: 'all', name: 'All', icon: Target },
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'recent', name: 'Recent', icon: TrendingUp },
    { id: 'social', name: 'Social', icon: null },
    { id: 'professional', name: 'Professional', icon: null },
    { id: 'creativity', name: 'Creative', icon: null },
  ];

  const handleEndConversation = async () => {
    console.log('Starting end conversation process');
    console.log('endConversation function exists:', typeof endConversation);
    console.log('currentConversation:', currentConversation);
    
    try {
      setIsGeneratingFeedback(true);
      // End conversation and generate feedback
      const feedback = await endConversation();
      console.log('End conversation completed, feedback:', feedback);
      
      // Clear conversation state
      setConversationMessages([]);
      setQuickReplies([]);
      stopCurrentPlayback();
      
      // Show feedback modal if feedback was generated
      if (feedback) {
        console.log('Showing feedback modal');
        setShowFeedbackModal(true);
      } else {
        console.log('No feedback generated');
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      // Still clear the conversation state even if feedback generation failed
      setConversationMessages([]);
      setQuickReplies([]);
      stopCurrentPlayback();
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!currentConversation) {
      console.log('No current conversation found');
      return;
    }
    
    console.log('Starting feedback generation for conversation:', currentConversation.id);
    console.log('generateFeedback function exists:', typeof generateFeedback);
    console.log('currentConversation:', currentConversation);
    
    try {
      setIsGeneratingFeedback(true);
      const feedback = await generateFeedback(currentConversation);
      console.log('Feedback generated successfully:', feedback);
      if (feedback) {
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  if (showPermissionHandler) {
    return (
      <PermissionHandler
        onPermissionGranted={() => setShowPermissionHandler(false)}
        onPermissionDenied={() => {
          setShowPermissionHandler(false);
          setInputMode('text');
        }}
      />
    );
  }

  if (currentConversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <GestureHandler
          onSwipeUp={() => setTextInputVisible(true)}
          onSwipeLeft={() => {}}
          onSwipeRight={() => {}}
          onDoubleTap={handleVoiceRecord}
          onPinch={() => {}}
          onShake={() => {
            Alert.alert(
              'Clear Conversation',
              'Are you sure you want to clear the current conversation?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => {
                  handleEndConversation();
                }},
              ]
            );
          }}
        >
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
            style={styles.conversationContainer}
          >
            <View style={styles.conversationHeader}>
              <View style={styles.conversationTitleContainer}>
                <Text style={[styles.conversationTitle, { color: colors.text }]}>
                  {currentMode?.name}
                </Text>
                {currentPersonality && (
                  <Text style={[styles.voicePersonalityText, { color: colors.textSecondary }]}>
                    Voice: {currentPersonality.name}
                  </Text>
                )}
              </View>
              <View style={styles.conversationActions}>
                <TouchableOpacity
                  style={[styles.voiceToggleButton, { backgroundColor: colors.surface }]}
                  onPress={handleVoicePlaybackToggle}
                >
                  {voicePlaybackEnabled ? (
                    <Volume2 size={20} color={isPlayingVoice ? colors.primary : colors.textSecondary} />
                  ) : (
                    <VolumeX size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                
                {isElevenLabsConfigured && (
                  <TouchableOpacity
                    style={[styles.voiceSettingsButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowVoicePersonalitySelector(true)}
                  >
                    <Settings size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {isPlayingVoice && (
                  <TouchableOpacity
                    style={[styles.audioControlButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowAudioPlayerControls(true)}
                  >
                    <Play size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.endButton, { backgroundColor: colors.error }]}
                  onPress={handleEndConversation}
                  accessibilityLabel="End conversation"
                >
                  <Text style={styles.endButtonText}>End</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Configuration Warning */}
            {!isSupabaseConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Supabase not configured. Please check your environment variables.
                </Text>
              </View>
            )}

            {/* ElevenLabs Status */}
            {!isElevenLabsConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ElevenLabs not configured. Voice responses disabled.
                </Text>
              </View>
            )}

            {/* Speech Recognition Status */}
            {!speechRecognitionSupported && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Speech recognition not supported in this browser. Voice recording available but no transcription.
                </Text>
              </View>
            )}

            {/* Voice Generation Status */}
            {isGeneratingVoice && (
              <View style={[styles.statusBanner, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  Generating voice response...
                </Text>
              </View>
            )}

            {/* Feedback Generation Status */}
            {isGeneratingFeedback && (
              <View style={[styles.statusBanner, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={[styles.statusText, { color: colors.secondary }]}>
                  Generating conversation feedback...
                </Text>
              </View>
            )}

            {/* Transcription Display */}
            {isTranscribing && (
              <View style={[styles.transcriptionBanner, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.transcriptionLabel, { color: colors.primary }]}>
                  {transcriptionText ? 'Transcribing...' : 'Listening for speech...'}
                </Text>
                {transcriptionText && (
                  <Text style={[styles.transcriptionText, { color: colors.text }]}>
                    "{transcriptionText}"
                  </Text>
                )}
              </View>
            )}

            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {conversationMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userMessage : styles.aiMessage,
                    {
                      backgroundColor: message.role === 'user' ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: message.role === 'user' ? 'white' : colors.text,
                      },
                    ]}
                  >
                    {message.content}
                  </Text>
                  
                  <Text
                    style={[
                      styles.messageTime,
                      {
                        color: message.role === 'user' 
                          ? 'rgba(255,255,255,0.7)' 
                          : colors.textTertiary,
                      },
                    ]}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}

              {(isLoadingResponse || isGeneratingVoice) && (
                <View style={[styles.messageBubble, styles.aiMessage, { backgroundColor: colors.surface }]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {isGeneratingVoice ? 'Generating voice...' : 'Thinking...'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Replies */}
            {quickReplies.length > 0 && !isLoadingResponse && (
              <View style={styles.quickRepliesContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickRepliesScroll}
                >
                  {quickReplies.map((reply, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.quickReplyButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => handleQuickReply(reply)}
                      disabled={!isSupabaseConfigured}
                    >
                      <Zap size={14} color={colors.primary} />
                      <Text style={[styles.quickReplyText, { color: colors.text }]}>{reply}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputArea}>
              <VoiceRecordButton
                onPress={handleVoiceRecord}
                state={recordButtonState}
                error={error}
                disabled={!isSupabaseConfigured}
              />
              
              {/* Speech Recognition Status */}
              {isTranscribing && (
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {transcriptionText ? 'Processing speech...' : 'Listening for speech...'}
                </Text>
              )}

              {/* Speech Recognition Support Info */}
              {!speechRecognitionSupported && (
                <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                  Voice recording only (no transcription available)
                </Text>
              )}
            </View>

            <FloatingActionButtons
              onTextInputToggle={() => setTextInputVisible(true)}
              onVoiceSettings={() => setShowVoicePersonalitySelector(true)}
              onModeSwitch={() => {
                // Show mode selection modal
              }}
              onHelp={() => {
                // Show help modal
              }}
            />

            {/* Manual Feedback Button for Testing */}
            {currentConversation && conversationMessages.length > 0 && (
              <TouchableOpacity
                style={[styles.feedbackTestButton, { backgroundColor: colors.secondary }]}
                onPress={handleGenerateFeedback}
                disabled={isGeneratingFeedback}
              >
                <BarChart3 size={20} color="white" />
                <Text style={styles.feedbackTestButtonText}>
                  {isGeneratingFeedback ? 'Generating...' : 'Generate Feedback'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </GestureHandler>

        <TextInputSystem
          visible={isTextInputVisible}
          onClose={() => setTextInputVisible(false)}
          onSend={handleTextSend}
          onVoiceToggle={() => {
            setTextInputVisible(false);
            setInputMode('voice');
          }}
          placeholder="Type your message..."
        />

        <VoicePersonalitySelector
          visible={showVoicePersonalitySelector}
          onClose={() => setShowVoicePersonalitySelector(false)}
          selectedMode={currentMode?.id || 'general-chat'}
          onPersonalityChange={(personality) => {
            console.log('Voice personality changed:', personality.name);
          }}
        />

        <AudioPlayerControls
          visible={showAudioPlayerControls}
          onClose={() => setShowAudioPlayerControls(false)}
        />

        {/* Feedback Modal */}
        {lastFeedback && (
          <ClaudeFeedbackModal
            visible={showFeedbackModal}
            onClose={() => {
              setShowFeedbackModal(false);
              clearLastFeedback();
            }}
            conversation={currentConversation || {
              id: 'ended-conversation',
              mode: { 
                id: 'general-chat', 
                name: 'General Chat', 
                description: '', 
                icon: '', 
                systemPrompt: '', 
                category: 'social', 
                difficulty: 'beginner', 
                estimatedDuration: 0, 
                color: { primary: '', secondary: '', gradient: [] }, 
                features: [], 
                topics: [], 
                aiPersonalities: [], 
                sessionTypes: { 
                  quick: { duration: 0, description: '' }, 
                  standard: { duration: 0, description: '' }, 
                  extended: { duration: 0, description: '' } 
                } 
              },
              title: 'Ended Conversation',
              duration: 0,
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { color: colors.text }]}>
                  Ready to practice?
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Choose a conversation mode to get started
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  // Navigate to settings
                }}
              >
                <Settings size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Configuration Warning */}
            {!isSupabaseConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Supabase not configured. Please check your environment variables to use AI features.
                </Text>
              </View>
            )}

            {/* ElevenLabs Status */}
            {!isElevenLabsConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ElevenLabs not configured. Voice responses will be disabled.
                </Text>
              </View>
            )}

            {/* Speech Recognition Support Info */}
            {!speechRecognitionSupported && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Speech recognition not supported in this browser. Voice recording available but no transcription.
                </Text>
              </View>
            )}

            {permissions.microphone === 'denied' && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Voice features disabled. Using text-only mode.
                </Text>
              </View>
            )}
          </View>

          {/* Daily Challenges */}
          {dailyChallenges.length > 0 && (
            <View style={styles.challengesSection}>
              <View style={styles.sectionHeader}>
                <Trophy size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Daily Challenges
                </Text>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.challengesScroll}
              >
                {dailyChallenges.map((challenge) => (
                  <TouchableOpacity
                    key={challenge.id}
                    style={[styles.challengeCard, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      const mode = conversationModes.find(m => m.id === challenge.modeId);
                      if (mode) handleModeSelect(mode);
                    }}
                    disabled={!isSupabaseConfigured}
                  >
                    <View style={styles.challengeHeader}>
                      <Calendar size={16} color={colors.warning} />
                      <Text style={[styles.challengePoints, { color: colors.warning }]}>
                        +{challenge.reward.points}
                      </Text>
                    </View>
                    <Text style={[styles.challengeTitle, { color: colors.text }]}>
                      {challenge.title}
                    </Text>
                    <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
                      {challenge.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterButton,
                      filterCategory === category.id && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setFilterCategory(category.id)}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={16}
                        color={filterCategory === category.id ? 'white' : colors.textSecondary}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: filterCategory === category.id ? 'white' : colors.textSecondary,
                        },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Conversation Modes */}
          <View style={styles.modesContainer}>
            {filteredModes.map((mode) => (
              <ModeSelectionCard
                key={mode.id}
                mode={mode}
                onPress={handleModeSelect}
                onConfigure={(mode) => {
                  setSelectedMode(mode);
                  setShowConfigModal(true);
                }}
                isFavorite={mode.id === favoriteMode}
                isRecentlyUsed={recentModes.includes(mode.id)}
                lastUsed={recentModes.includes(mode.id) ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined}
              />
            ))}
          </View>

          {/* Quick Stats */}
          {analytics && (
            <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Progress
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {analytics.totalConversations}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Conversations
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.secondary }]}>
                    {analytics.streakDays}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {analytics.averageScore.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Avg Score
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <ModeConfigurationModal
        visible={showConfigModal}
        mode={selectedMode}
        onClose={() => setShowConfigModal(false)}
        onStart={handleModeStart}
      />

      {/* Interview Setup Modal */}
      {showInterviewSetup && (
        <Modal
          visible={showInterviewSetup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowInterviewSetup(false)}
        >
          <View style={[styles.interviewSetupContainer, { backgroundColor: colors.background }]}>
            <View style={styles.interviewSetupHeader}>
              <TouchableOpacity
                style={styles.interviewSetupCloseButton}
                onPress={() => setShowInterviewSetup(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.interviewSetupTitle, { color: colors.text }]}>
                Interview Setup
              </Text>
            </View>
            
            <InterviewSetupScreen
              onQuickStart={handleInterviewQuickStart}
              onDocumentSelect={handleInterviewDocumentSelect}
              onContinue={handleInterviewContinue}
            />
          </View>
        </Modal>
      )}

      <TextInputSystem
        visible={isTextInputVisible && activeDocument !== null}
        onClose={() => {
          setTextInputVisible(false);
          setActiveDocument(null);
        }}
        onSend={(text) => {
          if (activeDocument === 'job') {
            updateDocumentData({ jobDescription: text });
          } else if (activeDocument === 'cv') {
            updateDocumentData({ cvContent: text });
          }
          setTextInputVisible(false);
          setActiveDocument(null);
        }}
        onVoiceToggle={() => {
          setTextInputVisible(false);
          setActiveDocument(null);
        }}
        mode="document"
        placeholder={activeDocument === 'job' 
          ? "Paste the job description here..." 
          : "Paste your CV/resume content here..."}
        initialText={activeDocument === 'job' 
          ? documentData.jobDescription 
          : documentData.cvContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.4,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningBanner: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  statusBanner: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  transcriptionBanner: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  transcriptionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    fontSize: typography.sizes.base,
    fontStyle: 'italic',
  },
  challengesSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  challengesScroll: {
    paddingRight: spacing.lg,
  },
  challengeCard: {
    width: 200,
    padding: spacing.md,
    borderRadius: 12,
    marginRight: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengePoints: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  challengeTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterScroll: {
    paddingRight: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  modesContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statsSection: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  conversationContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  conversationTitleContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  voicePersonalityText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voiceToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  endButtonText: {
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    marginBottom: spacing.xs,
  },
  messageTime: {
    fontSize: typography.sizes.xs,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  quickRepliesContainer: {
    marginBottom: spacing.md,
  },
  quickRepliesScroll: {
    paddingRight: spacing.lg,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  quickReplyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  inputArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  interviewSetupContainer: {
    flex: 1,
  },
  interviewSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    position: 'relative',
  },
  interviewSetupCloseButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 20,
    padding: 8,
  },
  interviewSetupTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackTestButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  feedbackTestButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
  },
});