import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface ThemeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSave: (isDark: boolean) => void;
}

export function ThemeSettingsModal({ 
  visible, 
  onClose, 
  isDarkMode,
  onSave 
}: ThemeSettingsModalProps) {
  const { colors } = useTheme();
  
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
    isDarkMode ? 'dark' : 'light'
  );

  const themeOptions = [
    {
      id: 'light' as const,
      title: 'Light',
      description: 'Use light theme',
      icon: Sun,
    },
    {
      id: 'dark' as const,
      title: 'Dark',
      description: 'Use dark theme',
      icon: Moon,
    },
    {
      id: 'system' as const,
      title: 'System',
      description: 'Follow system setting',
      icon: Smartphone,
    },
  ];

  const handleSave = () => {
    if (selectedTheme === 'system') {
      // For now, default to light theme when system is selected
      // In a real app, you'd check the system theme
      onSave(false);
    } else {
      onSave(selectedTheme === 'dark');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Theme Settings
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Choose how the app looks. You can change this anytime in settings.
          </Text>

          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedTheme === option.id;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionRow,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedTheme(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: isSelected ? colors.primary : colors.border }
                    ]}>
                      <IconComponent 
                        size={20} 
                        color={isSelected ? 'white' : colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
                      <Check size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.previewContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              Preview
            </Text>
            <View style={[styles.previewCard, { backgroundColor: colors.background }]}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={[styles.previewName, { color: colors.text }]}>
                    John Doe
                  </Text>
                  <Text style={[styles.previewEmail, { color: colors.textSecondary }]}>
                    john@example.com
                  </Text>
                </View>
              </View>
              <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                This is how your app will look with the selected theme.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Apply Theme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    marginBottom: spacing.xl,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    padding: spacing.lg,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  previewCard: {
    padding: spacing.lg,
    borderRadius: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  previewName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  previewEmail: {
    fontSize: typography.sizes.sm,
  },
  previewText: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  saveButton: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});