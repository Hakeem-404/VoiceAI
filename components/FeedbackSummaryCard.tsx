import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, TrendingUp, TrendingDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, ArrowRight, Award } from 'lucide-react-native'
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackSummary } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface FeedbackSummaryCardProps {
  summary: FeedbackSummary;
  conversationMode: string;
  onViewDetails: () => void;
}

export function FeedbackSummaryCard({ 
  summary, 
  conversationMode,
  onViewDetails 
}: FeedbackSummaryCardProps) {
  const { colors, isDark } = useTheme();

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} color={colors.success} />;
    if (change < 0) return <TrendingDown size={16} color={colors.error} />;
    return null;
  };

  const formatModeName = (mode: string) => {
    return mode.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabelText}>Overall Score</Text>
            <Text style={styles.scoreText}>{summary.overallScore}</Text>
            {summary.compareToPrevious && (
              <View style={styles.changeContainer}>
                {getChangeIcon(summary.compareToPrevious.overallChange)}
                <Text style={styles.changeText}>
                  {summary.compareToPrevious.overallChange > 0 ? '+' : ''}
                  {summary.compareToPrevious.overallChange}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.modeContainer}>
            <Award size={20} color="white" />
            <Text style={styles.modeText}>
              {formatModeName(conversationMode)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Strengths */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={18} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Key Strengths
            </Text>
          </View>
          
          {summary.keyStrengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.listBullet, { backgroundColor: colors.success }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
            </View>
          ))}
        </View>

        {/* Improvement Areas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Areas to Improve
            </Text>
          </View>
          
          {summary.improvementAreas.map((area, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.listBullet, { backgroundColor: colors.warning }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{area}</Text>
            </View>
          ))}
        </View>

        {/* Mode-Specific Insights */}
        {summary.modeSpecificInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {formatModeName(conversationMode)} Insights
              </Text>
            </View>
            
            {summary.modeSpecificInsights.map((insight, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.listText, { color: colors.text }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArrowRight size={18} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Next Steps
            </Text>
          </View>
          
          {summary.nextStepSuggestions.map((step, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.listBullet, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.detailsButton, { backgroundColor: colors.primary }]}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsButtonText}>View Detailed Feedback</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-start',
  },
  scoreLabelText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  scoreText: {
    color: 'white',
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs / 2,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  modeText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
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
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  detailsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignSelf: 'center',
  },
  detailsButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});