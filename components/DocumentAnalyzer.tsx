import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, User, Brain, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Target, Award, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { DocumentAnalysis } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface DocumentAnalyzerProps {
  jobDescription: string;
  cvContent?: string;
  onAnalysisComplete: (analysis: DocumentAnalysis) => void;
}

export function DocumentAnalyzer({
  jobDescription,
  cvContent,
  onAnalysisComplete,
}: DocumentAnalyzerProps) {
  const { colors, isDark } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Job description is required for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate the analysis with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock analysis result
      const mockAnalysis: DocumentAnalysis = {
        jobDescription: {
          requirements: [
            '3+ years of React Native experience',
            'TypeScript proficiency',
            'Experience with RESTful APIs',
            'Knowledge of state management',
            'Understanding of mobile app architecture',
          ],
          skills: ['React Native', 'TypeScript', 'JavaScript', 'Redux', 'REST APIs'],
          experience: '3-5 years',
          responsibilities: [
            'Develop mobile applications using React Native',
            'Collaborate with design and backend teams',
            'Implement new features and maintain existing code',
            'Troubleshoot and fix bugs',
            'Participate in code reviews',
          ],
          companyInfo: 'Tech startup focused on mobile solutions',
          culture: ['Fast-paced', 'Collaborative', 'Innovative'],
        },
        cv: {
          skills: cvContent ? ['React', 'JavaScript', 'HTML/CSS', 'Node.js', 'Git'] : [],
          experience: cvContent ? [
            'Frontend Developer at XYZ Company (2 years)',
            'Web Developer Intern at ABC Corp (6 months)',
            'Freelance Web Developer (1 year)',
          ] : [],
          achievements: cvContent ? [
            'Reduced load time by 40% through code optimization',
            'Implemented responsive design across 5 web applications',
            'Contributed to open-source projects',
          ] : [],
          education: cvContent ? ['Bachelor of Computer Science, University XYZ'] : [],
          technologies: cvContent ? ['React', 'JavaScript', 'HTML/CSS', 'Node.js', 'Git'] : [],
        },
        analysis: {
          matchScore: cvContent ? 75 : 60,
          strengths: cvContent ? [
            'Strong JavaScript foundation',
            'React experience transferable to React Native',
            'Experience with web development',
          ] : [
            'Job requirements clearly understood',
            'Opportunity to demonstrate potential',
          ],
          gaps: cvContent ? [
            'No direct React Native experience',
            'Limited TypeScript experience',
            'No mention of state management experience',
          ] : [
            'No CV provided for detailed analysis',
            'Unable to assess technical background',
            'Cannot identify specific experience gaps',
          ],
          focusAreas: [
            'React Native fundamentals',
            'TypeScript knowledge',
            'State management approaches',
            'Mobile-specific considerations',
          ],
          difficulty: 'mid',
          recommendations: cvContent ? [
            'Emphasize React experience and how it transfers to React Native',
            'Highlight any mobile-related projects or experience',
            'Prepare examples of complex state management',
            'Research company\'s mobile products before interview',
          ] : [
            'Add your CV for personalized analysis',
            'Research React Native fundamentals',
            'Prepare examples of your problem-solving approach',
            'Focus on demonstrating learning ability',
          ],
          interviewQuestions: {
            technical: [
              'How would you handle state management in a React Native app?',
              'What\'s your experience with TypeScript interfaces and types?',
              'How would you implement API calls in a React Native application?',
              'Explain the difference between React Native and React for web',
            ],
            behavioral: [
              'Tell me about a challenging project you worked on',
              'How do you approach learning new technologies?',
              'Describe a situation where you had to meet a tight deadline',
              'How do you handle feedback on your code?',
            ],
            situational: [
              'How would you debug a performance issue in a React Native app?',
              'What would you do if you disagreed with a design decision?',
              'How would you approach refactoring a legacy codebase?',
              'How would you handle a feature request that seems impossible to implement?',
            ],
            gapFocused: [
              'How would you transfer your React web skills to React Native?',
              'What steps have you taken to learn TypeScript?',
              'How would you approach learning mobile-specific concepts?',
              'What interests you about mobile development specifically?',
            ],
          },
        },
      };

      setAnalysis(mockAnalysis);
      onAnalysisComplete(mockAnalysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <Brain size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Analyzing Documents...
        </Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          Extracting requirements, skills, and generating personalized insights
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <AlertTriangle size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Analysis Error
        </Text>
        <Text style={[styles.errorMessage, { color: colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleAnalyze}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.container}>
        <View style={[styles.documentSummary, { backgroundColor: colors.surface }]}>
          <View style={styles.documentHeader}>
            <Briefcase size={20} color={colors.primary} />
            <Text style={[styles.documentTitle, { color: colors.text }]}>
              Job Description
            </Text>
            <View style={[
              styles.documentStatus,
              { backgroundColor: jobDescription ? colors.success : colors.warning }
            ]}>
              <Text style={styles.documentStatusText}>
                {jobDescription ? 'Ready' : 'Required'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.documentPreview, { color: colors.textSecondary }]}>
            {jobDescription 
              ? jobDescription.substring(0, 100) + (jobDescription.length > 100 ? '...' : '')
              : 'No job description provided'}
          </Text>
          
          <View style={styles.documentHeader}>
            <User size={20} color={colors.secondary} />
            <Text style={[styles.documentTitle, { color: colors.text }]}>
              CV/Resume
            </Text>
            <View style={[
              styles.documentStatus,
              { backgroundColor: cvContent ? colors.success : colors.accent }
            ]}>
              <Text style={styles.documentStatusText}>
                {cvContent ? 'Ready' : 'Optional'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.documentPreview, { color: colors.textSecondary }]}>
            {cvContent 
              ? cvContent.substring(0, 100) + (cvContent.length > 100 ? '...' : '')
              : 'No CV/resume provided (optional but recommended)'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            { backgroundColor: jobDescription ? colors.primary : colors.border }
          ]}
          onPress={handleAnalyze}
          disabled={!jobDescription}
        >
          <Brain size={20} color="white" />
          <Text style={styles.analyzeButtonText}>
            Analyze Documents
          </Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { color: colors.textTertiary }]}>
          {jobDescription 
            ? 'Analysis will generate personalized interview questions and insights'
            : 'Please add a job description to enable analysis'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.analysisCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.scoreSection}
          >
            <Text style={styles.scoreTitle}>Match Score</Text>
            <Text style={styles.scoreValue}>{analysis.analysis.matchScore}%</Text>
            <Text style={styles.scoreDescription}>
              {analysis.analysis.matchScore >= 80 ? 'Excellent match!' : 
               analysis.analysis.matchScore >= 60 ? 'Good match' : 'Potential match'}
            </Text>
          </LinearGradient>

          <View style={styles.analysisSection}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Strengths
              </Text>
            </View>
            
            {analysis.analysis.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.success }]} />
                <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisSection}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Areas to Address
              </Text>
            </View>
            
            {analysis.analysis.gaps.map((gap, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.warning }]} />
                <Text style={[styles.listText, { color: colors.text }]}>{gap}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisSection}>
            <View style={styles.sectionHeader}>
              <Target size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Focus Areas
              </Text>
            </View>
            
            {analysis.analysis.focusAreas.map((area, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.listText, { color: colors.text }]}>{area}</Text>
              </View>
            ))}
          </View>

          <View style={styles.analysisSection}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recommendations
              </Text>
            </View>
            
            {analysis.analysis.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.listText, { color: colors.text }]}>{recommendation}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={() => {}}
          >
            <Text style={styles.continueButtonText}>
              Start Personalized Interview
            </Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  loadingSubtext: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  documentSummary: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  documentTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  documentStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  documentStatusText: {
    color: 'white',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  documentPreview: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.lg,
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
  infoText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  analysisCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  scoreSection: {
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
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