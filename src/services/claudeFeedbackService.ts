import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Conversation, 
  FeedbackData, 
  FeedbackMetrics, 
  RealTimeFeedback,
  FeedbackSummary
} from '../types';
import { supabaseClaudeAPI } from './supabaseClaudeAPI';
import { ConversationContext, ConversationMessage } from '../../types/api';

class ClaudeFeedbackService {
  private realtimeFeedback: RealTimeFeedback[] = [];
  private previousFeedback: Map<string, FeedbackData> = new Map();
  private feedbackCache = new Map<string, FeedbackData>();

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

  // Generate comprehensive feedback after conversation using Claude
  async generateFeedback(conversation: Conversation): Promise<FeedbackData> {
    console.log('Generating Claude-powered feedback for conversation:', conversation.id);
    
    // Check cache first
    const cacheKey = `feedback_${conversation.id}`;
    const cachedFeedback = this.feedbackCache.get(cacheKey);
    if (cachedFeedback) {
      console.log('Using cached feedback for conversation:', conversation.id);
      return cachedFeedback;
    }
    
    try {
      // Create a prompt for Claude based on the conversation mode
      const prompt = this.createFeedbackPrompt(conversation);
      
      // Create a context for Claude API
      const context: ConversationContext = {
        messages: [],
        mode: 'feedback-analysis',
        sessionId: `feedback_${conversation.id}`,
        metadata: {
          startTime: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
          totalTokens: 0,
        },
      };
      
      // Send the prompt to Claude
      const response = await supabaseClaudeAPI.sendMessage(prompt, context);
      
      if (response.error) {
        console.error('Claude feedback analysis failed:', response.error);
        throw new Error(`Failed to analyze conversation: ${response.error}`);
      }
      
      if (!response.data) {
        throw new Error('No feedback data received from Claude');
      }
      
      // Parse the feedback from Claude's response
      const feedback = this.parseFeedbackResponse(response.data.content, conversation);
      
      // Add progress tracking if we have previous feedback
      const previousFeedback = this.previousFeedback.get(conversation.mode.id);
      if (previousFeedback) {
        feedback.progressTracking = this.generateProgressTracking(previousFeedback, feedback);
      }
      
      // Save this feedback for future comparison
      this.previousFeedback.set(conversation.mode.id, feedback);
      await this.savePreviousFeedback();
      
      // Cache the feedback
      this.feedbackCache.set(cacheKey, feedback);
      
      return feedback;
    } catch (error) {
      console.error('Failed to generate Claude feedback:', error);
      
      // Fallback to basic feedback if Claude analysis fails
      return this.generateBasicFeedback(conversation);
    }
  }

  // Create a mode-specific prompt for Claude to analyze the conversation
  private createFeedbackPrompt(conversation: Conversation): string {
    const { mode, messages, duration } = conversation;
    
    // Convert messages to a format suitable for analysis
    const formattedMessages = messages.map(msg => {
      return `${msg.role.toUpperCase()}: ${msg.content}`;
    }).join('\n\n');
    
    // Create a base prompt with conversation details
    let prompt = `
You are an expert communication coach specializing in ${mode.name} conversations. 
Please analyze the following conversation that lasted ${Math.floor(duration / 60)} minutes and ${duration % 60} seconds.

CONVERSATION MODE: ${mode.name}
MODE DESCRIPTION: ${mode.description}

CONVERSATION TRANSCRIPT:
${formattedMessages}

Based on this conversation, provide a comprehensive feedback analysis in the following JSON format:

{
  "scores": {
    "fluency": 85,
    "clarity": 80,
    "confidence": 75,
    "pace": 90,
    "overall": 82,
    "engagement": 88
  },
  "strengths": [
    "Clear articulation of ideas",
    "Effective use of examples",
    "Good engagement with questions"
  ],
  "improvements": [
    "Could use more varied vocabulary",
    "Some responses could be more concise",
    "Occasionally interrupted the other speaker"
  ],
  "analytics": {
    "wordsPerMinute": 150,
    "pauseCount": 12,
    "fillerWords": 8,
    "questionCount": 5,
    "responseTime": 2.3,
    "speakingTime": 4,
    "listeningTime": 3
  },
  "tips": [
    "Practice using more varied transitional phrases",
    "Try to eliminate filler words like 'um' and 'uh'",
    "Allow brief pauses for emphasis on key points"
  ],
  "nextSteps": [
    "Focus on developing more concise responses",
    "Practice active listening techniques",
    "Work on incorporating more evidence in arguments"
  ]
}

IMPORTANT: 
1. All scores should be integers between 0-100
2. Provide 3-5 specific strengths based on actual examples from the conversation
3. Provide 3-5 specific improvements with actionable suggestions
4. Make analytics as accurate as possible based on the conversation
5. Provide 3-5 practical tips that are specific to this conversation
6. Suggest 2-3 concrete next steps for improvement
`;

    // Add mode-specific analysis instructions
    switch (mode.id) {
      case 'general-chat':
        prompt += `\n\nFor general chat analysis, also include:
{
  "modeSpecific": {
    "generalChat": {
      "conversationFlow": 85,
      "topicExploration": 78,
      "empathyScore": 90,
      "curiosityLevel": 82
    }
  }
}

Focus on social skills, active listening, empathy, and natural conversation flow.`;
        break;
        
      case 'debate-challenge':
        prompt += `\n\nFor debate analysis, also include:
{
  "modeSpecific": {
    "debate": {
      "argumentStrength": 85,
      "evidenceUsage": 78,
      "counterArgumentHandling": 90,
      "logicalConsistency": 82
    }
  },
  "scores": {
    "criticalThinking": 88,
    "persuasiveness": 85
  }
}

Focus on argument quality, evidence usage, logical consistency, and respectful disagreement.`;
        break;
        
      case 'idea-brainstorm':
        prompt += `\n\nFor brainstorming analysis, also include:
{
  "modeSpecific": {
    "brainstorm": {
      "ideaCount": 12,
      "uniqueIdeas": 8,
      "ideaQuality": 85,
      "buildingOnIdeas": 78
    }
  },
  "scores": {
    "creativity": 90
  }
}

Focus on idea generation, creativity, concept development, and collaborative thinking.`;
        break;
        
      case 'interview-practice':
        prompt += `\n\nFor interview practice analysis, also include:
{
  "modeSpecific": {
    "interview": {
      "questionRelevance": 85,
      "answerCompleteness": 78,
      "professionalDemeanor": 90,
      "technicalAccuracy": 82
    }
  },
  "scores": {
    "professionalCommunication": 88
  }
}

Focus on STAR method usage, professional communication, question handling, and confidence.`;
        break;
        
      case 'presentation-prep':
        prompt += `\n\nFor presentation analysis, also include:
{
  "modeSpecific": {
    "presentation": {
      "structureQuality": 85,
      "audienceEngagement": 78,
      "messageClarity": 90,
      "deliveryStyle": 82
    }
  },
  "scores": {
    "structure": 88
  }
}

Focus on structure, clarity, audience engagement, and delivery style.`;
        break;
        
      case 'language-learning':
        prompt += `\n\nFor language learning analysis, also include:
{
  "modeSpecific": {
    "languageLearning": {
      "grammarAccuracy": 85,
      "vocabularyRange": 78,
      "pronunciationScore": 90,
      "fluencyProgress": 82
    }
  },
  "scores": {
    "grammarAccuracy": 85,
    "vocabularyUsage": 78
  }
}

Focus on grammar, vocabulary, pronunciation, and overall fluency.`;
        break;
    }
    
    prompt += `\n\nEnsure your feedback is specific to this conversation, mentioning actual examples from the transcript. Provide actionable advice that will help the user improve their ${mode.name} skills.`;
    
    return prompt;
  }

  // Parse Claude's response into a structured feedback object
private parseFeedbackResponse(response: string, conversation: Conversation): FeedbackData {
  try {
    console.log('Raw Claude response:', response);
    
    // Try to extract and parse JSON from the response
    let parsedFeedback;
    
    // First, try to find a complete JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in Claude response');
      throw new Error('No JSON found in Claude response');
    }
    
    let jsonString = jsonMatch[0];
    console.log('Extracted JSON string:', jsonString);
    
    // Try to parse the JSON
    try {
      parsedFeedback = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('Initial JSON parse failed, trying to fix common issues:', parseError);
      
      // If the JSON is incomplete, try to handle partial responses
      if (jsonString.includes('"scores"') && !jsonString.includes('"strengths"')) {
        console.log('Detected incomplete JSON response, attempting to reconstruct');
        // This appears to be just a scores object, wrap it properly
        if (!jsonString.trim().endsWith('}')) {
          // Find the last complete property and close the object
          const lastCommaIndex = jsonString.lastIndexOf(',');
          const lastBraceIndex = jsonString.lastIndexOf('}');
          if (lastCommaIndex > lastBraceIndex) {
            // Remove trailing comma and close
            jsonString = jsonString.substring(0, lastCommaIndex) + '}';
          } else if (!jsonString.trim().endsWith('}')) {
            jsonString += '}';
          }
        }
        
        try {
          const scoresOnly = JSON.parse(jsonString);
          // If it's just a scores object, create a minimal feedback structure
          if (scoresOnly.scores || (scoresOnly.fluency !== undefined)) {
            parsedFeedback = {
              scores: scoresOnly.scores || scoresOnly,
              strengths: ["Good participation in the conversation"],
              improvements: ["Continue practicing to improve skills"],
              analytics: {
                wordsPerMinute: 150,
                pauseCount: 10,
                fillerWords: 5
              },
              tips: ["Keep practicing regularly"],
              nextSteps: ["Schedule another practice session"]
            };
          } else {
            throw parseError;
          }
        } catch (secondError) {
          console.error('Failed to parse even partial JSON:', secondError);
          throw new Error('Failed to parse feedback response');
        }
      } else {
        throw parseError;
      }
    }
    
    console.log('Successfully parsed feedback:', parsedFeedback);
    
    // Ensure all required fields are present
    const feedback: FeedbackData = {
      scores: {
        fluency: parsedFeedback.scores?.fluency || 70,
        clarity: parsedFeedback.scores?.clarity || 70,
        confidence: parsedFeedback.scores?.confidence || 70,
        pace: parsedFeedback.scores?.pace || 70,
        overall: parsedFeedback.scores?.overall || 70,
        engagement: parsedFeedback.scores?.engagement,
        relevance: parsedFeedback.scores?.relevance,
        structure: parsedFeedback.scores?.structure,
        persuasiveness: parsedFeedback.scores?.persuasiveness,
        creativity: parsedFeedback.scores?.creativity,
        criticalThinking: parsedFeedback.scores?.criticalThinking,
        emotionalIntelligence: parsedFeedback.scores?.emotionalIntelligence,
        vocabularyUsage: parsedFeedback.scores?.vocabularyUsage,
        grammarAccuracy: parsedFeedback.scores?.grammarAccuracy,
        professionalCommunication: parsedFeedback.scores?.professionalCommunication,
      },
      strengths: parsedFeedback.strengths || [],
      improvements: parsedFeedback.improvements || [],
      analytics: {
        wordsPerMinute: parsedFeedback.analytics?.wordsPerMinute || 150,
        pauseCount: parsedFeedback.analytics?.pauseCount || 10,
        fillerWords: parsedFeedback.analytics?.fillerWords || 5,
        questionCount: parsedFeedback.analytics?.questionCount,
        topicChanges: parsedFeedback.analytics?.topicChanges,
        responseTime: parsedFeedback.analytics?.responseTime,
        complexSentences: parsedFeedback.analytics?.complexSentences,
        speakingTime: parsedFeedback.analytics?.speakingTime,
        listeningTime: parsedFeedback.analytics?.listeningTime,
      },
      modeSpecific: parsedFeedback.modeSpecific || {},
      tips: parsedFeedback.tips || [],
      nextSteps: parsedFeedback.nextSteps || [],
    };
    
    return feedback;
  } catch (error) {
    console.error('Failed to parse Claude feedback response:', error);
    throw new Error('Failed to parse feedback response');
  }
}

// Clean up common JSON syntax issues
private cleanJsonString(jsonString: string): string {
  // Fix trailing commas
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around property names
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  jsonString = jsonString.replace(/'/g, '"');
  
  // Fix unescaped quotes in string values
  jsonString = jsonString.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1$2$3"');
  
  // Fix missing commas between properties
  jsonString = jsonString.replace(/"\s*}\s*"/g, '", "');
  jsonString = jsonString.replace(/"\s*]\s*"/g, '", "');
  
  // Fix empty values
  jsonString = jsonString.replace(/:\s*,/g, ': null,');
  jsonString = jsonString.replace(/:\s*}/g, ': null}');
  jsonString = jsonString.replace(/:\s*]/g, ': null]');
  
  // Fix incomplete arrays/objects
  jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
  jsonString = jsonString.replace(/,\s*$/g, '');
  
  // Fix missing closing braces/brackets
  let braceCount = (jsonString.match(/\{/g) || []).length;
  let bracketCount = (jsonString.match(/\[/g) || []).length;
  let closeBraceCount = (jsonString.match(/\}/g) || []).length;
  let closeBracketCount = (jsonString.match(/\]/g) || []).length;
  
  // Add missing closing braces
  while (braceCount > closeBraceCount) {
    jsonString += '}';
    closeBraceCount++;
  }
  
  // Add missing closing brackets
  while (bracketCount > closeBracketCount) {
    jsonString += ']';
    closeBracketCount++;
  }
  
  return jsonString;
}

// Fix common JSON syntax issues
private fixCommonJsonIssues(jsonString: string): string {
  // Fix trailing commas
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around property names
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  jsonString = jsonString.replace(/'/g, '"');
  
  // Fix unescaped quotes in string values
  jsonString = jsonString.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1$2$3"');
  
  // Fix missing commas between properties
  jsonString = jsonString.replace(/"\s*}\s*"/g, '", "');
  jsonString = jsonString.replace(/"\s*]\s*"/g, '", "');
  
  // Fix empty values
  jsonString = jsonString.replace(/:\s*,/g, ': null,');
  jsonString = jsonString.replace(/:\s*}/g, ': null}');
  jsonString = jsonString.replace(/:\s*]/g, ': null]');
  
  // Fix incomplete arrays/objects
  jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
  jsonString = jsonString.replace(/,\s*$/g, '');
  
  // Fix missing closing braces/brackets
  let braceCount = (jsonString.match(/\{/g) || []).length;
  let bracketCount = (jsonString.match(/\[/g) || []).length;
  let closeBraceCount = (jsonString.match(/\}/g) || []).length;
  let closeBracketCount = (jsonString.match(/\]/g) || []).length;
  
  // Add missing closing braces
  while (braceCount > closeBraceCount) {
    jsonString += '}';
    closeBraceCount++;
  }
  
  // Add missing closing brackets
  while (bracketCount > closeBracketCount) {
    jsonString += ']';
    closeBracketCount++;
  }
  
  return jsonString;
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

  // Generate real-time feedback during conversation
  async generateRealTimeFeedback(
    messages: ConversationMessage[],
    conversationMode: string
  ): Promise<RealTimeFeedback | null> {
    // Only generate feedback if we have enough messages
    if (messages.length < 3) return null;
    
    // Get the last few messages for context
    const recentMessages = messages.slice(-3);
    
    // Create a prompt for Claude
    const prompt = `
You are an expert communication coach providing real-time feedback during a ${conversationMode} conversation.
Analyze these recent messages and provide ONE specific, actionable piece of feedback if needed.

RECENT MESSAGES:
${recentMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

If you notice an issue that needs improvement, respond in this JSON format:
{
  "type": "pace"|"volume"|"filler"|"engagement"|"question"|"clarity",
  "message": "Brief, specific feedback",
  "severity": "info"|"suggestion"|"warning"
}

If no feedback is needed right now, respond with: {"none": true}

Focus on ONE specific aspect that would most help improve the conversation right now.
`;

    try {
      // Create a context for Claude API
      const context: ConversationContext = {
        messages: [],
        mode: 'realtime-feedback',
        sessionId: `feedback_${Date.now()}`,
        metadata: {
          startTime: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
          totalTokens: 0,
        },
      };
      
      // Send the prompt to Claude
      const response = await supabaseClaudeAPI.sendMessage(prompt, context);
      
      if (response.error || !response.data) {
        console.warn('Real-time feedback generation failed:', response.error);
        return null;
      }
      
      // Parse the response
      try {
        const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        const feedbackData = JSON.parse(jsonMatch[0]);
        
        // Check if no feedback is needed
        if (feedbackData.none) return null;
        
        // Create feedback object
        const feedback: RealTimeFeedback = {
          type: feedbackData.type,
          message: feedbackData.message,
          severity: feedbackData.severity,
          timestamp: new Date(),
        };
        
        this.realtimeFeedback.push(feedback);
        return feedback;
      } catch (error) {
        console.warn('Failed to parse real-time feedback:', error);
        return null;
      }
    } catch (error) {
      console.warn('Failed to generate real-time feedback:', error);
      return null;
    }
  }

  // Fallback method if Claude analysis fails
  private generateBasicFeedback(conversation: Conversation): FeedbackData {
    console.log('Using fallback basic feedback generation');
    
    // Create a simple feedback object with generic feedback
    const feedback: FeedbackData = {
      scores: {
        fluency: 75,
        clarity: 75,
        confidence: 75,
        pace: 75,
        overall: 75,
        engagement: 75,
      },
      strengths: [
        `Good participation in the ${conversation.mode.name} conversation`,
        `Maintained engagement throughout the session`,
        `Showed willingness to learn and improve`,
      ],
      improvements: [
        `Continue practicing ${conversation.mode.name} skills`,
        `Work on developing more structured responses`,
        `Focus on active listening and engagement`,
      ],
      analytics: {
        wordsPerMinute: 150,
        pauseCount: Math.round(conversation.duration / 60),
        fillerWords: Math.round(conversation.duration / 120),
        questionCount: conversation.messages.filter(m => m.role === 'user' && m.content.includes('?')).length,
        speakingTime: Math.round(conversation.duration / 120),
        listeningTime: Math.round(conversation.duration / 120),
      },
      modeSpecific: {},
      tips: [
        `Practice ${conversation.mode.name} regularly to build confidence`,
        `Record yourself to identify areas for improvement`,
        `Study examples of effective ${conversation.mode.name} techniques`,
      ],
      nextSteps: [
        `Schedule another ${conversation.mode.name} practice session`,
        `Focus on one specific skill to improve next time`,
      ],
    };
    
    return feedback;
  }

  // Helper methods
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
          
          if (feedback.analytics.questionCount) {
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

export const claudeFeedbackService = new ClaudeFeedbackService();