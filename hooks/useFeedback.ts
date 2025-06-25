import { useState, useEffect, useCallback } from 'react';
import { Conversation, FeedbackData, FeedbackMetrics, RealTimeFeedback, FeedbackSummary } from '@/src/types';
import { feedbackService } from '@/src/services/feedbackService';

interface UseFeedbackOptions {
  conversation: Conversation | null;
  isActive?: boolean;
  autoUpdate?: boolean;
  updateInterval?: number;
}

export function useFeedback({
  conversation,
  isActive = true,
  autoUpdate = true,
  updateInterval = 10000, // 10 seconds
}: UseFeedbackOptions) {
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealTimeFeedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<RealTimeFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize metrics
  useEffect(() => {
    if (isActive && conversation) {
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
    }
  }, [isActive, conversation]);

  // Auto-update metrics
  useEffect(() => {
    if (!isActive || !conversation || !autoUpdate) return;
    
    const updateMetricsInterval = setInterval(() => {
      updateMetrics();
    }, updateInterval);
    
    return () => clearInterval(updateMetricsInterval);
  }, [isActive, conversation, autoUpdate, updateInterval]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!conversation) return;
    
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
    
    // Occasionally generate real-time feedback
    if (Math.random() < 0.3 && !currentFeedback) { // 30% chance to show feedback if none is showing
      const feedbackTypes: Array<RealTimeFeedback['type']> = ['pace', 'filler', 'engagement', 'question', 'clarity'];
      const randomType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
      
      const newFeedback: RealTimeFeedback = {
        type: randomType,
        message: getFeedbackMessage(randomType, mockMetrics),
        severity: 'suggestion',
        timestamp: new Date(),
      };
      
      setCurrentFeedback(newFeedback);
      setRealtimeFeedback(prev => [...prev, newFeedback]);
    }
  }, [conversation, currentFeedback]);

  // Generate comprehensive feedback
  const generateFeedback = useCallback(async () => {
    if (!conversation) {
      setError('No conversation available for feedback');
      return null;
    }
    
    setIsGenerating(true);
    setError(null);
    
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

  // Helper function to get feedback message
  const getFeedbackMessage = (type: RealTimeFeedback['type'], metrics: FeedbackMetrics): string => {
    switch (type) {
      case 'pace':
        return metrics.speakingPace > 160 
          ? 'Try slowing down a bit for better clarity' 
          : metrics.speakingPace < 120
            ? 'Try speaking a bit faster to maintain engagement'
            : 'Good pace, keep it up!';
      case 'filler':
        return metrics.fillerWordFrequency > 3
          ? 'Try to reduce filler words like "um" and "uh"'
          : 'Good job minimizing filler words';
      case 'engagement':
        return metrics.engagementLevel < 70
          ? 'Try to be more engaged in the conversation'
          : 'Great energy! Keep the engagement high';
      case 'question':
        return metrics.questionFrequency < 1
          ? 'Try asking more follow-up questions'
          : 'Good job asking questions';
      case 'clarity':
        return metrics.sentenceComplexity > 18
          ? 'Try using simpler sentences for clarity'
          : 'Good clarity in your explanations';
      default:
        return 'Keep up the good work!';
    }
  };

  return {
    metrics,
    feedback,
    summary,
    realtimeFeedback,
    currentFeedback,
    isGenerating,
    error,
    updateMetrics,
    generateFeedback,
    dismissFeedback,
  };
}