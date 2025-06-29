import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Target, 
  Clock,
  Award, 
  ChartBar as BarChart3, 
  Star,
  Calendar,
  Flame,
  MessageCircle,
  Share2,
  RefreshCw
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useDataPersistence } from '@/src/hooks/useDataPersistence';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { 
    user, 
    conversations, 
    progress, 
    streakDays, 
    isOnline,
    loadProgress,
    loadConversations
  } = useDataPersistence();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [modeStats, setModeStats] = useState<{
    mode: string;
    count: number;
    percentage: number;
    color: string;
  }[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [mostActiveDay, setMostActiveDay] = useState('');
  const [averageDuration, setAverageDuration] = useState(0);
  
  // Load data
  useEffect(() => {
    loadAnalyticsData();
  }, [conversations, progress]);
  
  const loadAnalyticsData = () => {
    if (conversations.length === 0) return;
    
    // Calculate weekly data
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    const weeklyConversations = Array(7).fill(0);
    const dayCount = Array(7).fill(0);
    
    // Count conversations per day of week
    conversations.forEach(conv => {
      const convDate = new Date(conv.createdAt);
      const dayDiff = Math.floor((today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only count conversations from the last 30 days
      if (dayDiff < 30) {
        const convDay = convDate.getDay();
        dayCount[convDay]++;
      }
      
      // Only count conversations from the current week
      if (dayDiff < 7) {
        const weekDay = (dayOfWeek - dayDiff + 7) % 7;
        weeklyConversations[weekDay]++;
      }
    });
    
    // Find most active day
    const maxDayCount = Math.max(...dayCount);
    const maxDayIndex = dayCount.indexOf(maxDayCount);
    setMostActiveDay(weekDays[maxDayIndex]);
    
    setWeeklyData(weeklyConversations);
    
    // Calculate mode stats
    const modeMap = new Map<string, number>();
    conversations.forEach(conv => {
      const mode = conv.mode.id;
      modeMap.set(mode, (modeMap.get(mode) || 0) + 1);
    });
    
    const modeColors = {
      'general-chat': '#3B82F6',
      'debate-challenge': '#EF4444',
      'idea-brainstorm': '#10B981',
      'interview-practice': '#8B5CF6',
      'presentation-prep': '#F59E0B',
      'language-learning': '#06B6D4'
    };
    
    const totalConversations = conversations.length;
    const modeStatsData = Array.from(modeMap.entries())
      .map(([mode, count]) => ({
        mode,
        count,
        percentage: Math.round((count / totalConversations) * 100),
        color: modeColors[mode as keyof typeof modeColors] || colors.primary
      }))
      .sort((a, b) => b.count - a.count);
    
    setModeStats(modeStatsData);
    
    // Calculate total time
    const totalMinutes = conversations.reduce((sum, conv) => sum + (conv.duration / 60), 0);
    setTotalTime(totalMinutes);
    
    // Calculate average duration
    setAverageDuration(totalMinutes / totalConversations);
    
    // Get achievements
    if (progress.length > 0) {
      const allAchievements = progress.flatMap(p => {
        const achievementsArray = p.achievements as any[] || [];
        return achievementsArray.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon || 'star',
          unlockedAt: new Date(a.unlockedAt),
          category: a.category || 'conversation',
          modeId: p.mode,
        }));
      });
      
      setAchievements(allAchievements.slice(0, 5));
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadProgress(),
      loadConversations()
    ]);
    loadAnalyticsData();
    setIsRefreshing(false);
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const getWeekProgress = () => {
    const currentWeekTotal = weeklyData.reduce((sum, count) => sum + count, 0);
    
    // For simplicity, we'll just compare to a fixed number
    // In a real app, you'd compare to the previous week's data
    const lastWeekTotal = currentWeekTotal > 0 ? currentWeekTotal - 2 : 0;
    
    if (currentWeekTotal > lastWeekTotal) {
      return {
        change: currentWeekTotal - lastWeekTotal,
        isIncrease: true
      };
    } else {
      return {
        change: lastWeekTotal - currentWeekTotal,
        isIncrease: false
      };
    }
  };
  
  const weekProgress = getWeekProgress();
  
  // Render loading state
  if (conversations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
          style={styles.gradient}
        >
          <OfflineIndicator />
          
          <View style={styles.loadingContainer}>
            <BarChart3 size={64} color={colors.textTertiary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              No analytics data available yet
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.textTertiary }]}>
              Complete some conversations to see your progress
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
        <OfflineIndicator />
        
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

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                <MessageCircle size={20} color="white" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {conversations.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Conversations
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                <Clock size={20} color="white" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatTime(totalTime)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Time
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                <Flame size={20} color="white" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {streakDays}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Day Streak
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                <Target size={20} color="white" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {modeStats.length > 0 ? modeStats[0].mode.split('-')[0] : '-'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Top Mode
              </Text>
            </View>
          </View>

          {/* Weekly Activity Chart */}
          <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitle}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.chartTitleText, { color: colors.text }]}>
                  Weekly Activity
                </Text>
              </View>
              
              <View style={styles.weekProgress}>
                <TrendingUp size={14} color={weekProgress.isIncrease ? colors.success : colors.error} />
                <Text style={[
                  styles.weekProgressText, 
                  { color: weekProgress.isIncrease ? colors.success : colors.error }
                ]}>
                  {weekProgress.isIncrease ? '+' : '-'}{weekProgress.change} this week
                </Text>
              </View>
            </View>
            
            <View style={styles.chart}>
              {weeklyData.map((value, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: `${Math.max(5, value * 20)}%`,
                          backgroundColor: colors.primary 
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mode Distribution */}
          <View style={[styles.modeContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Target size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Conversation Modes
              </Text>
            </View>
            
            {modeStats.map((mode, index) => (
              <View key={index} style={styles.modeItem}>
                <View style={styles.modeInfo}>
                  <Text style={[styles.modeName, { color: colors.text }]}>
                    {mode.mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Text>
                  <Text style={[styles.modeCount, { color: colors.textSecondary }]}>
                    {mode.count} conversation{mode.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                <View style={styles.modePercentage}>
                  <Text style={[styles.percentageText, { color: colors.text }]}>
                    {mode.percentage}%
                  </Text>
                </View>
                
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${mode.percentage}%`,
                        backgroundColor: mode.color
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Insights */}
          <View style={[styles.insightsContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Insights
              </Text>
            </View>
            
            <View style={styles.insightsList}>
              <View style={[styles.insightCard, { backgroundColor: colors.primary + '10' }]}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  Average conversation: {formatTime(averageDuration)}
                </Text>
              </View>
              
              <View style={[styles.insightCard, { backgroundColor: colors.secondary + '10' }]}>
                <Calendar size={16} color={colors.secondary} />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  Most active day: {mostActiveDay}
                </Text>
              </View>
              
              {modeStats.length > 0 && (
                <View style={[styles.insightCard, { backgroundColor: colors.success + '10' }]}>
                  <Target size={16} color={colors.success} />
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    You've used {modeStats.length} different conversation modes
                  </Text>
                </View>
              )}
              
              {weekProgress.isIncrease && (
                <View style={[styles.insightCard, { backgroundColor: colors.warning + '10' }]}>
                  <TrendingUp size={16} color={colors.warning} />
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {weekProgress.change} more conversation{weekProgress.change !== 1 ? 's' : ''} this week than last
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Achievements */}
          {achievements.length > 0 && (
            <View style={[styles.achievementsContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Award size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent Achievements
                </Text>
              </View>
              
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
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
                    <Text style={[styles.achievementDate, { color: colors.textTertiary }]}>
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
              
              {achievements.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Complete more conversations to earn achievements!
                </Text>
              )}
            </View>
          )}

          {/* Export Section */}
          <View style={[styles.exportContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Share2 size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Share Your Progress
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              disabled={!isOnline}
            >
              <Text style={styles.exportButtonText}>
                Export Progress Summary
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.exportNote, { color: colors.textTertiary }]}>
              Export a summary of your conversation history and progress
            </Text>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RefreshCw size={16} color="white" />
            <Text style={styles.refreshButtonText}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  chartContainer: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chartTitleText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  weekProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  weekProgressText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    justifyContent: 'space-between',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: '85%',
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  modeContainer: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  modeItem: {
    marginBottom: spacing.md,
  },
  modeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modeName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  modeCount: {
    fontSize: typography.sizes.sm,
  },
  modePercentage: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  percentageText: {
    fontSize: typography.sizes.sm,
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
  insightsContainer: {
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
  insightsList: {
    gap: spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  insightText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  achievementsContainer: {
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
  achievementItem: {
    flexDirection: 'row',
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
    marginBottom: spacing.xs / 2,
  },
  achievementDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs / 2,
  },
  achievementDate: {
    fontSize: typography.sizes.xs,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.md,
  },
  exportContainer: {
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
  exportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  exportButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  exportNote: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    maxWidth: '80%',
  },
});