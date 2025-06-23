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

  // Mock user preferences for favorites and recent modes
  const [favoriteMode, setFavoriteMode] = useState<string>('general-chat');
  const [recentModes, setRecentModes] = useState<string[]>(['interview-practice', 'presentation-prep']);

  useEffect(() => {
    if (permissions.microphone === 'granted') {
      setShowPermissionHandler(false);
    }
    loadDailyChallenges();
  }, [permissions.microphone]);

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

  const handleVoiceRecord = async () => {
    if (!currentConversation) return;

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

        // Simulate AI processing
        setTimeout(() => {
          addMessage({
            role: 'user',
            content: 'Sample recorded message',
            audioUrl: audioUri || undefined,
          });

          // Add AI response
          setTimeout(() => {
            const aiResponse = generateAIResponse(currentMode?.name || 'conversation');
            addMessage({
              role: 'ai',
              content: aiResponse,
            });

            // Speak the AI response
            if (voiceSettings.selectedVoice) {
              voiceService.speakText(aiResponse, {
                voice: voiceSettings.selectedVoice,
                rate: voiceSettings.speechRate,
                pitch: voiceSettings.speechPitch,
                volume: voiceSettings.volume,
              });
            }

            setRecordButtonState('idle');
            setProcessing(false);
            resetVoiceState();
          }, 1000);
        }, 2000);
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

  const handleTextSend = (text: string) => {
    if (!currentConversation) return;

    addMessage({
      role: 'user',
      content: text,
    });

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentMode?.name || 'conversation', text);
      addMessage({
        role: 'ai',
        content: aiResponse,
      });

      // Speak the AI response if voice is enabled
      if (permissions.microphone === 'granted' && voiceSettings.selectedVoice) {
        voiceService.speakText(aiResponse, {
          voice: voiceSettings.selectedVoice,
          rate: voiceSettings.speechRate,
          pitch: voiceSettings.speechPitch,
          volume: voiceSettings.volume,
        });
      }
    }, 1000);
  };

  const generateAIResponse = (mode: string, userInput?: string): string => {
    const responses = {
      'General Chat': [
        "That's really interesting! Tell me more about that.",
        "I can relate to that experience. What did you learn from it?",
        "That's a fascinating topic. Have you always been interested in that?",
      ],
      'Debate Challenge': [
        "That's a strong argument. However, have you considered the counterpoint that...",
        "I see your perspective, but what evidence supports that claim?",
        "Interesting stance. How would you respond to critics who say...",
      ],
      'Idea Brainstorm': [
        "That's a creative idea! How could we build on that concept?",
        "I love the innovation in that approach. What if we combined it with...",
        "Brilliant thinking! What would be the first step to implement this?",
      ],
      'Interview Practice': [
        "That's a great example. Can you tell me about a time when you faced a significant challenge?",
        "I appreciate your honesty. What do you consider your greatest strength?",
        "Interesting perspective. How do you handle working under pressure?",
      ],
      'Presentation Prep': [
        "Your main points are clear. Try to add more enthusiasm to your delivery.",
        "Good structure! Consider adding a compelling story to engage your audience.",
        "Nice flow. Remember to make eye contact and use gestures to emphasize key points.",
      ],
      'Language Learning': [
        "Excellent pronunciation! Let's practice some more complex sentences.",
        "Good effort! Remember to roll your R's in that word. Try again.",
        "Perfect! Now let's use that vocabulary in a different context.",
      ],
    };

    const modeResponses = responses[mode as keyof typeof responses] || responses['General Chat'];
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
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
            <View style={styles.conversationHeader}>
              <Text style={[styles.conversationTitle, { color: colors.text }]}>
                {currentMode?.name}
              </Text>
              <TouchableOpacity
                style={[styles.endButton, { backgroundColor: colors.error }]}
                onPress={endConversation}
                accessibilityLabel="End conversation"
              >
                <Text style={styles.endButtonText}>End</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {currentConversation.messages.map((message) => (
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
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputArea}>
              <VoiceRecordButton
                onPress={handleVoiceRecord}
                state={recordButtonState}
                error={error}
              />
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
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  conversationTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
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
  },
  inputArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
});