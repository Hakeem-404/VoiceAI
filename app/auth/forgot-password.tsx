import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Mail, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import supabase from '@/src/lib/supabase';
import { spacing, typography } from '@/src/constants/colors';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form validation
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };
  
  const handleResetPassword = async () => {
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate form
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Reset Password
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Forgot your password?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Success Message */}
          {success && (
            <View style={[styles.successContainer, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>
                Reset link sent! Check your email inbox and follow the instructions to reset your password.
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email
              </Text>
              <View style={[
                styles.inputContainer,
                { 
                  borderColor: emailError ? colors.error : colors.border,
                  backgroundColor: colors.surface
                }
              ]}>
                <Mail size={20} color={emailError ? colors.error : colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!success}
                />
              </View>
              {emailError && (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {emailError}
                </Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: colors.primary },
                (loading || success) && styles.disabledButton
              ]}
              onPress={handleResetPassword}
              disabled={loading || success}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>
                  {success ? 'Email Sent' : 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backToSignIn}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={[styles.backToSignInText, { color: colors.textSecondary }]}>
                Back to Sign In
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
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    marginLeft: spacing.sm,
  },
  fieldError: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  backToSignIn: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backToSignInText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});