import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Conversation, 
  Message, 
  FeedbackData, 
  FeedbackMetrics, 
  RealTimeFeedback,
  FeedbackSummary
} from '../types';

class FeedbackService {
  private realtimeFeedback: RealTimeFeedback[] = [];
  private currentMetrics: FeedbackMetrics | null = null;
  private previousFeedback: Map<string, FeedbackData> = new Map();
  private feedbackThresholds = {
    pace: {
      slow: 100, // words per minute
      fast: 180, // words per minute
    },
    pauseFrequency: {
      low: 2, // pauses per minute
      high: 12, // pauses per minute
    },
    fillerWordFrequency: {
      low: 0, // filler words per minute
      high: 5, // filler words per minute
    },
    responseTime: {
      quick: 1, // seconds
      slow: 5, // seconds
    },
    questionFrequency: {
      low: 0.5, // questions per minute
      high: 3, // questions per minute
    },
    sentenceComplexity: {
      simple: 8, // words per sentence
      complex: 20, // words per sentence
    },
    vocabularyDiversity: {
      low: 0.3, // unique words / total words
      high: 0.7, // unique words / total words
    },
    topicRelevance: {
      low: 60, // score
      high: 90, // score
    },
    emotionalTone: {
      negative: -30, // score
      positive: 30, // score
    },
    engagementLevel: {
      low: 50, // score
      high: 80, // score
    },
    speakingListeningRatio: {
      lowSpeaking: 0.5, // ratio
      highSpeaking: 2, // ratio
    },
  };

  constructor() {
    this.loadPreviousFeedback();
  }

  private async loadPreviousFeedback() {
    try {
      const feedbackData = await AsyncStorage.getItem('previous_feedback');
      if (feedbackData) {
        const parsed = JSON.parse(feedbackData);
        this.previousFeedback = new Map(parsed);
      }
    } catch (error) {
      console.warn('Failed to load previous feedback:', error);
    }
  }

  private async savePreviousFeedback() {
    try {
      const feedbackArray = Array.from(this.previousFeedback.entries());
      await AsyncStorage.setItem('previous_feedback', JSON.stringify(feedbackArray));
    } catch (error) {
      console.warn('Failed to save previous feedback:', error);
    }
  }

  // Real-time feedback during conversation
  startRealTimeFeedback(conversationMode: string) {
    this.realtimeFeedback = [];
    this.currentMetrics = this.initializeMetrics();
    
    // Start monitoring interval
    const monitoringInterval = setInterval(() => {
      if (this.currentMetrics) {
        const feedback = this.generateRealTimeFeedback(this.currentMetrics, conversationMode);
        if (feedback) {
          this.realtimeFeedback.push(feedback);
          console.log('Real-time feedback:', feedback);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return monitoringInterval;
  }

  stopRealTimeFeedback(monitoringInterval: NodeJS.Timeout) {
    clearInterval(monitoringInterval);
    return this.realtimeFeedback;
  }

  // Update metrics during conversation
  updateMetrics(metrics: Partial<FeedbackMetrics>) {
    if (!this.currentMetrics) {
      this.currentMetrics = this.initializeMetrics();
    }
    
    this.currentMetrics = {
      ...this.currentMetrics,
      ...metrics,
    };
    
    return this.currentMetrics;
  }

  // Generate comprehensive feedback after conversation
  async generateFeedback(conversation: Conversation): Promise<FeedbackData> {
    console.log('Generating feedback for conversation:', conversation.id);
    
    // Calculate metrics from conversation
    const metrics = this.calculateMetricsFromConversation(conversation);
    
    // Generate mode-specific feedback
    const modeSpecific = this.generateModeSpecificFeedback(conversation.mode.id, metrics, conversation);
    
    // Generate general feedback
    const generalFeedback = this.generateGeneralFeedback(metrics, conversation);
    
    // Combine feedback
    const feedback: FeedbackData = {
      scores: {
        ...generalFeedback.scores,
        ...modeSpecific.scores,
      },
      strengths: [...generalFeedback.strengths, ...modeSpecific.strengths],
      improvements: [...generalFeedback.improvements, ...modeSpecific.improvements],
      analytics: {
        ...generalFeedback.analytics,
        ...modeSpecific.analytics,
      },
      modeSpecific: {
        [conversation.mode.id]: modeSpecific.modeSpecific,
      },
      tips: [...generalFeedback.tips, ...modeSpecific.tips],
      nextSteps: [...generalFeedback.nextSteps, ...modeSpecific.nextSteps],
    };
    
    // Add progress tracking if we have previous feedback
    const previousFeedback = this.previousFeedback.get(conversation.mode.id);
    if (previousFeedback) {
      feedback.progressTracking = this.generateProgressTracking(previousFeedback, feedback);
    }
    
    // Save this feedback for future comparison
    this.previousFeedback.set(conversation.mode.id, feedback);
    await this.savePreviousFeedback();
    
    return feedback;
  }

  // Generate a summary of the feedback
  generateFeedbackSummary(feedback: FeedbackData, conversationMode: string): FeedbackSummary {
    const summary: FeedbackSummary = {
      overallScore: feedback.scores.overall,
      keyStrengths: feedback.strengths.slice(0, 3),
      improvementAreas: feedback.improvements.slice(0, 3),
      modeSpecificInsights: this.getModeSpecificInsights(conversationMode, feedback),
      nextStepSuggestions: feedback.nextSteps.slice(0, 3),
    };
    
    // Add comparison to previous if available
    if (feedback.progressTracking) {
      summary.compareToPrevious = {
        overallChange: feedback.progressTracking.improvement || 0,
        improvedAreas: feedback.progressTracking.consistentStrengths,
        declinedAreas: feedback.progressTracking.persistentChallenges,
      };
    }
    
    return summary;
  }

  // Private helper methods
  private initializeMetrics(): FeedbackMetrics {
    return {
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
  }

  private generateRealTimeFeedback(metrics: FeedbackMetrics, conversationMode: string): RealTimeFeedback | null {
    // Check various metrics and return feedback if needed
    
    // Check speaking pace
    if (metrics.speakingPace > this.feedbackThresholds.pace.fast) {
      return {
        type: 'pace',
        message: 'Try slowing down a bit for better clarity',
        severity: 'suggestion',
        timestamp: new Date(),
      };
    }
    
    if (metrics.speakingPace < this.feedbackThresholds.pace.slow) {
      return {
        type: 'pace',
        message: 'Try speaking a bit faster to maintain engagement',
        severity: 'suggestion',
        timestamp: new Date(),
      };
    }
    
    // Check filler words
    if (metrics.fillerWordFrequency > this.feedbackThresholds.fillerWordFrequency.high) {
      return {
        type: 'filler',
        message: `Try to reduce filler words like "um" and "uh"`,
        severity: 'suggestion',
        timestamp: new Date(),
      };
    }
    
    // Check engagement
    if (metrics.engagementLevel < this.feedbackThresholds.engagementLevel.low) {
      return {
        type: 'engagement',
        message: 'Try to be more engaged in the conversation',
        severity: 'suggestion',
        timestamp: new Date(),
      };
    }
    
    // Mode-specific feedback
    switch (conversationMode) {
      case 'debate-challenge':
        if (metrics.questionFrequency < this.feedbackThresholds.questionFrequency.low) {
          return {
            type: 'question',
            message: 'Try asking more questions to challenge the other perspective',
            severity: 'suggestion',
            timestamp: new Date(),
          };
        }
        break;
        
      case 'interview-practice':
        if (metrics.responseTime > this.feedbackThresholds.responseTime.slow) {
          return {
            type: 'clarity',
            message: 'Try to be more concise in your responses',
            severity: 'suggestion',
            timestamp: new Date(),
          };
        }
        break;
        
      case 'presentation-prep':
        if (metrics.pauseFrequency < this.feedbackThresholds.pauseFrequency.low) {
          return {
            type: 'pace',
            message: 'Try adding more strategic pauses for emphasis',
            severity: 'suggestion',
            timestamp: new Date(),
          };
        }
        break;
    }
    
    // No feedback needed at this time
    return null;
  }

  private calculateMetricsFromConversation(conversation: Conversation): FeedbackMetrics {
    const userMessages = conversation.messages.filter(msg => msg.role === 'user');
    const aiMessages = conversation.messages.filter(msg => msg.role === 'ai');
    
    // Calculate total words in user messages
    const userWords = userMessages.reduce((total, msg) => {
      return total + msg.content.split(/\s+/).length;
    }, 0);
    
    // Calculate unique words in user messages
    const uniqueWords = new Set<string>();
    userMessages.forEach(msg => {
      msg.content.split(/\s+/).forEach(word => {
        uniqueWords.add(word.toLowerCase().replace(/[^a-z0-9]/g, ''));
      });
    });
    
    // Calculate total sentences in user messages
    const userSentences = userMessages.reduce((total, msg) => {
      return total + msg.content.split(/[.!?]+/).filter(Boolean).length;
    }, 0);
    
    // Calculate filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically'];
    let fillerCount = 0;
    userMessages.forEach(msg => {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (fillerWords.includes(word)) {
          fillerCount++;
        }
      });
    });
    
    // Calculate questions asked by user
    const questionCount = userMessages.reduce((total, msg) => {
      return total + (msg.content.match(/\?/g) || []).length;
    }, 0);
    
    // Calculate response times
    const responseTimes: number[] = [];
    for (let i = 1; i < conversation.messages.length; i++) {
      const currentMsg = conversation.messages[i];
      const prevMsg = conversation.messages[i - 1];
      
      if (currentMsg.role === 'user' && prevMsg.role === 'ai') {
        const responseTime = (currentMsg.timestamp.getTime() - prevMsg.timestamp.getTime()) / 1000;
        responseTimes.push(responseTime);
      }
    }
    
    // Calculate average response time
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    // Calculate speaking time (approximation based on word count)
    const avgWordsPerMinute = 150; // Average speaking rate
    const speakingTime = userWords / avgWordsPerMinute;
    
    // Calculate listening time (approximation based on AI message length)
    const aiWords = aiMessages.reduce((total, msg) => {
      return total + msg.content.split(/\s+/).length;
    }, 0);
    const listeningTime = aiWords / avgWordsPerMinute;
    
    // Calculate speaking/listening ratio
    const speakingListeningRatio = listeningTime > 0 ? speakingTime / listeningTime : 1;
    
    // Calculate words per minute
    const durationInMinutes = conversation.duration / 60;
    const wordsPerMinute = durationInMinutes > 0 ? userWords / durationInMinutes : 0;
    
    // Calculate pauses (approximation based on punctuation)
    const pauseCount = userMessages.reduce((total, msg) => {
      return total + (msg.content.match(/[,.;:]/g) || []).length;
    }, 0);
    
    // Calculate pause frequency
    const pauseFrequency = durationInMinutes > 0 ? pauseCount / durationInMinutes : 0;
    
    // Calculate filler word frequency
    const fillerFrequency = durationInMinutes > 0 ? fillerCount / durationInMinutes : 0;
    
    // Calculate question frequency
    const questionFrequency = durationInMinutes > 0 ? questionCount / durationInMinutes : 0;
    
    // Calculate sentence complexity
    const sentenceComplexity = userSentences > 0 ? userWords / userSentences : 0;
    
    // Calculate vocabulary diversity
    const vocabularyDiversity = userWords > 0 ? uniqueWords.size / userWords : 0;
    
    // Estimate topic relevance and engagement level
    // In a real implementation, these would be calculated using NLP
    const topicRelevance = 85; // Placeholder
    const engagementLevel = 75; // Placeholder
    const emotionalTone = 20; // Placeholder (positive)
    
    return {
      speakingPace: wordsPerMinute,
      pauseFrequency,
      fillerWordFrequency: fillerFrequency,
      responseTime: avgResponseTime,
      questionFrequency,
      sentenceComplexity,
      vocabularyDiversity,
      topicRelevance,
      emotionalTone,
      engagementLevel,
      speakingListeningRatio,
    };
  }

  private generateGeneralFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze speaking pace
    if (metrics.speakingPace > this.feedbackThresholds.pace.slow && 
        metrics.speakingPace < this.feedbackThresholds.pace.fast) {
      strengths.push(`Good speaking pace that\'s easy to follow`);
    } else if (metrics.speakingPace > this.feedbackThresholds.pace.fast) {
      improvements.push(`Speaking pace is a bit fast at times`);
      tips.push(`Try to slow down slightly and add strategic pauses for emphasis`);
    } else if (metrics.speakingPace < this.feedbackThresholds.pace.slow) {
      improvements.push(`Speaking pace could be more energetic`);
      tips.push(`Try to increase your speaking pace slightly to maintain engagement`);
    }
    
    // Analyze filler words
    if (metrics.fillerWordFrequency < this.feedbackThresholds.fillerWordFrequency.low) {
      strengths.push(`Minimal use of filler words`);
    } else if (metrics.fillerWordFrequency > this.feedbackThresholds.fillerWordFrequency.high) {
      improvements.push(`Frequent use of filler words like "um" and "uh"`);
      tips.push(`Practice replacing filler words with brief pauses`);
    }
    
    // Analyze question frequency
    if (metrics.questionFrequency > this.feedbackThresholds.questionFrequency.low) {
      strengths.push(`Good use of questions to drive conversation`);
    } else {
      improvements.push(`Could ask more questions to engage the other speaker`);
      tips.push(`Try to include more open-ended questions to encourage deeper discussion`);
    }
    
    // Analyze vocabulary diversity
    if (metrics.vocabularyDiversity > this.feedbackThresholds.vocabularyDiversity.high) {
      strengths.push(`Excellent vocabulary diversity`);
    } else if (metrics.vocabularyDiversity < this.feedbackThresholds.vocabularyDiversity.low) {
      improvements.push(`Limited vocabulary range`);
      tips.push(`Try to incorporate more varied vocabulary in your responses`);
    }
    
    // Analyze engagement level
    if (metrics.engagementLevel > this.feedbackThresholds.engagementLevel.high) {
      strengths.push(`High level of engagement throughout the conversation`);
    } else if (metrics.engagementLevel < this.feedbackThresholds.engagementLevel.low) {
      improvements.push(`Could show more engagement in the conversation`);
      tips.push(`Try to respond more directly to points made and show more interest`);
    }
    
    // Analyze speaking/listening ratio
    if (metrics.speakingListeningRatio > 0.7 && metrics.speakingListeningRatio < 1.3) {
      strengths.push(`Good balance between speaking and listening`);
    } else if (metrics.speakingListeningRatio > this.feedbackThresholds.speakingListeningRatio.highSpeaking) {
      improvements.push(`Dominated the conversation at times`);
      tips.push(`Try to allow more space for the other speaker`);
    } else if (metrics.speakingListeningRatio < this.feedbackThresholds.speakingListeningRatio.lowSpeaking) {
      improvements.push(`Could contribute more to the conversation`);
      tips.push(`Try to elaborate more on your responses and share your thoughts`);
    }
    
    // Generate next steps
    nextSteps.push(`Practice with different conversation topics to build versatility`);
    nextSteps.push(`Review your strongest moments in this conversation`);
    
    // Calculate overall scores
    const fluency = this.calculateScore([
      metrics.speakingPace, 
      100 - metrics.fillerWordFrequency * 10,
      metrics.sentenceComplexity * 5
    ]);
    
    const clarity = this.calculateScore([
      100 - metrics.fillerWordFrequency * 20,
      metrics.sentenceComplexity * 3,
      metrics.topicRelevance
    ]);
    
    const confidence = this.calculateScore([
      metrics.speakingPace,
      metrics.vocabularyDiversity * 100,
      metrics.engagementLevel
    ]);
    
    const pace = this.calculateScore([
      100 - Math.abs(metrics.speakingPace - 150) * 0.5,
      100 - metrics.pauseFrequency * 5,
      100 - metrics.fillerWordFrequency * 10
    ]);
    
    const engagement = this.calculateScore([
      metrics.questionFrequency * 20,
      metrics.engagementLevel,
      metrics.emotionalTone > 0 ? 70 + metrics.emotionalTone : 70 + metrics.emotionalTone/2
    ]);
    
    // Calculate overall score
    const overall = this.calculateScore([
      fluency,
      clarity,
      confidence,
      pace,
      engagement
    ]);
    
    return {
      scores: {
        fluency,
        clarity,
        confidence,
        pace,
        overall,
        engagement
      },
      strengths,
      improvements,
      analytics: {
        wordsPerMinute: Math.round(metrics.speakingPace),
        pauseCount: Math.round(metrics.pauseFrequency * (conversation.duration / 60)),
        fillerWords: Math.round(metrics.fillerWordFrequency * (conversation.duration / 60)),
        questionCount: Math.round(metrics.questionFrequency * (conversation.duration / 60)),
        responseTime: Math.round(metrics.responseTime * 10) / 10,
        speakingTime: Math.round(metrics.speakingPace * (conversation.duration / 60) / 150),
        listeningTime: Math.round(conversation.duration / 60 - (metrics.speakingPace * (conversation.duration / 60) / 150)),
      },
      tips,
      nextSteps,
    };
  }

  private generateModeSpecificFeedback(
    mode: string, 
    metrics: FeedbackMetrics, 
    conversation: Conversation
  ): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    let modeSpecific: any = {};
    let scores: Record<string, number> = {};
    let analytics: Record<string, number | string> = {};
    
    switch (mode) {
      case 'general-chat':
        return this.generateGeneralChatFeedback(metrics, conversation);
      
      case 'debate-challenge':
        return this.generateDebateFeedback(metrics, conversation);
      
      case 'idea-brainstorm':
        return this.generateBrainstormFeedback(metrics, conversation);
      
      case 'interview-practice':
        return this.generateInterviewFeedback(metrics, conversation);
      
      case 'presentation-prep':
        return this.generatePresentationFeedback(metrics, conversation);
      
      case 'language-learning':
        return this.generateLanguageLearningFeedback(metrics, conversation);
      
      default:
        return {
          strengths,
          improvements,
          tips,
          nextSteps,
          scores,
          analytics,
          modeSpecific,
        };
    }
  }

  private generateGeneralChatFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze conversation flow
    const conversationFlow = this.calculateScore([
      metrics.responseTime > 0 ? 100 - (metrics.responseTime - 2) * 10 : 50,
      metrics.topicRelevance,
      metrics.engagementLevel
    ]);
    
    // Analyze topic exploration
    const topicExploration = this.calculateScore([
      metrics.questionFrequency * 25,
      metrics.sentenceComplexity * 3,
      metrics.vocabularyDiversity * 100
    ]);
    
    // Analyze empathy score
    const empathyScore = this.calculateScore([
      metrics.emotionalTone > 0 ? 70 + metrics.emotionalTone : 50,
      metrics.questionFrequency * 20,
      metrics.engagementLevel
    ]);
    
    // Analyze curiosity level
    const curiosityLevel = this.calculateScore([
      metrics.questionFrequency * 30,
      metrics.topicRelevance,
      metrics.engagementLevel
    ]);
    
    // Generate strengths
    if (conversationFlow > 80) {
      strengths.push(`Excellent conversation flow and natural transitions`);
    } else if (conversationFlow > 60) {
      strengths.push(`Good conversation flow with smooth exchanges`);
    }
    
    if (topicExploration > 80) {
      strengths.push(`Explored topics in depth with insightful questions`);
    } else if (topicExploration > 60) {
      strengths.push(`Good exploration of conversation topics`);
    }
    
    if (empathyScore > 80) {
      strengths.push(`Showed strong empathy and understanding`);
    } else if (empathyScore > 60) {
      strengths.push(`Demonstrated good empathy in responses`);
    }
    
    if (curiosityLevel > 80) {
      strengths.push(`Excellent curiosity with thoughtful follow-up questions`);
    } else if (curiosityLevel > 60) {
      strengths.push(`Good curiosity about the topics discussed`);
    }
    
    // Generate improvements
    if (conversationFlow < 60) {
      improvements.push(`Conversation flow could be more natural`);
      tips.push(`Practice smoother transitions between topics`);
    }
    
    if (topicExploration < 60) {
      improvements.push(`Could explore topics in more depth`);
      tips.push(`Try asking more follow-up questions to dig deeper into topics`);
    }
    
    if (empathyScore < 60) {
      improvements.push(`Could show more empathy in responses`);
      tips.push(`Try acknowledging feelings and perspectives more explicitly`);
    }
    
    if (curiosityLevel < 60) {
      improvements.push(`Could show more curiosity about the other speaker`);
      tips.push(`Ask more open-ended questions to learn more about the other person`);
    }
    
    // Generate next steps
    nextSteps.push(`Practice active listening techniques in your next conversation`);
    nextSteps.push(`Try to ask at least one follow-up question for each topic discussed`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        relevance: metrics.topicRelevance,
        emotionalIntelligence: empathyScore,
      },
      analytics: {
        questionCount: Math.round(metrics.questionFrequency * (conversation.duration / 60)),
        topicChanges: Math.round(conversation.messages.filter(m => m.role === 'user').length / 3),
      },
      modeSpecific: {
        generalChat: {
          conversationFlow,
          topicExploration,
          empathyScore,
          curiosityLevel,
        }
      }
    };
  }

  private generateDebateFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze argument strength
    const argumentStrength = this.calculateScore([
      metrics.sentenceComplexity * 4,
      metrics.vocabularyDiversity * 100,
      metrics.topicRelevance
    ]);
    
    // Analyze evidence usage
    const evidenceUsage = this.calculateScore([
      metrics.sentenceComplexity * 3,
      metrics.topicRelevance,
      metrics.vocabularyDiversity * 80
    ]);
    
    // Analyze counter-argument handling
    const counterArgumentHandling = this.calculateScore([
      metrics.responseTime > 0 ? 100 - (metrics.responseTime - 2) * 10 : 50,
      metrics.topicRelevance,
      metrics.sentenceComplexity * 3
    ]);
    
    // Analyze logical consistency
    const logicalConsistency = this.calculateScore([
      metrics.topicRelevance,
      100 - metrics.fillerWordFrequency * 10,
      metrics.sentenceComplexity * 3
    ]);
    
    // Generate strengths
    if (argumentStrength > 80) {
      strengths.push(`Excellent argument construction with strong logical flow`);
    } else if (argumentStrength > 60) {
      strengths.push(`Good argument structure and reasoning`);
    }
    
    if (evidenceUsage > 80) {
      strengths.push(`Strong use of evidence to support arguments`);
    } else if (evidenceUsage > 60) {
      strengths.push(`Good incorporation of supporting evidence`);
    }
    
    if (counterArgumentHandling > 80) {
      strengths.push(`Excellent handling of counter-arguments`);
    } else if (counterArgumentHandling > 60) {
      strengths.push(`Good responses to opposing viewpoints`);
    }
    
    if (logicalConsistency > 80) {
      strengths.push(`Highly consistent logical reasoning throughout`);
    } else if (logicalConsistency > 60) {
      strengths.push(`Generally consistent logical approach`);
    }
    
    // Generate improvements
    if (argumentStrength < 60) {
      improvements.push(`Argument structure could be stronger`);
      tips.push(`Try organizing your points in a clearer logical sequence`);
    }
    
    if (evidenceUsage < 60) {
      improvements.push(`Could use more evidence to support claims`);
      tips.push(`Incorporate specific examples or data to strengthen your arguments`);
    }
    
    if (counterArgumentHandling < 60) {
      improvements.push(`Could improve handling of counter-arguments`);
      tips.push(`Practice anticipating and addressing potential objections to your position`);
    }
    
    if (logicalConsistency < 60) {
      improvements.push(`Logical consistency could be improved`);
      tips.push(`Check for contradictions in your arguments and ensure consistent reasoning`);
    }
    
    // Generate next steps
    nextSteps.push(`Practice structuring arguments with clear premises and conclusions`);
    nextSteps.push(`Research and prepare evidence for common debate topics`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        criticalThinking: this.calculateScore([argumentStrength, logicalConsistency]),
        persuasiveness: this.calculateScore([argumentStrength, evidenceUsage, counterArgumentHandling]),
      },
      analytics: {
        complexSentences: Math.round(metrics.sentenceComplexity),
      },
      modeSpecific: {
        debate: {
          argumentStrength,
          evidenceUsage,
          counterArgumentHandling,
          logicalConsistency,
        }
      }
    };
  }

  private generateBrainstormFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Count ideas (approximation based on user messages)
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    const ideaCount = Math.max(1, Math.round(userMessages.length * 0.8));
    
    // Estimate unique ideas (approximation)
    const uniqueIdeas = Math.max(1, Math.round(ideaCount * metrics.vocabularyDiversity));
    
    // Analyze idea quality
    const ideaQuality = this.calculateScore([
      metrics.sentenceComplexity * 3,
      metrics.vocabularyDiversity * 100,
      metrics.topicRelevance
    ]);
    
    // Analyze building on ideas
    const buildingOnIdeas = this.calculateScore([
      metrics.topicRelevance,
      metrics.responseTime > 0 ? 100 - (metrics.responseTime - 1) * 10 : 50,
      metrics.engagementLevel
    ]);
    
    // Generate strengths
    if (ideaCount > 10) {
      strengths.push(`Generated an impressive ${ideaCount} ideas during the session`);
    } else if (ideaCount > 5) {
      strengths.push(`Contributed ${ideaCount} ideas to the brainstorming session`);
    }
    
    if (uniqueIdeas > 8) {
      strengths.push(`Excellent variety of unique concepts`);
    } else if (uniqueIdeas > 4) {
      strengths.push(`Good range of different ideas`);
    }
    
    if (ideaQuality > 80) {
      strengths.push(`High-quality ideas with excellent development`);
    } else if (ideaQuality > 60) {
      strengths.push(`Good quality ideas with solid potential`);
    }
    
    if (buildingOnIdeas > 80) {
      strengths.push(`Excellent at building upon and expanding ideas`);
    } else if (buildingOnIdeas > 60) {
      strengths.push(`Good collaboration in developing concepts further`);
    }
    
    // Generate improvements
    if (ideaCount < 5) {
      improvements.push(`Could generate more ideas during brainstorming`);
      tips.push(`Try rapid ideation techniques like timed idea sprints`);
    }
    
    if (uniqueIdeas < 4) {
      improvements.push(`Could explore a wider variety of concepts`);
      tips.push(`Try using different perspectives or constraints to spark diverse ideas`);
    }
    
    if (ideaQuality < 60) {
      improvements.push(`Could develop ideas in more depth`);
      tips.push(`Spend more time exploring the potential of each idea`);
    }
    
    if (buildingOnIdeas < 60) {
      improvements.push(`Could build more effectively on existing ideas`);
      tips.push(`Practice the "Yes, and..." technique to expand on concepts`);
    }
    
    // Generate next steps
    nextSteps.push(`Try brainstorming with constraints to spark creative solutions`);
    nextSteps.push(`Practice combining different ideas to create hybrid concepts`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        creativity: this.calculateScore([ideaQuality, uniqueIdeas * 10]),
      },
      analytics: {
        topicChanges: uniqueIdeas,
      },
      modeSpecific: {
        brainstorm: {
          ideaCount,
          uniqueIdeas,
          ideaQuality,
          buildingOnIdeas,
        }
      }
    };
  }

  private generateInterviewFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze question relevance
    const questionRelevance = this.calculateScore([
      metrics.topicRelevance,
      metrics.sentenceComplexity * 3,
      metrics.vocabularyDiversity * 80
    ]);
    
    // Analyze answer completeness
    const answerCompleteness = this.calculateScore([
      metrics.sentenceComplexity * 4,
      metrics.speakingPace > 0 ? 100 - Math.abs(metrics.speakingPace - 150) * 0.5 : 50,
      metrics.vocabularyDiversity * 100
    ]);
    
    // Analyze professional demeanor
    const professionalDemeanor = this.calculateScore([
      100 - metrics.fillerWordFrequency * 15,
      metrics.emotionalTone > 0 ? 70 + metrics.emotionalTone/2 : 50,
      metrics.engagementLevel
    ]);
    
    // Analyze technical accuracy (placeholder - would need domain knowledge)
    const technicalAccuracy = this.calculateScore([
      metrics.topicRelevance,
      metrics.vocabularyDiversity * 100,
      metrics.sentenceComplexity * 3
    ]);
    
    // Generate strengths
    if (questionRelevance > 80) {
      strengths.push(`Excellent understanding of interview questions`);
    } else if (questionRelevance > 60) {
      strengths.push(`Good comprehension of interview questions`);
    }
    
    if (answerCompleteness > 80) {
      strengths.push(`Thorough and comprehensive answers`);
    } else if (answerCompleteness > 60) {
      strengths.push(`Answers covered key points effectively`);
    }
    
    if (professionalDemeanor > 80) {
      strengths.push(`Excellent professional communication style`);
    } else if (professionalDemeanor > 60) {
      strengths.push(`Good professional demeanor throughout`);
    }
    
    if (technicalAccuracy > 80) {
      strengths.push(`Strong technical knowledge demonstrated`);
    } else if (technicalAccuracy > 60) {
      strengths.push(`Good technical understanding shown`);
    }
    
    // Generate improvements
    if (questionRelevance < 60) {
      improvements.push(`Could better address the specific questions asked`);
      tips.push(`Listen carefully to each question and ensure your answer directly addresses it`);
    }
    
    if (answerCompleteness < 60) {
      improvements.push(`Answers could be more comprehensive`);
      tips.push(`Use the STAR method (Situation, Task, Action, Result) for behavioral questions`);
    }
    
    if (professionalDemeanor < 60) {
      improvements.push(`Could present a more professional demeanor`);
      tips.push(`Reduce casual language and filler words in professional contexts`);
    }
    
    if (technicalAccuracy < 60) {
      improvements.push(`Technical explanations could be clearer`);
      tips.push(`Practice explaining technical concepts concisely and accurately`);
    }
    
    // Generate next steps
    nextSteps.push(`Research common interview questions for your target role`);
    nextSteps.push(`Practice the STAR method for behavioral questions`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        professionalCommunication: this.calculateScore([professionalDemeanor, answerCompleteness]),
      },
      analytics: {
        responseTime: Math.round(metrics.responseTime * 10) / 10,
      },
      modeSpecific: {
        interview: {
          questionRelevance,
          answerCompleteness,
          professionalDemeanor,
          technicalAccuracy,
        }
      }
    };
  }

  private generatePresentationFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze structure quality
    const structureQuality = this.calculateScore([
      metrics.topicRelevance,
      metrics.sentenceComplexity * 3,
      100 - metrics.fillerWordFrequency * 10
    ]);
    
    // Analyze audience engagement
    const audienceEngagement = this.calculateScore([
      metrics.emotionalTone > 0 ? 70 + metrics.emotionalTone/2 : 50,
      metrics.speakingPace > 0 ? 100 - Math.abs(metrics.speakingPace - 140) * 0.5 : 50,
      metrics.engagementLevel
    ]);
    
    // Analyze message clarity
    const messageClarity = this.calculateScore([
      100 - metrics.fillerWordFrequency * 15,
      metrics.sentenceComplexity > 0 ? 100 - Math.abs(metrics.sentenceComplexity - 15) * 3 : 50,
      metrics.topicRelevance
    ]);
    
    // Analyze delivery style
    const deliveryStyle = this.calculateScore([
      metrics.speakingPace > 0 ? 100 - Math.abs(metrics.speakingPace - 140) * 0.5 : 50,
      metrics.pauseFrequency * 5,
      metrics.emotionalTone > 0 ? 70 + metrics.emotionalTone/2 : 50
    ]);
    
    // Generate strengths
    if (structureQuality > 80) {
      strengths.push(`Excellent presentation structure with clear organization`);
    } else if (structureQuality > 60) {
      strengths.push(`Good presentation structure with logical flow`);
    }
    
    if (audienceEngagement > 80) {
      strengths.push(`Highly engaging presentation style`);
    } else if (audienceEngagement > 60) {
      strengths.push(`Good audience engagement techniques`);
    }
    
    if (messageClarity > 80) {
      strengths.push(`Exceptionally clear and concise messaging`);
    } else if (messageClarity > 60) {
      strengths.push(`Clear communication of key points`);
    }
    
    if (deliveryStyle > 80) {
      strengths.push(`Excellent delivery with effective pacing and emphasis`);
    } else if (deliveryStyle > 60) {
      strengths.push(`Good presentation delivery style`);
    }
    
    // Generate improvements
    if (structureQuality < 60) {
      improvements.push(`Presentation structure could be more organized`);
      tips.push(`Use a clear introduction, body, and conclusion structure`);
    }
    
    if (audienceEngagement < 60) {
      improvements.push(`Could be more engaging for the audience`);
      tips.push(`Incorporate rhetorical questions or interactive elements`);
    }
    
    if (messageClarity < 60) {
      improvements.push(`Main message could be clearer`);
      tips.push(`Focus on simplifying complex ideas and emphasizing key points`);
    }
    
    if (deliveryStyle < 60) {
      improvements.push(`Delivery style could be more dynamic`);
      tips.push(`Vary your pace, volume, and tone for emphasis`);
    }
    
    // Generate next steps
    nextSteps.push(`Practice your presentation with a timer to improve pacing`);
    nextSteps.push(`Record yourself presenting and review for areas to improve`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        structure: structureQuality,
      },
      analytics: {
        pauseCount: Math.round(metrics.pauseFrequency * (conversation.duration / 60)),
      },
      modeSpecific: {
        presentation: {
          structureQuality,
          audienceEngagement,
          messageClarity,
          deliveryStyle,
        }
      }
    };
  }

  private generateLanguageLearningFeedback(metrics: FeedbackMetrics, conversation: Conversation): Partial<FeedbackData> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const tips: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze grammar accuracy (placeholder - would need NLP)
    const grammarAccuracy = this.calculateScore([
      metrics.sentenceComplexity > 0 ? 100 - Math.abs(metrics.sentenceComplexity - 12) * 3 : 50,
      metrics.vocabularyDiversity * 80,
      metrics.topicRelevance
    ]);
    
    // Analyze vocabulary range
    const vocabularyRange = this.calculateScore([
      metrics.vocabularyDiversity * 120,
      metrics.sentenceComplexity * 3,
      metrics.topicRelevance
    ]);
    
    // Analyze pronunciation score (placeholder - would need audio analysis)
    const pronunciationScore = this.calculateScore([
      100 - metrics.fillerWordFrequency * 10,
      metrics.speakingPace > 0 ? 100 - Math.abs(metrics.speakingPace - 130) * 0.5 : 50,
      metrics.pauseFrequency * 5
    ]);
    
    // Analyze fluency progress
    const fluencyProgress = this.calculateScore([
      metrics.speakingPace > 0 ? 100 - Math.abs(metrics.speakingPace - 130) * 0.5 : 50,
      100 - metrics.fillerWordFrequency * 15,
      metrics.pauseFrequency * 3
    ]);
    
    // Generate strengths
    if (grammarAccuracy > 80) {
      strengths.push(`Excellent grammar usage throughout the conversation`);
    } else if (grammarAccuracy > 60) {
      strengths.push(`Good grammatical structure in most sentences`);
    }
    
    if (vocabularyRange > 80) {
      strengths.push(`Impressive vocabulary range and usage`);
    } else if (vocabularyRange > 60) {
      strengths.push(`Good variety of vocabulary`);
    }
    
    if (pronunciationScore > 80) {
      strengths.push(`Clear and accurate pronunciation`);
    } else if (pronunciationScore > 60) {
      strengths.push(`Generally good pronunciation`);
    }
    
    if (fluencyProgress > 80) {
      strengths.push(`Excellent conversational fluency`);
    } else if (fluencyProgress > 60) {
      strengths.push(`Good speaking flow and fluency`);
    }
    
    // Generate improvements
    if (grammarAccuracy < 60) {
      improvements.push(`Some grammatical structures could be improved`);
      tips.push(`Focus on practicing specific grammar patterns that challenge you`);
    }
    
    if (vocabularyRange < 60) {
      improvements.push(`Could use a wider range of vocabulary`);
      tips.push(`Try to incorporate new words into each conversation`);
    }
    
    if (pronunciationScore < 60) {
      improvements.push(`Pronunciation could be clearer in some words`);
      tips.push(`Practice difficult sounds and words by recording and listening to yourself`);
    }
    
    if (fluencyProgress < 60) {
      improvements.push(`Conversational fluency could be smoother`);
      tips.push(`Regular speaking practice will help improve your overall fluency`);
    }
    
    // Generate next steps
    nextSteps.push(`Practice with different conversation topics to expand vocabulary`);
    nextSteps.push(`Focus on using more complex sentence structures`);
    
    return {
      strengths,
      improvements,
      tips,
      nextSteps,
      scores: {
        grammarAccuracy,
        vocabularyUsage: vocabularyRange,
      },
      analytics: {
        complexSentences: Math.round(metrics.sentenceComplexity),
      },
      modeSpecific: {
        languageLearning: {
          grammarAccuracy,
          vocabularyRange,
          pronunciationScore,
          fluencyProgress,
        }
      }
    };
  }

  private generateProgressTracking(
    previousFeedback: FeedbackData, 
    currentFeedback: FeedbackData
  ): FeedbackData['progressTracking'] {
    const previousScore = previousFeedback.scores.overall;
    const currentScore = currentFeedback.scores.overall;
    const improvement = currentScore - previousScore;
    
    // Find consistent strengths (strengths in both feedback reports)
    const consistentStrengths = currentFeedback.strengths.filter(strength => 
      previousFeedback.strengths.some(prevStrength => 
        this.areStringsRelated(strength, prevStrength)
      )
    );
    
    // Find persistent challenges (improvements in both feedback reports)
    const persistentChallenges = currentFeedback.improvements.filter(improvement => 
      previousFeedback.improvements.some(prevImprovement => 
        this.areStringsRelated(improvement, prevImprovement)
      )
    );
    
    return {
      previousScore,
      improvement,
      consistentStrengths,
      persistentChallenges,
    };
  }

  private getModeSpecificInsights(mode: string, feedback: FeedbackData): string[] {
    const insights: string[] = [];
    
    switch (mode) {
      case 'general-chat':
        if (feedback.modeSpecific?.generalChat) {
          const { conversationFlow, topicExploration, empathyScore, curiosityLevel } = feedback.modeSpecific.generalChat;
          
          if (conversationFlow > 80) {
            insights.push(`Excellent natural conversation flow`);
          }
          
          if (curiosityLevel > 80) {
            insights.push(`Asked ${feedback.analytics.questionCount} thoughtful questions`);
          }
          
          if (empathyScore > 80) {
            insights.push(`Showed strong empathy and understanding`);
          }
        }
        break;
        
      case 'debate-challenge':
        if (feedback.modeSpecific?.debate) {
          const { argumentStrength, evidenceUsage, counterArgumentHandling, logicalConsistency } = feedback.modeSpecific.debate;
          
          if (argumentStrength > 80) {
            insights.push(`Strong, well-structured arguments`);
          }
          
          if (counterArgumentHandling > 80) {
            insights.push(`Excellent handling of opposing viewpoints`);
          }
          
          if (logicalConsistency > 80) {
            insights.push(`Highly consistent logical reasoning`);
          }
        }
        break;
        
      case 'idea-brainstorm':
        if (feedback.modeSpecific?.brainstorm) {
          const { ideaCount, uniqueIdeas, ideaQuality, buildingOnIdeas } = feedback.modeSpecific.brainstorm;
          
          insights.push(`Generated ${ideaCount} ideas (${uniqueIdeas} unique concepts)`);
          
          if (ideaQuality > 80) {
            insights.push(`High-quality, well-developed ideas`);
          }
          
          if (buildingOnIdeas > 80) {
            insights.push(`Excellent at expanding and building on concepts`);
          }
        }
        break;
        
      case 'interview-practice':
        if (feedback.modeSpecific?.interview) {
          const { questionRelevance, answerCompleteness, professionalDemeanor, technicalAccuracy } = feedback.modeSpecific.interview;
          
          if (answerCompleteness > 80) {
            insights.push(`Comprehensive, well-structured answers`);
          }
          
          if (professionalDemeanor > 80) {
            insights.push(`Excellent professional communication style`);
          }
          
          if (technicalAccuracy > 80) {
            insights.push(`Strong technical knowledge demonstrated`);
          }
        }
        break;
        
      case 'presentation-prep':
        if (feedback.modeSpecific?.presentation) {
          const { structureQuality, audienceEngagement, messageClarity, deliveryStyle } = feedback.modeSpecific.presentation;
          
          if (structureQuality > 80) {
            insights.push(`Clear, well-organized presentation structure`);
          }
          
          if (audienceEngagement > 80) {
            insights.push(`Highly engaging presentation style`);
          }
          
          if (deliveryStyle > 80) {
            insights.push(`Excellent delivery with effective pacing`);
          }
        }
        break;
        
      case 'language-learning':
        if (feedback.modeSpecific?.languageLearning) {
          const { grammarAccuracy, vocabularyRange, pronunciationScore, fluencyProgress } = feedback.modeSpecific.languageLearning;
          
          if (grammarAccuracy > 80) {
            insights.push(`${grammarAccuracy}% grammar accuracy - excellent!`);
          } else {
            insights.push(`${grammarAccuracy}% grammar accuracy`);
          }
          
          if (vocabularyRange > 80) {
            insights.push(`Impressive vocabulary range and usage`);
          }
          
          if (fluencyProgress > 80) {
            insights.push(`Excellent conversational fluency`);
          }
        }
        break;
    }
    
    return insights;
  }

  // Utility methods
  private calculateScore(values: number[]): number {
    // Filter out any NaN or undefined values
    const validValues = values.filter(v => !isNaN(v) && v !== undefined);
    
    if (validValues.length === 0) return 50; // Default score
    
    // Calculate average and round to nearest integer
    const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    return Math.round(Math.min(100, Math.max(0, average)));
  }

  private areStringsRelated(str1: string, str2: string): boolean {
    // Simple check for string similarity
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    // Count matching words
    const matchingWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    ).length;
    
    // Calculate similarity score
    const totalWords = Math.max(words1.length, words2.length);
    const similarityScore = matchingWords / totalWords;
    
    return similarityScore > 0.3; // Threshold for considering strings related
  }
}

export const feedbackService = new FeedbackService();