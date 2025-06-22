import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Mic, Square } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { RecordingState } from '../types';
import { VoiceVisualizer } from './VoiceVisualizer';

interface RecordButtonProps {
  state: RecordingState;
  onPress: () => void;
  audioLevels?: number[];
}

export function RecordButton({ state, onPress, audioLevels = [] }: RecordButtonProps) {
  const { colors } = useTheme();
  
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isProcessing}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isRecording ? [colors.error, '#DC2626'] : [colors.primary, colors.secondary]}
        style={[
          styles.button,
          isProcessing && styles.processing,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isRecording ? (
          <VoiceVisualizer
            audioLevels={audioLevels}
            isActive={true}
            size={60}
          />
        ) : (
          <>
            {isRecording ? (
              <Square size={28} color="white" />
            ) : (
              <Mic size={28} color="white" />
            )}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  processing: {
    opacity: 0.6,
  },
});