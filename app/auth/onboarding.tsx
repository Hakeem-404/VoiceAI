import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, MessageSquare, Target, ChevronRight, CircleCheck as CheckCircle, Settings, Bell } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import * as supabaseService from '@/src/services/supabaseService';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
}

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useSupabaseAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissions, setPermissions] = useState({
    microphone: false,
    notifications: false,
  });
  
  const flatListRef = useRef<FlatList>(null);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: true }));
      } catch (error) {
        console.error('Microphone permission denied:', error);
      }
    } else {
      // For native platforms, we'd use expo-permissions
      // For now, just simulate success
      setPermissions(prev => ({ ...prev, microphone: true }));
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'web' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: permission === 'granted' }));
      } catch (error) {
        console.error('Notification permission error:', error);
      }
    } else {
      // For native platforms, we'd use expo-notifications
      // For now, just simulate success
      setPermissions(prev => ({ ...prev, notifications: true }));
    }
  };

  // Save user preferences
  const savePreferences = async () => {
    if (user) {
      try {
        await supabaseService.updateUserPreferences(user.id, {
          onboardingCompleted: true,
          permissions: {
            microphone: permissions.microphone,
            notifications: permissions.notifications,
          }
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
  };

  // Onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to VoiceAI',
      description: 'Your personal AI conversation companion for improving communication skills',
      icon: <Mic size={48} color={colors.primary} />,
    },
    {
      id: 'microphone',
      title: 'Enable Voice Features',
      description: 'Allow microphone access to use voice conversations and get real-time feedback',
      icon: <Mic size={48} color={colors.primary} />,
      action: requestMicrophonePermission,
    },
    {
      id: 'notifications',
      title: 'Stay on Track',
      description: 'Enable notifications to receive practice reminders and achievement updates',
      icon: <Bell size={48} color={colors.primary} />,
      action: requestNotificationPermission,
    },
    {
      id: 'modes',
      title: 'Practice Modes',
      description: 'Choose from different conversation modes to improve specific communication skills',
      icon: <Target size={48} color={colors.primary} />,
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start your first conversation and begin improving your communication skills',
      icon: <CheckCircle size={48} color={colors.success} />,
    },
  ];

  const goToNextStep = () => {
    if (currentIndex < steps.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      // Complete onboarding
      savePreferences();
      router.replace('/(tabs)');
    }
  };

  const handleStepAction = () => {
    const currentStep = steps[currentIndex];
    if (currentStep.action) {
      currentStep.action();
    }
    goToNextStep();
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.stepContainer, { width }]}>
      <View style={styles.stepContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          {item.icon}
        </View>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
        
        {/* Permission Status */}
        {item.id === 'microphone' && (
          <View style={[
            styles.permissionStatus,
            { 
              backgroundColor: permissions.microphone 
                ? colors.success + '20' 
                : colors.warning + '20' 
            }
          ]}>
            {permissions.microphone ? (
              <CheckCircle size={20} color={colors.success} />
            ) : (
              <Settings size={20} color={colors.warning} />
            )}
            <Text style={[
              styles.permissionText,
              { 
                color: permissions.microphone 
                  ? colors.success 
                  : colors.warning 
              }
            ]}>
              {permissions.microphone 
                ? 'Microphone access granted' 
                : 'Microphone permission required'
              }
            </Text>
          </View>
        )}
        
        {item.id === 'notifications' && (
          <View style={[
            styles.permissionStatus,
            { 
              backgroundColor: permissions.notifications 
                ? colors.success + '20' 
                : colors.warning + '20' 
            }
          ]}>
            {permissions.notifications ? (
              <CheckCircle size={20} color={colors.success} />
            ) : (
              <Settings size={20} color={colors.warning} />
            )}
            <Text style={[
              styles.permissionText,
              { 
                color: permissions.notifications 
                  ? colors.success 
                  : colors.warning 
              }
            ]}>
              {permissions.notifications 
                ? 'Notifications enabled' 
                : 'Notifications recommended'
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        {/* Skip Button */}
        {currentIndex < steps.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              savePreferences();
              router.replace('/(tabs)');
            }}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}

        {/* Steps */}
        <FlatList
          ref={flatListRef}
          data={steps}
          renderItem={renderStep}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.stepsList}
        />

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                { 
                  backgroundColor: index === currentIndex 
                    ? colors.primary 
                    : colors.border 
                }
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleStepAction}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === steps.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  stepsList: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepDescription: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.lg * 1.4,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  permissionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
});