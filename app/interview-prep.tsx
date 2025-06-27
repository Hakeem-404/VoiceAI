import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Briefcase, User, Brain, ArrowLeft, MessageSquare, Play, Settings, FileText, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { useConversationStore } from '@/src/stores/conversationStore';
import { DocumentAnalysis } from '@/src/types';
import { DocumentAnalyzer } from '@/components/DocumentAnalyzer';
import { conversationModes } from '@/src/constants/conversationModes';
import { spacing, typography } from '@/src/constants/colors';

export default function InterviewPrepScreen() {
  const { colors, isDark } = useTheme();
  const { documentData, updateDocumentData } = useInputStore();
  const { startConversation } = useConversationStore();
  
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis' | 'questions'>('documents');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (documentData.analysisResult) {
      setAnalysis(documentData.analysisResult);
      setActiveTab('analysis');
    }
  }, [documentData.analysisResult]);

  const handleAnalysisComplete = (result: DocumentAnalysis) => {
    setAnalysis(result);
    updateDocumentData({ analysisResult: result });
    setActiveTab('analysis');
  };

  const handleStartPersonalizedInterview = () => {
  console.log('🎯 User clicked Start Personalized Interview - navigating back to home');
  
  // Navigate back to home with the callback parameter
  router.push({
    pathname: '/',
    params: { startPersonalizedInterview: 'true' }
  });
};

  const handleStartInterview = () => {
    const interviewMode = conversationModes.find(mode => mode.id === 'interview-practice');
    if (!interviewMode) {
      Alert.alert('Error', 'Interview practice mode not found');
      return;
    }

    startConversation(interviewMode, {
      modeId: 'interview-practice',
      difficulty: (analysis?.analysis.difficulty === 'junior' ? 'beginner' : 
                  analysis?.analysis.difficulty === 'executive' ? 'advanced' : 'intermediate') || 'intermediate',
      sessionType: 'standard',
      selectedTopics: analysis?.analysis.focusAreas.slice(0, 3) || interviewMode.topics.slice(0, 3),
      aiPersonality: 'Professional',
      customSettings: {
        documentAnalysis: analysis,
        jobDescription: documentData.jobDescription,
        cvContent: documentData.cvContent,
      },
    });

    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Interview Preparation
          </Text>
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {}}
          >
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'documents' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setActiveTab('documents')}
          >
            <FileText size={16} color={activeTab === 'documents' ? 'white' : colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'documents' ? 'white' : colors.textSecondary }
            ]}>
              Documents
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'analysis' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
              !analysis && styles.disabledTab
            ]}
            onPress={() => analysis && setActiveTab('analysis')}
            disabled={!analysis}
          >
            <Brain size={16} color={activeTab === 'analysis' ? 'white' : 
                                   !analysis ? colors.textTertiary : colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { 
                color: activeTab === 'analysis' ? 'white' : 
                      !analysis ? colors.textTertiary : colors.textSecondary 
              }
            ]}>
              Analysis
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'questions' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
              !analysis && styles.disabledTab
            ]}
            onPress={() => analysis && setActiveTab('questions')}
            disabled={!analysis}
          >
            <MessageSquare size={16} color={activeTab === 'questions' ? 'white' : 
                                          !analysis ? colors.textTertiary : colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { 
                color: activeTab === 'questions' ? 'white' : 
                      !analysis ? colors.textTertiary : colors.textSecondary 
              }
            ]}>
              Questions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'documents' && (
            <DocumentAnalyzer
              jobDescription={documentData.jobDescription}
              cvContent={documentData.cvContent}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {activeTab === 'analysis' && analysis && (
            <View style={styles.analysisContainer}>
              {/* Match Score */}
              <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.scoreGradient}
                >
                  <Text style={styles.scoreTitle}>Match Score</Text>
                  <Text style={styles.scoreValue}>{analysis.analysis.matchScore}%</Text>
                  <Text style={styles.scoreDescription}>
                    {analysis.analysis.matchScore >= 80 ? 'Excellent match!' : 
                     analysis.analysis.matchScore >= 60 ? 'Good match' : 'Potential match'}
                  </Text>
                </LinearGradient>
              </View>

              {/* Job Requirements */}
              <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeader}>
                  <Briefcase size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Job Requirements
                  </Text>
                </View>
                
                {analysis.jobDescription.requirements.map((requirement, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.listBullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.listText, { color: colors.text }]}>{requirement}</Text>
                  </View>
                ))}
              </View>

              {/* Your Profile */}
              {analysis.cv.skills.length > 0 && (
                <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.sectionHeader}>
                    <User size={20} color={colors.secondary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Your Profile
                    </Text>
                  </View>
                  
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Skills
                  </Text>
                  <View style={styles.skillsContainer}>
                    {analysis.cv.skills.map((skill, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.skillChip,
                          { 
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary
                          }
                        ]}
                      >
                        <Text style={[styles.skillText, { color: colors.primary }]}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Experience
                  </Text>
                  {analysis.cv.experience.map((exp, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.listText, { color: colors.text }]}>{exp}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Strengths & Gaps */}
              <View style={styles.strengthsGapsContainer}>
                <View style={[
                  styles.strengthsSection,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.success + '40'
                  }
                ]}>
                  <View style={styles.sectionHeader}>
                    <CheckCircle size={18} color={colors.success} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Strengths
                    </Text>
                  </View>
                  
                  {analysis.analysis.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: colors.success }]} />
                      <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
                    </View>
                  ))}
                </View>

                <View style={[
                  styles.gapsSection,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.warning + '40'
                  }
                ]}>
                  <View style={styles.sectionHeader}>
                    <AlertTriangle size={18} color={colors.warning} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Gaps
                    </Text>
                  </View>
                  
                  {analysis.analysis.gaps.map((gap, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.listText, { color: colors.text }]}>{gap}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Start Interview Button */}
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={handleStartPersonalizedInterview}
              >
                <Play size={20} color="white" />
                <Text style={styles.startButtonText}>
                  Start Personalized Interview
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'questions' && analysis && analysis.analysis.interviewQuestions && (
            <View style={styles.questionsContainer}>
              {/* Technical Questions */}
              <View style={[styles.questionSection, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'CC']}
                  style={styles.questionHeader}
                >
                  <Text style={styles.questionCategoryTitle}>Technical Questions</Text>
                </LinearGradient>
                
                {analysis.analysis.interviewQuestions.technical.map((question, index) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={[styles.questionNumber, { color: colors.primary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Behavioral Questions */}
              <View style={[styles.questionSection, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.secondary, colors.secondary + 'CC']}
                  style={styles.questionHeader}
                >
                  <Text style={styles.questionCategoryTitle}>Behavioral Questions</Text>
                </LinearGradient>
                
                {analysis.analysis.interviewQuestions.behavioral.map((question, index) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={[styles.questionNumber, { color: colors.secondary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Situational Questions */}
              <View style={[styles.questionSection, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.accent, colors.accent + 'CC']}
                  style={styles.questionHeader}
                >
                  <Text style={styles.questionCategoryTitle}>Situational Questions</Text>
                </LinearGradient>
                
                {analysis.analysis.interviewQuestions.situational.map((question, index) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={[styles.questionNumber, { color: colors.accent }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gap-Focused Questions */}
              <View style={[styles.questionSection, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.warning, colors.warning + 'CC']}
                  style={styles.questionHeader}
                >
                  <Text style={styles.questionCategoryTitle}>Gap-Focused Questions</Text>
                </LinearGradient>
                
                {analysis.analysis.interviewQuestions.gapFocused.map((question, index) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={[styles.questionNumber, { color: colors.warning }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Start Interview Button */}
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={handleStartInterview}
              >
                <Play size={20} color="white" />
                <Text style={styles.startButtonText}>
                  Start Personalized Interview
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  settingsButton: {
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
  disabledTab: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  analysisContainer: {
    gap: spacing.lg,
  },
  scoreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  scoreTitle: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    color: 'white',
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  scoreDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.base,
  },
  analysisSection: {
    padding: spacing.lg,
    borderRadius: 16,
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
  sectionSubtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skillChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  skillText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  strengthsGapsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  strengthsSection: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gapsSection: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  startButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  questionsContainer: {
    gap: spacing.lg,
  },
  questionSection: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    padding: spacing.md,
  },
  questionCategoryTitle: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  questionItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  questionNumber: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginRight: spacing.md,
    width: 20,
  },
  questionText: {
    flex: 1,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
  },
});