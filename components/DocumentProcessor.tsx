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
import {
  FileText,
  User,
  Briefcase,
  Brain,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  Award,
  X,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { SmartTextInput } from './SmartTextInput';
import { spacing, typography } from '@/src/constants/colors';

export interface DocumentAnalysis {
  jobDescription: {
    requirements: string[];
    skills: string[];
    experience: string;
    responsibilities: string[];
    companyInfo: string;
    culture: string[];
  };
  cv: {
    skills: string[];
    experience: string[];
    achievements: string[];
    education: string[];
    technologies: string[];
  };
  analysis: {
    matchScore: number;
    strengths: string[];
    gaps: string[];
    focusAreas: string[];
    difficulty: 'junior' | 'mid' | 'senior' | 'executive';
    recommendations: string[];
  };
}

interface DocumentProcessorProps {
  visible: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: DocumentAnalysis) => void;
  initialJobDescription?: string;
  initialCV?: string;
}

export function DocumentProcessor({
  visible,
  onClose,
  onAnalysisComplete,
  initialJobDescription = '',
  initialCV = '',
}: DocumentProcessorProps) {
  const { colors, isDark } = useTheme();
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [cv, setCV] = useState(initialCV);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');

  useEffect(() => {
    setJobDescription(initialJobDescription);
    setCV(initialCV);
  }, [initialJobDescription, initialCV]);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      Alert.alert('Missing Information', 'Please add a job description to analyze.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate API call to Claude for document analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockAnalysis: DocumentAnalysis = {
        jobDescription: {
          requirements: [
            '3+ years React Native experience',
            'TypeScript proficiency',
            'Mobile app development',
            'API integration experience',
            'Git version control',
          ],
          skills: ['React Native', 'TypeScript', 'JavaScript', 'REST APIs', 'Git'],
          experience: 'Mid-level (3-5 years)',
          responsibilities: [
            'Develop mobile applications',
            'Collaborate with design team',
            'Implement new features',
            'Code reviews and testing',
          ],
          companyInfo: 'Tech startup focused on mobile solutions',
          culture: ['Fast-paced', 'Collaborative', 'Innovation-focused'],
        },
        cv: {
          skills: cv.trim() ? ['React', 'JavaScript', 'Node.js', 'MongoDB'] : [],
          experience: cv.trim() ? [
            '2 years frontend development',
            'Internship at tech company',
            'Freelance web projects',
          ] : [],
          achievements: cv.trim() ? [
            'Built 3 web applications',
            'Increased user engagement by 40%',
          ] : [],
          education: cv.trim() ? ['Computer Science degree'] : [],
          technologies: cv.trim() ? ['React', 'JavaScript', 'HTML/CSS', 'Node.js'] : [],
        },
        analysis: {
          matchScore: cv.trim() ? 75 : 60,
          strengths: cv.trim() ? [
            'Strong JavaScript foundation',
            'React experience transferable to React Native',
            'Understanding of modern development practices',
          ] : [
            'Job requirements clearly understood',
            'Good opportunity to demonstrate potential',
          ],
          gaps: cv.trim() ? [
            'No direct React Native experience',
            'Limited mobile development background',
            'TypeScript experience not mentioned',
          ] : [
            'No CV provided for detailed analysis',
            'Unable to assess technical background',
            'Cannot identify specific experience gaps',
          ],
          focusAreas: [
            'React Native fundamentals',
            'Mobile development concepts',
            'TypeScript basics',
            'API integration patterns',
          ],
          difficulty: 'mid',
          recommendations: cv.trim() ? [
            'Emphasize React experience and learning ability',
            'Prepare examples of complex problem-solving',
            'Study React Native basics before interview',
            'Practice explaining technical concepts clearly',
          ] : [
            'Add your CV for personalized analysis',
            'Focus on demonstrating learning ability',
            'Prepare general technical examples',
            'Research company and role thoroughly',
          ],
        },
      };

      setAnalysis(mockAnalysis);
      setActiveTab('analysis');
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseAnalysis = () => {
    if (analysis) {
      onAnalysisComplete(analysis);
      onClose();
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setCV('');
    setAnalysis(null);
    setActiveTab('input');
  };

  const jobDescriptionSuggestions = [
    "We are looking for a skilled React Native developer...",
    "Join our team as a Senior Frontend Engineer...",
    "Seeking a passionate Mobile App Developer...",
    "Full-stack developer position available...",
  ];

  const cvSuggestions = [
    "Experienced software developer with 5+ years...",
    "Recent computer science graduate with internship experience...",
    "Full-stack developer specializing in React and Node.js...",
    "Mobile app developer with published apps...",
  ];

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Interview Preparation
        </Text>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RotateCcw size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'input' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('input')}
        >
          <FileText size={16} color={activeTab === 'input' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'input' ? 'white' : colors.textSecondary }
          ]}>
            Documents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'analysis' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('analysis')}
          disabled={!analysis}
        >
          <Brain size={16} color={activeTab === 'analysis' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'analysis' ? 'white' : colors.textSecondary }
          ]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'input' ? (
          <View style={styles.inputTab}>
            {/* Job Description Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Briefcase size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Job Description
                </Text>
                <View style={[styles.requiredBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              
              <SmartTextInput
                value={jobDescription}
                onChangeText={setJobDescription}
                onSend={() => {}}
                onVoiceToggle={() => {}}
                placeholder="Paste the job description here..."
                mode="document"
                maxLength={3000}
                suggestions={jobDescriptionSuggestions}
                showSuggestions={!jobDescription.trim()}
              />
            </View>

            {/* CV Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Your CV/Resume
                </Text>
                <View style={[styles.optionalBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </View>
              
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Adding your CV enables personalized question generation and gap analysis
              </Text>
              
              <SmartTextInput
                value={cv}
                onChangeText={setCV}
                onSend={() => {}}
                onVoiceToggle={() => {}}
                placeholder="Paste your CV/resume here for personalized analysis..."
                mode="document"
                maxLength={4000}
                suggestions={cvSuggestions}
                showSuggestions={!cv.trim()}
              />
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                { 
                  backgroundColor: jobDescription.trim() ? colors.primary : colors.border,
                }
              ]}
              onPress={handleAnalyze}
              disabled={!jobDescription.trim() || isAnalyzing}
            >
              <LinearGradient
                colors={jobDescription.trim() ? [colors.primary, colors.secondary] : [colors.border, colors.border]}
                style={styles.analyzeGradient}
              >
                <Brain size={20} color={jobDescription.trim() ? 'white' : colors.textTertiary} />
                <Text style={[
                  styles.analyzeButtonText,
                  { color: jobDescription.trim() ? 'white' : colors.textTertiary }
                ]}>
                  {isAnalyzing ? 'Analyzing Documents...' : 'Analyze & Generate Questions'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.analysisTab}>
            {analysis && (
              <>
                {/* Match Score */}
                <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
                  <LinearGradient
                    colors={[colors.success, '#059669']}
                    style={styles.scoreGradient}
                  >
                    <Target size={24} color="white" />
                    <Text style={styles.scoreValue}>{analysis.analysis.matchScore}%</Text>
                    <Text style={styles.scoreLabel}>Match Score</Text>
                  </LinearGradient>
                </View>

                {/* Strengths */}
                <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.analysisSectionHeader}>
                    <CheckCircle size={18} color={colors.success} />
                    <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
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

                {/* Gaps */}
                <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.analysisSectionHeader}>
                    <AlertTriangle size={18} color={colors.warning} />
                    <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
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

                {/* Focus Areas */}
                <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.analysisSectionHeader}>
                    <TrendingUp size={18} color={colors.primary} />
                    <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                      Interview Focus Areas
                    </Text>
                  </View>
                  {analysis.analysis.focusAreas.map((area, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.listText, { color: colors.text }]}>{area}</Text>
                    </View>
                  ))}
                </View>

                {/* Recommendations */}
                <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.analysisSectionHeader}>
                    <Award size={18} color={colors.secondary} />
                    <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                      Preparation Recommendations
                    </Text>
                  </View>
                  {analysis.analysis.recommendations.map((rec, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.listText, { color: colors.text }]}>{rec}</Text>
                    </View>
                  ))}
                </View>

                {/* Use Analysis Button */}
                <TouchableOpacity
                  style={[styles.useButton, { backgroundColor: colors.primary }]}
                  onPress={handleUseAnalysis}
                >
                  <Zap size={20} color="white" />
                  <Text style={styles.useButtonText}>
                    Start Personalized Interview Practice
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  resetButton: {
    padding: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputTab: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
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
    flex: 1,
  },
  requiredBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  optionalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.sm * 1.4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  analyzeButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  analysisTab: {
    paddingBottom: spacing.xl,
  },
  scoreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  scoreGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  scoreValue: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  scoreLabel: {
    fontSize: typography.sizes.lg,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.weights.medium,
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
  analysisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  analysisSectionTitle: {
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
  useButton: {
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
  useButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
});