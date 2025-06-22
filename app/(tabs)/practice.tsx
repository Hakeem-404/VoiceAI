import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Target, 
  Trophy, 
  Clock, 
  Star,
  Play,
  CheckCircle
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { PracticeSession } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

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
  const [selectedTab, setSelectedTab] = useState<'all' | 'daily' | 'challenges'>('all');

  const filteredSessions = mockPracticeSessions.filter(session => {
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Practice Sessions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Improve your speaking skills with focused exercises
          </Text>
        </View>

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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
  header: {
    padding: spacing.lg,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sessionCard: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
});