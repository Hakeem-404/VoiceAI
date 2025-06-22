import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Clock,
  Star,
  Target,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { DailyChallenge } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  onPress: (challenge: DailyChallenge) => void;
}

export function DailyChallengeCard({ challenge, onPress }: DailyChallengeCardProps) {
  const { colors } = useTheme();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.primary;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const timeLeft = challenge.expiresAt.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    
    if (hoursLeft < 1) {
      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
      return `${minutesLeft}m left`;
    }
    
    return `${hoursLeft}h left`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(challenge)}
      activeOpacity={0.8}
      disabled={challenge.completed}
    >
      <LinearGradient
        colors={challenge.completed ? ['#9CA3AF', '#6B7280'] : [colors.warning, '#F59E0B']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Trophy size={20} color="white" />
            <Text style={styles.challengeType}>Daily Challenge</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.points}>+{challenge.reward.points}</Text>
            {challenge.reward.badge && (
              <Star size={16} color="white" fill="white" />
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(challenge.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {challenge.difficulty}
              </Text>
            </View>
          </View>
          
          <View style={styles.footerRight}>
            <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.timeRemaining}>
              {challenge.completed ? 'Completed' : getTimeRemaining()}
            </Text>
          </View>
        </View>

        {challenge.completed && (
          <View style={styles.completedOverlay}>
            <View style={styles.completedBadge}>
              <Target size={16} color="white" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    marginRight: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 16,
    minHeight: 140,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
  challengeType: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  points: {
    fontSize: typography.sizes.base,
    color: 'white',
    fontWeight: typography.weights.bold,
  },
  content: {
    flex: 1,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    color: 'white',
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: typography.sizes.sm * 1.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeRemaining: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.weights.medium,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  completedText: {
    fontSize: typography.sizes.sm,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
});