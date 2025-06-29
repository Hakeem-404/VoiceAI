import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Volume2, Mic, FileSliders as Sliders } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleSave = () => {
    // Save voice settings logic would go here
    onClose();
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    
    // Find the selected voice profile and update settings
    const profile = voiceProfiles.find(p => p.id === voiceId);
    if (profile) {
      setSpeed(profile.voice_settings.speed || 1.0);
      setPitch(profile.voice_settings.pitch || 1.0);
      setVolume(profile.voice_settings.volume || 0.8);
    }
  };

  const handleTestVoice = () => {
    // Test voice logic would go here
    console.log('Testing voice with settings:', { selectedVoice, speed, pitch, volume });
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
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  step={0.1}
                  value={speed}
                  onValueChange={setSpeed}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                  disabled={!enableVoice}
                />
                <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>
                  {speed.toFixed(1)}x
                </Text>
              </View>
            </View>

            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Volume
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.1}
                  value={volume}
                  onValueChange={setVolume}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                  disabled={!enableVoice}
                />
                <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.testButton, 
                { 
                  backgroundColor: enableVoice ? colors.primary : colors.border,
                  opacity: enableVoice ? 1 : 0.5
                }
              ]}
              onPress={handleTestVoice}
              disabled={!enableVoice}
            >
              <Volume2 size={16} color="white" />
              <Text style={styles.testButtonText}>Test Voice</Text>
            </TouchableOpacity>
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
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto-detect Language
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Automatically detect spoken language
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textSecondary}
              />
            </View>
            
            <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto-stop after silence
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Stop recording after 2 seconds of silence
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.advancedButton, { borderColor: colors.border }]}
            onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <Sliders size={16} color={colors.primary} />
            <Text style={[styles.advancedButtonText, { color: colors.primary }]}>
              {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </Text>
          </TouchableOpacity>
          
          {showAdvancedSettings && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sliders size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Advanced Settings
                </Text>
              </View>
              
              <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Pitch
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={pitch}
                    onValueChange={setPitch}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                    disabled={!enableVoice}
                  />
                  <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>
                    {pitch.toFixed(1)}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Haptic Feedback
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Vibration feedback when recording
                  </Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                  disabled={Platform.OS === 'web'}
                />
              </View>
              
              <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Voice Activity Detection
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Only record when speech is detected
                  </Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
            </View>
          )}
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
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs / 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 50,
    textAlign: 'right',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  testButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  advancedButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
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