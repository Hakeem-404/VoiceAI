import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, User, Briefcase, Zap, Play, ArrowRight, CircleCheck as CheckCircle, Upload, Brain } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { TextInputSystem } from './TextInputSystem';
import { spacing, typography } from '@/src/constants/colors';
import { documentAnalysisService } from '@/src/services/documentAnalysisService';
import { DocumentAnalysis } from '@/src/types';

interface InterviewSetupScreenProps {
  onQuickStart: () => void;
  onDocumentSelect: (type: 'job' | 'cv') => void;
  onContinue: () => void;
}

export function InterviewSetupScreen({
  onQuickStart,
  onDocumentSelect,
  onContinue,
}: InterviewSetupScreenProps) {
  const { colors, isDark } = useTheme();
  const { documentData, updateDocumentData } = useInputStore();
  
  const [selectedOption, setSelectedOption] = useState<'quick' | 'personalized'>('quick');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [activeDocument, setActiveDocument] = useState<'job' | 'cv' | null>(null);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);

  const hasJobDescription = !!documentData.jobDescription?.trim();
  const hasCV = !!documentData.cvContent?.trim();
  const canContinue = hasJobDescription || selectedOption === 'quick';

  useEffect(() => {
    // If we already have analysis results, use them
    if (documentData.analysisResult) {
      setAnalysis(documentData.analysisResult);
    }
  }, [documentData.analysisResult]);

  const handleDocumentSelect = (type: 'job' | 'cv') => {
    setActiveDocument(type);
    setIsTextInputVisible(true);
  };

  const handleTextInputClose = () => {
    setIsTextInputVisible(false);
    setActiveDocument(null);
  };

  const handleTextInputSave = (text: string) => {
    if (activeDocument === 'job') {
      updateDocumentData({ jobDescription: text });
    } else if (activeDocument === 'cv') {
      updateDocumentData({ cvContent: text });
    }
    setIsTextInputVisible(false);
    setActiveDocument(null);
    
    // If both documents are provided, trigger analysis
    if ((activeDocument === 'job' && hasCV) || 
        (activeDocument === 'cv' && hasJobDescription)) {
      handleAnalyzeDocuments();
    }
  };

  const handleAnalyzeDocuments = async () => {
    if (!hasJobDescription) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysisResult = await documentAnalysisService.analyzeDocuments(
        documentData.jobDescription,
        documentData.cvContent
      );
      
      setAnalysis(analysisResult);
      updateDocumentData({ analysisResult });
    } catch (error) {
      console.error('Document analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    onContinue();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Interview Practice Setup
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose how you want to prepare for your interview
      </Text>

      {/* Quick Start Option */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          { backgroundColor: colors.surface },
          selectedOption === 'quick' && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={() => setSelectedOption('quick')}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.primary }]}>
            <Zap size={24} color="white" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Quick Start
            </Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Jump right into a general interview practice session
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            selectedOption === 'quick' && { borderColor: colors.primary }
          ]}>
            {selectedOption === 'quick' && (
              <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </View>

        <View style={styles.optionFeatures}>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              General interview questions
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              Common behavioral scenarios
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              Immediate start
            </Text>
          </View>
        </View>

        {selectedOption === 'quick' && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={onQuickStart}
          >
            <Play size={16} color="white" />
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Personalized Option */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          { backgroundColor: colors.surface },
          selectedOption === 'personalized' && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={() => setSelectedOption('personalized')}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIcon, { backgroundColor: colors.secondary }]}>
            <User size={24} color="white" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Personalized Interview
            </Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Tailor the interview to a specific job and your experience
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            selectedOption === 'personalized' && { borderColor: colors.primary }
          ]}>
            {selectedOption === 'personalized' && (
              <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </View>

        <View style={styles.optionFeatures}>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              Job-specific questions
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              CV/resume analysis
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              Gap identification and preparation
            </Text>
          </View>
        </View>

        {selectedOption === 'personalized' && (
          <View style={styles.documentSection}>
            <TouchableOpacity
              style={[
                styles.documentButton,
                { 
                  backgroundColor: hasJobDescription ? colors.success + '20' : colors.surface,
                  borderColor: hasJobDescription ? colors.success : colors.border
                }
              ]}
              onPress={() => handleDocumentSelect('job')}
            >
              <Briefcase size={20} color={hasJobDescription ? colors.success : colors.primary} />
              <View style={styles.documentButtonContent}>
                <Text style={[styles.documentButtonTitle, { color: colors.text }]}>
                  {hasJobDescription ? 'Job Description Added' : 'Add Job Description'}
                </Text>
                <Text style={[styles.documentButtonSubtitle, { color: colors.textSecondary }]}>
                  {hasJobDescription ? 'Tap to edit' : 'Required for personalized questions'}
                </Text>
              </View>
              {hasJobDescription ? (
                <CheckCircle size={20} color={colors.success} />
              ) : (
                <Upload size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.documentButton,
                { 
                  backgroundColor: hasCV ? colors.success + '20' : colors.surface,
                  borderColor: hasCV ? colors.success : colors.border
                }
              ]}
              onPress={() => handleDocumentSelect('cv')}
            >
              <FileText size={20} color={hasCV ? colors.success : colors.secondary} />
              <View style={styles.documentButtonContent}>
                <Text style={[styles.documentButtonTitle, { color: colors.text }]}>
                  {hasCV ? 'CV/Resume Added' : 'Add Your CV/Resume'}
                </Text>
                <Text style={[styles.documentButtonSubtitle, { color: colors.textSecondary }]}>
                  {hasCV ? 'Tap to edit' : 'Optional but recommended'}
                </Text>
              </View>
              {hasCV ? (
                <CheckCircle size={20} color={colors.success} />
              ) : (
                <Upload size={20} color={colors.secondary} />
              )}
            </TouchableOpacity>

            {(hasJobDescription || hasCV) && !analysis && !isAnalyzing && (
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  { backgroundColor: hasJobDescription ? colors.primary : colors.border }
                ]}
                onPress={handleAnalyzeDocuments}
                disabled={!hasJobDescription || isAnalyzing}
              >
                <Brain size={20} color="white" />
                <Text style={styles.analyzeButtonText}>
                  Analyse Documents
                </Text>
              </TouchableOpacity>
            )}

            {isAnalyzing && (
              <View style={[styles.analyzingContainer, { backgroundColor: colors.primary + '20' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.analyzingText, { color: colors.primary }]}>
                  Analysing documents...
                </Text>
              </View>
            )}

            {analysis && (
              <View style={[styles.analysisPreview, { backgroundColor: colors.primary + '20' }]}>
                <View style={styles.analysisHeader}>
                  <Brain size={20} color={colors.primary} />
                  <Text style={[styles.analysisTitle, { color: colors.primary }]}>
                    Analysis Complete
                  </Text>
                </View>
                <View style={styles.analysisStats}>
                  <View style={styles.analysisStat}>
                    <Text style={[styles.analysisStatValue, { color: colors.text }]}>
                      {analysis.analysis.matchScore}%
                    </Text>
                    <Text style={[styles.analysisStatLabel, { color: colors.textSecondary }]}>
                      Match
                    </Text>
                  </View>
                  <View style={styles.analysisStat}>
                    <Text style={[styles.analysisStatValue, { color: colors.text }]}>
                      {analysis.analysis.strengths.length}
                    </Text>
                    <Text style={[styles.analysisStatLabel, { color: colors.textSecondary }]}>
                      Strengths
                    </Text>
                  </View>
                  <View style={styles.analysisStat}>
                    <Text style={[styles.analysisStatValue, { color: colors.text }]}>
                      {analysis.analysis.gaps.length}
                    </Text>
                    <Text style={[styles.analysisStatLabel, { color: colors.textSecondary }]}>
                      Gaps
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: canContinue ? colors.primary : colors.border }
        ]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <ArrowRight size={20} color="white" />
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={[styles.infoText, { color: colors.textTertiary }]}>
        {selectedOption === 'quick' 
          ? 'Quick start uses general interview questions suitable for most job types'
          : 'Personalized interviews analyze your documents to create targeted questions'}
      </Text>

      {/* Text Input Modal */}
      <TextInputSystem
        visible={isTextInputVisible}
        onClose={handleTextInputClose}
        onSend={handleTextInputSave}
        onVoiceToggle={handleTextInputClose}
        placeholder={activeDocument === 'job' 
          ? "Paste the job description here..." 
          : "Paste your CV/resume content here..."}
        mode="document"
        initialText={activeDocument === 'job' 
          ? documentData.jobDescription 
          : documentData.cvContent}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    marginBottom: spacing.xl,
  },
  optionCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionFeatures: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sizes.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  startButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  documentSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  documentButtonContent: {
    flex: 1,
  },
  documentButtonTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs / 2,
  },
  documentButtonSubtitle: {
    fontSize: typography.sizes.xs,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  analyzingText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  analysisPreview: {
    padding: spacing.md,
    borderRadius: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  analysisTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  analysisStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analysisStat: {
    alignItems: 'center',
  },
  analysisStatValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  analysisStatLabel: {
    fontSize: typography.sizes.xs,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  continueButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});