import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pause,
  Play,
  Square,
  Bookmark,
  Highlighter,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ConversationSession } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface ConversationSessionManagerProps {
  session: ConversationSession;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onBookmark: (messageId: string, note?: string) => void;
  onHighlight: (messageId: string, text: string, color: string) => void;
  onModeSwitch: () => void;
  onVolumeToggle: () => void;
  isVolumeOn: boolean;
}

export function ConversationSessionManager({
  session,
  onPause,
  onResume,
  onEnd,
  onBookmark,
  onHighlight,
  onModeSwitch,
  onVolumeToggle,
  isVolumeOn,
}: ConversationSessionManagerProps) {
  const { colors } = useTheme();
  const [showControls, setShowControls] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);

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

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then(({ impactAsync, ImpactFeedbackStyle }) => {
        impactAsync(ImpactFeedbackStyle.Light);
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary + '20', colors.secondary + '20']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <View style={styles.sessionDetails}>
            <Text style={[styles.sessionTitle, { color: colors.text }]}>
              Active Session
            </Text>
            <Text style={[styles.sessionDuration, { color: colors.textSecondary }]}>
              {formatDuration(sessionDuration)}
            </Text>
          </View>
          
          <View style={styles.sessionStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: session.isPaused ? colors.warning : colors.success }
            ]} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {session.isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Primary Controls */}
          <View style={styles.primaryControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                session.isPaused ? onResume() : onPause();
              }}
              accessibilityLabel={session.isPaused ? 'Resume session' : 'Pause session'}
            >
              {session.isPaused ? (
                <Play size={20} color={colors.primary} />
              ) : (
                <Pause size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endButton, { backgroundColor: colors.error }]}
              onPress={() => {
                triggerHaptic();
                handleEndSession();
              }}
              accessibilityLabel="End session"
            >
              <Square size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.smallControlButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                onVolumeToggle();
              }}
              accessibilityLabel={isVolumeOn ? 'Mute audio' : 'Unmute audio'}
            >
              {isVolumeOn ? (
                <Volume2 size={16} color={colors.textSecondary} />
              ) : (
                <VolumeX size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallControlButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                onModeSwitch();
              }}
              accessibilityLabel="Switch conversation mode"
            >
              <RotateCcw size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallControlButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                triggerHaptic();
                // Open session settings
              }}
              accessibilityLabel="Session settings"
            >
              <Settings size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              triggerHaptic();
              // Trigger bookmark for last message
              const lastMessage = session.messages[session.messages.length - 1];
              if (lastMessage) {
                onBookmark(lastMessage.id);
              }
            }}
            accessibilityLabel="Bookmark last message"
          >
            <Bookmark size={16} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Bookmark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              triggerHaptic();
              // Trigger highlight for last message
              const lastMessage = session.messages[session.messages.length - 1];
              if (lastMessage) {
                onHighlight(lastMessage.id, lastMessage.content, colors.warning);
              }
            }}
            accessibilityLabel="Highlight last message"
          >
            <Highlighter size={16} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>
              Highlight
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    margin: spacing.md,
  },
  gradient: {
    padding: spacing.lg,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  sessionDuration: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  primaryControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  endButton: {
    elevation: 3,
    shadowOpacity: 0.2,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  quickActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});