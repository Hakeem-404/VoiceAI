import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useVoiceStore } from '@/src/stores/voiceStore';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { conversationModes } from '@/src/constants/modes';
import { voiceService } from '@/src/services/voiceService';
import { ModeCard } from '@/src/components/ModeCard';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { TextInputModal } from '@/components/TextInputModal';
import { GestureHandler } from '@/components/GestureHandler';
import { PermissionHandler } from '@/components/PermissionHandler';
import { ConversationMode } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

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

  const [recordButtonState, setRecordButtonState] = useState<'idle' | 'recording' | 'processing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPermissionHandler, setShowPermissionHandler] = useState(true);

  useEffect(() => {
    if (permissions.microphone === 'granted') {
      setShowPermissionHandler(false);
    }
  }, [permissions.microphone]);

  const handleModeSelect = (mode: ConversationMode) => {
    if (permissions.microphone === 'denied' && inputMode === 'voice') {
      setInputMode('text');
    }
    
    startConversation(mode);
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
          setRecording(recording);
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
      'Job Interview': [
        "That's a great example. Can you tell me about a time when you faced a significant challenge at work?",
        "I appreciate your honesty. What do you consider your greatest strength in a professional setting?",
        "Interesting perspective. How do you handle working under pressure or tight deadlines?",
      ],
      'Presentation Practice': [
        "Your main points are clear. Try to add more enthusiasm to your delivery.",
        "Good structure! Consider adding a compelling story to engage your audience better.",
        "Nice flow. Remember to make eye contact and use gestures to emphasize key points.",
      ],
      'Casual Chat': [
        "That sounds really interesting! Tell me more about that.",
        "I can relate to that experience. What did you learn from it?",
        "That's a fascinating topic. Have you always been interested in that?",
      ],
      'Business Meeting': [
        "Those are solid points. What metrics would you use to measure success?",
        "I see the potential benefits. What challenges do you anticipate?",
        "That's a strategic approach. How would you handle potential risks?",
      ],
    };

    const modeResponses = responses[mode as keyof typeof responses] || responses['Casual Chat'];
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
  };

  const handleGestureSwipeUp = () => {
    setTextInputVisible(true);
  };

  const handleGestureSwipeLeft = () => {
    const currentIndex = conversationModes.findIndex(m => m.id === currentMode?.id);
    const nextIndex = (currentIndex + 1) % conversationModes.length;
    handleModeSelect(conversationModes[nextIndex]);
  };

  const handleGestureSwipeRight = () => {
    const currentIndex = conversationModes.findIndex(m => m.id === currentMode?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : conversationModes.length - 1;
    handleModeSelect(conversationModes[prevIndex]);
  };

  const handleGestureDoubleTap = () => {
    if (currentConversation) {
      handleVoiceRecord();
    }
  };

  const handleGesturePinch = (scale: number) => {
    // Implement zoom for accessibility
    if (scale > 1.5) {
      // Zoom in - could increase text size or button size
    } else if (scale < 0.5) {
      // Zoom out - could decrease text size or button size
    }
  };

  const handleGestureShake = () => {
    if (currentConversation) {
      Alert.alert(
        'Clear Conversation',
        'Are you sure you want to clear the current conversation?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: endConversation },
        ]
      );
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
          onSwipeUp={handleGestureSwipeUp}
          onSwipeLeft={handleGestureSwipeLeft}
          onSwipeRight={handleGestureSwipeRight}
          onDoubleTap={handleGestureDoubleTap}
          onPinch={handleGesturePinch}
          onShake={handleGestureShake}
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
        >
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Ready to practice?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose a conversation mode to get started
            </Text>
            {permissions.microphone === 'denied' && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Voice features disabled. Using text-only mode.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modesContainer}>
            {conversationModes.map((mode) => (
              <ModeCard
                key={mode.id}
                mode={mode}
                onPress={handleModeSelect}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
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
  greeting: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.4,
  },
  warningBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  modesContainer: {
    gap: spacing.md,
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