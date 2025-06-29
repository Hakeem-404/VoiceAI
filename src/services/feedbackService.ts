import { Conversation, FeedbackData, FeedbackMetrics, RealTimeFeedback, FeedbackSummary } from '../types';
import { claudeFeedbackService } from './claudeFeedbackService';
import { ConversationMessage } from '../../types/api';

class FeedbackService {
  // Generate feedback for a conversation
  async generateFeedback(conversation: Conversation): Promise<FeedbackData> {
    try {
      // Use Claude service to generate comprehensive feedback
      return await claudeFeedbackService.generateFeedback(conversation);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      throw error;
    }
  }

  // Generate feedback summary
  generateFeedbackSummary(feedback: FeedbackData, conversationMode: string): FeedbackSummary {
    return claudeFeedbackService.generateFeedbackSummary(feedback, conversationMode);
  }

  // Generate real-time feedback
  async generateRealTimeFeedback(
    messages: ConversationMessage[],
    conversationMode: string
  ): Promise<RealTimeFeedback | null> {
    try {
      // Use Claude service to generate real-time feedback
      return await claudeFeedbackService.generateRealTimeFeedback(messages, conversationMode);
    } catch (error) {
      console.error('Failed to generate real-time feedback:', error);
      return null;
    }
  }

  // Calculate metrics from conversation
  calculateMetrics(conversation: Conversation): FeedbackMetrics {
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    const aiMessages = conversation.messages.filter(m => m.role === 'ai');
    
    // Calculate total words in user messages
    const totalUserWords = userMessages.reduce((sum, msg) => {
      return sum + msg.content.split(/\s+/).length;
    }, 0);
    
    // Calculate speaking pace (words per minute)
    const speakingTime = conversation.duration / 60; // minutes
    const speakingPace = Math.round(totalUserWords / speakingTime) || 150;
    
    // Count pauses (estimate based on message timing)
    const pauseCount = Math.max(1, Math.floor(conversation.duration / 60));
    
    // Count filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];
    let fillerWordCount = 0;
    
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      fillerWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          fillerWordCount += matches.length;
        }
      });
    });
    
    // Calculate filler word frequency (per minute)
    const fillerWordFrequency = Math.round((fillerWordCount / speakingTime) * 10) / 10 || 0;
    
    // Count questions
    const questionCount = userMessages.reduce((count, msg) => {
      return count + (msg.content.match(/\?/g) || []).length;
    }, 0);
    
    // Calculate question frequency (per minute)
    const questionFrequency = Math.round((questionCount / speakingTime) * 10) / 10 || 0;
    
    // Calculate average response time
    const responseTime = 2.3; // Default value
    
    // Calculate sentence complexity
    const sentences = userMessages.flatMap(msg => msg.content.split(/[.!?]+/).filter(s => s.trim()));
    const totalSentenceWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0);
    const sentenceComplexity = Math.round((totalSentenceWords / sentences.length) * 10) / 10 || 10;
    
    // Calculate vocabulary diversity
    const allWords = userMessages.flatMap(msg => msg.content.toLowerCase().split(/\s+/));
    const uniqueWords = new Set(allWords);
    const vocabularyDiversity = Math.round((uniqueWords.size / allWords.length) * 100) / 100 || 0.5;
    
    // Estimate topic relevance
    const topicRelevance = 75; // Default value
    
    // Estimate emotional tone
    const emotionalTone = 10; // Default value (slightly positive)
    
    // Estimate engagement level
    const engagementLevel = 70; // Default value
    
    // Calculate speaking/listening ratio
    const speakingListeningRatio = userMessages.length / aiMessages.length || 1;
    
    return {
      speakingPace,
      pauseFrequency: pauseCount / speakingTime,
      fillerWordFrequency,
      responseTime,
      questionFrequency,
      sentenceComplexity,
      vocabularyDiversity,
      topicRelevance,
      emotionalTone,
      engagementLevel,
      speakingListeningRatio,
    };
  }
}

export const feedbackService = new FeedbackService();