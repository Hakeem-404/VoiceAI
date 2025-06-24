import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageSquare,
  Brain,
  Target,
  Clock,
  Star,
  Play,
  Shuffle,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface Question {
  id: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Cultural' | 'Experience';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  relevance: 'High' | 'Medium' | 'Low';
  reasoning: string;
  preparationTip: string;
  followUpQuestions?: string[];
  expectedDuration: number; // in minutes
}

interface SmartQuestionGeneratorProps {
  analysisData: any;
  onQuestionSelect: (question: Question) => void;
  onStartPractice: (questions: Question[]) => void;
}

export function SmartQuestionGenerator({
  analysisData,
  onQuestionSelect,
  onStartPractice,
}: SmartQuestionGeneratorProps) {
  const { colors } = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (analysisData) {
      generatePersonalizedQuestions();
    }
  }, [analysisData]);

  const generatePersonalizedQuestions = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI question generation based on analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedQuestions: Question[] = [
        {
          id: '1',
          question: 'Tell me about a challenging React project where you had to lead a team. How did you handle technical decisions and team coordination?',
          category: 'Technical',
          difficulty: 'Medium',
          relevance: 'High',
          reasoning: 'Combines your React expertise with leadership experience mentioned in CV',
          preparationTip: 'Use STAR method and focus on both technical and people management aspects',
          followUpQuestions: [
            'What specific React patterns did you implement?',
            'How did you handle disagreements within the team?',
            'What would you do differently next time?'
          ],
          expectedDuration: 5,
        },
        {
          id: '2',
          question: 'How would you approach migrating a legacy JavaScript application to TypeScript while maintaining team productivity?',
          category: 'Technical',
          difficulty: 'Medium',
          relevance: 'High',
          reasoning: 'Tests TypeScript knowledge and strategic thinking',
          preparationTip: 'Discuss incremental migration strategies and team training',
          followUpQuestions: [
            'What tools would you use for the migration?',
            'How would you handle type definitions for third-party libraries?',
            'How would you measure the success of the migration?'
          ],
          expectedDuration: 4,
        },
        {
          id: '3',
          question: 'Describe a situation where you had to learn a new technology quickly to solve a problem. How did you approach it?',
          category: 'Behavioral',
          difficulty: 'Easy',
          relevance: 'High',
          reasoning: 'Addresses the AWS knowledge gap while highlighting adaptability',
          preparationTip: 'Choose an example that shows systematic learning approach',
          followUpQuestions: [
            'What resources did you use to learn?',
            'How did you validate your understanding?',
            'How do you stay updated with new technologies?'
          ],
          expectedDuration: 3,
        },
        {
          id: '4',
          question: 'How do you balance code quality with delivery deadlines when mentoring junior developers?',
          category: 'Experience',
          difficulty: 'Medium',
          relevance: 'High',
          reasoning: 'Directly relevant to job requirements and your experience',
          preparationTip: 'Provide specific examples of code review processes and teaching moments',
          followUpQuestions: [
            'What code review practices do you follow?',
            'How do you handle pushback on code quality standards?',
            'Can you give an example of a successful mentoring outcome?'
          ],
          expectedDuration: 4,
        },
        {
          id: '5',
          question: 'If you had to design a scalable frontend architecture for a high-traffic application, what considerations would you make?',
          category: 'Technical',
          difficulty: 'Hard',
          relevance: 'High',
          reasoning: 'Tests architectural thinking and scalability knowledge',
          preparationTip: 'Cover performance, state management, code splitting, and monitoring',
          followUpQuestions: [
            'How would you handle state management at scale?',
            'What performance monitoring would you implement?',
            'How would you ensure code maintainability?'
          ],
          expectedDuration: 6,
        },
        {
          id: '6',
          question: 'Tell me about a time when you had to make a difficult technical decision with limited information.',
          category: 'Situational',
          difficulty: 'Medium',
          relevance: 'Medium',
          reasoning: 'Evaluates decision-making skills under uncertainty',
          preparationTip: 'Focus on your thought process and how you gathered information',
          followUpQuestions: [
            'What factors did you consider?',
            'How did you communicate the decision to stakeholders?',
            'What was the outcome?'
          ],
          expectedDuration: 4,
        },
        {
          id: '7',
          question: 'How do you approach working with product managers and designers to translate requirements into technical solutions?',
          category: 'Cultural',
          difficulty: 'Easy',
          relevance: 'High',
          reasoning: 'Tests collaboration skills mentioned in job requirements',
          preparationTip: 'Emphasize communication and translation of technical concepts',
          followUpQuestions: [
            'How do you handle conflicting requirements?',
            'What tools do you use for collaboration?',
            'How do you ensure technical feasibility is considered early?'
          ],
          expectedDuration: 3,
        },
        {
          id: '8',
          question: 'Describe your experience with CI/CD pipelines and how you would improve our current deployment process.',
          category: 'Technical',
          difficulty: 'Medium',
          relevance: 'Medium',
          reasoning: 'Based on your CI/CD experience mentioned in CV',
          preparationTip: 'Discuss specific tools and improvements you\'ve implemented',
          followUpQuestions: [
            'What testing strategies do you include in CI/CD?',
            'How do you handle rollbacks?',
            'What metrics do you track for deployments?'
          ],
          expectedDuration: 5,
        },
      ];
      
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const categoryMatch = filterCategory === 'all' || question.category === filterCategory;
    const difficultyMatch = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectRandomQuestions = () => {
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, shuffled.length));
    setSelectedQuestions(selected.map(q => q.id));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return colors.success;
      case 'Medium': return colors.warning;
      case 'Hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getRelevanceIcon = (relevance: string) => {
    switch (relevance) {
      case 'High': return <Star size={16} color={colors.warning} fill={colors.warning} />;
      case 'Medium': return <Star size={16} color={colors.warning} />;
      case 'Low': return <Star size={16} color={colors.textTertiary} />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Brain size={16} color={colors.primary} />;
      case 'Behavioral': return <MessageSquare size={16} color={colors.secondary} />;
      case 'Situational': return <Target size={16} color={colors.accent} />;
      case 'Cultural': return <TrendingUp size={16} color={colors.success} />;
      case 'Experience': return <CheckCircle size={16} color={colors.warning} />;
      default: return <MessageSquare size={16} color={colors.textSecondary} />;
    }
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        <View style={styles.filterHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilters(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filter Questions
          </Text>
          
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.secondary }]}
            onPress={() => {
              setFilterCategory('all');
              setFilterDifficulty('all');
            }}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Category
            </Text>
            <View style={styles.filterOptions}>
              {['all', 'Technical', 'Behavioral', 'Situational', 'Cultural', 'Experience'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    filterCategory === category && { backgroundColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setFilterCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: filterCategory === category ? 'white' : colors.text },
                    ]}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Difficulty
            </Text>
            <View style={styles.filterOptions}>
              {['all', 'Easy', 'Medium', 'Hard'].map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterOption,
                    filterDifficulty === difficulty && { backgroundColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setFilterDifficulty(difficulty)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: filterDifficulty === difficulty ? 'white' : colors.text },
                    ]}
                  >
                    {difficulty === 'all' ? 'All Levels' : difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (isGenerating) {
    return (
      <View style={styles.loadingContainer}>
        <Brain size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Generating personalized questions...
        </Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          Analyzing your profile and job requirements
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Practice Questions
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {filteredQuestions.length} personalized questions
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={colors.textSecondary} />
          <Text style={[styles.controlButtonText, { color: colors.text }]}>
            Filter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface }]}
          onPress={selectRandomQuestions}
        >
          <Shuffle size={20} color={colors.textSecondary} />
          <Text style={[styles.controlButtonText, { color: colors.text }]}>
            Random
          </Text>
        </TouchableOpacity>

        {selectedQuestions.length > 0 && (
          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              const selected = questions.filter(q => selectedQuestions.includes(q.id));
              onStartPractice(selected);
            }}
          >
            <Play size={20} color="white" />
            <Text style={styles.practiceButtonText}>
              Practice ({selectedQuestions.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Questions List */}
      <ScrollView style={styles.questionsList} showsVerticalScrollIndicator={false}>
        {filteredQuestions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.questionCard,
              { backgroundColor: colors.surface },
              selectedQuestions.includes(question.id) && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => onQuestionSelect(question)}
            onLongPress={() => toggleQuestionSelection(question.id)}
          >
            <View style={styles.questionHeader}>
              <View style={styles.questionMeta}>
                {getCategoryIcon(question.category)}
                <Text style={[styles.questionCategory, { color: colors.textSecondary }]}>
                  {question.category}
                </Text>
                <View style={styles.questionBadges}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(question.difficulty) }]}>
                    <Text style={styles.difficultyText}>{question.difficulty}</Text>
                  </View>
                  {getRelevanceIcon(question.relevance)}
                </View>
              </View>
              
              <View style={styles.questionDuration}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                  {question.expectedDuration}m
                </Text>
              </View>
            </View>

            <Text style={[styles.questionText, { color: colors.text }]}>
              {question.question}
            </Text>

            <View style={styles.questionFooter}>
              <Text style={[styles.reasoningText, { color: colors.textSecondary }]}>
                {question.reasoning}
              </Text>
              
              {selectedQuestions.includes(question.id) && (
                <View style={styles.selectedIndicator}>
                  <CheckCircle size={20} color={colors.primary} />
                </View>
              )}
            </View>

            {question.preparationTip && (
              <View style={[styles.tipContainer, { backgroundColor: colors.background }]}>
                <AlertCircle size={16} color={colors.accent} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {question.preparationTip}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FilterModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginLeft: 'auto',
  },
  practiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  questionsList: {
    flex: 1,
  },
  questionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  questionCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  questionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasoningText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Filter Modal Styles
  filterContainer: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  closeButton: {
    padding: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});