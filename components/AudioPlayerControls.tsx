import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, MoveHorizontal as MoreHorizontal, X, List, Settings, Download, Share } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { audioPlayerService, PlaybackState, AudioQueueItem } from '@/services/audioPlayerService';
import { spacing, typography } from '@/src/constants/colors';

interface AudioPlayerControlsProps {
  visible: boolean;
  onClose: () => void;
}

export function AudioPlayerControls({ visible, onClose }: AudioPlayerControlsProps) {
  const { colors, isDark } = useTheme();
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    playbackRate: 1.0
  });
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    // Set up callbacks
    audioPlayerService.setStatusUpdateCallback(setPlaybackState);
    audioPlayerService.setQueueUpdateCallback((queue, index) => {
      setAudioQueue(queue);
      setCurrentIndex(index);
    });

    // Load initial state
    setPlaybackState(audioPlayerService.getPlaybackState());
    setAudioQueue(audioPlayerService.getQueue());
    setCurrentIndex(audioPlayerService.getCurrentIndex());
    setIsRepeatMode(audioPlayerService.isRepeatMode());

    return () => {
      audioPlayerService.setStatusUpdateCallback(() => {});
      audioPlayerService.setQueueUpdateCallback(() => {});
    };
  }, []);

  const currentItem = audioQueue[currentIndex];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (playbackState.isPlaying) {
      await audioPlayerService.pause();
    } else {
      await audioPlayerService.play();
    }
  };

  const handleSeek = async (value: number) => {
    if (!isSeeking) return;
    await audioPlayerService.seek(value);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = async (value: number) => {
    await audioPlayerService.seek(value);
    setIsSeeking(false);
  };

  const handleVolumeChange = async (volume: number) => {
    await audioPlayerService.setVolume(volume);
  };

  const handlePlaybackRateChange = async (rate: number) => {
    await audioPlayerService.setPlaybackRate(rate);
  };

  const handleSkipPrevious = async () => {
    await audioPlayerService.skipToPrevious();
  };

  const handleSkipNext = async () => {
    await audioPlayerService.skipToNext();
  };

  const handleToggleRepeat = () => {
    audioPlayerService.toggleRepeat();
    setIsRepeatMode(!isRepeatMode);
  };

  const handleRemoveFromQueue = (itemId: string) => {
    audioPlayerService.removeFromQueue(itemId);
  };

  const QueueModal = () => (
    <Modal
      visible={showQueue}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowQueue(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowQueue(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Audio Queue
          </Text>
          <TouchableOpacity
            style={styles.modalActionButton}
            onPress={() => audioPlayerService.clearQueue()}
          >
            <Text style={[styles.modalActionText, { color: colors.error }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.queueList}>
          {audioQueue.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.queueItem,
                { backgroundColor: colors.surface },
                index === currentIndex && { borderColor: colors.primary, borderWidth: 2 }
              ]}
            >
              <View style={styles.queueItemContent}>
                <Text
                  style={[
                    styles.queueItemTitle,
                    { color: index === currentIndex ? colors.primary : colors.text }
                  ]}
                  numberOfLines={1}
                >
                  {item.title || `Audio ${index + 1}`}
                </Text>
                <Text
                  style={[styles.queueItemText, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.text}
                </Text>
                <Text style={[styles.queueItemMode, { color: colors.textTertiary }]}>
                  {item.conversationMode.replace('-', ' ')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.queueItemRemove}
                onPress={() => handleRemoveFromQueue(item.id)}
              >
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const SettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowSettings(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Audio Settings
          </Text>
          <View style={styles.modalActionButton} />
        </View>

        <ScrollView style={styles.settingsContent}>
          <View style={styles.settingSection}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Volume: {Math.round(playbackState.volume * 100)}%
            </Text>
            <Slider
              style={styles.settingSlider}
              minimumValue={0}
              maximumValue={1}
              value={playbackState.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbStyle={{ backgroundColor: colors.primary }}
            />
          </View>

          <View style={styles.settingSection}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Playback Speed: {playbackState.playbackRate.toFixed(1)}x
            </Text>
            <Slider
              style={styles.settingSlider}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={playbackState.playbackRate}
              onValueChange={handlePlaybackRateChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbStyle={{ backgroundColor: colors.primary }}
            />
          </View>

          <View style={styles.settingSection}>
            <TouchableOpacity
              style={[
                styles.settingToggle,
                { backgroundColor: isRepeatMode ? colors.primary : colors.surface }
              ]}
              onPress={handleToggleRepeat}
            >
              <Repeat size={20} color={isRepeatMode ? 'white' : colors.textSecondary} />
              <Text
                style={[
                  styles.settingToggleText,
                  { color: isRepeatMode ? 'white' : colors.text }
                ]}
              >
                Repeat Mode
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!visible || !currentItem) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
            style={styles.header}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Now Playing
            </Text>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowSettings(true)}
            >
              <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            {/* Track Info */}
            <View style={[styles.trackInfo, { backgroundColor: colors.surface }]}>
              <Text style={[styles.trackTitle, { color: colors.text }]}>
                {currentItem.title || `Audio ${currentIndex + 1}`}
              </Text>
              <Text style={[styles.trackMode, { color: colors.textSecondary }]}>
                {currentItem.conversationMode.replace('-', ' ')}
              </Text>
              <Text
                style={[styles.trackText, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {currentItem.text}
              </Text>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={playbackState.duration || 1}
                value={isSeeking ? playbackState.currentTime : playbackState.currentTime}
                onValueChange={handleSeek}
                onSlidingStart={handleSeekStart}
                onSlidingComplete={handleSeekEnd}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbStyle={{ backgroundColor: colors.primary }}
              />
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatTime(playbackState.currentTime)}
                </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatTime(playbackState.duration)}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleSkipPrevious}
                disabled={currentIndex === 0}
              >
                <SkipBack
                  size={24}
                  color={currentIndex === 0 ? colors.textTertiary : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                onPress={handlePlayPause}
                disabled={playbackState.isLoading}
              >
                {playbackState.isLoading ? (
                  <View style={styles.loadingIndicator} />
                ) : playbackState.isPlaying ? (
                  <Pause size={32} color="white" />
                ) : (
                  <Play size={32} color="white" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleSkipNext}
                disabled={currentIndex >= audioQueue.length - 1}
              >
                <SkipForward
                  size={24}
                  color={currentIndex >= audioQueue.length - 1 ? colors.textTertiary : colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Secondary Controls */}
            <View style={styles.secondaryControls}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleToggleRepeat}
              >
                <Repeat
                  size={20}
                  color={isRepeatMode ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleVolumeChange(playbackState.volume > 0 ? 0 : 0.8)}
              >
                {playbackState.volume > 0 ? (
                  <Volume2 size={20} color={colors.textSecondary} />
                ) : (
                  <VolumeX size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowQueue(true)}
              >
                <List size={20} color={colors.textSecondary} />
                {audioQueue.length > 1 && (
                  <View style={[styles.queueBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.queueBadgeText}>{audioQueue.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton}>
                <Share size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <QueueModal />
      <SettingsModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  moreButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  trackInfo: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  trackMode: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  trackText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  timeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xl,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loadingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: 'white',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  queueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: typography.weights.bold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  modalActionButton: {
    padding: spacing.sm,
  },
  modalActionText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  queueList: {
    flex: 1,
    padding: spacing.lg,
  },
  queueItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  queueItemContent: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  queueItemText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
    marginBottom: spacing.xs,
  },
  queueItemMode: {
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  queueItemRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    flex: 1,
    padding: spacing.lg,
  },
  settingSection: {
    marginBottom: spacing.xl,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
  },
  settingSlider: {
    width: '100%',
    height: 40,
  },
  settingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
  },
  settingToggleText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});