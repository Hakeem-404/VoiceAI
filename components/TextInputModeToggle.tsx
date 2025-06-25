import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MessageSquare, Zap } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { spacing, typography } from '@/src/constants/colors';

interface TextInputModeToggleProps {
  onVoicePress: () => void;
  onTextPress: () => void;
  disabled?: boolean;
}

export function TextInputModeToggle({
  onVoicePress,
  onTextPress,
  disabled = false,
}: TextInputModeToggleProps) {
  const { colors } = useTheme();
  const { inputMode } = useInputStore();

  return (
    <View style={styles.container}>
      <View style={[styles.toggleContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            inputMode === 'voice' && styles.activeButton,
            disabled && styles.disabledButton,
          ]}
          onPress={onVoicePress}
          disabled={disabled}
        >
          {inputMode === 'voice' ? (
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.activeGradient}
            >
              <Mic size={20} color="white" />
              <Text style={styles.activeButtonText}>Voice</Text>
            </LinearGradient>
          ) : (
            <>
              <Mic size={20} color={disabled ? colors.textTertiary : colors.textSecondary} />
              <Text style={[
                styles.inactiveButtonText,
                { color: disabled ? colors.textTertiary : colors.textSecondary }
              ]}>
                Voice
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            inputMode === 'text' && styles.activeButton,
            disabled && styles.disabledButton,
          ]}
          onPress={onTextPress}
          disabled={disabled}
        >
          {inputMode === 'text' ? (
            <LinearGradient
              colors={[colors.secondary, colors.accent]}
              style={styles.activeGradient}
            >
              <MessageSquare size={20} color="white" />
              <Text style={styles.activeButtonText}>Text</Text>
            </LinearGradient>
          ) : (
            <>
              <MessageSquare size={20} color={disabled ? colors.textTertiary : colors.textSecondary} />
              <Text style={[
                styles.inactiveButtonText,
                { color: disabled ? colors.textTertiary : colors.textSecondary }
              ]}>
                Text
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            inputMode === 'hybrid' && styles.activeButton,
            disabled && styles.disabledButton,
          ]}
          onPress={() => {
            // Toggle to hybrid mode
            const { setInputMode } = useInputStore.getState();
            setInputMode('hybrid');
          }}
          disabled={disabled}
        >
          {inputMode === 'hybrid' ? (
            <LinearGradient
              colors={[colors.accent, colors.warning]}
              style={styles.activeGradient}
            >
              <Zap size={20} color="white" />
              <Text style={styles.activeButtonText}>Both</Text>
            </LinearGradient>
          ) : (
            <>
              <Zap size={20} color={disabled ? colors.textTertiary : colors.textSecondary} />
              <Text style={[
                styles.inactiveButtonText,
                { color: disabled ? colors.textTertiary : colors.textSecondary }
              ]}>
                Both
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: spacing.xs,
  },
  activeButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  activeGradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  activeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  inactiveButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});