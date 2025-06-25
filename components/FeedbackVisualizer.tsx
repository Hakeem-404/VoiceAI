import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackData } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

interface FeedbackVisualizerProps {
  feedback: FeedbackData;
  mode: string;
}

export function FeedbackVisualizer({ feedback, mode }: FeedbackVisualizerProps) {
  const { colors, isDark } = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  const formatModeName = (mode: string) => {
    return mode.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get mode-specific metrics
  const getModeSpecificMetrics = () => {
    if (!feedback.modeSpecific) return [];
    
    switch (mode) {
      case 'general-chat':
        if (!feedback.modeSpecific.generalChat) return [];
        return [
          { 
            label: 'Conversation Flow', 
            value: feedback.modeSpecific.generalChat.conversationFlow 
          },
          { 
            label: 'Topic Exploration', 
            value: feedback.modeSpecific.generalChat.topicExploration 
          },
          { 
            label: 'Empathy', 
            value: feedback.modeSpecific.generalChat.empathyScore 
          },
          { 
            label: 'Curiosity', 
            value: feedback.modeSpecific.generalChat.curiosityLevel 
          },
        ];
        
      case 'debate-challenge':
        if (!feedback.modeSpecific.debate) return [];
        return [
          { 
            label: 'Argument Strength', 
            value: feedback.modeSpecific.debate.argumentStrength 
          },
          { 
            label: 'Evidence Usage', 
            value: feedback.modeSpecific.debate.evidenceUsage 
          },
          { 
            label: 'Counter-Arguments', 
            value: feedback.modeSpecific.debate.counterArgumentHandling 
          },
          { 
            label: 'Logical Consistency', 
            value: feedback.modeSpecific.debate.logicalConsistency 
          },
        ];
        
      case 'idea-brainstorm':
        if (!feedback.modeSpecific.brainstorm) return [];
        return [
          { 
            label: 'Idea Quality', 
            value: feedback.modeSpecific.brainstorm.ideaQuality 
          },
          { 
            label: 'Building on Ideas', 
            value: feedback.modeSpecific.brainstorm.buildingOnIdeas 
          },
          { 
            label: 'Ideas Generated', 
            value: feedback.modeSpecific.brainstorm.ideaCount,
            isCount: true
          },
          { 
            label: 'Unique Ideas', 
            value: feedback.modeSpecific.brainstorm.uniqueIdeas,
            isCount: true
          },
        ];
        
      case 'interview-practice':
        if (!feedback.modeSpecific.interview) return [];
        return [
          { 
            label: 'Question Relevance', 
            value: feedback.modeSpecific.interview.questionRelevance 
          },
          { 
            label: 'Answer Completeness', 
            value: feedback.modeSpecific.interview.answerCompleteness 
          },
          { 
            label: 'Professional Demeanor', 
            value: feedback.modeSpecific.interview.professionalDemeanor 
          },
          { 
            label: 'Technical Accuracy', 
            value: feedback.modeSpecific.interview.technicalAccuracy 
          },
        ];
        
      case 'presentation-prep':
        if (!feedback.modeSpecific.presentation) return [];
        return [
          { 
            label: 'Structure', 
            value: feedback.modeSpecific.presentation.structureQuality 
          },
          { 
            label: 'Audience Engagement', 
            value: feedback.modeSpecific.presentation.audienceEngagement 
          },
          { 
            label: 'Message Clarity', 
            value: feedback.modeSpecific.presentation.messageClarity 
          },
          { 
            label: 'Delivery Style', 
            value: feedback.modeSpecific.presentation.deliveryStyle 
          },
        ];
        
      case 'language-learning':
        if (!feedback.modeSpecific.languageLearning) return [];
        return [
          { 
            label: 'Grammar', 
            value: feedback.modeSpecific.languageLearning.grammarAccuracy 
          },
          { 
            label: 'Vocabulary', 
            value: feedback.modeSpecific.languageLearning.vocabularyRange 
          },
          { 
            label: 'Pronunciation', 
            value: feedback.modeSpecific.languageLearning.pronunciationScore 
          },
          { 
            label: 'Fluency', 
            value: feedback.modeSpecific.languageLearning.fluencyProgress 
          },
        ];
        
      default:
        return [];
    }
  };

  const modeSpecificMetrics = getModeSpecificMetrics();

  return (
    <View style={styles.container}>
      {/* Overall Score */}
      <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.scoreGradient}
        >
          <Text style={styles.scoreTitle}>Overall Score</Text>
          <Text style={styles.scoreValue}>{feedback.scores.overall}</Text>
          <Text style={styles.modeLabel}>{formatModeName(mode)}</Text>
        </LinearGradient>
      </View>

      {/* Core Metrics */}
      <View style={[styles.metricsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.metricsTitle, { color: colors.text }]}>
          Core Communication Skills
        </Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: getScoreColor(feedback.scores.fluency) }]}>
              {feedback.scores.fluency}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Fluency
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: getScoreColor(feedback.scores.clarity) }]}>
              {feedback.scores.clarity}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Clarity
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: getScoreColor(feedback.scores.confidence) }]}>
              {feedback.scores.confidence}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Confidence
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: getScoreColor(feedback.scores.pace) }]}>
              {feedback.scores.pace}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Pace
            </Text>
          </View>
        </View>
      </View>

      {/* Mode-Specific Metrics */}
      {modeSpecificMetrics.length > 0 && (
        <View style={[styles.metricsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.metricsTitle, { color: colors.text }]}>
            {formatModeName(mode)} Skills
          </Text>
          
          <View style={styles.metricsGrid}>
            {modeSpecificMetrics.map((metric, index) => (
              <View key={index} style={styles.metricItem}>
                <Text style={[
                  styles.metricValue, 
                  { 
                    color: metric.isCount 
                      ? colors.primary 
                      : getScoreColor(metric.value) 
                  }
                ]}>
                  {metric.value}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  {metric.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Analytics */}
      <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.analyticsTitle, { color: colors.text }]}>
          Conversation Analytics
        </Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>
              {feedback.analytics.wordsPerMinute}
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
              Words/Min
            </Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>
              {feedback.analytics.pauseCount}
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
              Pauses
            </Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>
              {feedback.analytics.fillerWords}
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
              Filler Words
            </Text>
          </View>
          
          {feedback.analytics.questionCount !== undefined && (
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.primary }]}>
                {feedback.analytics.questionCount}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>
                Questions
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scoreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreGradient: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  scoreTitle: {
    color: 'white',
    fontSize: typography.sizes.base,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    color: 'white',
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  modeLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  metricsCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  analyticsCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  analyticsValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs / 2,
  },
  analyticsLabel: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});