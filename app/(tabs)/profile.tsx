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
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { useDataPersistence } from '@/src/hooks/useDataPersistence';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { UserAvatar } from '@/components/UserAvatar';
import { SettingItem } from '@/components/SettingItem';
import { ProfileSettings } from '@/components/ProfileSettings';
import { VoiceSettingsModal } from '@/components/VoiceSettingsModal';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { ThemeSettingsModal } from '@/components/ThemeSettingsModal';
import { spacing, typography } from '@/src/constants/colors';

export default function ProfileScreen() {
  const { colors, isDark, theme } = useTheme();
  const { 
    user,
    setTheme,
    updatePreferences,
    isOnline,
    pendingChanges
  } = useDataPersistence();
  
  const { user: authUser, signOut } = useSupabaseAuth();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [profileUpdateKey, setProfileUpdateKey] = useState(0);

  // Local state for preferences
  const [localPreferences, setLocalPreferences] = useState({
    practiceReminders: true,
    achievements: false,
    darkMode: theme === 'dark',
  });

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
    setLocalPreferences(prev => ({ ...prev, darkMode: value }));
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

  // Save theme preference
  const saveThemePreference = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setTheme(newTheme);
    setShowThemeSettings(false);
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
          {user?.subscription?.expiresAt && (
            <Text style={styles.subscriptionExpiry}>
              Expires {user.subscription.expiresAt.toLocaleDateString()}
            </Text>
          )}
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
        <OfflineIndicator />
        <SyncStatusIndicator compact />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <UserAvatar 
              size={80} 
              showBadge={!!user?.subscription && user.subscription.tier !== 'free'}
              onPress={() => setShowSettings(true)}
            />
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Guest User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || 'Sign in to save your progress'}
            </Text>
          </View>

          {user?.subscription?.tier !== 'free' && <SubscriptionCard />}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>
            <SettingItem
              icon={isDark ? Moon : Sun}
              title="Dark Mode"
              subtitle="Change app appearance"
              type="toggle"
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              onPress={() => setShowThemeSettings(true)}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <SettingItem
              icon={Bell}
              title="Practice Reminders"
              subtitle="Configure notification settings"
              type="nav"
              onPress={() => setShowNotificationSettings(true)}
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
              onPress={() => setShowVoiceSettings(true)}
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
              onPress={() => setShowSettings(true)}
            />
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.6}
              onPress={async () => {
                if (authUser) {
                  await signOut();
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
      
      {/* Profile Settings Modal */}
      <ProfileSettings
        key={profileUpdateKey}
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        visible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
      
      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        initialSettings={{
          practiceReminders: localPreferences.practiceReminders,
          achievements: localPreferences.achievements,
        }}
        onSave={(settings) => {
          if (authUser) {
            updatePreferences(authUser.id, {
              notifications: settings
            });
          }
          setLocalPreferences(prev => ({
            ...prev,
            practiceReminders: settings.practiceReminders,
            achievements: settings.achievements,
          }));
          setShowNotificationSettings(false);
        }}
      />
      
      {/* Theme Settings Modal */}
      <ThemeSettingsModal
        visible={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
        isDarkMode={theme === 'dark'}
        onSave={saveThemePreference}
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