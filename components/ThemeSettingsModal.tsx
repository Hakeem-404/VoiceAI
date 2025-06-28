import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Moon, Sun, Monitor } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface ThemeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSave: (isDarkMode: boolean) => void;
}

export function ThemeSettingsModal({ 
  visible, 
  onClose, 
  isDarkMode,
  onSave
}: ThemeSettingsModalProps) {
  const { colors, isDark } = useTheme();
  
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
    isDarkMode ? 'dark' : 'light'
  );
  const [success, setSuccess] = useState(false);
  
  const handleSave = () => {
    onSave(selectedTheme === 'dark');
    setSuccess(true);
    
    // Reset success state after a delay
    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Appearance
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              {success ? (
                <Check size={20} color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Choose how VoiceAI looks to you. Select light or dark mode.
            </Text>

            {/* Theme Options */}
            <View style={styles.themeOptions}>
              {/* Light Theme */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: selectedTheme === 'light' ? colors.primary : colors.border,
                    borderWidth: selectedTheme === 'light' ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedTheme('light')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#FFFFFF' }]}>
                  <Sun size={32} color="#0F172A" />
                </View>
                <Text style={[styles.themeLabel, { color: colors.text }]}>
                  Light
                </Text>
                {selectedTheme === 'light' && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Dark Theme */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: selectedTheme === 'dark' ? colors.primary : colors.border,
                    borderWidth: selectedTheme === 'dark' ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedTheme('dark')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#0F172A' }]}>
                  <Moon size={32} color="#F8FAFC" />
                </View>
                <Text style={[styles.themeLabel, { color: colors.text }]}>
                  Dark
                </Text>
                {selectedTheme === 'dark' && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              {/* System Theme */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: selectedTheme === 'system' ? colors.primary : colors.border,
                    borderWidth: selectedTheme === 'system' ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedTheme('system')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#E2E8F0' }]}>
                  <Monitor size={32} color="#0F172A" />
                </View>
                <Text style={[styles.themeLabel, { color: colors.text }]}>
                  System
                </Text>
                {selectedTheme === 'system' && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={[styles.noteContainer, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                System theme will automatically match your device's appearance settings.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.base,
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.base * 1.4,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  themeOption: {
    width: '30%',
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  themeLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteContainer: {
    padding: spacing.md,
    borderRadius: 12,
  },
  noteText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.4,
  },
});