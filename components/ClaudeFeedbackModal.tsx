import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star, 
  Award, 
  ArrowRight, 
  X,
  BarChart3,
  Share2,
  MessageSquare,
  Brain,
  Zap,
  Target
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackData, FeedbackSummary, Conversation } from '@/src/types';
import { FeedbackSummaryCard } from './FeedbackSummaryCard';
import { DetailedFeedbackScreen } from './DetailedFeedbackScreen';
import { claudeFeedbackService } from '@/src/services/claudeFeedbackService';
import { spacing, typography } from '@/src/constants/colors';

interface ClaudeFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function ClaudeFeedbackModal({ 
  visible, 
  onClose,
  conversation
}: ClaudeFeedbackModalProps) {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>('Analyzing conversation...');

  useEffect(() => {
    if (visible) {
      generateFeedback();
    }
  }, [visible]);

  const generateFeedback = async () => {
    setIsLoading(true);
    setAnalysisStage('Analyzing conversation...');
    
    try {
      // Simulate analysis stages for better UX
      setTimeout(() => setAnalysisStage('Evaluating communication patterns...'), 1000);
      setTimeout(() => setAnalysisStage('Identifying strengths and areas for improvement...'), 3000);
      setTimeout(() => setAnalysisStage('Generating personalized recommendations...'), 5000);
      
      // Generate feedback using Claude
      const feedbackData = await claudeFeedbackService.generateFeedback(conversation);
      setFeedback(feedbackData);
      
      // Generate summary
      const summaryData = claudeFeedbackService.generateFeedbackSummary(
        feedbackData, 
        conversation.mode.id
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    setShowDetailedFeedback(true);
  };

  const handleCloseDetails = () => {
    setShowDetailedFeedback(false);
  };

  const handleShare = () => {
    // Share functionality would be implemented here
    console.log('Share feedback');
  };

  if (showDetailedFeedback && feedback) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDetailedFeedback(false)}
      >
        <DetailedFeedbackScreen
          feedback={feedback}
          conversationMode={conversation.mode.id}
          conversationDuration={conversation.duration}
          onClose={handleCloseDetails}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI-Powered Feedback
            </Text>
            
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Share2 size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Intelligent analysis of your {conversation.mode.name.toLowerCase()} conversation
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.analysisStages}>
                <View style={[styles.analysisIcon, { backgroundColor: colors.primary }]}>
                  <Brain size={32} color="white" />
                </View>
                <View style={styles.analysisSteps}>
                  <View style={styles.analysisStep}>
                    <MessageSquare size={20} color={colors.primary} />
                    <Text style={[styles.analysisStepText, { color: colors.text }]}>
                      Processing conversation data
                    </Text>
                    <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  </View>
                  <View style={styles.analysisStep}>
                    <Brain size={20} color={colors.primary} />
                    <Text style={[styles.analysisStepText, { color: colors.text }]}>
                      {analysisStage}
                    </Text>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                  <View style={styles.analysisStep}>
                    <Zap size={20} color={colors.textTertiary} />
                    <Text style={[styles.analysisStepText, { color: colors.textTertiary }]}>
                      Generating personalized insights
                    </Text>
                  </View>
                  <View style={styles.analysisStep}>
                    <Target size={20} color={colors.textTertiary} />
                    <Text style={[styles.analysisStepText, { color: colors.textTertiary }]}>
                      Creating improvement recommendations
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Using Claude AI to analyze your conversation...
              </Text>
            </View>
          ) : summary ? (
            <FeedbackSummaryCard
              summary={summary}
              conversationMode={conversation.mode.id}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.text }]}>
                Unable to generate feedback at this time.
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={generateFeedback}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && summary && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleViewDetails}
              >
                <BarChart3 size={20} color="white" />
                <Text style={styles.actionButtonText}>View Detailed Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  // Navigate to practice screen
                  onClose();
                }}
              >
                <Award size={20} color="white" />
                <Text style={styles.actionButtonText}>Practice Recommendations</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  shareButton: {
    padding: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  analysisStages: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  analysisIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  analysisSteps: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  analysisStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  analysisStepText: {
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  actionButtonText: {
    color: 'white',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});