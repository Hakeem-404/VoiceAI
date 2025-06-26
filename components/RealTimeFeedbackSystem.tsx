import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { Conversation, RealTimeFeedback } from '@/src/types';
import { ConversationMessage } from '../../types/api';
import { RealTimeFeedbackIndicator } from './RealTimeFeedbackIndicator';
import { claudeFeedbackService } from '@/src/services/claudeFeedbackService';
import { spacing } from '@/src/constants/colors';

interface RealTimeFeedbackSystemProps {
  conversation: Conversation;
  messages: ConversationMessage[];
  isActive: boolean;
}

export function RealTimeFeedbackSystem({
  conversation,
  messages,
  isActive
}: RealTimeFeedbackSystemProps) {
  const { colors } = useTheme();
  const [currentFeedback, setCurrentFeedback] = useState<RealTimeFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<RealTimeFeedback[]>([]);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFeedbackTimeRef = useRef<number>(0);
  
  // Minimum time between feedback (in milliseconds)
  const FEEDBACK_COOLDOWN = 30000; // 30 seconds
  
  useEffect(() => {
    if (isActive) {
      startFeedbackMonitoring();
    } else {
      stopFeedbackMonitoring();
    }
    
    return () => {
      stopFeedbackMonitoring();
    };
  }, [isActive]);
  
  // Monitor for new messages to trigger feedback
  useEffect(() => {
    if (isActive && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only check for feedback after user messages and if enough time has passed
      if (lastMessage.role === 'user' && 
          Date.now() - lastFeedbackTimeRef.current > FEEDBACK_COOLDOWN) {
        checkForFeedback();
      }
    }
  }, [messages, isActive]);
  
  const startFeedbackMonitoring = () => {
    // Clear any existing timer
    if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
    }
    
    // Set up a timer to periodically check for feedback opportunities
    feedbackTimerRef.current = setInterval(() => {
      if (Date.now() - lastFeedbackTimeRef.current > FEEDBACK_COOLDOWN) {
        checkForFeedback();
      }
    }, 60000); // Check every minute
  };
  
  const stopFeedbackMonitoring = () => {
    if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };
  
  const checkForFeedback = async () => {
    if (messages.length < 3) return; // Need enough context
    
    try {
      const feedback = await claudeFeedbackService.generateRealTimeFeedback(
        messages,
        conversation.mode.id
      );
      
      if (feedback) {
        setCurrentFeedback(feedback);
        setFeedbackHistory(prev => [...prev, feedback]);
        lastFeedbackTimeRef.current = Date.now();
      }
    } catch (error) {
      console.warn('Failed to generate real-time feedback:', error);
    }
  };
  
  const handleDismissFeedback = () => {
    setCurrentFeedback(null);
  };
  
  return (
    <View style={styles.container}>
      {currentFeedback && (
        <RealTimeFeedbackIndicator
          feedback={currentFeedback}
          onDismiss={handleDismissFeedback}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
});