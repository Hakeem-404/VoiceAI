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
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Volume2, Mic, Play, Pause, Settings, Check } from 'lucide-react-native';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');

  const handleSave = () => {
    // Save voice settings logic would go here
    onClose();
  };

  const handlePlaySample = () => {
    setIsPlaying(!isPlaying);
    // Logic to play voice sample would go here
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'output' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setActiveTab('output')}
          >
            <Volume2 size={16} color={activeTab === 'output' ? 'white' : colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'output' ? 'white' : colors.textSecondary }
            ]}>
              Voice Output
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'input' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setActiveTab('input')}
          >
            <Mic size={16} color={activeTab === 'input' ? 'white' : colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'input' ? 'white' : colors.textSecondary }
            ]}>
              Voice Input
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'output' ? (
            <>
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

                {/* Voice Profiles */}
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                  Voice Profile
                </Text>
                
                {voiceProfiles.length > 0 ? (
                  voiceProfiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      style={[
                        styles.voiceProfileCard,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: selectedVoice === profile.id ? colors.primary : 'transparent',
                          borderWidth: selectedVoice === profile.id ? 2 : 0,
                        }
                      ]}
                      onPress={() => setSelectedVoice(profile.id)}
                    >
                      <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                          {profile.name}
                        </Text>
                        {profile.description && (
                          <Text style={[styles.profileDescription, { color: colors.textSecondary }]}>
                            {profile.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.profileActions}>
                        <TouchableOpacity
                          style={[styles.playButton, { backgroundColor: colors.primary + '20' }]}
                          onPress={handlePlaySample}
                        >
                          {isPlaying ? (
                            <Pause size={16} color={colors.primary} />
                          ) : (
                            <Play size={16} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                        {selectedVoice === profile.id && (
                          <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                            <Check size={12} color="white" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      No voice profiles available
                    </Text>
                  </View>
                )}

                {/* Voice Settings */}
                <Text style={[styles.subsectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
                  Voice Settings
                </Text>
                
                <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sliderLabel, { color: colors.text }]}>
                      Speed
                    </Text>
                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                      {speed.toFixed(1)}x
                    </Text>
                  </View>
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
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Slower</Text>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Faster</Text>
                  </View>
                </View>

                <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sliderLabel, { color: colors.text }]}>
                      Pitch
                    </Text>
                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                      {pitch.toFixed(1)}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={1.5}
                    step={0.1}
                    value={pitch}
                    onValueChange={setPitch}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Lower</Text>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Higher</Text>
                  </View>
                </View>

                <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sliderLabel, { color: colors.text }]}>
                      Volume
                    </Text>
                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                      {Math.round(volume * 100)}%
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.05}
                    value={volume}
                    onValueChange={setVolume}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Quiet</Text>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Loud</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
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
                  <TouchableOpacity style={styles.languageSelector}>
                    <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                      English (US)
                    </Text>
                  </TouchableOpacity>
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

                <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Auto-stop after silence
                  </Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>

                <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Haptic Feedback
                  </Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>

                <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sliderLabel, { color: colors.text }]}>
                      Silence Threshold
                    </Text>
                    <Text style={[styles.sliderValue, { color: colors.primary }]}>
                      2.0s
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={5.0}
                    step={0.5}
                    value={2.0}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Short</Text>
                    <Text style={[styles.sliderMinMax, { color: colors.textTertiary }]}>Long</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Voice recognition works best in a quiet environment. Speak clearly and at a normal pace for best results.
                </Text>
              </View>
            </>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
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
  subsectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
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
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  profileDescription: {
    fontSize: typography.sizes.sm,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    fontStyle: 'italic',
  },
  sliderContainer: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  sliderValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    fontSize: typography.sizes.xs,
  },
  infoBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizes.sm,
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