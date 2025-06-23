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
  ActivityIndicator,
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
  RotateCcw,
  Copy,
  Wifi,
  WifiOff,
  X,
  Mic,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useVoiceStore } from '@/src/stores/voiceStore';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useUserStore } from '@/src/stores/userStore';
import { conversationModes } from '@/src/constants/conversationModes';
import { voiceService } from '@/src/services/voiceService';
import { ModeSelectionCard } from '@/components/ModeSelectionCard';
import { ModeConfigurationModal } from '@/components/ModeConfigurationModal';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { TextInputModal } from '@/components/TextInputModal';
import { GestureHandler } from '@/components/GestureHandler';
import { PermissionHandler } from '@/components/PermissionHandler';
import { ConversationMode, ModeConfiguration, DailyChallenge } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';
import { supabaseClaudeAPI } from '@/services/supabaseClaudeAPI';
import { ConversationMessage, ConversationContext } from '@/types/api';

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
    setInputMode,
    setTextInputVisible,
    clearCurrentText,
  } = useInputStore();

  const { permissions, voiceSettings } = useSettingsStore();
  const { user, analytics } = useUserStore();

  const [recordButtonState, setRecordButtonState] = useState<'idle' | 'recording' | 'processing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPermissionHandler, setShowPermissionHandler] = useState(true);
  const [selectedMode, setSelectedMode] = useState<ConversationMode | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [configStatus, setConfigStatus] = useState({ hasUrl: false, hasKey: false });

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
    setConfigStatus(status);
  }, [permissions.microphone]);

  // Network status monitoring
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected ?? false);
        });
        return unsubscribe;
      }).catch(() => {
        setIsOnline(true);
      });
    } else {
      const updateOnlineStatus = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

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
        'Supabase is not properly configured. Please check your environment variables:\n\n' +
        (!configStatus.hasUrl ? '• EXPO_PUBLIC_SUPABASE_URL\n' : '') +
        (!configStatus.hasKey ? '• EXPO_PUBLIC_SUPABASE_ANON_KEY\n' : '') +
        '\nAlso ensure your Claude API key is set in the Supabase Edge Function.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (permissions.microphone === 'denied' && inputMode === 'voice') {
      setInputMode('text');
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
    
    startConversation(mode);
    setShowConfigModal(false);
    setError(null);
  };

  const createConversationContext = (): ConversationContext => {
    if (!currentConversation || !currentMode) {
      throw new Error('No active conversation');
    }

    return {
      messages: currentConversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp
      })),
      mode: currentMode.id,
      sessionId: currentConversation.id,
      metadata: {
        startTime: currentConversation.createdAt,
        lastActivity: currentConversation.updatedAt,
        messageCount: currentConversation.messages.length,
        totalTokens: 0
      }
    };
  };

  const handleVoiceRecord = async () => {
    if (!currentConversation || !isSupabaseConfigured) {
      if (!isSupabaseConfigured) {
        setError('Supabase not configured. Please check your settings.');
      }
      return;
    }

    try {
      if (!isRecording) {
        // Start recording
        setRecordButtonState('recording');
        setIsRecording(true);
        setError(null);

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
        } else {
          // Mock recording for demo
          setTimeout(() => {
            if (isRecording) {
              handleVoiceRecord();
            }
          }, 3000);
        }
      } else {
        // Stop recording
        setRecordButtonState('processing');
        setIsRecording(false);
        setProcessing(true);

        let audioUri = null;
        if (permissions.microphone === 'granted') {
          audioUri = await voiceService.stopRecording();
        }

        // For now, simulate transcription with a sample message
        // In a real app, you'd transcribe the audio first
        const transcribedText = 'Sample recorded message';
        
        // Add user message
        addMessage({
          role: 'user',
          content: transcribedText,
          audioUrl: audioUri || undefined,
        });

        // Send to Claude API via Supabase
        try {
          const context = createConversationContext();
          const response = await supabaseClaudeAPI.sendMessage(transcribedText, context);
          
          if (response.error) {
            throw new Error(response.error);
          }

          if (response.data) {
            // Add AI response
            addMessage({
              role: 'ai',
              content: response.data.content,
            });

            // Speak the AI response
            if (voiceSettings.selectedVoice) {
              voiceService.speakText(response.data.content, {
                voice: voiceSettings.selectedVoice,
                rate: voiceSettings.speechRate,
                pitch: voiceSettings.speechPitch,
                volume: voiceSettings.volume,
              });
            }
          }
        } catch (apiError) {
          console.error('Claude API error:', apiError);
          setError(apiError instanceof Error ? apiError.message : 'Failed to get AI response');
          
          // Add fallback response
          addMessage({
            role: 'ai',
            content: 'I apologize, but I encountered an error processing your message. Please try again.',
          });
        }

        setRecordButtonState('idle');
        setProcessing(false);
        resetVoiceState();
      }
    } catch (error) {
      console.error('Recording error:', error);
      setRecordButtonState('error');
      setError('Failed to record audio. Please try again.');
      setIsRecording(false);
      setProcessing(false);
      resetVoiceState();
    }
  };

  const handleTextSend = async (text: string) => {
    if (!currentConversation || !isSupabaseConfigured) {
      if (!isSupabaseConfigured) {
        setError('Supabase not configured. Please check your settings.');
      }
      return;
    }

    // Add user message
    addMessage({
      role: 'user',
      content: text,
    });

    setProcessing(true);

    try {
      // Send to Claude API via Supabase
      const context = createConversationContext();
      const response = await supabaseClaudeAPI.sendMessage(text, context);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // Add AI response
        addMessage({
          role: 'ai',
          content: response.data.content,
        });

        // Speak the AI response if voice is enabled
        if (permissions.microphone === 'granted' && voiceSettings.selectedVoice) {
          voiceService.speakText(response.data.content, {
            voice: voiceSettings.selectedVoice,
            rate: voiceSettings.speechRate,
            pitch: voiceSettings.speechPitch,
            volume: voiceSettings.volume,
          });
        }
      }
    } catch (apiError) {
      console.error('Claude API error:', apiError);
      setError(apiError instanceof Error ? apiError.message : 'Failed to get AI response');
      
      // Add fallback response
      addMessage({
        role: 'ai',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate loading new challenges and data
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadDailyChallenges();
    
    // Re-check Supabase configuration
    const status = supabaseClaudeAPI.getConfigStatus();
    setIsSupabaseConfigured(status.configured);
    setConfigStatus(status);
    
    setRefreshing(false);
  };

  const copyMessage = async (content: string) => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(content);
    } else {
      const { setStringAsync } = await import('expo-clipboard');
      await setStringAsync(content);
    }
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
                { text: 'Clear', style: 'destructive', onPress: endConversation },
              ]
            );
          }}
        >
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
            style={styles.conversationContainer}
          >
            {/* Header */}
            <View style={styles.conversationHeader}>
              <View style={styles.conversationTitleContainer}>
                <Text style={[styles.conversationTitle, { color: colors.text }]}>
                  {currentMode?.name}
                </Text>
                <View style={[styles.networkStatus, !isOnline && styles.networkStatusOffline]}>
                  {isOnline ? (
                    <Wifi size={12} color="#10B981" />
                  ) : (
                    <WifiOff size={12} color="#EF4444" />
                  )}
                  <Text style={[styles.networkStatusText, !isOnline && styles.networkStatusTextOffline]}>
                    {isOnline ? 'Connected' : 'Offline'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.endButton, { backgroundColor: colors.error }]}
                onPress={endConversation}
                accessibilityLabel="End conversation"
              >
                <X size={16} color="white" />
                <Text style={styles.endButtonText}>End</Text>
              </TouchableOpacity>
            </View>

            {/* Configuration Warning */}
            {!isSupabaseConfigured && (
              <View style={styles.configWarning}>
                <Text style={[styles.configWarningText, { color: colors.warning }]}>
                  ⚠️ Supabase not configured - using fallback responses
                </Text>
              </View>
            )}

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {currentConversation.messages.map((message, index) => (
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
                  
                  <View style={styles.messageFooter}>
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
                    
                    {message.role === 'ai' && (
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyMessage(message.content)}
                      >
                        <Copy size={12} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              
              {isProcessing && (
                <View style={[styles.messageBubble, styles.aiMessage, { backgroundColor: colors.surface }]}>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                      AI is thinking...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputArea}>
              <View style={styles.inputControls}>
                <TouchableOpacity
                  style={[styles.inputButton, { backgroundColor: colors.surface }]}
                  onPress={() => setTextInputVisible(true)}
                  disabled={!isSupabaseConfigured}
                >
                  <MessageSquare size={20} color={isSupabaseConfigured ? colors.primary : colors.textTertiary} />
                </TouchableOpacity>

                <VoiceRecordButton
                  onPress={handleVoiceRecord}
                  state={recordButtonState}
                  error={error}
                  disabled={!isSupabaseConfigured}
                />

                <TouchableOpacity
                  style={[styles.inputButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    // Show conversation options
                  }}
                >
                  <RotateCcw size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
            </View>

            <FloatingActionButtons
              onTextInputToggle={() => setTextInputVisible(true)}
              onVoiceSettings={() => {
                // Navigate to voice settings
              }}
              onModeSwitch={() => {
                // Show mode selection modal
              }}
              onHelp={() => {
                // Show help modal
              }}
            />
          </LinearGradient>
        </GestureHandler>

        <TextInputModal
          visible={isTextInputVisible}
          onClose={() => setTextInputVisible(false)}
          onSend={handleTextSend}
          onVoiceToggle={() => {
            setTextInputVisible(false);
            setInputMode('voice');
          }}
          placeholder="Type your message..."
        />
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

            {/* Configuration Status */}
            {!isSupabaseConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ⚠️ Supabase not configured. Please check your environment variables.
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
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
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
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  conversationTitleContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  networkStatusOffline: {
    opacity: 0.7,
  },
  networkStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  networkStatusTextOffline: {
    color: '#EF4444',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  endButtonText: {
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  configWarning: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  configWarningText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    marginBottom: spacing.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: typography.sizes.xs,
  },
  copyButton: {
    padding: spacing.xs,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
  },
  inputArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  inputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  inputButton: {
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
  errorContainer: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});