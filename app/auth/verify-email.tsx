import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

export default function VerifyEmailScreen() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/auth/sign-in')}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Verify Email
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Mail size={64} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Check Your Email
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </Text>

          {/* Steps */}
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Check your email inbox
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Click the verification link
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Return to the app and sign in
              </Text>
            </View>
          </View>

          {/* Note */}
          <View style={[styles.noteContainer, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              If you don't see the email, please check your spam folder or try signing in again to resend the verification email.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={styles.primaryButtonText}>
                Go to Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => router.push('/auth/welcome')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Back to Welcome
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.base * 1.4,
  },
  steps: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  stepText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  noteContainer: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xl,
    width: '100%',
  },
  noteText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
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
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});