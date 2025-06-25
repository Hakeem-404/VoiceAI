import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { 
  BarChart3, 
  Clock, 
  MessageSquare, 
  Volume2, 
  Zap,
  ChevronRight
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackMetrics } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface ConversationMetricsDisplayProps {
  metrics: FeedbackMetrics;
  conversationMode: string;
  onViewFullAnalytics: () => void;
}

export function ConversationMetricsDisplay({ 
  metrics, 
  conversationMode,
  onViewFullAnalytics
}: ConversationMetricsDisplayProps) {
  const { colors, isDark } = useTheme();

  const getMetricColor = (value: number, type: string) => {
    // Different metrics have different optimal ranges
    switch (type) {
      case 'pace':
        // For pace, 120-160 words per minute is ideal
        if (value >= 120 && value <= 160) return colors.success;
        if (value < 100 || value > 180) return colors.warning;
        return colors.primary;
        
      case 'filler':
        // For filler words, lower is better
        if (value <= 2) return colors.success;
        if (value > 5) return colors.warning;
        return colors.primary;
        
      case 'questions':
        // For questions, higher is generally better
        if (value >= 3) return colors.success;
        if (value <= 1) return colors.warning;
        return colors.primary;
        
      case 'engagement':
        // For engagement, higher is better
        if (value >= 80) return colors.success;
        if (value < 50) return colors.warning;
        return colors.primary;
        
      default:
        return colors.primary;
    }
  };

  const getModeSpecificMetric = () => {
    switch (conversationMode) {
      case 'debate-challenge':
        return {
          icon: <Zap size={16} color={colors.primary} />,
          label: 'Argument Strength',
          value: Math.round(metrics.topicRelevance),
          unit: '%'
        };
        
      case 'idea-brainstorm':
        return {
          icon: <Zap size={16} color={colors.primary} />,
          label: 'Idea Generation',
          value: Math.round(metrics.vocabularyDiversity * 100),
          unit: '%'
        };
        
      case 'interview-practice':
        return {
          icon: <Clock size={16} color={colors.primary} />,
          label: 'Response Time',
          value: Math.round(metrics.responseTime * 10) / 10,
          unit: 's'
        };
        
      case 'presentation-prep':
        return {
          icon: <Volume2 size={16} color={colors.primary} />,
          label: 'Clarity',
          value: Math.round(100 - metrics.fillerWordFrequency * 10),
          unit: '%'
        };
        
      case 'language-learning':
        return {
          icon: <MessageSquare size={16} color={colors.primary} />,
          label: 'Vocabulary',
          value: Math.round(metrics.vocabularyDiversity * 100),
          unit: '%'
        };
        
      default:
        return {
          icon: <MessageSquare size={16} color={colors.primary} />,
          label: 'Engagement',
          value: Math.round(metrics.engagementLevel),
          unit: '%'
        };
    }
  };

  const modeSpecificMetric = getModeSpecificMetric();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Live Metrics
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onViewFullAnalytics}
        >
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
            View All
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Pace
            </Text>
          </View>
          <Text style={[
            styles.metricValue, 
            { color: getMetricColor(metrics.speakingPace, 'pace') }
          ]}>
            {Math.round(metrics.speakingPace)}
          </Text>
          <Text style={[styles.metricUnit, { color: colors.textTertiary }]}>
            wpm
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <MessageSquare size={16} color={colors.primary} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Fillers
            </Text>
          </View>
          <Text style={[
            styles.metricValue, 
            { color: getMetricColor(metrics.fillerWordFrequency, 'filler') }
          ]}>
            {Math.round(metrics.fillerWordFrequency)}
          </Text>
          <Text style={[styles.metricUnit, { color: colors.textTertiary }]}>
            /min
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <MessageSquare size={16} color={colors.primary} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Questions
            </Text>
          </View>
          <Text style={[
            styles.metricValue, 
            { color: getMetricColor(metrics.questionFrequency, 'questions') }
          ]}>
            {Math.round(metrics.questionFrequency)}
          </Text>
          <Text style={[styles.metricUnit, { color: colors.textTertiary }]}>
            /min
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            {modeSpecificMetric.icon}
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {modeSpecificMetric.label}
            </Text>
          </View>
          <Text style={[
            styles.metricValue, 
            { color: colors.primary }
          ]}>
            {modeSpecificMetric.value}
          </Text>
          <Text style={[styles.metricUnit, { color: colors.textTertiary }]}>
            {modeSpecificMetric.unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    width: '23%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs / 2,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  metricUnit: {
    fontSize: typography.sizes.xs,
  },
});