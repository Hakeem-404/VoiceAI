import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Volume2,
  Award,
  Crown,
  ChevronRight,
  LogOut
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { SettingItem } from '@/components/SettingItem';
import { UserAvatar } from '@/components/UserAvatar';
import { GuestModePrompt } from '@/components/GuestModePrompt';
import { ProfileSettings } from '@/components/ProfileSettings';
import { spacing, typography } from '@/src/constants/colors';

export default function ProfileScreen() {
  const { colors, isDark, theme } = useTheme();
  const { 
    user, 
    theme: userTheme, 
    setTheme, 
    updatePreferences 
  } = useUserStore();
  const { user: authUser, signOut } = useSupabaseAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [promptFeature, setPromptFeature] = useState<'save' | 'history' | 'voice' | 'analytics' | 'premium'>('save');
  const [showSettings, setShowSettings] = useState(false);
  const [profileUpdateKey, setProfileUpdateKey] = useState(0);

  // Local state for preferences
  const [localPreferences, setLocalPreferences] = useState({
    practiceReminders: true,
    achievements: false,
  });

  // Reset auth prompt when user authentication status changes
  useEffect(() => {
    if (authUser) {
      setShowAuthPrompt(false);
    }
  }, [authUser]);

  // Refresh user data when profile is updated
  const handleProfileUpdated = () => {
    console.log('Profile updated callback triggered');
    setProfileUpdateKey(prev => {
      const newKey = prev + 1;
      console.log('Profile update key changed from', prev, 'to', newKey);
      return newKey;
    });
    console.log('Profile updated, refreshing user data...');
  };

  // Handle theme changes
  const handleThemeChange = (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (authUser) {
      updatePreferences(authUser.id, { theme: newTheme });
    }
  };

  // Handle preference updates
  const handlePreferenceUpdate = async (key: string, value: boolean) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    
    if (authUser) {
      const notificationUpdates = {
        ...localPreferences,
        [key]: value,
      };
      
      await updatePreferences(authUser.id, {
        notifications: notificationUpdates
      });
    }
  };

  const mockUser = {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    preferences: {
      theme: userTheme,
      voiceSettings: {
        selectedVoice: 'en-US-Standard-A',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
      },
      notifications: {
        practiceReminders: localPreferences.practiceReminders,
        dailyGoals: true,
        achievements: localPreferences.achievements,
      },
      language: 'en-US',
    },
    subscription: {
      tier: 'premium' as const,
      expiresAt: new Date('2024-12-31'),
      features: ['unlimited_conversations', 'advanced_analytics', 'custom_voices'],
    },
    createdAt: new Date('2024-01-15'),
  };

  const SubscriptionCard = () => (
    <View style={[styles.subscriptionCard, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.subscriptionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.subscriptionContent}>
          <Crown size={24} color="white" />
          <Text style={styles.subscriptionTitle}>Premium Member</Text>
          <Text style={styles.subscriptionExpiry}>
            Expires Dec 31, 2024
          </Text>
        </View>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

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
            <UserAvatar 
              size={80} 
              showBadge={true} 
              onPress={() => {
                if (!authUser) {
                  setPromptFeature('save');
                  setShowAuthPrompt(true);
                }
              }}
            />
            <Text style={[styles.userName, { color: colors.text }]}>
              {authUser?.user_metadata?.name || user?.name || 'Guest User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {authUser?.email || user?.email || 'Sign in to save your progress'}
            </Text>
          </View>

          <SubscriptionCard />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>
            <SettingItem
              icon={isDark ? Moon : Sun}
              title="Dark Mode"
              subtitle="Automatically adapts to system preference"
              value={userTheme === 'dark'}
              onValueChange={handleThemeChange}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <SettingItem
              icon={Bell}
              title="Practice Reminders"
              subtitle="Daily reminders to practice speaking"
              value={localPreferences.practiceReminders}
              onValueChange={(value) => handlePreferenceUpdate('practiceReminders', value)}
            />
            <SettingItem
              icon={Award}
              title="Achievement Notifications"
              subtitle="Get notified when you unlock achievements"
              value={localPreferences.achievements}
              onValueChange={(value) => handlePreferenceUpdate('achievements', value)}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Voice Settings
            </Text>
            <SettingItem
              icon={Volume2}
              title="Voice & Speech"
              subtitle="Customize voice speed, pitch, and language"
              type="nav"
              onPress={() => {
                // TODO: Navigate to voice settings screen
                console.log('Voice settings pressed');
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
            <SettingItem
              icon={Settings}
              title="Account Settings"
              subtitle="Manage your account and privacy"
              type="nav"
              onPress={() => {
                if (authUser) {
                  setShowSettings(true);
                } else {
                  setPromptFeature('save');
                  setShowAuthPrompt(true);
                }
              }}
            />
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.6}
              onPress={async () => {
                if (authUser) {
                  await signOut();
                } else {
                  setPromptFeature('save');
                  setShowAuthPrompt(true);
                }
              }}
            >
              <LogOut size={20} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {authUser ? 'Sign Out' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* Auth Prompt Modal */}
      <GuestModePrompt
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        feature={promptFeature}
      />
      
      {/* Profile Settings Modal */}
      <ProfileSettings
        key={profileUpdateKey}
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileUpdated={handleProfileUpdated}
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
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.base,
  },
  subscriptionCard: {
    borderRadius: 16,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  subscriptionGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  subscriptionExpiry: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.sm,
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  manageButtonText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.md,
  },
});