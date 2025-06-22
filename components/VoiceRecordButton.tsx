import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square, Loader, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { useVoiceStore } from '@/src/stores/voiceStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = 120;

interface VoiceRecordButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  state: 'idle' | 'recording' | 'processing' | 'error';
  error?: string;
}

export function VoiceRecordButton({
  onPress,
  onLongPress,
  state,
  error,
}: VoiceRecordButtonProps) {
  const { colors } = useTheme();
  const { audioLevel } = useVoiceStore();
  const { voiceSettings } = useSettingsStore();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    switch (state) {
      case 'idle':
        // Subtle glow animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
        break;

      case 'recording':
        // Pulsing animation based on audio level
        Animated.loop(
          Animated.timing(pulseAnim, {
            toValue: 1 + audioLevel * 0.3,
            duration: 100,
            useNativeDriver: true,
          })
        ).start();
        break;

      case 'processing':
        // Rotation animation
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();
        break;

      case 'error':
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  }, [state, audioLevel]);

  const handlePress = () => {
    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getButtonColors = () => {
    switch (state) {
      case 'recording':
        return [colors.error, '#DC2626'];
      case 'processing':
        return [colors.warning, '#F59E0B'];
      case 'error':
        return [colors.error, '#B91C1C'];
      default:
        return [colors.primary, colors.secondary];
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'recording':
        return <Square size={32} color="white" />;
      case 'processing':
        return (
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <Loader size={32} color="white" />
          </Animated.View>
        );
      case 'error':
        return <AlertCircle size={32} color="white" />;
      default:
        return <Mic size={32} color="white" />;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'recording':
        return 'Recording...';
      case 'processing':
        return 'Thinking...';
      case 'error':
        return error || 'Error occurred';
      default:
        return 'Tap to speak';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* Glow effect for idle state */}
        {state === 'idle' && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}

        {/* Audio level visualization for recording state */}
        {state === 'recording' && (
          <View style={styles.audioVisualization}>
            {Array.from({ length: 20 }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.audioBar,
                  {
                    backgroundColor: colors.error,
                    height: Math.max(4, audioLevel * 40 * Math.random()),
                    opacity: 0.6 + audioLevel * 0.4,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          onLongPress={onLongPress}
          disabled={state === 'processing'}
          activeOpacity={0.8}
          accessibilityLabel={getStatusText()}
          accessibilityRole="button"
          accessibilityHint="Double tap to record voice message"
        >
          <LinearGradient
            colors={getButtonColors()}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {getIcon()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Text
        style={[
          styles.statusText,
          { color: state === 'error' ? colors.error : colors.textSecondary },
        ]}
      >
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
    borderRadius: (BUTTON_SIZE + 20) / 2,
    opacity: 0.3,
  },
  audioVisualization: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
    borderRadius: (BUTTON_SIZE + 60) / 2,
  },
  audioBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});