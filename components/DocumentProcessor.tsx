import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, User, Briefcase, Zap, CircleCheck as CheckCircle, CircleAlert as AlertCircle, TrendingUp, Target, Award, Clock, Brain, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface DocumentProcessorProps {
  jobDescription: string;
  cvContent: string;
  onAnalysisComplete: (analysis: any) => void;
  onQuestionGenerated: (questions: any[]) => void;
}

interface AnalysisResult {
  jobRequirements: {
    technicalSkills: string[];
    softSkills: string[];
    experienceLevel: string;
    education: string;
    certifications: string[];
    responsibilities: string[];
  };
  candidateProfile: {
    strengths: string[];
    gaps: string[];
    experienceLevel: string;
    uniqueQualifications: string[];
    relevantExperience: string[];
  };
  matchAnalysis: {
    overallScore: number;
    technicalMatch: number;
    experienceMatch: number;
    skillsMatch: number;
    culturalFit: number;
  };
  recommendations: string[];
  interviewStrategy: {
    focusAreas: string[];
    questionsToExpect: string[];
    preparationTips: string[];
  };
}

export function DocumentProcessor({
  jobDescription,
  cvContent,
  onAnalysisComplete,
  onQuestionGenerated,
}: DocumentProcessorProps) {
  const { colors } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const analyzeDocuments = async () => {
    if (!jobDescription.trim() || !cvContent.trim()) {
      Alert.alert('Missing Documents', 'Please provide both job description and CV content.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Step 1: Parse Job Description
      setProcessingStep('Analyzing job requirements...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const jobRequirements = await parseJobDescription(jobDescription);
      
      // Step 2: Parse CV
      setProcessingStep('Analyzing candidate profile...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const candidateProfile = await parseCVContent(cvContent);
      
      // Step 3: Match Analysis
      setProcessingStep('Calculating compatibility...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const matchAnalysis = calculateMatch(jobRequirements, candidateProfile);
      
      // Step 4: Generate Recommendations
      setProcessingStep('Generating recommendations...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const recommendations = generateRecommendations(jobRequirements, candidateProfile, matchAnalysis);
      
      // Step 5: Create Interview Strategy
      setProcessingStep('Creating interview strategy...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const interviewStrategy = createInterviewStrategy(jobRequirements, candidateProfile);
      
      const result: AnalysisResult = {
        jobRequirements,
        candidateProfile,
        matchAnalysis,
        recommendations,
        interviewStrategy,
      };
      
      setAnalysisResult(result);
      onAnalysisComplete(result);
      
      // Generate personalized questions
      const questions = generatePersonalizedQuestions(result);
      onQuestionGenerated(questions);
      
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProcessingStep('');
    }
  };

  const parseJobDescription = async (text: string) => {
    // Simulate AI parsing of job description
    return {
      technicalSkills: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL'],
      softSkills: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork'],
      experienceLevel: 'Senior (5+ years)',
      education: 'Bachelor\'s degree in Computer Science or related field',
      certifications: ['AWS Certified Solutions Architect', 'Scrum Master'],
      responsibilities: [
        'Lead frontend development team',
        'Architect scalable web applications',
        'Mentor junior developers',
        'Collaborate with product managers',
      ],
    };
  };

  const parseCVContent = async (text: string) => {
    // Simulate AI parsing of CV
    return {
      strengths: [
        'Strong React and TypeScript experience',
        'Full-stack development capabilities',
        'Team leadership experience',
        'Open source contributions',
      ],
      gaps: [
        'Limited AWS cloud experience',
        'No formal Scrum certification',
        'Less experience with GraphQL',
      ],
      experienceLevel: 'Mid-level (3-4 years)',
      uniqueQualifications: [
        'Mobile app development',
        'UI/UX design background',
        'Machine learning projects',
      ],
      relevantExperience: [
        'Led team of 3 developers',
        'Built React applications serving 10k+ users',
        'Implemented CI/CD pipelines',
        'Mentored 2 junior developers',
      ],
    };
  };

  const calculateMatch = (jobReqs: any, candidate: any) => {
    // Simulate match calculation
    return {
      overallScore: 78,
      technicalMatch: 82,
      experienceMatch: 70,
      skillsMatch: 85,
      culturalFit: 75,
    };
  };

  const generateRecommendations = (jobReqs: any, candidate: any, match: any) => {
    return [
      'Emphasize your React and TypeScript expertise early in the interview',
      'Prepare specific examples of team leadership situations',
      'Research AWS basics and mention your willingness to learn',
      'Highlight your unique mobile development experience as a differentiator',
      'Prepare questions about the team structure and mentoring opportunities',
    ];
  };

  const createInterviewStrategy = (jobReqs: any, candidate: any) => {
    return {
      focusAreas: [
        'Technical React/TypeScript skills',
        'Leadership and mentoring experience',
        'Problem-solving approach',
        'Learning agility for new technologies',
      ],
      questionsToExpected: [
        'Tell me about a challenging React project',
        'How do you approach mentoring junior developers?',
        'Describe your experience with cloud platforms',
        'How do you stay updated with new technologies?',
      ],
      preparationTips: [
        'Prepare STAR method examples for leadership questions',
        'Review latest React features and best practices',
        'Research the company\'s tech stack and challenges',
        'Prepare thoughtful questions about team dynamics',
      ],
    };
  };

  const generatePersonalizedQuestions = (analysis: AnalysisResult) => {
    return [
      {
        id: '1',
        question: 'Tell me about a challenging React project where you had to lead a team. How did you handle technical decisions and team coordination?',
        category: 'Technical Leadership',
        difficulty: 'Medium',
        relevance: 'High',
        reasoning: 'Combines your React expertise with leadership experience mentioned in CV',
        preparationTip: 'Use STAR method and focus on both technical and people management aspects',
      },
      {
        id: '2',
        question: 'How would you approach migrating a legacy JavaScript application to TypeScript while maintaining team productivity?',
        category: 'Technical Strategy',
        difficulty: 'Medium',
        relevance: 'High',
        reasoning: 'Tests TypeScript knowledge and strategic thinking',
        preparationTip: 'Discuss incremental migration strategies and team training',
      },
      {
        id: '3',
        question: 'Describe a situation where you had to learn a new technology quickly to solve a problem. How did you approach it?',
        category: 'Learning Agility',
        difficulty: 'Easy',
        relevance: 'High',
        reasoning: 'Addresses the AWS knowledge gap while highlighting adaptability',
        preparationTip: 'Choose an example that shows systematic learning approach',
      },
      {
        id: '4',
        question: 'How do you balance code quality with delivery deadlines when mentoring junior developers?',
        category: 'Mentoring',
        difficulty: 'Medium',
        relevance: 'High',
        reasoning: 'Directly relevant to job requirements and your experience',
        preparationTip: 'Provide specific examples of code review processes and teaching moments',
      },
    ];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.container}>
      {!analysisResult ? (
        <View style={styles.analyzeSection}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              { backgroundColor: isAnalyzing ? colors.border : colors.primary },
            ]}
            onPress={analyzeDocuments}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={isAnalyzing ? [colors.border, colors.border] : [colors.primary, colors.secondary]}
              style={styles.analyzeGradient}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <Brain size={24} color="white" />
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  {processingStep && (
                    <Text style={styles.processingStep}>{processingStep}</Text>
                  )}
                </View>
              ) : (
                <>
                  <Zap size={24} color="white" />
                  <Text style={styles.analyzeButtonText}>Analyze Documents</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {/* Match Score Overview */}
          <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
            <View style={styles.scoreHeader}>
              <Target size={24} color={colors.primary} />
              <Text style={[styles.scoreTitle, { color: colors.text }]}>
                Overall Match Score
              </Text>
            </View>
            
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysisResult.matchAnalysis.overallScore) }]}>
                {analysisResult.matchAnalysis.overallScore}%
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                Compatibility
              </Text>
            </View>
            
            <View style={styles.scoreBreakdown}>
              {Object.entries(analysisResult.matchAnalysis).map(([key, value]) => {
                if (key === 'overallScore') return null;
                return (
                  <View key={key} style={styles.scoreItem}>
                    <Text style={[styles.scoreItemLabel, { color: colors.textSecondary }]}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Text>
                    <Text style={[styles.scoreItemValue, { color: getScoreColor(value as number) }]}>
                      {value}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Strengths */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Strengths
              </Text>
            </View>
            {analysisResult.candidateProfile.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  {strength}
                </Text>
              </View>
            ))}
          </View>

          {/* Areas to Address */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Areas to Address
              </Text>
            </View>
            {analysisResult.candidateProfile.gaps.map((gap, index) => (
              <View key={index} style={styles.listItem}>
                <AlertCircle size={16} color={colors.warning} />
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  {gap}
                </Text>
              </View>
            ))}
          </View>

          {/* Recommendations */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Interview Strategy
              </Text>
            </View>
            {analysisResult.recommendations.map((rec, index) => (
              <View key={index} style={styles.listItem}>
                <Zap size={16} color={colors.primary} />
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>

          {/* Focus Areas */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Target size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Interview Focus Areas
              </Text>
            </View>
            {analysisResult.interviewStrategy.focusAreas.map((area, index) => (
              <View key={index} style={styles.listItem}>
                <Target size={16} color={colors.accent} />
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  {area}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  analyzeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  analyzeGradient: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  analyzingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  processingStep: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  scoreCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreBreakdown: {
    gap: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});