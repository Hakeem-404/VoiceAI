import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { User, LogIn, Save, X } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface GuestModePromptProps {
  visible: boolean;
  onClose: () => void;
  feature: 'save' | 'history' | 'voice' | 'analytics' | 'premium';
}

export function GuestModePrompt({ visible, onClose, feature }: GuestModePromptProps) {
  const { colors, isDark } = useTheme();

  const getFeatureDetails = () => {
    switch (feature) {
      case 'save':
        return {
          title: 'Save Your Progress',
          description: 'Create an account to save your conversations and track your progress over time.',
          icon: <Save size={48} color={colors.primary} />,
        };
      case 'history':
        return {
          title: 'Access Conversation History',
          description: 'Sign up to access your conversation history and review past practice sessions.',
          icon: <Save size={48} color={colors.primary} />,
        };
      case 'voice':
        return {
          title: 'Unlock Voice Features',
          description: 'Create an account to access advanced voice features and personalized voice profiles.',
          icon: <Save size={48} color={colors.primary} />,
        };
      case 'analytics':
        return {
          title: 'View Detailed Analytics',
          description: 'Sign up to access detailed analytics and track your communication skill improvements.',
          icon: <Save size={48} color={colors.primary} />,
        };
      case 'premium':
        return {
          title: 'Access Premium Features',
          description: 'Create an account to unlock premium features and enhance your practice experience.',
          icon: <Save size={48} color={colors.primary} />,
        };
      default:
        return {
          title: 'Create an Account',
          description: 'Sign up to unlock all features and save your progress.',
          icon: <User size={48} color={colors.primary} />,
        };
    }
  };

  const featureDetails = getFeatureDetails();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            {featureDetails.icon}
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {featureDetails.title}
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {featureDetails.description}
          </Text>
          
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.benefitCheck, { color: colors.success }]}>✓</Text>
              </View>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Save conversations and progress
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.benefitCheck, { color: colors.success }]}>✓</Text>
              </View>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Access from multiple devices
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.benefitCheck, { color: colors.success }]}>✓</Text>
              </View>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Unlock all practice modes
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              onClose();
              router.push('/auth/sign-up');
            }}
          >
            <User size={20} color="white" />
            <Text style={styles.signUpButtonText}>
              Create Free Account
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.signInButton, { borderColor: colors.border }]}
            onPress={() => {
              onClose();
              router.push('/auth/sign-in');
            }}
          >
            <LogIn size={20} color={colors.primary} />
            <Text style={[styles.signInButtonText, { color: colors.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={[styles.continueButtonText, { color: colors.textSecondary }]}>
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.base * 1.4,
  },
  benefits: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  benefitCheck: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  benefitText: {
    fontSize: typography.sizes.base,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  signUpButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  signInButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  continueButton: {
    padding: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});