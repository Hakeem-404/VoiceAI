import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { X, Volume2, Play, Pause, Check, Mic, Settings } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import * as supabaseService from '@/src/services/supabaseService';
import { spacing, typography } from '@/src/constants/colors';

interface VoiceSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  voiceProfiles: any[];
}

export function VoiceSettingsModal({ visible, onClose, voiceProfiles }: VoiceSettingsModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useSupabaseAuth();
  
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Initialize settings from user preferences
  useEffect(() => {
    if (user?.user_metadata?.preferences?.voiceSettings) {
      const voiceSettings = user.user_metadata.preferences.voiceSettings;
      setSelectedVoice(voiceSettings.selectedVoice || '');
      setSpeed(voiceSettings.speed || 1.0);
      setPitch(voiceSettings.pitch || 1.0);
      setVolume(voiceSettings.volume || 0.8);
    }
  }, [user]);
  
  // Set default selected voice if none is selected
  useEffect(() => {
    if (voiceProfiles.length > 0 && !selectedVoice) {
      setSelectedVoice(voiceProfiles[0].elevenlabs_voice_id || '');
    }
  }, [voiceProfiles, selectedVoice]);
  
  const handlePlayPreview = () => {
    // In a real implementation, this would play a preview of the selected voice
    setIsPlaying(true);
    
    // Simulate playback ending after 3 seconds
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };
  
  const handleSaveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Save voice settings to user preferences
      await supabaseService.updateUserPreferences(user.id, {
        voiceSettings: {
          selectedVoice,
          speed,
          pitch,
          volume
        }
      });
      
      setSuccess(true);
      
      // Reset success state after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getVoiceName = (voiceId: string) => {
    const profile = voiceProfiles.find(p => p.elevenlabs_voice_id === voiceId);
    return profile ? profile.name : 'Default Voice';
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
              Voice Settings
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveSettings}
              disabled={loading}
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
            {/* Voice Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Voice Selection
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Choose a voice personality for your AI conversations
              </Text>
              
              <View style={styles.voiceProfiles}>
                {voiceProfiles.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.voiceProfileCard,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: selectedVoice === profile.elevenlabs_voice_id 
                          ? colors.primary 
                          : colors.border,
                        borderWidth: selectedVoice === profile.elevenlabs_voice_id ? 2 : 1,
                      }
                    ]}
                    onPress={() => setSelectedVoice(profile.elevenlabs_voice_id)}
                  >
                    <View style={styles.voiceProfileHeader}>
                      <View style={[styles.voiceIcon, { backgroundColor: colors.primary }]}>
                        <Mic size={20} color="white" />
                      </View>
                      <Text style={[styles.voiceProfileName, { color: colors.text }]}>
                        {profile.name}
                      </Text>
                    </View>
                    <Text style={[styles.voiceProfileDescription, { color: colors.textSecondary }]}>
                      {profile.description}
                    </Text>
                    <View style={styles.voiceProfileFooter}>
                      <TouchableOpacity
                        style={[
                          styles.previewButton,
                          { backgroundColor: colors.primary + '20' }
                        ]}
                        onPress={handlePlayPreview}
                      >
                        {isPlaying ? (
                          <Pause size={16} color={colors.primary} />
                        ) : (
                          <Play size={16} color={colors.primary} />
                        )}
                        <Text style={[styles.previewButtonText, { color: colors.primary }]}>
                          {isPlaying ? 'Playing...' : 'Preview'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Voice Speed */}
            <View style={styles.section}>
              <View style={styles.settingHeader}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Voice Speed
                </Text>
                <Text style={[styles.settingValue, { color: colors.primary }]}>
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
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Slower</Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Faster</Text>
              </View>
            </View>

            {/* Voice Pitch */}
            <View style={styles.section}>
              <View style={styles.settingHeader}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Voice Pitch
                </Text>
                <Text style={[styles.settingValue, { color: colors.primary }]}>
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
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Lower</Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Higher</Text>
              </View>
            </View>

            {/* Voice Volume */}
            <View style={styles.section}>
              <View style={styles.settingHeader}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Voice Volume
                </Text>
                <Text style={[styles.settingValue, { color: colors.primary }]}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1.0}
                step={0.1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Quieter</Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Louder</Text>
              </View>
            </View>

            {/* Advanced Settings */}
            <TouchableOpacity
              style={[styles.advancedButton, { borderColor: colors.border }]}
              onPress={() => {
                // In a real implementation, this would open advanced voice settings
                console.log('Advanced voice settings pressed');
              }}
            >
              <Settings size={20} color={colors.primary} />
              <Text style={[styles.advancedButtonText, { color: colors.text }]}>
                Advanced Voice Settings
              </Text>
            </TouchableOpacity>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  voiceProfiles: {
    gap: spacing.md,
  },
  voiceProfileCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  voiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  voiceProfileName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  voiceProfileDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  voiceProfileFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    gap: spacing.xs,
  },
  previewButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  settingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  settingValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: typography.sizes.xs,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  advancedButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});