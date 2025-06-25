import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star, 
  Award, 
  ArrowRight, 
  X,
  BarChart3,
  Share2
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackData, FeedbackSummary, Conversation } from '@/src/types';
import { FeedbackSummaryCard } from './FeedbackSummaryCard';
import { DetailedFeedbackScreen } from './DetailedFeedbackScreen';
import { feedbackService } from '@/src/services/feedbackService';
import { spacing, typography } from '@/src/constants/colors';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function FeedbackModal({ 
  visible, 
  onClose,
  conversation
}: FeedbackModalProps) {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  React.useEffect(() => {
    if (visible) {
      generateFeedback();
    }
  }, [visible]);

  const generateFeedback = async () => {
    setIsLoading(true);
    
    try {
      // Generate feedback
      const feedbackData = await feedbackService.generateFeedback(conversation);
      setFeedback(feedbackData);
      
      // Generate summary
      const summaryData = feedbackService.generateFeedbackSummary(
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
              Conversation Feedback
            </Text>
            
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Share2 size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Analysis of your {conversation.mode.name.toLowerCase()} conversation
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <BarChart3 size={48} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Analyzing your conversation...
              </Text>
              <ActivityIndicator 
                size="large" 
                color={colors.primary} 
                style={styles.loadingIndicator} 
              />
              <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
                Generating personalized insights and feedback
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
  loadingText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingIndicator: {
    marginVertical: spacing.lg,
  },
  loadingSubtext: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
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