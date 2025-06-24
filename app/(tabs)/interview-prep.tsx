import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  User,
  Briefcase,
  Brain,
  MessageSquare,
  Target,
  Zap,
  Settings,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { TextInputSystem } from '@/components/TextInputSystem';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { SmartQuestionGenerator } from '@/components/SmartQuestionGenerator';
import { conversationModes } from '@/src/constants/conversationModes';
import { spacing, typography } from '@/src/constants/colors';

export default function InterviewPrepScreen() {
  const { colors, isDark } = useTheme();
  const { startConversation } = useConversationStore();
  
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'practice'>('upload');
  const [documentData, setDocumentData] = useState({
    jobDescription: '',
    cvContent: '',
  });
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);

  const interviewMode = conversationModes.find(mode => mode.id === 'interview-practice');

  const handleDocumentUpload = (jobDesc: string, cv: string) => {
    setDocumentData({
      jobDescription: jobDesc,
      cvContent: cv,
    });
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResults(analysis);
    setCurrentStep('practice');
  };

  const handleQuestionsGenerated = (questions: any[]) => {
    setGeneratedQuestions(questions);
  };

  const handleQuestionSelect = (question: any) => {
    if (!interviewMode) return;
    
    // Start conversation with the selected question
    startConversation(interviewMode, {
      modeId: 'interview-practice',
      difficulty: 'intermediate',
      sessionType: 'standard',
      selectedTopics: ['Interview Questions'],
      aiPersonality: 'Professional',
      customSettings: {
        initialQuestion: question.question,
        analysisContext: analysisResults,
        questionContext: question,
      },
    });
  };

  const handleStartPractice = (selectedQuestions: any[]) => {
    if (!interviewMode) return;
    
    Alert.alert(
      'Start Practice Session',
      `Ready to practice with ${selectedQuestions.length} questions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            startConversation(interviewMode, {
              modeId: 'interview-practice',
              difficulty: 'intermediate',
              sessionType: 'extended',
              selectedTopics: ['Interview Questions'],
              aiPersonality: 'Professional',
              customSettings: {
                practiceQuestions: selectedQuestions,
                analysisContext: analysisResults,
                sessionType: 'multi-question',
              },
            });
          },
        },
      ]
    );
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['upload', 'analyze', 'practice'].map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted = ['upload', 'analyze', 'practice'].indexOf(currentStep) > index;
        
        return (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: isActive || isCompleted ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: isActive || isCompleted ? 'white' : colors.textSecondary },
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </Text>
            {index < 2 && (
              <View
                style={[
                  styles.stepConnector,
                  { backgroundColor: isCompleted ? colors.primary : colors.border },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  const UploadStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FileText size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Upload Documents
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Provide your job description and CV for personalized interview preparation
        </Text>
      </View>

      <View style={styles.uploadCards}>
        <TouchableOpacity
          style={[styles.uploadCard, { backgroundColor: colors.surface }]}
          onPress={() => setShowTextInput(true)}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.uploadIcon}
          >
            <Briefcase size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            Job Description
          </Text>
          <Text style={[styles.uploadDescription, { color: colors.textSecondary }]}>
            Paste the job posting or description
          </Text>
          {documentData.jobDescription && (
            <View style={styles.uploadStatus}>
              <Text style={[styles.uploadStatusText, { color: colors.success }]}>
                ✓ Added ({documentData.jobDescription.length} chars)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadCard, { backgroundColor: colors.surface }]}
          onPress={() => setShowTextInput(true)}
        >
          <LinearGradient
            colors={[colors.accent, colors.secondary]}
            style={styles.uploadIcon}
          >
            <User size={24} color="white" />
          </LinearGradient>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>
            CV / Resume
          </Text>
          <Text style={[styles.uploadDescription, { color: colors.textSecondary }]}>
            Paste your resume or CV content
          </Text>
          {documentData.cvContent && (
            <View style={styles.uploadStatus}>
              <Text style={[styles.uploadStatusText, { color: colors.success }]}>
                ✓ Added ({documentData.cvContent.length} chars)
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {documentData.jobDescription && documentData.cvContent && (
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentStep('analyze')}
        >
          <Brain size={20} color="white" />
          <Text style={styles.continueButtonText}>Analyze Documents</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const AnalyzeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Brain size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Document Analysis
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          AI analysis of your profile against job requirements
        </Text>
      </View>

      <DocumentProcessor
        jobDescription={documentData.jobDescription}
        cvContent={documentData.cvContent}
        onAnalysisComplete={handleAnalysisComplete}
        onQuestionGenerated={handleQuestionsGenerated}
      />
    </View>
  );

  const PracticeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Target size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Practice Questions
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Personalized questions based on your analysis
        </Text>
      </View>

      <SmartQuestionGenerator
        analysisData={analysisResults}
        onQuestionSelect={handleQuestionSelect}
        onStartPractice={handleStartPractice}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Interview Preparation
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            AI-powered interview practice with personalized questions
          </Text>
        </View>

        <StepIndicator />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 'upload' && <UploadStep />}
          {currentStep === 'analyze' && <AnalyzeStep />}
          {currentStep === 'practice' && <PracticeStep />}
        </ScrollView>

        <TextInputSystem
          visible={showTextInput}
          onClose={() => setShowTextInput(false)}
          onSend={(text) => {
            // Handle document upload
            setShowTextInput(false);
          }}
          onVoiceToggle={() => {
            setShowTextInput(false);
          }}
          mode="interview-prep"
          placeholder="Paste your document content here..."
        />
      </LinearGradient>
    </SafeAreaView>
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
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    fontSize: typography.sizes.sm,
    font: typography.weights.bold,
  },
  stepLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    right: -40,
    width: 80,
    height: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    maxWidth: '80%',
  },
  uploadCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  uploadCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  uploadDescription: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  uploadStatus: {
    marginTop: spacing.sm,
  },
  uploadStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  continueButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});