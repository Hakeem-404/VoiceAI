import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Conversation, FeedbackMetrics, RealTimeFeedback } from '@/src/types';
import { ConversationFeedbackIndicator } from './ConversationFeedbackIndicator';
import { ConversationMetricsDisplay } from './ConversationMetricsDisplay';
import { FeedbackButton } from './FeedbackButton';
import { FeedbackModal } from './FeedbackModal';
import { feedbackService } from '@/src/services/feedbackService';
import { spacing } from '@/src/constants/colors';

interface ConversationFeedbackSystemProps {
  conversation: Conversation;
  isActive: boolean;
  showMetrics?: boolean;
}

export function ConversationFeedbackSystem({ 
  conversation, 
  isActive,
  showMetrics = true
}: ConversationFeedbackSystemProps) {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [feedback, setFeedback] = useState<RealTimeFeedback | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [overallScore, setOverallScore] = useState<number | undefined>(undefined);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isActive]);

  useEffect(() => {
    // Update metrics when conversation changes
    if (conversation && isActive) {
      updateMetrics();
    }
  }, [conversation, isActive]);

  const startMonitoring = () => {
    // Initialize metrics
    const initialMetrics: FeedbackMetrics = {
      speakingPace: 0,
      pauseFrequency: 0,
      fillerWordFrequency: 0,
      responseTime: 0,
      questionFrequency: 0,
      sentenceComplexity: 0,
      vocabularyDiversity: 0,
      topicRelevance: 0,
      emotionalTone: 0,
      engagementLevel: 0,
      speakingListeningRatio: 0,
    };
    
    setMetrics(initialMetrics);
    
    // Start real-time feedback monitoring
    monitoringInterval.current = feedbackService.startRealTimeFeedback(conversation.mode.id);
  };

  const stopMonitoring = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  const updateMetrics = () => {
    // In a real implementation, this would analyze the conversation in real-time
    // For now, we'll use mock data that changes slightly each time
    
    const mockMetrics: FeedbackMetrics = {
      speakingPace: 120 + Math.random() * 40, // 120-160 wpm
      pauseFrequency: 2 + Math.random() * 4, // 2-6 pauses per minute
      fillerWordFrequency: 1 + Math.random() * 3, // 1-4 filler words per minute
      responseTime: 1 + Math.random() * 2, // 1-3 seconds
      questionFrequency: 1 + Math.random() * 2, // 1-3 questions per minute
      sentenceComplexity: 10 + Math.random() * 8, // 10-18 words per sentence
      vocabularyDiversity: 0.4 + Math.random() * 0.3, // 0.4-0.7 unique words ratio
      topicRelevance: 70 + Math.random() * 20, // 70-90% relevance
      emotionalTone: -10 + Math.random() * 40, // -10 to 30 (negative to positive)
      engagementLevel: 60 + Math.random() * 30, // 60-90% engagement
      speakingListeningRatio: 0.8 + Math.random() * 0.4, // 0.8-1.2 ratio
    };
    
    setMetrics(mockMetrics);
    
    // Occasionally show real-time feedback
    if (Math.random() < 0.3 && !feedback) { // 30% chance to show feedback if none is showing
      const feedbackTypes: Array<RealTimeFeedback['type']> = ['pace', 'filler', 'engagement', 'question', 'clarity'];
      const randomType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
      
      const newFeedback: RealTimeFeedback = {
        type: randomType,
        message: getFeedbackMessage(randomType, mockMetrics),
        severity: 'suggestion',
        timestamp: new Date(),
      };
      
      setFeedback(newFeedback);
    }
    
    // Calculate overall score
    const overallScore = Math.round(
      (mockMetrics.speakingPace > 0 ? 100 - Math.abs(mockMetrics.speakingPace - 140) * 0.5 : 50) * 0.2 +
      (100 - mockMetrics.fillerWordFrequency * 10) * 0.2 +
      mockMetrics.topicRelevance * 0.3 +
      mockMetrics.engagementLevel * 0.3
    );
    
    setOverallScore(overallScore);
  };

  const getFeedbackMessage = (type: RealTimeFeedback['type'], metrics: FeedbackMetrics): string => {
    switch (type) {
      case 'pace':
        return metrics.speakingPace > 160 
          ? 'Try slowing down a bit for better clarity' 
          : 'Good pace, keep it up!';
      case 'filler':
        return 'Try to reduce filler words like "um" and "uh"';
      case 'engagement':
        return 'Great energy! Keep the engagement high';
      case 'question':
        return 'Try asking more follow-up questions';
      case 'clarity':
        return 'Good clarity in your explanations';
      default:
        return 'Keep up the good work!';
    }
  };

  const handleDismissFeedback = () => {
    setFeedback(null);
  };

  const handleViewFullAnalytics = () => {
    setShowFeedbackModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Real-time feedback indicator */}
      {feedback && (
        <ConversationFeedbackIndicator
          feedback={feedback}
          onDismiss={handleDismissFeedback}
          position="top"
        />
      )}
      
      {/* Metrics display */}
      {showMetrics && metrics && (
        <ConversationMetricsDisplay
          metrics={metrics}
          conversationMode={conversation.mode.id}
          onViewFullAnalytics={handleViewFullAnalytics}
        />
      )}
      
      {/* Feedback button */}
      {!showMetrics && (
        <View style={styles.buttonContainer}>
          <FeedbackButton
            onPress={handleViewFullAnalytics}
            score={overallScore}
            showScore={!!overallScore}
          />
        </View>
      )}
      
      {/* Feedback modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        conversation={conversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
});