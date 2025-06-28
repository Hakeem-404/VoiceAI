import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Bell, Clock, Award, Target } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface NotificationSettings {
  practiceReminders: boolean;
  achievements: boolean;
  dailyGoals?: boolean;
  weeklyReports?: boolean;
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
  const { colors } = useTheme();
  
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(settings);
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
            Notification Settings
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Practice Notifications
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Clock size={16} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Practice Reminders
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Daily reminders to practice your skills
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.practiceReminders}
                onValueChange={() => handleToggle('practiceReminders')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.practiceReminders ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Target size={16} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Daily Goals
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Notifications about your daily progress
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.dailyGoals || false}
                onValueChange={() => handleToggle('dailyGoals')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.dailyGoals ? colors.background : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Achievement Notifications
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Award size={16} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Achievements
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Get notified when you unlock new achievements
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.achievements}
                onValueChange={() => handleToggle('achievements')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.achievements ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Bell size={16} color={colors.textSecondary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Weekly Reports
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Weekly summary of your progress
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.weeklyReports || false}
                onValueChange={() => handleToggle('weeklyReports')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.weeklyReports ? colors.background : colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You can change these settings at any time. Notifications help you stay consistent with your practice routine.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
  },
  infoBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
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