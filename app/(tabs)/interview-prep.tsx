import React, { useState, useEffect } from 'react';
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
  Play,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useInputStore } from '@/src/stores/inputStore';
import { TextInputSystem } from '@/components/TextInputSystem';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { SmartQuestionGenerator } from '@/components/SmartQuestionGenerator';
import { conversationModes } from '@/src/constants/conversationModes';
import { spacing, typography } from '@/src/constants/colors';

export default function InterviewPrepScreen() {
  const { colors, isDark } = useTheme();
  const { startConversation } = useConversationStore();
  const { documentData, updateDocumentData } = useInputStore();
  
  const [currentView, setCurrentView] = useState<'setup' | 'analysis' | 'questions'>('setup');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [activeDocument, setActiveDocument] = useState<'job' | 'cv' | null>(null);

  const interviewMode = conversationModes.find(mode => mode.id === 'interview-practice');

  useEffect(() => {
    // Check if we have valid documents to enable analysis
    if (documentData.isValid && currentView === 'setup') {
      setCurrentView('analysis');
    }
  }, [documentData.isValid, currentView]);

  const handleTextInputClose = () => {
    setShowTextInput(false);
    setActiveDocument(null);
  };

  const handleTextInputSave = (text: string) => {
    if (activeDocument === 'job') {
      updateDocumentData({ jobDescription: text });
    } else if (activeDocument === 'cv') {
      updateDocumentData({ cvContent: text });
    }
    setShowTextInput(false);
    setActiveDocument(null);
  };

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResults(analysis);
    setCurrentView('questions');
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
  };

  const handleQuickStart = () => {
    if (!interviewMode) return;
    
    startConversation(interviewMode, {
      modeId: 'interview-practice',
      difficulty: 'intermediate',
      sessionType: 'standard',
      selectedTopics: ['General Interview'],
      aiPersonality: 'Professional',
    });
  };

  const SetupView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.viewHeader}>
        <MessageSquare size={32} color={colors.primary} />
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Interview Setup
        </Text>
        <Text style={[styles.viewDescription, { color: colors.textSecondary }]}>
          Choose how you want to practice for your interview
        </Text>
      </View>

      {/* Quick Start Option */}
      <TouchableOpacity
        style={[styles.quickStartCard, { backgroundColor: colors.primary }]}
        onPress={handleQuickStart}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.quickStartGradient}
        >
          <View style={styles.quickStartContent}>
            <Play size={32} color="white" />
            <View style={styles.quickStartTextContainer}>
              <Text style={styles.quickStartTitle}>Quick Interview</Text>
              <Text style={styles.quickStartDescription}>
                Start a general interview practice session immediately
              </Text>
            </View>
          </View>
          <ArrowRight size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Personalized Option */}
      <View style={[styles.personalizedSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.personalizedTitle, { color: colors.text }]}>
          Personalized Interview
        </Text>
        <Text style={[styles.personalizedDescription, { color: colors.textSecondary }]}>
          Get tailored questions based on your documents (optional)
        </Text>

        <View style={styles.documentCards}>
          {/* Job Description Card */}
          <TouchableOpacity
            style={[
              styles.documentCard, 
              { backgroundColor: colors.background },
              documentData.jobDescription ? { borderColor: colors.success, borderWidth: 1 } : null
            ]}
            onPress={() => {
              setActiveDocument('job');
              setShowTextInput(true);
            }}
          >
            <Briefcase size={24} color={colors.primary} />
            <Text style={[styles.documentCardTitle, { color: colors.text }]}>
              Job Description
            </Text>
            <Text style={[styles.documentCardDescription, { color: colors.textSecondary }]}>
              {documentData.jobDescription 
                ? `${documentData.jobDescription.length} characters added` 
                : "Optional - Add for better results"}
            </Text>
            {documentData.jobDescription && (
              <View style={styles.documentStatus}>
                <CheckCircle size={16} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>

          {/* CV Card */}
          <TouchableOpacity
            style={[
              styles.documentCard, 
              { backgroundColor: colors.background },
              documentData.cvContent ? { borderColor: colors.success, borderWidth: 1 } : null
            ]}
            onPress={() => {
              setActiveDocument('cv');
              setShowTextInput(true);
            }}
          >
            <User size={24} color={colors.secondary} />
            <Text style={[styles.documentCardTitle, { color: colors.text }]}>
              Your CV/Resume
            </Text>
            <Text style={[styles.documentCardDescription, { color: colors.textSecondary }]}>
              {documentData.cvContent 
                ? `${documentData.cvContent.length} characters added` 
                : "Optional - Add for better results"}
            </Text>
            {documentData.cvContent && (
              <View style={styles.documentStatus}>
                <CheckCircle size={16} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            {
              backgroundColor: (documentData.jobDescription || documentData.cvContent) 
                ? colors.primary 
                : colors.border
            }
          ]}
          onPress={() => {
            if (documentData.jobDescription || documentData.cvContent) {
              setCurrentView('analysis');
            } else {
              Alert.alert(
                'No Documents Added',
                'Would you like to add documents for personalized questions or start with general questions?',
                [
                  {
                    text: 'Add Documents',
                    onPress: () => {
                      setActiveDocument('job');
                      setShowTextInput(true);
                    }
                  },
                  {
                    text: 'General Questions',
                    onPress: handleQuickStart
                  }
                ]
              );
            }
          }}
        >
          <Zap size={20} color="white" />
          <Text style={styles.analyzeButtonText}>
            {documentData.isValid 
              ? 'Analyze & Start Practice' 
              : (documentData.jobDescription || documentData.cvContent)
                ? 'Continue with Documents'
                : 'Skip Documents'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const AnalysisView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.viewHeader}>
        <Brain size={32} color={colors.primary} />
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Document Analysis
        </Text>
        <Text style={[styles.viewDescription, { color: colors.textSecondary }]}>
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

  const QuestionsView = () => (
    <View style={styles.viewContainer}>
      <View style={styles.viewHeader}>
        <Target size={32} color={colors.primary} />
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Practice Questions
        </Text>
        <Text style={[styles.viewDescription, { color: colors.textSecondary }]}>
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

        {/* View Navigation */}
        {(currentView === 'analysis' || currentView === 'questions') && (
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentView === 'setup' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setCurrentView('setup')}
            >
              <Text style={[
                styles.navButtonText,
                { color: currentView === 'setup' ? 'white' : colors.textSecondary }
              ]}>
                Setup
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.navButton,
                currentView === 'analysis' && { backgroundColor: colors.primary }
              ]}
              onPress={() => {
                if (documentData.jobDescription || documentData.cvContent) {
                  setCurrentView('analysis');
                }
              }}
              disabled={!documentData.jobDescription && !documentData.cvContent}
            >
              <Text style={[
                styles.navButtonText,
                { 
                  color: currentView === 'analysis' 
                    ? 'white' 
                    : (!documentData.jobDescription && !documentData.cvContent)
                      ? colors.textTertiary
                      : colors.textSecondary 
                }
              ]}>
                Analysis
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.navButton,
                currentView === 'questions' && { backgroundColor: colors.primary }
              ]}
              onPress={() => {
                if (analysisResults) {
                  setCurrentView('questions');
                }
              }}
              disabled={!analysisResults}
            >
              <Text style={[
                styles.navButtonText,
                { 
                  color: currentView === 'questions' 
                    ? 'white' 
                    : !analysisResults
                      ? colors.textTertiary
                      : colors.textSecondary 
                }
              ]}>
                Questions
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentView === 'setup' && <SetupView />}
          {currentView === 'analysis' && <AnalysisView />}
          {currentView === 'questions' && <QuestionsView />}
        </ScrollView>

        <TextInputSystem
          visible={showTextInput}
          onClose={handleTextInputClose}
          onSend={handleTextInputSave}
          onVoiceToggle={() => {
            setShowTextInput(false);
          }}
          mode="interview-prep"
          placeholder={activeDocument === 'job' 
            ? "Paste the job description here..." 
            : "Paste your CV/resume content here..."}
          initialText={activeDocument === 'job' 
            ? documentData.jobDescription 
            : documentData.cvContent}
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
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  navButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  navButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  viewContainer: {
    flex: 1,
  },
  viewHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  viewTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  viewDescription: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    maxWidth: '80%',
  },
  quickStartCard: {
    borderRadius: 16,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickStartTextContainer: {
    flex: 1,
  },
  quickStartTitle: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  quickStartDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
  },
  personalizedSection: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  personalizedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  personalizedDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  documentCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  documentCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  documentCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  documentCardDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  documentStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});