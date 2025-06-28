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
import { X, Volume2, Mic } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface VoiceProfile {
  id: string;
  name: string;
  description?: string;
  elevenlabs_voice_id?: string;
  is_custom: boolean;
  voice_settings: {
    speed?: number;
    pitch?: number;
    volume?: number;
  };
}

interface VoiceSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  voiceProfiles?: VoiceProfile[];
}

export function VoiceSettingsModal({ 
  visible, 
  onClose, 
  voiceProfiles = [] 
}: VoiceSettingsModalProps) {
  const { colors } = useTheme();
  
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [enableVoice, setEnableVoice] = useState(true);

  const handleSave = () => {
    // Save voice settings logic would go here
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
            Voice Settings
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Volume2 size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Voice Output
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Voice
              </Text>
              <Switch
                value={enableVoice}
                onValueChange={setEnableVoice}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={enableVoice ? colors.background : colors.textSecondary}
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Voice Profile
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                Default
              </Text>
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Speed
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {speed.toFixed(1)}x
              </Text>
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Volume
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {Math.round(volume * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Mic size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Voice Input
              </Text>
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Language
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                English (US)
              </Text>
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto-detect Language
              </Text>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textSecondary}
              />
            </View>
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
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  settingValue: {
    fontSize: typography.sizes.base,
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