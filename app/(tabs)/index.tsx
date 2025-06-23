import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Star, 
  TrendingUp, 
  Zap, 
  Filter,
  Search,
  Settings,
  Trophy,
  Target,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useUserStore } from '@/src/stores/userStore';
import { conversationModes } from '@/src/constants/conversationModes';
import { ModeSelectionCard } from '@/components/ModeSelectionCard';
import { ModeConfigurationModal } from '@/components/ModeConfigurationModal';
import { SupabaseConversationView } from '@/components/SupabaseConversationView';
import { supabaseClaudeAPI } from '@/services/supabaseClaudeAPI';
import { ConversationMode, ModeConfiguration, DailyChallenge } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user, analytics } = useUserStore();

  // Conversation state
  const [selectedMode, setSelectedMode] = useState<ConversationMode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // UI state
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  // Mock user preferences for favorites and recent modes
  const [favoriteMode, setFavoriteMode] = useState<string>('general-chat');
  const [recentModes, setRecentModes] = useState<string[]>(['interview-practice', 'presentation-prep']);

  useEffect(() => {
    // Check if Supabase is properly configured
    const status = supabaseClaudeAPI.getConfigStatus();
    setIsSupabaseConfigured(status.configured);
    
    loadDailyChallenges();
  }, []);

  const loadDailyChallenges = () => {
    // Mock daily challenges
    const mockChallenges: DailyChallenge[] = [
      {
        id: '1',
        modeId: 'debate-challenge',
        title: 'Climate Change Debate',
        description: 'Argue for renewable energy solutions',
        difficulty: 'intermediate',
        reward: { points: 100, badge: 'Climate Advocate' },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: '2',
        modeId: 'presentation-prep',
        title: 'Elevator Pitch Challenge',
        description: 'Perfect your 30-second pitch',
        difficulty: 'beginner',
        reward: { points: 50 },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: false,
      },
    ];
    setDailyChallenges(mockChallenges);
  };

  const handleModeSelect = (mode: ConversationMode) => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Configuration Required',
        'Supabase is not properly configured. Please check your environment variables and ensure the Claude API key is set in the Supabase Edge Function.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedMode(mode);
    setShowConfigModal(true);
  };

  const handleModeStart = (configuration: ModeConfiguration) => {
    const mode = conversationModes.find(m => m.id === configuration.modeId);
    if (!mode) return;

    // Update recent modes
    setRecentModes(prev => [mode.id, ...prev.filter(id => id !== mode.id)].slice(0, 3));
    
    // Start conversation with real Claude API integration
    setSessionId(Date.now().toString());
    setShowConfigModal(false);
  };

  const handleEndConversation = () => {
    setSelectedMode(null);
    setSessionId(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate loading new challenges and data
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadDailyChallenges();
    setRefreshing(false);
  };

  const filteredModes = conversationModes.filter(mode => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'favorites') return mode.id === favoriteMode;
    if (filterCategory === 'recent') return recentModes.includes(mode.id);
    return mode.category === filterCategory;
  });

  const categories = [
    { id: 'all', name: 'All', icon: Target },
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'recent', name: 'Recent', icon: TrendingUp },
    { id: 'social', name: 'Social', icon: null },
    { id: 'professional', name: 'Professional', icon: null },
    { id: 'creativity', name: 'Creative', icon: null },
  ];

  // If a conversation is active, show the conversation interface
  if (selectedMode && sessionId) {
    return (
      <SupabaseConversationView
        mode={selectedMode.id}
        sessionId={sessionId}
        onClose={handleEndConversation}
      />
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
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { color: colors.text }]}>
                  Ready to practice?
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isSupabaseConfigured 
                    ? 'Choose a conversation mode to get started'
                    : 'Configuration required to start conversations'
                  }
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  // Navigate to settings
                }}
              >
                <Settings size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!isSupabaseConfigured && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Supabase configuration required. Please check your environment variables.
                </Text>
              </View>
            )}
          </View>

          {/* Daily Challenges */}
          {dailyChallenges.length > 0 && (
            <View style={styles.challengesSection}>
              <View style={styles.sectionHeader}>
                <Trophy size={20} color={colors.warning} />
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
                  <TouchableOpacity
                    key={challenge.id}
                    style={[
                      styles.challengeCard, 
                      { backgroundColor: colors.surface },
                      !isSupabaseConfigured && styles.challengeCardDisabled
                    ]}
                    onPress={() => {
                      if (!isSupabaseConfigured) {
                        Alert.alert(
                          'Configuration Required',
                          'Please configure Supabase to start conversations.',
                          [{ text: 'OK' }]
                        );
                        return;
                      }
                      const mode = conversationModes.find(m => m.id === challenge.modeId);
                      if (mode) handleModeSelect(mode);
                    }}
                    disabled={!isSupabaseConfigured}
                  >
                    <View style={styles.challengeHeader}>
                      <Calendar size={16} color={colors.warning} />
                      <Text style={[styles.challengePoints, { color: colors.warning }]}>
                        +{challenge.reward.points}
                      </Text>
                    </View>
                    <Text style={[styles.challengeTitle, { color: colors.text }]}>
                      {challenge.title}
                    </Text>
                    <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
                      {challenge.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterButton,
                      filterCategory === category.id && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setFilterCategory(category.id)}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={16}
                        color={filterCategory === category.id ? 'white' : colors.textSecondary}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: filterCategory === category.id ? 'white' : colors.textSecondary,
                        },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Conversation Modes */}
          <View style={styles.modesContainer}>
            {filteredModes.map((mode) => (
              <ModeSelectionCard
                key={mode.id}
                mode={mode}
                onPress={handleModeSelect}
                onConfigure={(mode) => {
                  setSelectedMode(mode);
                  setShowConfigModal(true);
                }}
                isFavorite={mode.id === favoriteMode}
                isRecentlyUsed={recentModes.includes(mode.id)}
                lastUsed={recentModes.includes(mode.id) ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined}
              />
            ))}
          </View>

          {/* Quick Stats */}
          {analytics && (
            <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Progress
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {analytics.totalConversations}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Conversations
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.secondary }]}>
                    {analytics.streakDays}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Day Streak
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {analytics.averageScore.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Avg Score
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Configuration Help */}
          {!isSupabaseConfigured && (
            <View style={[styles.helpSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>
                Setup Required
              </Text>
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                To start conversations, please configure your Supabase settings:
              </Text>
              <View style={styles.helpSteps}>
                <Text style={[styles.helpStep, { color: colors.textSecondary }]}>
                  1. Set EXPO_PUBLIC_SUPABASE_URL in your .env file
                </Text>
                <Text style={[styles.helpStep, { color: colors.textSecondary }]}>
                  2. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file
                </Text>
                <Text style={[styles.helpStep, { color: colors.textSecondary }]}>
                  3. Deploy the Claude proxy Edge Function
                </Text>
                <Text style={[styles.helpStep, { color: colors.textSecondary }]}>
                  4. Set CLAUDE_API_KEY in Supabase dashboard
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.helpButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  router.push('/chat');
                }}
              >
                <Text style={styles.helpButtonText}>Go to Chat Tab for Setup</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <ModeConfigurationModal
        visible={showConfigModal}
        mode={selectedMode}
        onClose={() => setShowConfigModal(false)}
        onStart={handleModeStart}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.4,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningBanner: {
    padding: spacing.md,
    borderRadius: 8,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  challengesSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  challengesScroll: {
    paddingRight: spacing.lg,
  },
  challengeCard: {
    width: 200,
    padding: spacing.md,
    borderRadius: 12,
    marginRight: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeCardDisabled: {
    opacity: 0.5,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  challengePoints: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  challengeTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterScroll: {
    paddingRight: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  modesContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statsSection: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
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
  helpSection: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    marginBottom: spacing.md,
  },
  helpSteps: {
    marginBottom: spacing.lg,
  },
  helpStep: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.xs,
  },
  helpButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
});