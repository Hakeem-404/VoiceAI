import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Bell, Check, Clock, Award, Calendar, Zap } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface NotificationSettings {
  practiceReminders: boolean;
  achievements: boolean;
  dailyGoals?: boolean;
  streakUpdates?: boolean;
  newFeatures?: boolean;
}

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  initialSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
}

export function NotificationSettingsModal({ 
  visible, 
  onClose, 
  initialSettings,
  onSave
}: NotificationSettingsModalProps) {
  const { colors, isDark } = useTheme();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    ...initialSettings,
    dailyGoals: initialSettings.dailyGoals !== undefined ? initialSettings.dailyGoals : true,
    streakUpdates: initialSettings.streakUpdates !== undefined ? initialSettings.streakUpdates : true,
    newFeatures: initialSettings.newFeatures !== undefined ? initialSettings.newFeatures : true,
  });
  
  const [success, setSuccess] = useState(false);
  
  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSave = () => {
    onSave(settings);
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
              Notification Settings
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Bell size={24} color={colors.primary} />
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Configure which notifications you'd like to receive to enhance your practice experience
              </Text>
            </View>

            {/* Notification Settings */}
            <View style={styles.settingsContainer}>
              {/* Practice Reminders */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={() => handleToggle('practiceReminders')}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                    <Clock size={20} color="white" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Practice Reminders
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Daily reminders to practice speaking
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  { backgroundColor: settings.practiceReminders ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.toggleKnob, 
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: settings.practiceReminders ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Achievement Notifications */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={() => handleToggle('achievements')}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
                    <Award size={20} color="white" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Achievement Notifications
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified when you unlock achievements
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  { backgroundColor: settings.achievements ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.toggleKnob, 
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: settings.achievements ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Daily Goals */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={() => handleToggle('dailyGoals')}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
                    <Calendar size={20} color="white" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Daily Goals
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Notifications about daily challenges and goals
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  { backgroundColor: settings.dailyGoals ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.toggleKnob, 
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: settings.dailyGoals ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Streak Updates */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={() => handleToggle('streakUpdates')}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
                    <Zap size={20} color="white" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Streak Updates
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Reminders to maintain your practice streak
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  { backgroundColor: settings.streakUpdates ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.toggleKnob, 
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: settings.streakUpdates ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* New Features */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.surface }]}
                onPress={() => handleToggle('newFeatures')}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
                    <Bell size={20} color="white" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      New Features
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      Get notified about new app features and updates
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  { backgroundColor: settings.newFeatures ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.toggleKnob, 
                    { 
                      backgroundColor: colors.surface,
                      transform: [{ translateX: settings.newFeatures ? 20 : 0 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={[styles.noteContainer, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                You can change these settings at any time. Notifications help you stay consistent with your practice routine.
              </Text>
            </View>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  description: {
    flex: 1,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
  },
  settingsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
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