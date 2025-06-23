import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Slider,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, Settings, Play, Pause, X, FileSliders as Sliders, Mic, User, Zap } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { elevenLabsService, VoicePersonality } from '@/services/elevenLabsService';
import { audioPlayerService } from '@/services/audioPlayerService';
import { spacing, typography } from '@/src/constants/colors';

interface VoicePersonalitySelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedMode: string;
  onPersonalityChange: (personality: VoicePersonality) => void;
}

export function VoicePersonalitySelector({
  visible,
  onClose,
  selectedMode,
  onPersonalityChange
}: VoicePersonalitySelectorProps) {
  const { colors, isDark } = useTheme();
  const [personalities, setPersonalities] = useState<VoicePersonality[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<VoicePersonality | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<VoicePersonality | null>(null);

  useEffect(() => {
    loadPersonalities();
  }, []);

  useEffect(() => {
    // Set up audio player callback
    audioPlayerService.setStatusUpdateCallback((state) => {
      setIsPlaying(state.isPlaying);
    });

    return () => {
      audioPlayerService.setStatusUpdateCallback(() => {});
    };
  }, []);

  const loadPersonalities = () => {
    const allPersonalities = elevenLabsService.getAllVoicePersonalities();
    setPersonalities(allPersonalities);
    
    // Find personality for current mode
    const modePersonality = elevenLabsService.getVoicePersonalityForMode(selectedMode);
    if (modePersonality) {
      setSelectedPersonality(modePersonality);
      setTempSettings(modePersonality);
    }
  };

  const handlePersonalitySelect = (personality: VoicePersonality) => {
    setSelectedPersonality(personality);
    setTempSettings({ ...personality });
    onPersonalityChange(personality);
  };

  const handlePreviewVoice = async (personality: VoicePersonality) => {
    if (isPlaying) {
      await audioPlayerService.stop();
      return;
    }

    try {
      const previewText = getPreviewText(selectedMode);
      const { audioUrl } = await elevenLabsService.generateSpeech(
        previewText,
        selectedMode,
        { voice_settings: personality.settings }
      );

      await audioPlayerService.playImmediate(
        audioUrl,
        previewText,
        selectedMode
      );
    } catch (error) {
      console.error('Voice preview failed:', error);
    }
  };

  const getPreviewText = (mode: string): string => {
    const previewTexts = {
      'general-chat': "Hi there! I'm excited to have a conversation with you. What would you like to talk about today?",
      'debate-challenge': "I appreciate your perspective, but I'd like to challenge that point. Have you considered the counterargument?",
      'idea-brainstorm': "That's a fantastic idea! What if we took it a step further and combined it with emerging technology?",
      'interview-practice': "Thank you for that response. Can you give me a specific example of how you handled a challenging situation?",
      'presentation-prep': "Your main points are clear and well-structured. Consider adding more enthusiasm to engage your audience.",
      'language-learning': "Excellent pronunciation! Let's practice some more complex sentences to build your confidence."
    };

    return previewTexts[mode as keyof typeof previewTexts] || previewTexts['general-chat'];
  };

  const handleSettingsUpdate = (field: string, value: number) => {
    if (!tempSettings) return;

    if (field.startsWith('audio.')) {
      const audioField = field.split('.')[1];
      setTempSettings({
        ...tempSettings,
        audioSettings: {
          ...tempSettings.audioSettings,
          [audioField]: value
        }
      });
    } else {
      setTempSettings({
        ...tempSettings,
        settings: {
          ...tempSettings.settings,
          [field]: value
        }
      });
    }
  };

  const handleSaveSettings = () => {
    if (!tempSettings) return;

    elevenLabsService.updateVoicePersonality(tempSettings.id, tempSettings);
    setSelectedPersonality(tempSettings);
    onPersonalityChange(tempSettings);
    setShowAdvancedSettings(false);
  };

  const PersonalityCard = ({ personality }: { personality: VoicePersonality }) => {
    const isSelected = selectedPersonality?.id === personality.id;
    const isCompatible = personality.conversationModes.includes(selectedMode);

    return (
      <TouchableOpacity
        style={[
          styles.personalityCard,
          { backgroundColor: colors.surface },
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
          !isCompatible && { opacity: 0.6 }
        ]}
        onPress={() => isCompatible && handlePersonalitySelect(personality)}
        disabled={!isCompatible}
      >
        <View style={styles.personalityHeader}>
          <View style={[styles.personalityIcon, { backgroundColor: colors.primary }]}>
            <User size={20} color="white" />
          </View>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => handlePreviewVoice(personality)}
            disabled={!isCompatible}
          >
            {isPlaying ? (
              <Pause size={16} color={colors.primary} />
            ) : (
              <Play size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.personalityName, { color: colors.text }]}>
          {personality.name}
        </Text>
        <Text style={[styles.personalityDescription, { color: colors.textSecondary }]}>
          {personality.description}
        </Text>

        <View style={styles.personalityMeta}>
          <View style={styles.speedIndicator}>
            <Zap size={12} color={colors.textTertiary} />
            <Text style={[styles.speedText, { color: colors.textTertiary }]}>
              {personality.audioSettings.speed}x
            </Text>
          </View>
          {isCompatible && (
            <View style={[styles.compatibleBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.compatibleText}>Compatible</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const AdvancedSettingsModal = () => (
    <Modal
      visible={showAdvancedSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAdvancedSettings(false)}
    >
      <View style={[styles.settingsContainer, { backgroundColor: colors.background }]}>
        <View style={styles.settingsHeader}>
          <TouchableOpacity
            style={styles.settingsCloseButton}
            onPress={() => setShowAdvancedSettings(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>
            Voice Settings
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveSettings}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {tempSettings && (
          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Voice Characteristics
              </Text>
              
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Stability: {tempSettings.settings.stability.toFixed(2)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={tempSettings.settings.stability}
                  onValueChange={(value) => handleSettingsUpdate('stability', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Higher values make the voice more consistent
                </Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Similarity: {tempSettings.settings.similarity_boost.toFixed(2)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={tempSettings.settings.similarity_boost}
                  onValueChange={(value) => handleSettingsUpdate('similarity_boost', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  How closely the voice matches the original
                </Text>
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Style: {tempSettings.settings.style.toFixed(2)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={tempSettings.settings.style}
                  onValueChange={(value) => handleSettingsUpdate('style', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Expressiveness and emotion in the voice
                </Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Audio Settings
              </Text>
              
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Speed: {tempSettings.audioSettings.speed.toFixed(2)}x
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  value={tempSettings.audioSettings.speed}
                  onValueChange={(value) => handleSettingsUpdate('audio.speed', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Pitch: {tempSettings.audioSettings.pitch.toFixed(2)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  value={tempSettings.audioSettings.pitch}
                  onValueChange={(value) => handleSettingsUpdate('audio.pitch', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Volume: {tempSettings.audioSettings.volume.toFixed(2)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={tempSettings.audioSettings.volume}
                  onValueChange={(value) => handleSettingsUpdate('audio.volume', value)}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={{ backgroundColor: colors.primary }}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Voice Personalities
              </Text>
              
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowAdvancedSettings(true)}
                disabled={!selectedPersonality}
              >
                <Settings size={24} color={selectedPersonality ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Choose a voice personality for {selectedMode.replace('-', ' ')}
            </Text>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.personalitiesGrid}>
              {personalities.map((personality) => (
                <PersonalityCard key={personality.id} personality={personality} />
              ))}
            </View>

            {selectedPersonality && (
              <View style={[styles.selectedInfo, { backgroundColor: colors.surface }]}>
                <View style={styles.selectedHeader}>
                  <Volume2 size={20} color={colors.primary} />
                  <Text style={[styles.selectedTitle, { color: colors.text }]}>
                    Selected Voice
                  </Text>
                </View>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {selectedPersonality.name}
                </Text>
                <Text style={[styles.selectedDescription, { color: colors.textSecondary }]}>
                  {selectedPersonality.description}
                </Text>
                
                <TouchableOpacity
                  style={[styles.advancedButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAdvancedSettings(true)}
                >
                  <Sliders size={16} color="white" />
                  <Text style={styles.advancedButtonText}>Advanced Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <AdvancedSettingsModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  personalitiesGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  personalityCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  personalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  personalityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  personalityName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  personalityDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.md,
  },
  personalityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  speedText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  compatibleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  compatibleText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  selectedInfo: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  selectedTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  selectedName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  selectedDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.lg,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  advancedButtonText: {
    fontSize: typography.sizes.base,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  settingsCloseButton: {
    padding: spacing.sm,
  },
  settingsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: typography.sizes.sm,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  settingsContent: {
    flex: 1,
    padding: spacing.lg,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  settingItem: {
    marginBottom: spacing.lg,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: spacing.sm,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
});