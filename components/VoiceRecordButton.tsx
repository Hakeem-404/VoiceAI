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
  error?: string | null;
  disabled?: boolean;
}

export function VoiceRecordButton({
  onPress,
  onLongPress,
  state,
  error,
  disabled = false,
}: VoiceRecordButtonProps) {
  const { colors } = useTheme();
  const { audioLevel } = useVoiceStore();
  const { voiceSettings } = useSettingsStore();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const audioVisualizationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset all animations when state changes
    scaleAnim.setValue(1);
    pulseAnim.setValue(1);
    glowAnim.setValue(0);
    shakeAnim.setValue(0);
    rotateAnim.setValue(0);

    switch (state) {
      case 'idle':
        startIdleAnimation();
        break;
      case 'recording':
        startRecordingAnimation();
        break;
      case 'processing':
        startProcessingAnimation();
        break;
      case 'error':
        startErrorAnimation();
        break;
    }

    return () => {
      // Cleanup animations
      scaleAnim.stopAnimation();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      shakeAnim.stopAnimation();
      rotateAnim.stopAnimation();
      audioVisualizationAnim.stopAnimation();
    };
  }, [state]);

  useEffect(() => {
    // Update audio visualization based on audio level
    if (state === 'recording') {
      Animated.timing(audioVisualizationAnim, {
        toValue: audioLevel,
        duration: 50,
        useNativeDriver: false,
      }).start();
    }
  }, [audioLevel, state]);

  const startIdleAnimation = () => {
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
  };

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startProcessingAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startErrorAnimation = () => {
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
  };

  const handlePress = () => {
    if (disabled) return;

    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
    
    // Button press animation
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

  const handleLongPress = () => {
    if (disabled || !onLongPress) return;

    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }

    onLongPress();
  };

  const getButtonColors = () => {
    if (disabled) {
      return [colors.border, colors.textTertiary];
    }

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
    const iconColor = disabled ? colors.textTertiary : 'white';
    const iconSize = 32;

    switch (state) {
      case 'recording':
        return <Square size={iconSize} color={iconColor} />;
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
            <Loader size={iconSize} color={iconColor} />
          </Animated.View>
        );
      case 'error':
        return <AlertCircle size={iconSize} color={iconColor} />;
      default:
        return <Mic size={iconSize} color={iconColor} />;
    }
  };

  const getStatusText = () => {
    if (disabled) return 'Voice disabled';
    
    switch (state) {
      case 'recording':
        return 'Recording...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return error || 'Error occurred';
      default:
        return 'Tap to speak';
    }
  };

  const getAccessibilityHint = () => {
    if (disabled) return 'Voice recording is disabled';
    
    switch (state) {
      case 'recording':
        return 'Tap to stop recording';
      case 'processing':
        return 'Processing your voice input';
      case 'error':
        return 'Tap to try recording again';
      default:
        return 'Tap to start voice recording, long press for continuous recording';
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
        {state === 'idle' && !disabled && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3],
                }),
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
                    height: audioVisualizationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 40],
                    }),
                    opacity: audioVisualizationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.9],
                    }),
                    transform: [
                      {
                        scaleY: audioVisualizationAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1 + Math.random() * 0.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            disabled && styles.disabledButton,
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          disabled={disabled || state === 'processing'}
          activeOpacity={0.8}
          accessibilityLabel={getStatusText()}
          accessibilityRole="button"
          accessibilityHint={getAccessibilityHint()}
          accessibilityState={{
            disabled: disabled || state === 'processing',
            busy: state === 'processing',
          }}
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
          { 
            color: state === 'error' ? colors.error : 
                   disabled ? colors.textTertiary : colors.textSecondary 
          },
        ]}
        accessibilityLiveRegion="polite"
      >
        {getStatusText()}
      </Text>

      {error && state === 'error' && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
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
    minHeight: 4,
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
  disabledButton: {
    elevation: 2,
    shadowOpacity: 0.1,
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
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});