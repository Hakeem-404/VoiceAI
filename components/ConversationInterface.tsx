import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pause, Play, Square, RotateCcw, Bookmark, Highlighter, Volume2, VolumeX, MessageSquare, Settings, MoveHorizontal as MoreHorizontal, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ConversationSession, Message } from '@/src/types';
import { VoiceRecordButton } from './VoiceRecordButton';
import { TextInputModal } from './TextInputModal';
import { ConversationFeedbackSystem } from './ConversationFeedbackSystem';
import { useConversationStore } from '@/src/stores/conversationStore';
import { spacing, typography } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

interface ConversationInterfaceProps {
  session: ConversationSession;
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  onVoiceRecord: () => void;
  onTextSend: (text: string) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onModeSwitch: () => void;
  onBookmark: (messageId: string) => void;
  onHighlight: (messageId: string, text: string, color: string) => void;
  recordButtonState: 'idle' | 'recording' | 'processing' | 'error';
  error?: string | null;
}

export function ConversationInterface({
  session,
  messages,
  isRecording,
  isProcessing,
  onVoiceRecord,
  onTextSend,
  onPause,
  onResume,
  onEnd,
  onModeSwitch,
  onBookmark,
  onHighlight,
  recordButtonState,
  error,
}: ConversationInterfaceProps) {
  const { colors, isDark } = useTheme();
  const { currentConversation } = useConversationStore();
  
  const [showTextInput, setShowTextInput] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!session.isPaused) {
        const now = new Date();
        const elapsed = now.getTime() - session.startTime.getTime() - session.totalPauseTime;
        setSessionDuration(Math.floor(elapsed / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isPaused, session.totalPauseTime]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this conversation session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: onEnd },
      ]
    );
  };

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessageId(message.id);
    
    Alert.alert(
      'Message Actions',
      'What would you like to do with this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Bookmark', 
          onPress: () => onBookmark(message.id) 
        },
        { 
          text: 'Highlight', 
          onPress: () => onHighlight(message.id, message.content, colors.warning) 
        },
      ]
    );
  };

  const hideControlsTemporarily = () => {
    setShowControls(false);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(true);
    }, 3000);
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then(({ impactAsync, ImpactFeedbackStyle }) => {
        impactAsync(ImpactFeedbackStyle.Light);
      });
    }
  };

  const toggleFeedback = () => {
    setShowFeedback(!showFeedback);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        {/* Header with session info */}
        {showControls && (
          <View style={[styles.header, { backgroundColor: colors.surface + 'E6' }]}>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionTitle, { color: colors.text }]}>
                {session.modeId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: session.isPaused ? colors.warning : colors.success }
                ]} />
                <Text style={[styles.sessionDuration, { color: colors.textSecondary }]}>
                  {formatDuration(sessionDuration)}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  triggerHaptic();
                  setIsVolumeOn(!isVolumeOn);
                }}
              >
                {isVolumeOn ? (
                  <Volume2 size={18} color={colors.textSecondary} />
                ) : (
                  <VolumeX size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  triggerHaptic();
                  toggleFeedback();
                }}
              >
                <BarChart3 size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  triggerHaptic();
                  onModeSwitch();
                }}
              >
                <RotateCcw size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  triggerHaptic();
                  // Show more options
                }}
              >
                <MoreHorizontal size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Feedback System */}
        {showFeedback && currentConversation && (
          <ConversationFeedbackSystem
            conversation={currentConversation}
            isActive={true}
            showMetrics={true}
          />
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => hideControlsTemporarily()}
        >
          {messages.map((message, index) => (
            <TouchableOpacity
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.aiMessage,
                {
                  backgroundColor: message.role === 'user' 
                    ? colors.primary 
                    : colors.surface,
                },
                selectedMessageId === message.id && styles.selectedMessage,
              ]}
              onLongPress={() => handleMessageLongPress(message)}
              activeOpacity={0.8}
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
              
              {message.audioUrl && (
                <TouchableOpacity style={styles.audioIndicator}>
                  <Volume2 size={14} color={message.role === 'user' ? 'white' : colors.primary} />
                </TouchableOpacity>
              )}
              
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
            </TouchableOpacity>
          ))}
          
          {isProcessing && (
            <View style={[styles.messageBubble, styles.aiMessage, { backgroundColor: colors.surface }]}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: colors.surface + 'E6' }]}>
          <View style={styles.inputControls}>
            <TouchableOpacity
              style={[styles.inputButton, { backgroundColor: colors.background }]}
              onPress={() => {
                triggerHaptic();
                setShowTextInput(true);
              }}
            >
              <MessageSquare size={20} color={colors.primary} />
            </TouchableOpacity>

            <VoiceRecordButton
              onPress={onVoiceRecord}
              state={recordButtonState}
              error={error}
            />

            <TouchableOpacity
              style={[styles.inputButton, { backgroundColor: colors.background }]}
              onPress={() => {
                triggerHaptic();
                session.isPaused ? onResume() : onPause();
              }}
            >
              {session.isPaused ? (
                <Play size={20} color={colors.success} />
              ) : (
                <Pause size={20} color={colors.warning} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.endButton, { backgroundColor: colors.error }]}
            onPress={() => {
              triggerHaptic();
              handleEndSession();
            }}
          >
            <Square size={16} color="white" />
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Quick Actions */}
        {showControls && messages.length > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) onBookmark(lastMessage.id);
              }}
            >
              <Bookmark size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) onHighlight(lastMessage.id, lastMessage.content, colors.warning);
              }}
            >
              <Highlighter size={16} color={colors.warning} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <TextInputModal
        visible={showTextInput}
        onClose={() => setShowTextInput(false)}
        onSend={onTextSend}
        onVoiceToggle={() => {
          setShowTextInput(false);
          // Switch to voice mode
        }}
        placeholder="Type your message..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionDuration: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    maxWidth: '80%',
    position: 'relative',
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
  selectedMessage: {
    borderWidth: 2,
    borderColor: '#FFD700',
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
  audioIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs / 2,
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
  inputArea: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
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
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  endButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  quickActions: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 200,
    gap: spacing.sm,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});