import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, MessageSquare, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3761504/pexels-photo-3761504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', isDark ? '#0F172A' : '#F8FAFC']}
            style={styles.headerOverlay}
          />
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <Mic size={32} color="white" />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>VoiceAI</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Elevate Your Communication Skills
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Practice conversations, interviews, debates, and presentations with AI-powered feedback
          </Text>

          {/* Feature Highlights */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                <Mic size={20} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Voice-powered AI conversations
              </Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
                <MessageSquare size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                Real-time feedback and coaching
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/sign-up')}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={[styles.tertiaryButtonText, { color: colors.textSecondary }]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    height: height * 0.4,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.lg * 1.4,
  },
  features: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  tertiaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tertiaryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});