import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mic,
  MicOff,
  Type,
  Send,
  RotateCcw,
  Edit3,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { useVoiceStore } from '@/src/stores/voiceStore';

interface HybridInputInterfaceProps {
  onSend: (text: string, mode: 'voice' | 'text' | 'hybrid') => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onTextEdit: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  transcribedText: string;
  editedText: string;
  onTextChange: (text: string) => void;
}

export function HybridInputInterface({
  onSend,
  onVoiceStart,
  onVoiceStop,
  onTextEdit,
  isRecording,
  isProcessing,
  transcribedText,
  editedText,
  onTextChange,
}: HybridInputInterfaceProps) {
  const { colors } = useTheme();
  const { inputMode, setInputMode } = useInputStore();
  const { audioLevel } = useVoiceStore();
  
  const [currentMode, setCurrentMode] = useState<'voice' | 'text' | 'hybrid'>('voice');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [hasTextEdit, setHasTextEdit] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    if (transcribedText) {
      setHasVoiceInput(true);
      setCurrentMode('hybrid');
    }
  }, [transcribedText]);

  useEffect(() => {
    if (editedText !== transcribedText) {
      setHasTextEdit(true);
      setCurrentMode('hybrid');
    }
  }, [editedText, transcribedText]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      onVoiceStop();
    } else {
      onVoiceStart();
    }
  };

  const handleSend = () => {
    const finalText = editedText || transcribedText;
    if (finalText.trim()) {
      let mode: 'voice' | 'text' | 'hybrid' = 'text';
      
      if (hasVoiceInput && hasTextEdit) {
        mode = 'hybrid';
      } else if (hasVoiceInput) {
        mode = 'voice';
      }
      
      onSend(finalText, mode);
      
      // Reset state
      setHasVoiceInput(false);
      setHasTextEdit(false);
      setCurrentMode('voice');
    }
  };

  const handleReset = () => {
    onTextChange('');
    setHasVoiceInput(false);
    setHasTextEdit(false);
    setCurrentMode('voice');
  };

  const getModeColor = () => {
    switch (currentMode) {
      case 'voice': return colors.primary;
      case 'text': return colors.secondary;
      case 'hybrid': return colors.accent;
      default: return colors.primary;
    }
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'voice': return Mic;
      case 'text': return Type;
      case 'hybrid': return Edit3;
      default: return Mic;
    }
  };

  const finalText = editedText || transcribedText;

  return (
    <View style={styles.container}>
      {/* Mode Indicator */}
      <View style={styles.modeIndicator}>
        <LinearGradient
          colors={[getModeColor(), getModeColor() + '80']}
          style={styles.modeGradient}
        >
          <Text style={styles.modeText}>
            {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode
          </Text>
        </LinearGradient>
      </View>

      {/* Input Status */}
      {(hasVoiceInput || hasTextEdit) && (
        <View style={[styles.statusContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.statusIndicators}>
            {hasVoiceInput && (
              <View style={styles.statusItem}>
                <Volume2 size={16} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Voice captured
                </Text>
              </View>
            )}
            {hasTextEdit && (
              <View style={styles.statusItem}>
                <Edit3 size={16} color={colors.accent} />
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  Text edited
                </Text>
              </View>
            )}
          </View>
          
          {finalText && (
            <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={2}>
              {finalText}
            </Text>
          )}
        </View>
      )}

      {/* Main Controls */}
      <View style={styles.controlsContainer}>
        {/* Voice Control */}
        <View style={styles.voiceSection}>
          <TouchableOpacity
            style={styles.voiceToggle}
            onPress={() => setIsVoiceEnabled(!isVoiceEnabled)}
          >
            {isVoiceEnabled ? (
              <Volume2 size={20} color={colors.textSecondary} />
            ) : (
              <VolumeX size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.voiceButton,
              {
                transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.voiceButtonInner,
                {
                  backgroundColor: isRecording ? colors.error : getModeColor(),
                },
              ]}
              onPress={handleVoiceToggle}
              disabled={!isVoiceEnabled || isProcessing}
            >
              <LinearGradient
                colors={
                  isRecording
                    ? [colors.error, '#DC2626']
                    : [getModeColor(), getModeColor() + 'CC']
                }
                style={styles.voiceGradient}
              >
                {isRecording ? (
                  <MicOff size={32} color="white" />
                ) : (
                  <Mic size={32} color="white" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Audio Level Indicator */}
          {isRecording && (
            <View style={styles.audioLevelContainer}>
              <View
                style={[
                  styles.audioLevelBar,
                  {
                    backgroundColor: colors.error,
                    height: Math.max(4, audioLevel * 20),
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={onTextEdit}
          >
            <Type size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {(hasVoiceInput || hasTextEdit) && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleReset}
            >
              <RotateCcw size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: finalText.trim() ? colors.success : colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!finalText.trim()}
          >
            <Send
              size={20}
              color={finalText.trim() ? 'white' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={[styles.processingText, { color: colors.textSecondary }]}>
            Processing speech...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  modeIndicator: {
    marginBottom: 16,
  },
  modeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  voiceSection: {
    alignItems: 'center',
    gap: 12,
  },
  voiceToggle: {
    padding: 8,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    overflow: 'hidden',
  },
  voiceGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioLevelContainer: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioLevelBar: {
    width: '100%',
    borderRadius: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContainer: {
    marginTop: 16,
  },
  processingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});