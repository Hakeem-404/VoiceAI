import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface FeedbackButtonProps {
  onPress: () => void;
  score?: number;
  showScore?: boolean;
}

export function FeedbackButton({ 
  onPress, 
  score,
  showScore = false
}: FeedbackButtonProps) {
  const { colors } = useTheme();

  const getScoreColor = (score?: number) => {
    if (!score) return colors.primary;
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {showScore && score ? (
        <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(score) }]}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <BarChart3 size={16} color="white" />
        </View>
      )}
      
      <Text style={[styles.text, { color: colors.text }]}>
        {showScore ? 'View Feedback' : 'Get Feedback'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  scoreContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  scoreText: {
    color: 'white',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});