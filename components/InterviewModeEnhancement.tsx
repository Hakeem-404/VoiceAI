import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, User, Brain, Target, Zap, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Settings, Play, X } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { DocumentAnalyzer } from '@/components/DocumentAnalyzer';
import { ModeConfiguration, ConversationMode, DocumentAnalysis } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface InterviewModeEnhancementProps {
  visible: boolean;
  mode: ConversationMode;
  onClose: () => void;
  onStart: (configuration: ModeConfiguration & { analysis?: DocumentAnalysis }) => void;
}

export function InterviewModeEnhancement({
  visible,
  mode,
  onClose,
  onStart,
}: InterviewModeEnhancementProps) {
  const { colors, isDark } = useTheme();
  const [showDocumentAnalyzer, setShowDocumentAnalyzer] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [configuration, setConfiguration] = useState<ModeConfiguration>({
    modeId: mode.id,
    difficulty: mode.difficulty,
    sessionType: 'standard',
    selectedTopics: mode.topics.slice(0, 2),
    aiPersonality: mode.aiPersonalities[0],
  });

  useEffect(() => {
    if (visible) {
      setAnalysis(null);
      setConfiguration({
        modeId: mode.id,
        difficulty: mode.difficulty,
        sessionType: 'standard',
        selectedTopics: mode.topics.slice(0, 2),
        aiPersonality: mode.aiPersonalities[0],
      });
    }
  }, [visible, mode]);

  const handleAnalysisComplete = (documentAnalysis: DocumentAnalysis) => {
    setAnalysis(documentAnalysis);
    setShowDocumentAnalyzer(false);
    
    // Update configuration based on analysis
    setConfiguration(prev => ({
      ...prev,
      difficulty: documentAnalysis.analysis.difficulty === 'junior' ? 'beginner' :
                 documentAnalysis.analysis.difficulty === 'executive' ? 'advanced' : 'intermediate',
      customSettings: {
        ...prev.customSettings,
        hasDocumentAnalysis: true,
        matchScore: documentAnalysis.analysis.matchScore,
        focusAreas: documentAnalysis.analysis.focusAreas,
      },
    }));
  };

  const handleStart = () => {
    const finalConfiguration = {
      ...configuration,
      analysis,
    };
    
    onStart(finalConfiguration);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'junior': return colors.success;
      case 'mid': return colors.warning;
      case 'senior': return colors.error;
      case 'executive': return colors.error;
      default: return colors.primary;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  if (!visible) return null;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={mode.color.gradient}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Interview Practice Setup</Text>
            <Text style={styles.headerSubtitle}>
              Configure your personalized interview experience
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Analysis Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Brain size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Smart Interview Preparation
              </Text>
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Upload your job description and CV for personalized questions and targeted preparation
            </Text>

            {analysis ? (
              <View style={styles.analysisPreview}>
                <View style={styles.analysisHeader}>
                  <CheckCircle size={18} color={colors.success} />
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>
                    Analysis Complete
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setShowDocumentAnalyzer(true)}
                  >
                    <Settings size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.analysisStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: getMatchScoreColor(analysis.analysis.matchScore) }]}>
                      {analysis.analysis.matchScore}%
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Match Score
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: getDifficultyColor(analysis.analysis.difficulty) }]}>
                      {analysis.analysis.difficulty.charAt(0).toUpperCase() + analysis.analysis.difficulty.slice(1)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Level
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {analysis.analysis.focusAreas.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Focus Areas
                    </Text>
                  </View>
                </View>

                <View style={styles.analysisHighlights}>
                  <View style={styles.highlight}>
                    <CheckCircle size={14} color={colors.success} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      {analysis.analysis.strengths.length} strengths identified
                    </Text>
                  </View>
                  
                  <View style={styles.highlight}>
                    <AlertTriangle size={14} color={colors.warning} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      {analysis.analysis.gaps.length} areas to address
                    </Text>
                  </View>
                  
                  <View style={styles.highlight}>
                    <Target size={14} color={colors.primary} />
                    <Text style={[styles.highlightText, { color: colors.text }]}>
                      Personalized questions generated
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowDocumentAnalyzer(true)}
              >
                <FileText size={20} color="white" />
                <Text style={styles.uploadButtonText}>
                  Add Job Description & CV
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Configuration Options */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Interview Configuration
              </Text>
            </View>

            {/* Session Type */}
            <View style={styles.configGroup}>
              <Text style={[styles.configLabel, { color: colors.text }]}>
                Session Type
              </Text>
              <View style={styles.optionGrid}>
                {Object.entries(mode.sessionTypes).map(([type, config]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionCard,
                      configuration.sessionType === type && { backgroundColor: colors.primary },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setConfiguration(prev => ({ ...prev, sessionType: type as any }))}
                  >
                    <Text style={[
                      styles.optionTitle,
                      { color: configuration.sessionType === type ? 'white' : colors.text }
                    ]}>
                      {config.duration} min
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { color: configuration.sessionType === type ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                    ]}>
                      {config.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Personality */}
            <View style={styles.configGroup}>
              <Text style={[styles.configLabel, { color: colors.text }]}>
                Interviewer Style
              </Text>
              <View style={styles.personalityList}>
                {mode.aiPersonalities.map((personality) => (
                  <TouchableOpacity
                    key={personality}
                    style={[
                      styles.personalityOption,
                      configuration.aiPersonality === personality && { backgroundColor: colors.primary + '20' },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => setConfiguration(prev => ({ ...prev, aiPersonality: personality }))}
                  >
                    <View style={styles.personalityContent}>
                      <Text style={[
                        styles.personalityName,
                        { color: configuration.aiPersonality === personality ? colors.primary : colors.text }
                      ]}>
                        {personality}
                      </Text>
                      <View style={[
                        styles.radioButton,
                        configuration.aiPersonality === personality && { backgroundColor: colors.primary }
                      ]}>
                        {configuration.aiPersonality === personality && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Preview Section */}
          {analysis && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Interview Preview
                </Text>
              </View>
              
              <Text style={[styles.previewDescription, { color: colors.textSecondary }]}>
                Based on your analysis, the interview will focus on:
              </Text>
              
              <View style={styles.previewList}>
                {analysis.analysis.focusAreas.slice(0, 3).map((area, index) => (
                  <View key={index} style={styles.previewItem}>
                    <View style={[styles.previewBullet, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.previewText, { color: colors.text }]}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Start Button */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStart}
          >
            <Play size={20} color="white" />
            <Text style={styles.startButtonText}>
              {analysis ? 'Start Personalized Interview' : 'Start Standard Interview'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDocumentAnalyzer && (
        <View style={[styles.analyzerOverlay, { backgroundColor: colors.background }]}>
          <View style={styles.analyzerHeader}>
            <TouchableOpacity
              style={styles.analyzerCloseButton}
              onPress={() => setShowDocumentAnalyzer(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.analyzerTitle, { color: colors.text }]}>
              Document Analysis
            </Text>
            
            <View style={styles.analyzerPlaceholder} />
          </View>
          
          <DocumentAnalyzer
            jobDescription=""
            cvContent=""
            onAnalysisComplete={handleAnalysisComplete}
          />
        </View>
      )}
    </>
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
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
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
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  uploadButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  analysisPreview: {
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  analysisTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  editButton: {
    padding: spacing.xs,
  },
  analysisStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  analysisHighlights: {
    gap: spacing.sm,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  highlightText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  configGroup: {
    marginBottom: spacing.lg,
  },
  configLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalityName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
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
  previewDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  previewList: {
    gap: spacing.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewText: {
    fontSize: typography.sizes.sm,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  startButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  analyzerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  analyzerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  analyzerCloseButton: {
    padding: spacing.sm,
  },
  analyzerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  analyzerPlaceholder: {
    width: 40,
  },
});