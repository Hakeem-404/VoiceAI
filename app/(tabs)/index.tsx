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
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { conversationModes } from '@/src/constants/modes';
import { ModeCard } from '@/src/components/ModeCard';
import { RecordButton } from '@/src/components/RecordButton';
import { audioService } from '@/src/services/audioService';
import { ConversationMode } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const {
    currentConversation,
    currentMode,
    recordingState,
    isProcessing,
    audioLevels,
    startConversation,
    endConversation,
    addMessage,
    setRecordingState,
    setProcessing,
    updateAudioLevels,
  } = useConversationStore();

  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    initializeAudio();
  }, []);

  const initializeAudio = async () => {
    try {
      if (Platform.OS !== 'web') {
        await audioService.initializeAudio();
        setHasPermissions(true);
      } else {
        setHasPermissions(true); // Mock for web
      }
    } catch (error) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required for voice conversations.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleModeSelect = (mode: ConversationMode) => {
    if (!hasPermissions) {
      initializeAudio();
      return;
    }
    
    startConversation(mode);
    router.push('/conversation');
  };

  const handleRecordPress = async () => {
    if (!hasPermissions) {
      initializeAudio();
      return;
    }

    try {
      if (recordingState === 'idle') {
        setRecordingState('recording');
        
        if (Platform.OS !== 'web') {
          await audioService.startRecording((level) => {
            updateAudioLevels([level]);
          });
        } else {
          // Mock recording for web
          const mockLevels = () => {
            updateAudioLevels([Math.random()]);
            setTimeout(mockLevels, 100);
          };
          mockLevels();
        }
      } else if (recordingState === 'recording') {
        setRecordingState('processing');
        setProcessing(true);
        
        let audioUri = null;
        if (Platform.OS !== 'web') {
          audioUri = await audioService.stopRecording();
        }
        
        // Simulate AI processing
        setTimeout(() => {
          if (currentConversation) {
            addMessage({
              role: 'user',
              content: 'Sample recorded message',
              audioUrl: audioUri || undefined,
            });
            
            // Add AI response
            setTimeout(() => {
              addMessage({
                role: 'ai',
                content: 'Thank you for your message. This is a sample AI response.',
              });
              
              setRecordingState('idle');
              setProcessing(false);
            }, 1000);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Recording error:', error);
      setRecordingState('idle');
      setProcessing(false);
      Alert.alert('Error', 'Failed to record audio. Please try again.');
    }
  };

  if (currentConversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            >
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.messagesContainer}>
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
          </View>

          <View style={styles.recordingArea}>
            <RecordButton
              state={recordingState}
              onPress={handleRecordPress}
              audioLevels={audioLevels}
            />
            <Text style={[styles.recordingHint, { color: colors.textSecondary }]}>
              {recordingState === 'idle' && 'Tap to speak'}
              {recordingState === 'recording' && 'Recording...'}
              {recordingState === 'processing' && 'Processing...'}
            </Text>
          </View>
        </LinearGradient>
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
  recordingArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recordingHint: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
});