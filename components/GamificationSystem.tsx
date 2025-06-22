import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  TrendingUp,
  Zap,
  Crown,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Achievement, DailyChallenge } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

interface GamificationSystemProps {
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  streakDays: number;
  totalPoints: number;
  level: number;
  onChallengePress: (challenge: DailyChallenge) => void;
  onAchievementPress: (achievement: Achievement) => void;
}

export function GamificationSystem({
  achievements,
  dailyChallenges,
  streakDays,
  totalPoints,
  level,
  onChallengePress,
  onAchievementPress,
}: GamificationSystemProps) {
  const { colors, isDark } = useTheme();

  const getStreakColor = () => {
    if (streakDays >= 30) return colors.error;
    if (streakDays >= 14) return colors.warning;
    if (streakDays >= 7) return colors.success;
    return colors.primary;
  };

  const getLevelProgress = () => {
    const pointsForCurrentLevel = level * 1000;
    const pointsForNextLevel = (level + 1) * 1000;
    const progress = ((totalPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
    <TouchableOpacity
      style={[styles.achievementBadge, { backgroundColor: colors.surface }]}
      onPress={() => onAchievementPress(achievement)}
    >
      <LinearGradient
        colors={[colors.warning, '#F59E0B']}
        style={styles.achievementIcon}
      >
        <Trophy size={20} color="white" />
      </LinearGradient>
      <Text style={[styles.achievementTitle, { color: colors.text }]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>
        {achievement.unlockedAt.toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const ChallengeCard = ({ challenge }: { challenge: DailyChallenge }) => (
    <TouchableOpacity
      style={[styles.challengeCard, { backgroundColor: colors.surface }]}
      onPress={() => onChallengePress(challenge)}
      disabled={challenge.completed}
    >
      <LinearGradient
        colors={challenge.completed ? ['#9CA3AF', '#6B7280'] : [colors.primary, colors.secondary]}
        style={styles.challengeGradient}
      >
        <View style={styles.challengeHeader}>
          <Target size={16} color="white" />
          <Text style={styles.challengePoints}>+{challenge.reward.points}</Text>
        </View>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeDescription}>{challenge.description}</Text>
        
        {challenge.completed && (
          <View style={styles.completedBadge}>
            <Star size={12} color="white" fill="white" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Level and Progress */}
      <View style={[styles.levelSection, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.levelGradient}
        >
          <View style={styles.levelHeader}>
            <Crown size={24} color="white" />
            <Text style={styles.levelTitle}>Level {level}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: 'white',
                    width: `${getLevelProgress()}%`
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {totalPoints} / {(level + 1) * 1000} XP
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[getStreakColor(), getStreakColor() + 'CC']}
            style={styles.statIcon}
          >
            <Flame size={20} color="white" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>{streakDays}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.warning, '#F59E0B']}
            style={styles.statIcon}
          >
            <Star size={20} color="white" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalPoints}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total XP</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.success, '#059669']}
            style={styles.statIcon}
          >
            <Trophy size={20} color="white" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>{achievements.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Achievements</Text>
        </View>
      </View>

      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Daily Challenges
            </Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.challengesScroll}
          >
            {dailyChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Achievements
            </Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {achievements.slice(0, 5).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  levelSection: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelGradient: {
    padding: spacing.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  levelTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  progressContainer: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  challengesScroll: {
    paddingRight: spacing.lg,
  },
  challengeCard: {
    width: 200,
    marginRight: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeGradient: {
    padding: spacing.md,
    minHeight: 120,
    position: 'relative',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengePoints: {
    fontSize: typography.sizes.sm,
    color: 'white',
    fontWeight: typography.weights.bold,
  },
  challengeTitle: {
    fontSize: typography.sizes.base,
    color: 'white',
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: typography.sizes.sm * 1.3,
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  completedText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  achievementsScroll: {
    paddingRight: spacing.lg,
  },
  achievementBadge: {
    width: 120,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDate: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});