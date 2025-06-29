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
      const prompt = await this.createFeedbackPrompt(conversation);
      
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
      const feedback = await this.parseFeedbackResponse(response.data.content, conversation);
      
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
  private async createFeedbackPrompt(conversation: Conversation): Promise<string> {
    const { mode, messages, duration } = conversation;
    
    // Convert messages to a format suitable for analysis
    const formattedMessages = messages.map(msg => {
      return `${msg.role === 'user' ? 'USER' : 'AI'}: ${msg.content}`;
    }).join('\n\n');
    
    // Create a base prompt with conversation details
    const prompt = `
You are an expert communication coach specializing in ${mode.name} conversations. 
Please analyze the following conversation that lasted ${Math.floor(duration / 60)} minutes and ${duration % 60} seconds.

CRITICAL INSTRUCTION: Analyze only the USER's performance and communication skills. Do NOT analyze the AI assistant's responses.

CONVERSATION MODE: ${mode.name}
MODE DESCRIPTION: ${mode.description}

CONVERSATION TRANSCRIPT:
${formattedMessages}

Based on this conversation, provide a comprehensive feedback analysis of the USER's communication skills in the following JSON format:

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
2. Provide 3-5 specific strengths based on actual examples from the USER's messages
3. Provide 3-5 specific improvements with actionable suggestions for the USER
4. Make analytics as accurate as possible based on the USER's communication patterns
5. Provide 3-5 practical tips that are specific to how the USER communicated
6. Suggest 2-3 concrete next steps for the USER to improve
7. Remember: You are coaching the USER, not evaluating the AI assistant.
`;

    /* Add mode-specific analysis instructions
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

Focus on the USER's social skills, active listening, empathy, and natural conversation flow.`;
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

Focus on the USER's argument quality, evidence usage, logical consistency, and respectful disagreement.`;
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

Focus on the USER's idea generation, creativity, concept development, and collaborative thinking.`;
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

Focus on the USER's STAR method usage, professional communication, question handling, and confidence.`;
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

Focus on the USER's structure, clarity, audience engagement, and delivery style.`;
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

Focus on the USER's grammar, vocabulary, pronunciation, and overall fluency.`;
        break;
    }
    
    prompt += `\n\nEnsure your feedback is specific to the USER's communication in this conversation, mentioning actual examples from the USER's messages. Provide actionable advice that will help the USER improve their ${mode.name} skills.`;*/
    
    return prompt;
  }

  // Enhanced parsing methods to capture ALL of Claude's feedback

// Parse Claude's response into a structured feedback object
private async parseFeedbackResponse(response: string, conversation: Conversation): Promise<FeedbackData> {
  try {
    console.log('Raw Claude response:', response);
    
    // Clean the response first
    const cleanedResponse = response.trim();
    
    // Try to extract ALL possible data from Claude's response
    const extractedData = this.extractAllClaudeData(cleanedResponse);
    
    console.log('Extracted data from Claude:', extractedData);
    
    // Build feedback from extracted data
    const feedback = this.buildFeedbackFromExtractedData(extractedData, conversation);
    
    // If we have a very basic feedback, try to enhance it with real data
    if (feedback.scores.overall === 75 && feedback.strengths.length <= 3) {
      try {
        // Calculate some real metrics from the conversation
        const userMessages = conversation.messages.filter(m => m.role === 'user');
        const totalWords = userMessages.reduce((sum, msg) => sum + msg.content.split(/\s+/).length, 0);
        const avgWordsPerMessage = Math.round(totalWords / userMessages.length);
        const fillerWords = this.countFillerWords(userMessages);
        const questionCount = this.countQuestions(userMessages);
        
        // Update analytics with real data
        feedback.analytics.wordsPerMinute = Math.round(totalWords / (conversation.duration / 60)) || 150;
        feedback.analytics.fillerWords = fillerWords;
        feedback.analytics.questionCount = questionCount;
        feedback.analytics.speakingTime = Math.round(conversation.duration / 120);
        feedback.analytics.listeningTime = Math.round(conversation.duration / 120);
      } catch (error) {
        console.warn('Failed to enhance feedback with real metrics:', error);
      }
    }
    
    return feedback;
  } catch (error) {
    console.error('Failed to parse Claude feedback response:', error);
    // Only fall back to basic feedback if we truly can't extract anything
    return await this.generateBasicFeedback(conversation);
  }
}

// Count filler words in messages
private countFillerWords(messages: any[]): number {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually', 'literally'];
  let count = 0;
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
  });
  
  return count;
}

// Count questions in messages
private countQuestions(messages: any[]): number {
  let count = 0;
  
  messages.forEach(msg => {
    const content = msg.content;
    const questionMarks = (content.match(/\?/g) || []).length;
    const questionWords = (content.match(/\b(what|how|why|when|where|who|which)\b/gi) || []).length;
    
    // Count as question if it has a question mark or starts with a question word
    count += questionMarks;
    
    // Add questions that don't have question marks but start with question words
    const sentences = content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed && !trimmed.includes('?') && /^(what|how|why|when|where|who|which)\b/i.test(trimmed)) {
        count++;
      }
    });
  });
  
  return count;
}

// Extract ALL possible data from Claude's response using multiple strategies
private extractAllClaudeData(response: string): any {
  const extractedData = {
    scores: {},
    strengths: [],
    improvements: [],
    analytics: {},
    tips: [],
    nextSteps: [],
    modeSpecific: {}
  };
  
  // Strategy 1: Try to parse complete JSON if possible
  try {
    const completeJson = this.extractAndFixCompleteJson(response);
    if (completeJson) {
      console.log('Successfully parsed complete JSON');
      return completeJson;
    }
  } catch (e) {
    console.log('Complete JSON parsing failed, trying partial extraction');
  }
  
  // Strategy 2: Extract data piece by piece using regex patterns
  
  // Extract scores (even if incomplete)
  extractedData.scores = this.extractAllScores(response);
  
  // Extract arrays with better pattern matching
  extractedData.strengths = this.extractArrayAdvanced(response, 'strengths');
  extractedData.improvements = this.extractArrayAdvanced(response, 'improvements');
  extractedData.tips = this.extractArrayAdvanced(response, 'tips');
  extractedData.nextSteps = this.extractArrayAdvanced(response, 'nextSteps');
  
  // Extract analytics if present
  extractedData.analytics = this.extractAnalytics(response);
  
  // Extract mode-specific data
  extractedData.modeSpecific = this.extractModeSpecific(response);
  
  console.log('Partial extraction results:', extractedData);
  return extractedData;
}

// Try to extract and fix complete JSON with aggressive repair
private extractAndFixCompleteJson(response: string): any | null {
  // Find JSON boundaries
  const jsonStart = response.indexOf('{');
  if (jsonStart === -1) return null;
  
  // Try to find the end, or reconstruct it
  let jsonString = response.substring(jsonStart);
  
  // Aggressive JSON completion
  jsonString = this.aggressiveJsonRepair(jsonString);
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

// Aggressive JSON repair that tries to complete incomplete JSON
private aggressiveJsonRepair(jsonString: string): string {
  let repaired = jsonString;
  
  // If it's clearly cut off mid-string, try to complete it
  if (repaired.includes('"improvements": [') && !repaired.includes(']')) {
    // Find the last complete string in improvements array
    const improvementsMatch = repaired.match(/"improvements":\s*\[(.*?)(?:\]|$)/s);
    if (improvementsMatch) {
      const improvementsContent = improvementsMatch[1];
      
      // Extract complete strings from the content
      const strings = this.extractCompleteStringsFromArray(improvementsContent);
      
      // Reconstruct the improvements array
      const improvementsJson = '"improvements": [' + strings.map(s => `"${s}"`).join(', ') + ']';
      
      // Replace in the original
      repaired = repaired.replace(/"improvements":\s*\[.*?(?:\]|$)/s, improvementsJson);
    }
  }
  
  // Apply similar logic for other arrays
  ['strengths', 'tips', 'nextSteps'].forEach(arrayName => {
    repaired = this.repairArrayInJson(repaired, arrayName);
  });
  
  // Ensure proper closing
  repaired = this.ensureProperJsonClosing(repaired);
  
  return repaired;
}

// Extract complete strings from a partially parsed array content
private extractCompleteStringsFromArray(content: string): string[] {
  const strings: string[] = [];
  
  // Match complete quoted strings
  const completeStrings = content.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
  if (completeStrings) {
    strings.push(...completeStrings.map(s => s.slice(1, -1))); // Remove quotes
  }
  
  // If there's an incomplete string at the end, try to use it
  const incompleteMatch = content.match(/,\s*"([^"]*?)(?:\s*$)/);
  if (incompleteMatch && incompleteMatch[1].length > 10) {
    // Only include if it's substantial content
    strings.push(incompleteMatch[1]);
  }
  
  return strings;
}

// Repair specific arrays in JSON
private repairArrayInJson(jsonString: string, arrayName: string): string {
  const arrayPattern = new RegExp(`"${arrayName}":\\s*\\[(.*?)(?:\\]|$)`, 's');
  const match = jsonString.match(arrayPattern);
  
  if (match) {
    const content = match[1];
    const strings = this.extractCompleteStringsFromArray(content);
    
    if (strings.length > 0) {
      const repairedArray = `"${arrayName}": [${strings.map(s => `"${s}"`).join(', ')}]`;
      return jsonString.replace(arrayPattern, repairedArray);
    }
  }
  
  return jsonString;
}

// Ensure proper JSON closing
private ensureProperJsonClosing(jsonString: string): string {
  let result = jsonString.trim();
  
  // Count braces and brackets
  const openBraces = (result.match(/\{/g) || []).length;
  const closeBraces = (result.match(/\}/g) || []).length;
  const openBrackets = (result.match(/\[/g) || []).length;
  const closeBrackets = (result.match(/\]/g) || []).length;
  
  // Add missing closings
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    result += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    result += '}';
  }
  
  return result;
}

// Extract all possible scores from the response
private extractAllScores(response: string): any {
  const scores: any = {};
  
  // Common score fields
  const scoreFields = [
    'fluency', 'clarity', 'confidence', 'pace', 'overall', 'engagement',
    'relevance', 'structure', 'persuasiveness', 'creativity', 'criticalThinking',
    'emotionalIntelligence', 'vocabularyUsage', 'grammarAccuracy', 'professionalCommunication'
  ];
  
  for (const field of scoreFields) {
    // Try multiple regex patterns
    const patterns = [
      new RegExp(`"${field}"\\s*:\\s*(\\d+)`, 'i'),
      new RegExp(`${field}.*?(\\d+)`, 'i'),
      new RegExp(`"${field}".*?(\\d{1,3})`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        const value = parseInt(match[1], 10);
        if (value >= 0 && value <= 100) {
          scores[field] = value;
          break;
        }
      }
    }
  }
  
  return scores;
}

// Advanced array extraction with multiple fallback strategies
private extractArrayAdvanced(response: string, arrayName: string): string[] {
  const results: string[] = [];
  
  // Strategy 1: Standard JSON array extraction
  const standardResult = this.extractArrayFromJson(response, arrayName);
  if (standardResult && standardResult.length > 0) {
    return standardResult;
  }
  
  // Strategy 2: Look for the array pattern even if incomplete
  const arrayPattern = new RegExp(`"${arrayName}"\\s*:\\s*\\[(.*?)(?:\\]|$)`, 's');
  const match = response.match(arrayPattern);
  
  if (match) {
    const content = match[1];
    
    // Extract all quoted strings from the content
    const quotes = content.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
    if (quotes) {
      results.push(...quotes.map(q => q.slice(1, -1))); // Remove quotes
    }
    
    // Also look for unfinished strings
    const unfinished = content.match(/,\s*"([^"]{10,})\s*$/);
    if (unfinished) {
      results.push(unfinished[1]);
    }
  }
  
  // Strategy 3: Look for patterns without the array structure
  if (results.length === 0) {
    results.push(...this.extractByPattern(response, arrayName));
  }
  
  return results.filter(item => item && item.trim().length > 0);
}

// Extract items by looking for patterns in the text
private extractByPattern(response: string, arrayName: string): string[] {
  const results: string[] = [];
  
  // Look for bullet points or list-like patterns after the array name
  const sectionPattern = new RegExp(`${arrayName}[^\\[]*\\[(.*?)(?:\\]|improvements|tips|analytics|nextSteps|$)`, 'is');
  const match = response.match(sectionPattern);
  
  if (match) {
    const content = match[1];
    
    // Look for patterns like "text", or bullet points
    const items = content.match(/["']([^"']{20,})["']/g);
    if (items) {
      results.push(...items.map(item => item.slice(1, -1)));
    }
  }
  
  return results;
}

// Extract analytics data
private extractAnalytics(response: string): any {
  const analytics: any = {};
  
  const analyticsFields = [
    'wordsPerMinute', 'pauseCount', 'fillerWords', 'questionCount',
    'topicChanges', 'responseTime', 'complexSentences', 'speakingTime', 'listeningTime'
  ];
  
  for (const field of analyticsFields) {
    const patterns = [
      new RegExp(`"${field}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
      new RegExp(`${field}.*?(\\d+(?:\\.\\d+)?)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value >= 0) {
          analytics[field] = value;
          break;
        }
      }
    }
  }
  
  return analytics;
}

// Extract mode-specific data
private extractModeSpecific(response: string): any {
  const modeSpecific: any = {};
  
  // Look for modeSpecific object
  const modeSpecificPattern = /"modeSpecific"\s*:\s*\{(.*?)\}/s;
  const match = response.match(modeSpecificPattern);
  
  if (match) {
    try {
      const content = `{${match[1]}}`;
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      // Extract manually if JSON parsing fails
      return this.extractModeSpecificManually(match[1]);
    }
  }
  
  return modeSpecific;
}

// Manually extract mode-specific data if JSON parsing fails
private extractModeSpecificManually(content: string): any {
  const result: any = {};
  
  // Look for nested objects like "generalChat": { ... }
  const objectPattern = /"(\w+)"\s*:\s*\{([^}]*)\}/g;
  let match;
  
  while ((match = objectPattern.exec(content)) !== null) {
    const objectName = match[1];
    const objectContent = match[2];
    
    result[objectName] = {};
    
    // Extract properties from the object
    const propPattern = /"(\w+)"\s*:\s*(\d+(?:\.\d+)?)/g;
    let propMatch;
    
    while ((propMatch = propPattern.exec(objectContent)) !== null) {
      const propName = propMatch[1];
      const propValue = parseFloat(propMatch[2]);
      result[objectName][propName] = propValue;
    }
  }
  
  return result;
}

// Build final feedback object from all extracted data
private buildFeedbackFromExtractedData(extractedData: any, conversation: Conversation): FeedbackData {
  const feedback: FeedbackData = {
    scores: {
      fluency: extractedData.scores?.fluency || 75,
      clarity: extractedData.scores?.clarity || 75,
      confidence: extractedData.scores?.confidence || 75,
      pace: extractedData.scores?.pace || 75,
      overall: extractedData.scores?.overall || 75,
      engagement: extractedData.scores?.engagement,
      relevance: extractedData.scores?.relevance,
      structure: extractedData.scores?.structure,
      persuasiveness: extractedData.scores?.persuasiveness,
      creativity: extractedData.scores?.creativity,
      criticalThinking: extractedData.scores?.criticalThinking,
      emotionalIntelligence: extractedData.scores?.emotionalIntelligence,
      vocabularyUsage: extractedData.scores?.vocabularyUsage,
      grammarAccuracy: extractedData.scores?.grammarAccuracy,
      professionalCommunication: extractedData.scores?.professionalCommunication,
    },
    strengths: extractedData.strengths?.length > 0 
      ? extractedData.strengths 
      : [`Good participation in the ${conversation.mode.name} conversation`],
    improvements: extractedData.improvements?.length > 0 
      ? extractedData.improvements 
      : [`Continue practicing ${conversation.mode.name} skills`],
    analytics: {
      wordsPerMinute: extractedData.analytics?.wordsPerMinute || 150,
      pauseCount: extractedData.analytics?.pauseCount || 10,
      fillerWords: extractedData.analytics?.fillerWords || 5,
      questionCount: extractedData.analytics?.questionCount,
      topicChanges: extractedData.analytics?.topicChanges,
      responseTime: extractedData.analytics?.responseTime,
      complexSentences: extractedData.analytics?.complexSentences,
      speakingTime: extractedData.analytics?.speakingTime,
      listeningTime: extractedData.analytics?.listeningTime,
    },
    modeSpecific: extractedData.modeSpecific || {},
    tips: extractedData.tips?.length > 0 
      ? extractedData.tips 
      : [`Practice ${conversation.mode.name} regularly to build confidence`],
    nextSteps: extractedData.nextSteps?.length > 0 
      ? extractedData.nextSteps 
      : [`Schedule another ${conversation.mode.name} practice session`],
  };
  
  console.log('Final constructed feedback:', feedback);
  return feedback;
}

// Extract the best JSON from Claude's response
private extractBestJson(response: string): string | null {
  // Strategy 1: Find complete JSON objects with balanced braces
  const jsonObjects = this.findCompleteJsonObjects(response);
  if (jsonObjects.length > 0) {
    // Return the largest/most complete one
    return jsonObjects.reduce((largest, current) => 
      current.length > largest.length ? current : largest
    );
  }
  
  // Strategy 2: Look for JSON-like structures and try to complete them
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return response.substring(jsonStart, jsonEnd + 1);
  }
  
  return null;
}

// Find complete JSON objects with balanced braces
private findCompleteJsonObjects(text: string): string[] {
  const objects: string[] = [];
  let braceCount = 0;
  let startIndex = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      
      if (braceCount === 0 && startIndex !== -1) {
        const jsonCandidate = text.substring(startIndex, i + 1);
        // Validate it looks like feedback JSON
        if (jsonCandidate.includes('"scores"') || jsonCandidate.includes('"fluency"')) {
          objects.push(jsonCandidate);
        }
        startIndex = -1;
      }
    }
  }
  
  return objects;
}

// Progressive JSON fixing with multiple strategies
private fixJsonProgressively(jsonString: string): string {
  let fixed = jsonString;
  
  // 1. Remove trailing incomplete content after last complete property
  fixed = this.removeIncompleteTrailing(fixed);
  
  // 2. Fix common syntax issues
  fixed = this.fixCommonJsonSyntax(fixed);
  
  // 3. Ensure proper closing
  fixed = this.ensureProperClosing(fixed);
  
  // 4. Validate and fix structure
  fixed = this.validateJsonStructure(fixed);
  
  return fixed;
}

// Remove incomplete trailing content
private removeIncompleteTrailing(jsonString: string): string {
  // Find the last complete value before any incomplete content
  const lines = jsonString.split('\n');
  let lastCompleteIndex = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    
    // Skip empty lines and closing braces
    if (!line || line === '}' || line === '},' || line === '],') {
      continue;
    }
    
    // Look for complete property lines
    if (line.includes(':') && (line.endsWith(',') || line.endsWith('"') || line.endsWith(']') || line.endsWith('}'))) {
      lastCompleteIndex = i;
      break;
    }
  }
  
  if (lastCompleteIndex !== -1) {
    // Reconstruct with only complete lines
    const completeLines = lines.slice(0, lastCompleteIndex + 1);
    const lastLine = completeLines[completeLines.length - 1];
    
    // Remove trailing comma from last line if present
    completeLines[completeLines.length - 1] = lastLine.replace(/,$/, '');
    
    // Add proper closing
    let result = completeLines.join('\n');
    
    // Count open braces/brackets to determine what closing is needed
    const openBraces = (result.match(/\{/g) || []).length;
    const closeBraces = (result.match(/\}/g) || []).length;
    const openBrackets = (result.match(/\[/g) || []).length;
    const closeBrackets = (result.match(/\]/g) || []).length;
    
    // Add missing closings
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      result += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      result += '}';
    }
    
    return result;
  }
  
  return jsonString;
}

// Fix common JSON syntax issues
private fixCommonJsonSyntax(jsonString: string): string {
  let fixed = jsonString;
  
  // Fix unquoted property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes
  fixed = fixed.replace(/'/g, '"');
  
  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between properties
  fixed = fixed.replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');
  fixed = fixed.replace(/](\s*)"([^"]+)":/g, '],$1"$2":');
  fixed = fixed.replace(/"(\s*)"([^"]+)":/g, '",$1"$2":');
  
  return fixed;
}

// Ensure proper JSON closing
private ensureProperClosing(jsonString: string): string {
  let fixed = jsonString.trim();
  
  if (!fixed.endsWith('}')) {
    // Count unclosed braces
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
  }
  
  return fixed;
}

// Validate JSON structure and fix if possible
private validateJsonStructure(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return jsonString; // Already valid
  } catch (error) {
    // Try to fix based on the error
    if (error.message.includes('Unexpected token')) {
      // Remove problematic content
      const lines = jsonString.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.includes('undefined') && !trimmed.includes('null,');
      });
      return this.ensureProperClosing(filteredLines.join('\n'));
    }
    
    return jsonString;
  }
}

// Reconstruct feedback from partial JSON
private reconstructFromPartialJson(jsonString: string, conversation: Conversation): FeedbackData | null {
  try {
    // Try to extract any valid scores object
    const scoresMatch = jsonString.match(/"scores"\s*:\s*\{[^}]*\}/);
    let scores = null;
    
    if (scoresMatch) {
      try {
        const scoresJson = `{${scoresMatch[0]}}`;
        const parsed = JSON.parse(scoresJson);
        scores = parsed.scores;
      } catch (e) {
        // Try to extract individual score values
        scores = this.extractScoresManually(jsonString);
      }
    } else {
      // Try to extract scores manually if no scores object found
      scores = this.extractScoresManually(jsonString);
    }
    
    // Extract other arrays if present
    const strengths = this.extractArrayFromJson(jsonString, 'strengths') || [];
    const improvements = this.extractArrayFromJson(jsonString, 'improvements') || [];
    const tips = this.extractArrayFromJson(jsonString, 'tips') || [];
    
    if (scores) {
      return {
        scores: {
          fluency: scores.fluency || 70,
          clarity: scores.clarity || 70,
          confidence: scores.confidence || 70,
          pace: scores.pace || 70,
          overall: scores.overall || 70,
          engagement: scores.engagement || 70,
        },
        strengths: strengths.length > 0 ? strengths : ["Good participation in the conversation"],
        improvements: improvements.length > 0 ? improvements : ["Continue practicing to improve skills"],
        analytics: {
          wordsPerMinute: 150,
          pauseCount: 10,
          fillerWords: 5,
        },
        modeSpecific: {},
        tips: tips.length > 0 ? tips : ["Keep practicing regularly"],
        nextSteps: ["Schedule another practice session"],
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to reconstruct from partial JSON:', error);
    return null;
  }
}

// Extract scores manually using regex
private extractScoresManually(text: string): any {
  const scores: any = {};
  
  const scoreFields = ['fluency', 'clarity', 'confidence', 'pace', 'overall', 'engagement'];
  
  for (const field of scoreFields) {
    const regex = new RegExp(`"${field}"\\s*:\\s*(\\d+)`, 'i');
    const match = text.match(regex);
    if (match) {
      scores[field] = parseInt(match[1], 10);
    }
  }
  
  return Object.keys(scores).length > 0 ? scores : null;
}

// Extract array values from JSON text
private extractArrayFromJson(text: string, arrayName: string): string[] | null {
  const regex = new RegExp(`"${arrayName}"\\s*:\\s*\\[([^\\]]*?)\\]`, 's');
  const match = text.match(regex);
  
  if (match) {
    try {
      const arrayContent = match[1];
      // Extract quoted strings
      const stringMatches = arrayContent.match(/"([^"]+)"/g);
      if (stringMatches) {
        return stringMatches.map(s => s.slice(1, -1)); // Remove quotes
      }
    } catch (e) {
      console.warn(`Failed to extract ${arrayName} array:`, e);
    }
  }
  
  return null;
}

// Validate and complete feedback object
private validateAndCompleteFeedback(parsedFeedback: any, conversation: Conversation): FeedbackData {
  const feedback: FeedbackData = {
    scores: {
      fluency: this.validateScore(parsedFeedback.scores?.fluency) || 70,
      clarity: this.validateScore(parsedFeedback.scores?.clarity) || 70,
      confidence: this.validateScore(parsedFeedback.scores?.confidence) || 70,
      pace: this.validateScore(parsedFeedback.scores?.pace) || 70,
      overall: this.validateScore(parsedFeedback.scores?.overall) || 70,
      engagement: this.validateScore(parsedFeedback.scores?.engagement),
      relevance: this.validateScore(parsedFeedback.scores?.relevance),
      structure: this.validateScore(parsedFeedback.scores?.structure),
      persuasiveness: this.validateScore(parsedFeedback.scores?.persuasiveness),
      creativity: this.validateScore(parsedFeedback.scores?.creativity),
      criticalThinking: this.validateScore(parsedFeedback.scores?.criticalThinking),
      emotionalIntelligence: this.validateScore(parsedFeedback.scores?.emotionalIntelligence),
      vocabularyUsage: this.validateScore(parsedFeedback.scores?.vocabularyUsage),
      grammarAccuracy: this.validateScore(parsedFeedback.scores?.grammarAccuracy),
      professionalCommunication: this.validateScore(parsedFeedback.scores?.professionalCommunication),
    },
    strengths: this.validateArray(parsedFeedback.strengths) || ["Good participation in the conversation"],
    improvements: this.validateArray(parsedFeedback.improvements) || ["Continue practicing to improve skills"],
    analytics: {
      wordsPerMinute: this.validateNumber(parsedFeedback.analytics?.wordsPerMinute) || 150,
      pauseCount: this.validateNumber(parsedFeedback.analytics?.pauseCount) || 10,
      fillerWords: this.validateNumber(parsedFeedback.analytics?.fillerWords) || 5,
      questionCount: this.validateNumber(parsedFeedback.analytics?.questionCount),
      topicChanges: this.validateNumber(parsedFeedback.analytics?.topicChanges),
      responseTime: this.validateNumber(parsedFeedback.analytics?.responseTime),
      complexSentences: this.validateNumber(parsedFeedback.analytics?.complexSentences),
      speakingTime: this.validateNumber(parsedFeedback.analytics?.speakingTime),
      listeningTime: this.validateNumber(parsedFeedback.analytics?.listeningTime),
    },
    modeSpecific: parsedFeedback.modeSpecific || {},
    tips: this.validateArray(parsedFeedback.tips) || ["Keep practicing regularly"],
    nextSteps: this.validateArray(parsedFeedback.nextSteps) || ["Schedule another practice session"],
  };
  
  return feedback;
}

// Validation helper methods
private validateScore(value: any): number | undefined {
  if (typeof value === 'number' && value >= 0 && value <= 100) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      return num;
    }
  }
  return undefined;
}

private validateArray(value: any): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string' && item.trim().length > 0);
  }
  return undefined;
}

private validateNumber(value: any): number | undefined {
  if (typeof value === 'number' && !isNaN(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      return Math.round(num);
    }
  }
  return undefined;
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
    
    // Create a prompt for real-time feedback
    const prompt = `
You are an expert communication coach providing real-time feedback during a ${conversationMode} conversation.
Analyze these recent messages and provide ONE specific, actionable piece of feedback for the USER if needed.

CRITICAL INSTRUCTION: Analyze only the USER's messages and communication skills. Do NOT analyze the AI assistant's responses.

RECENT MESSAGES:
${recentMessages.map(msg => `${msg.role === 'user' ? 'USER' : 'AI'}: ${msg.content}`).join('\n\n')}

If you notice an issue in the USER's communication that needs improvement, respond in this JSON format:
{
  "type": "pace"|"volume"|"filler"|"engagement"|"question"|"clarity",
  "message": "Brief, specific feedback for the USER",
  "severity": "info"|"suggestion"|"warning"
}

If no feedback is needed right now for the USER, respond with: {"none": true}

Focus on ONE specific aspect of the USER's communication that would most help improve the conversation right now.
Remember: You are coaching the USER, not evaluating the AI assistant.
`;

    try {
      // Create a context for Claude API
      // Analyze the conversation to generate real-time feedback
      const userMessages = recentMessages.filter(m => m.role === 'user');
      if (userMessages.length === 0) return null;
      
      // Get the last user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      
      // Simple analysis to generate feedback
      const content = lastUserMessage.content.toLowerCase();
      
      // Check for filler words
      const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];
      const hasFillerWords = fillerWords.some(word => content.includes(word));
      
      // Check for questions
      const hasQuestion = content.includes('?');
      
      // Check for short responses
      const wordCount = content.split(/\s+/).length;
      const isShortResponse = wordCount < 5;
      
      // Check for long responses
      const isLongResponse = wordCount > 50;
      
      // Generate feedback based on analysis
      if (hasFillerWords) {
        return {
          type: 'filler',
          message: 'Try to reduce filler words like "um" and "uh"',
          severity: 'suggestion',
          timestamp: new Date(),
        };
      } else if (isShortResponse) {
        return {
          type: 'engagement',
          message: 'Try to elaborate more in your responses',
          severity: 'suggestion',
          timestamp: new Date(),
        };
      } else if (isLongResponse) {
        return {
          type: 'pace',
          message: 'Consider breaking long responses into smaller points',
          severity: 'suggestion',
          timestamp: new Date(),
        };
      } else if (!hasQuestion && Math.random() < 0.3) {
        return {
          type: 'question',
          message: 'Try asking follow-up questions to engage more',
          severity: 'suggestion',
          timestamp: new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to generate real-time feedback:', error);
      return null;
    }
  }

  // Fallback method if Claude analysis fails
  private async generateBasicFeedback(conversation: Conversation): Promise<FeedbackData> {
    console.log('Using fallback basic feedback generation');
    
    // Calculate some real metrics from the conversation
    const userMessages = conversation.messages.filter(m => m.role === 'user');
    const totalWords = userMessages.reduce((sum, msg) => sum + msg.content.split(/\s+/).length, 0);
    const fillerWords = this.countFillerWords(userMessages);
    const questionCount = this.countQuestions(userMessages);
    const wordsPerMinute = Math.round(totalWords / (conversation.duration / 60)) || 150;
    
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
        wordsPerMinute,
        pauseCount: Math.round(conversation.duration / 60),
        fillerWords,
        questionCount,
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