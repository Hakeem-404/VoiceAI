import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, FileText, User, Zap, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { spacing, typography } from '@/src/constants/colors';

interface InterviewSetupScreenProps {
  onQuickStart: () => void;
  onDocumentSelect: (type: 'job' | 'cv') => void;
  onContinue: () => void;
}

export function InterviewSetupScreen({
  onQuickStart,
  onDocumentSelect,
  onContinue,
}: InterviewSetupScreenProps) {
  const { colors } = useTheme();
  const { documentData } = useInputStore();

  return (
    <View style={styles.container}>
      {/* Quick Start Option */}
      <TouchableOpacity
        style={[styles.quickStartCard, { backgroundColor: colors.primary }]}
        onPress={onQuickStart}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.quickStartGradient}
        >
          <View style={styles.quickStartContent}>
            <Play size={32} color="white" />
            <View style={styles.quickStartTextContainer}>
              <Text style={styles.quickStartTitle}>Quick Interview</Text>
              <Text style={styles.quickStartDescription}>
                Start a general interview practice session immediately
              </Text>
            </View>
          </View>
          <ArrowRight size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Personalized Option */}
      <View style={[styles.personalizedSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.personalizedTitle, { color: colors.text }]}>
          Personalized Interview
        </Text>
        <Text style={[styles.personalizedDescription, { color: colors.textSecondary }]}>
          Get tailored questions based on your documents (optional)
        </Text>

        <View style={styles.documentCards}>
          {/* Job Description Card */}
          <TouchableOpacity
            style={[
              styles.documentCard, 
              { backgroundColor: colors.background },
              documentData.jobDescription ? { borderColor: colors.success, borderWidth: 1 } : null
            ]}
            onPress={() => onDocumentSelect('job')}
          >
            <FileText size={24} color={colors.primary} />
            <Text style={[styles.documentCardTitle, { color: colors.text }]}>
              Job Description
            </Text>
            <Text style={[styles.documentCardDescription, { color: colors.textSecondary }]}>
              {documentData.jobDescription 
                ? `${documentData.jobDescription.length} characters added` 
                : "Optional - Add for better results"}
            </Text>
            {documentData.jobDescription && (
              <View style={styles.documentStatus}>
                <CheckCircle size={16} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>

          {/* CV Card */}
          <TouchableOpacity
            style={[
              styles.documentCard, 
              { backgroundColor: colors.background },
              documentData.cvContent ? { borderColor: colors.success, borderWidth: 1 } : null
            ]}
            onPress={() => onDocumentSelect('cv')}
          >
            <User size={24} color={colors.secondary} />
            <Text style={[styles.documentCardTitle, { color: colors.text }]}>
              Your CV/Resume
            </Text>
            <Text style={[styles.documentCardDescription, { color: colors.textSecondary }]}>
              {documentData.cvContent 
                ? `${documentData.cvContent.length} characters added` 
                : "Optional - Add for better results"}
            </Text>
            {documentData.cvContent && (
              <View style={styles.documentStatus}>
                <CheckCircle size={16} color={colors.success} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            {
              backgroundColor: (documentData.jobDescription || documentData.cvContent) 
                ? colors.primary 
                : colors.border
            }
          ]}
          onPress={onContinue}
          disabled={!documentData.jobDescription && !documentData.cvContent}
        >
          <Zap size={20} color="white" />
          <Text style={styles.analyzeButtonText}>
            {documentData.isValid 
              ? 'Analyze & Start Practice' 
              : (documentData.jobDescription || documentData.cvContent)
                ? 'Continue with Documents'
                : 'Skip Documents'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickStartCard: {
    borderRadius: 16,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickStartTextContainer: {
    flex: 1,
  },
  quickStartTitle: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  quickStartDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
  },
  personalizedSection: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  personalizedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  personalizedDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  documentCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  documentCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  documentCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  documentCardDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  documentStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});