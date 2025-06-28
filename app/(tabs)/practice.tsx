import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Trophy, Clock, Star, Play, CircleCheck as CheckCircle, TrendingUp, Zap, Award, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useUserStore } from '@/src/hooks/userStore';
import { useConversationStore } from '@/src/stores/conversationStore';
import { PracticeSession, DailyChallenge } from '@/src/types';
import { GamificationSystem } from '@/components/GamificationSystem';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { conversationModes } from '@/src/constants/conversationModes';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

const mockPracticeSessions: PracticeSession[] = [
  {
    id: '1',
    type: 'daily',
    title: 'Daily Speaking Challenge',
    description: 'Practice your daily conversation skills with varied topics',
    exercises: [
      {
        id: '1',
        type: 'speaking',
        prompt: 'Describe your perfect day',
        duration: 3,
        completed: true,
        score: 85,
      },
      {
        id: '2',
        type: 'speaking',
        prompt: 'Explain a hobby you enjoy',
        duration: 3,
        completed: false,
      },
    ],
    progress: 50,
  },
  {
    id: '2',
    type: 'challenge',
    title: 'Pronunciation Master',
    description: 'Focus on difficult sounds and word combinations',
    exercises: [
      {
        id: '3',
        type: 'pronunciation',
        prompt: 'Practice tongue twisters',
        duration: 5,
        completed: false,
      },
    ],
    progress: 0,
  },
  {
    id: '3',
    type: 'custom',
    title: 'Business Presentation',
    description: 'Prepare for your upcoming presentation',
    exercises: [
      {
        id: '4',
        type: 'speaking',
        prompt: 'Present quarterly results',
        duration: 10,
        completed: true,
        score: 92,
      },
    ],
    progress: 100,
    completedAt: new Date(),
  },
];

export default function PracticeScreen() {
  const { colors, isDark } = useTheme();
  const { analytics, dailyChallenges, loadDailyChallenges, completeChallenge } = useUserStore();
  const { startConversation } = useConversationStore();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'daily' | 'challenges'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [practiceSessions] = useState(mockPracticeSessions);

  useEffect(() => {
    loadDailyChallenges();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadDailyChallenges();
    setRefreshing(false);
  };

  const handleChallengePress = (challenge: DailyChallenge) => {
    const mode = conversationModes.find(m => m.id === challenge.modeId);
    if (mode && !challenge.completed) {
      startConversation(mode);
      // Mark challenge as completed (in a real app, this would happen after successful completion)
      setTimeout(() => {
        completeChallenge(challenge.id);
      }, 1000);
    }
  };

  const handleAchievementPress = (achievement: any) => {
    // Show achievement details
    console.log('Achievement pressed:', achievement);
  };

  const filteredSessions = practiceSessions.filter(session => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'daily') return session.type === 'daily';
    if (selectedTab === 'challenges') return session.type === 'challenge';
    return true;
  });

  const getTypeIcon = (type: PracticeSession['type']) => {
    switch (type) {
      case 'daily': return Target;
      case 'challenge': return Trophy;
      case 'custom': return Star;
      default: return Target;
    }
  };

  const getTypeColor = (type: PracticeSession['type']) => {
    switch (type) {
      case 'daily': return colors.primary;
      case 'challenge': return colors.warning;
      case 'custom': return colors.secondary;
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Practice & Challenges
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Improve your skills with focused exercises and daily challenges
            </Text>
          </View>

          {/* Gamification System */}
          {analytics && (
            <GamificationSystem
              achievements={analytics.achievements}
              dailyChallenges={dailyChallenges}
              streakDays={analytics.streakDays}
              totalPoints={analytics.totalConversations * 50} // Mock points calculation
              level={Math.floor(analytics.totalConversations / 10) + 1}
              onChallengePress={handleChallengePress}
              onAchievementPress={handleAchievementPress}
            />
          )}

          {/* Quick Stats */}
          <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today's Progress
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.statIcon}
                >
                  <Target size={20} color="white" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: colors.text }]}>3/5</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Exercises
                </Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.warning, '#F59E0B']}
                  style={styles.statIcon}
                >
                  <Clock size={20} color="white" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: colors.text }]}>25m</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Practice Time
                </Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  style={styles.statIcon}
                >
                  <TrendingUp size={20} color="white" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: colors.text }]}>+150</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  XP Earned
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {(['all', 'daily', 'challenges'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: selectedTab === tab ? 'white' : colors.textSecondary,
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Practice Sessions */}
          <View style={styles.sessionsContainer}>
            {filteredSessions.map((session) => {
              const IconComponent = getTypeIcon(session.type);
              const typeColor = getTypeColor(session.type);
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.8}
                >
                  <View style={styles.sessionHeader}>
                    <View style={[styles.typeIcon, { backgroundColor: typeColor }]}>
                      <IconComponent size={20} color="white" />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]}>
                        {session.title}
                      </Text>
                      <Text style={[styles.sessionDescription, { color: colors.textSecondary }]}>
                        {session.description}
                      </Text>
                    </View>
                    {session.completedAt && (
                      <CheckCircle size={24} color={colors.success} />
                    )}
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                        Progress
                      </Text>
                      <Text style={[styles.progressPercent, { color: colors.text }]}>
                        {session.progress}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: typeColor,
                            width: `${session.progress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.exercisesList}>
                    {session.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.exercise}>
                        <View style={styles.exerciseInfo}>
                          <View style={styles.exerciseHeader}>
                            {exercise.completed ? (
                              <CheckCircle size={16} color={colors.success} />
                            ) : (
                              <Play size={16} color={colors.textSecondary} />
                            )}
                            <Text style={[styles.exercisePrompt, { color: colors.text }]}>
                              {exercise.prompt}
                            </Text>
                          </View>
                          <View style={styles.exerciseMeta}>
                            <Clock size={12} color={colors.textSecondary} />
                            <Text style={[styles.exerciseDuration, { color: colors.textSecondary }]}>
                              {exercise.duration} min
                            </Text>
                            {exercise.score && (
                              <>
                                <Star size={12} color={colors.warning} />
                                <Text style={[styles.exerciseScore, { color: colors.textSecondary }]}>
                                  {exercise.score}/100
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Weekly Challenge Preview */}
          <View style={[styles.weeklyChallenge, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={[colors.error, '#DC2626']}
              style={styles.challengeGradient}
            >
              <View style={styles.challengeHeader}>
                <Trophy size={24} color="white" />
                <Text style={styles.challengeTitle}>Weekly Challenge</Text>
              </View>
              
              <Text style={styles.challengeDescription}>
                Complete 5 different conversation modes this week
              </Text>
              
              <View style={styles.challengeProgress}>
                <Text style={styles.challengeProgressText}>3/5 modes completed</Text>
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, { width: '60%' }]} />
                </View>
              </View>
              
              <View style={styles.challengeReward}>
                <Award size={16} color="white" />
                <Text style={styles.challengeRewardText}>+500 XP + Special Badge</Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.4,
  },
  statsSection: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sessionsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  sessionCard: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  sessionDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  progressPercent: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
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
  exercisesList: {
    gap: spacing.sm,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  exercisePrompt: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.sm,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.lg,
  },
  exerciseDuration: {
    fontSize: typography.sizes.xs,
  },
  exerciseScore: {
    fontSize: typography.sizes.xs,
  },
  weeklyChallenge: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  challengeGradient: {
    padding: spacing.lg,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  challengeTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  challengeDescription: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.base * 1.4,
  },
  challengeProgress: {
    marginBottom: spacing.md,
  },
  challengeProgressText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  challengeRewardText: {
    fontSize: typography.sizes.sm,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
});