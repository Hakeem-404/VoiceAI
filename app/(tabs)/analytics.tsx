import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, Award, ChartBar as BarChart3, Star } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { GuestModePrompt } from '@/components/GuestModePrompt';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { analytics } = useUserStore();
  const { user } = useSupabaseAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  useEffect(() => {
    if (!user) {
      setShowAuthPrompt(true);
    }
  }, [user]);

  const StatCard = ({ 
    icon: IconComponent, 
    title, 
    value, 
    subtitle,
    color 
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <IconComponent size={24} color="white" />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  const ProgressBar = ({ 
    label, 
    value, 
    color 
  }: { 
    label: string; 
    value: number; 
    color: string; 
  }) => (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.progressValue, { color: colors.text }]}>{value}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: `${value}%`,
            },
          ]}
        />
      </View>
    </View>
  );

  const WeeklyChart = ({ data }: { data: number[] }) => {
    const maxValue = Math.max(...data);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Weekly Progress
        </Text>
        <View style={styles.chart}>
          {data.map((value, index) => (
            <View key={index} style={styles.chartColumn}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: (value / maxValue) * 100,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
              <Text style={[styles.chartDay, { color: colors.textSecondary }]}>
                {days[index]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!analytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <BarChart3 size={64} color={colors.textTertiary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Your Progress
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your speaking improvement over time
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={TrendingUp}
              title="Conversations"
              value={analytics.totalConversations}
              color={colors.primary}
            />
            <StatCard
              icon={Clock}
              title="Practice Time"
              value={`${Math.floor(analytics.totalPracticeTime / 60)}h`}
              subtitle={`${analytics.totalPracticeTime % 60}m total`}
              color={colors.secondary}
            />
            <StatCard
              icon={Target}
              title="Average Score"
              value={analytics.averageScore.toFixed(1)}
              subtitle="out of 10"
              color={colors.success}
            />
            <StatCard
              icon={Award}
              title="Streak"
              value={`${analytics.streakDays} days`}
              color={colors.warning}
            />
          </View>

          <WeeklyChart data={analytics.weeklyProgress} />

          <View style={[styles.skillsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Skill Progress
            </Text>
            <ProgressBar
              label="Fluency"
              value={analytics.skillProgress.fluency}
              color={colors.primary}
            />
            <ProgressBar
              label="Confidence"
              value={analytics.skillProgress.confidence}
              color={colors.secondary}
            />
            <ProgressBar
              label="Clarity"
              value={analytics.skillProgress.clarity}
              color={colors.accent}
            />
          </View>

          <View style={[styles.achievementsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Achievements
            </Text>
            {analytics.achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={[styles.achievementIcon, { backgroundColor: colors.warning }]}>
                  <Star size={20} color="white" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* Auth Prompt Modal */}
      <GuestModePrompt
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        feature="analytics"
      />
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: (width - spacing.lg * 3) / 2,
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  statSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs / 2,
  },
  chartContainer: {
    backgroundColor: 'transparent',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  chartTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  chartDay: {
    fontSize: typography.sizes.xs,
  },
  skillsContainer: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  progressValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementsContainer: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    marginTop: spacing.lg,
  },
});