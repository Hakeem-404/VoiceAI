import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Wifi, Database, RefreshCw, Clock, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { getData, saveData, STORAGE_KEYS } from '../lib/asyncStorage';
import { processSyncQueue } from '../services/syncService';
import { spacing, typography } from '../constants/colors';

interface NetworkPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NetworkPreferencesModal({ 
  visible, 
  onClose 
}: NetworkPreferencesModalProps) {
  const { colors } = useTheme();
  
  const [wifiOnly, setWifiOnly] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState(15); // minutes
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const prefs = await getData(STORAGE_KEYS.NETWORK_PREFERENCES);
      if (prefs) {
        setWifiOnly(prefs.wifiOnly ?? false);
        setAutoSync(prefs.autoSync ?? true);
        setSyncFrequency(prefs.syncFrequency ?? 15);
        setDataSaverMode(prefs.dataSaverMode ?? false);
        setBackgroundSync(prefs.backgroundSync ?? true);
        setAnalyticsEnabled(prefs.analyticsEnabled ?? true);
      }
    };
    
    if (visible) {
      loadPreferences();
    }
  }, [visible]);
  
  // Save preferences
  const savePreferences = async () => {
    const prefs = {
      wifiOnly,
      autoSync,
      syncFrequency,
      dataSaverMode,
      backgroundSync,
      analyticsEnabled,
    };
    
    await saveData(STORAGE_KEYS.NETWORK_PREFERENCES, prefs);
    
    // If auto sync is enabled, trigger a sync
    if (autoSync) {
      processSyncQueue();
    }
    
    onClose();
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
            Network & Sync Preferences
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wifi size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Network Usage
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  WiFi Only
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Only sync data when connected to WiFi
                </Text>
              </View>
              <Switch
                value={wifiOnly}
                onValueChange={setWifiOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={wifiOnly ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Data Saver Mode
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Reduce data usage by compressing content
                </Text>
              </View>
              <Switch
                value={dataSaverMode}
                onValueChange={setDataSaverMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={dataSaverMode ? colors.background : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <RefreshCw size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Synchronization
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto Sync
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Automatically sync data when online
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={autoSync ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Background Sync
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Sync data in the background when app is closed
                </Text>
              </View>
              <Switch
                value={backgroundSync}
                onValueChange={setBackgroundSync}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={backgroundSync ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Sync Frequency
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  How often to sync data when auto sync is enabled
                </Text>
              </View>
              <View style={styles.frequencySelector}>
                {[5, 15, 30, 60].map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.frequencyOption,
                      syncFrequency === minutes && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                      },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setSyncFrequency(minutes)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        { color: syncFrequency === minutes ? 'white' : colors.text }
                      ]}
                    >
                      {minutes}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Database size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Storage & Data
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Offline Data Retention
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  How long to keep offline data
                </Text>
              </View>
              <View style={styles.frequencySelector}>
                {[7, 30, 90, 365].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.frequencyOption,
                      { borderColor: colors.border }
                    ]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.frequencyText, { color: colors.text }]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Analytics
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Usage Analytics
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Share anonymous usage data to help improve the app
                </Text>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={analyticsEnabled ? colors.background : colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Changes to these settings will take effect immediately. Background sync requires system permissions and may be affected by battery optimization settings on your device.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={savePreferences}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  frequencyOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xl,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: typography.sizes.sm * 1.4,
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