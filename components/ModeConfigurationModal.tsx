import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Settings,
  Clock,
  Target,
  Users,
  Zap,
  Brain,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ConversationMode, ModeConfiguration } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

interface ModeConfigurationModalProps {
  visible: boolean;
  mode: ConversationMode | null;
  onClose: () => void;
  onStart: (configuration: ModeConfiguration) => void;
}

export function ModeConfigurationModal({
  visible,
  mode,
  onClose,
  onStart,
}: ModeConfigurationModalProps) {
  const { colors, isDark } = useTheme();
  
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [sessionType, setSessionType] = useState<'quick' | 'standard' | 'extended'>('standard');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [aiPersonality, setAiPersonality] = useState<string>('');
  const [customSettings, setCustomSettings] = useState<Record<string, any>>({});

  React.useEffect(() => {
    if (mode) {
      setDifficulty(mode.difficulty);
      setAiPersonality(mode.aiPersonalities[0]);
      setSelectedTopics(mode.topics.slice(0, 2));
      setCustomSettings({});
    }
  }, [mode]);

  if (!mode) return null;

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleStart = () => {
    const configuration: ModeConfiguration = {
      modeId: mode.id,
      difficulty,
      sessionType,
      selectedTopics,
      aiPersonality,
      customSettings,
    };
    onStart(configuration);
  };

  const getDifficultyDescription = (level: string) => {
    switch (level) {
      case 'beginner': return 'Gentle pace, basic concepts, supportive guidance';
      case 'intermediate': return 'Moderate challenge, deeper topics, constructive feedback';
      case 'advanced': return 'Fast pace, complex scenarios, detailed analysis';
      default: return '';
    }
  };

  const getPersonalityDescription = (personality: string) => {
    switch (personality.toLowerCase()) {
      case 'supportive': return 'Encouraging and patient, focuses on building confidence';
      case 'challenging': return 'Pushes you to think deeper and defend your ideas';
      case 'analytical': return 'Logical and detail-oriented, asks probing questions';
      case 'creative': return 'Imaginative and open-minded, encourages wild ideas';
      case 'professional': return 'Formal and business-focused, maintains professional tone';
      default: return 'Balanced approach with helpful guidance';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={mode.color.gradient}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close configuration"
          >
            <X size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Settings size={32} color="white" />
            <Text style={styles.headerTitle}>Configure {mode.name}</Text>
            <Text style={styles.headerSubtitle}>
              Customize your conversation experience
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Session Duration */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Session Duration
              </Text>
            </View>
            
            <View style={styles.optionGrid}>
              {Object.entries(mode.sessionTypes).map(([type, config]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionCard,
                    sessionType === type && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setSessionType(type as any)}
                >
                  <Text style={[
                    styles.optionTitle,
                    { color: sessionType === type ? 'white' : colors.text }
                  ]}>
                    {config.duration} min
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    { color: sessionType === type ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                  ]}>
                    {config.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty Level */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Target size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Difficulty Level
              </Text>
            </View>
            
            <View style={styles.optionGrid}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionCard,
                    difficulty === level && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[
                    styles.optionTitle,
                    { color: difficulty === level ? 'white' : colors.text }
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    { color: difficulty === level ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                  ]}>
                    {getDifficultyDescription(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Personality */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Brain size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                AI Personality
              </Text>
            </View>
            
            <View style={styles.personalityList}>
              {mode.aiPersonalities.map((personality) => (
                <TouchableOpacity
                  key={personality}
                  style={[
                    styles.personalityOption,
                    aiPersonality === personality && { backgroundColor: colors.primary + '20' },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setAiPersonality(personality)}
                >
                  <View style={styles.personalityContent}>
                    <View style={styles.personalityHeader}>
                      <Text style={[
                        styles.personalityName,
                        { color: aiPersonality === personality ? colors.primary : colors.text }
                      ]}>
                        {personality}
                      </Text>
                      <View style={[
                        styles.radioButton,
                        aiPersonality === personality && { backgroundColor: colors.primary }
                      ]}>
                        {aiPersonality === personality && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </View>
                    <Text style={[styles.personalityDescription, { color: colors.textSecondary }]}>
                      {getPersonalityDescription(personality)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Topics */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Focus Topics
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Select topics you'd like to practice
              </Text>
            </View>
            
            <View style={styles.topicGrid}>
              {mode.topics.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.topicChip,
                    selectedTopics.includes(topic) && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => handleTopicToggle(topic)}
                >
                  <Text style={[
                    styles.topicText,
                    { color: selectedTopics.includes(topic) ? 'white' : colors.text }
                  ]}>
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode-specific settings */}
          {mode.id === 'debate-challenge' && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Users size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Debate Settings
                </Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Choose your stance
                </Text>
                <Switch
                  value={customSettings.chooseStance || false}
                  onValueChange={(value) => 
                    setCustomSettings(prev => ({ ...prev, chooseStance: value }))
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Timed rounds
                </Text>
                <Switch
                  value={customSettings.timedRounds || false}
                  onValueChange={(value) => 
                    setCustomSettings(prev => ({ ...prev, timedRounds: value }))
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Start Button */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStart}
            accessibilityLabel="Start conversation with current configuration"
          >
            <Zap size={20} color="white" />
            <Text style={styles.startButtonText}>
              Start {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: 'white',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    marginLeft: 'auto',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.3,
  },
  personalityList: {
    gap: spacing.sm,
  },
  personalityOption: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  personalityContent: {
    flex: 1,
  },
  personalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  personalityName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  personalityDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  startButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
});