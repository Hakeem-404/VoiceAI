import { useState, useEffect, useCallback } from 'react';
import { Conversation, FeedbackData, FeedbackMetrics, RealTimeFeedback, FeedbackSummary } from '@/src/types';
import { claudeFeedbackService } from '@/src/services/claudeFeedbackService';
import { ConversationMessage } from '../../types/api';

interface UseFeedbackOptions {
  conversation: Conversation | null;
  messages?: ConversationMessage[];
  isActive?: boolean;
  autoUpdate?: boolean;
  updateInterval?: number;
}

export function useFeedback({
  conversation,
  messages = [],
  isActive = true,
  autoUpdate = true,
  updateInterval = 60000, // 1 minute
}: UseFeedbackOptions) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealTimeFeedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<RealTimeFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);

  // Auto-update real-time feedback
  useEffect(() => {
    if (!isActive || !conversation || !autoUpdate || messages.length < 3) return;
    
    const checkForFeedback = async () => {
      // Only check for feedback if enough time has passed since last feedback
      const now = Date.now();
      if (now - lastFeedbackTime < 30000) return; // At least 30 seconds between feedback
      
      try {
        const feedback = await claudeFeedbackService.generateRealTimeFeedback(
          messages,
          conversation.mode.id
        );
        
        if (feedback) {
          setCurrentFeedback(feedback);
          setRealtimeFeedback(prev => [...prev, feedback]);
          setLastFeedbackTime(now);
        }
      } catch (error) {
        console.warn('Failed to generate real-time feedback:', error);
      }
    };
    
    const interval = setInterval(checkForFeedback, updateInterval);
    
    // Also check when messages change significantly
    if (messages.length % 3 === 0) { // Check every 3 messages
      checkForFeedback();
    }
    
    return () => clearInterval(interval);
  }, [isActive, conversation, autoUpdate, updateInterval, messages, lastFeedbackTime]);

  // Generate comprehensive feedback
  const generateFeedback = useCallback(async () => {
    if (!conversation) {
      setError('No conversation available for feedback');
      return null;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate feedback using Claude
      const feedbackData = await claudeFeedbackService.generateFeedback(conversation);
      setFeedback(feedbackData);
      
      // Generate summary
      const summaryData = claudeFeedbackService.generateFeedbackSummary(
        feedbackData, 
        conversation.mode.id
      );
      setSummary(summaryData);
      
      return feedbackData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [conversation]);

  // Dismiss current feedback
  const dismissFeedback = useCallback(() => {
    setCurrentFeedback(null);
  }, []);

  return {
    feedback,
    summary,
    realtimeFeedback,
    currentFeedback,
    isGenerating,
    error,
    generateFeedback,
    dismissFeedback,
  };
}