import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  APIResponse,
  ConversationMessage,
  ConversationContext,
  APIRequestOptions,
  StreamingResponse,
  NetworkQuality,
  CacheEntry,
  QueuedRequest
} from '../types/api';

class SupabaseClaudeAPIService {
  private supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  private supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  private requestQueue: QueuedRequest[] = [];
  private cache = new Map<string, CacheEntry<any>>();
  private isOnline = true;
  private networkQuality: NetworkQuality = { type: 'unknown', speed: 'medium', latency: 0 };
  private activeRequests = new Set<string>();

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadCacheFromStorage();
    this.processQueuePeriodically();
    
    // Validate Supabase configuration
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }
  }

  // Check if Supabase is properly configured
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseAnonKey);
  }

  // Get configuration status for debugging
  getConfigStatus(): { configured: boolean; hasUrl: boolean; hasKey: boolean } {
    return {
      configured: this.isConfigured(),
      hasUrl: !!this.supabaseUrl,
      hasKey: !!this.supabaseAnonKey
    };
  }

  // Network monitoring for mobile optimization
  private async initializeNetworkMonitoring() {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      this.networkQuality = {
        type: state.type as 'wifi' | 'cellular' | 'unknown',
        speed: this.determineSpeed(state),
        latency: 0
      };

      if (this.isOnline) {
        this.processOfflineQueue();
      }
    });

    return unsubscribe;
  }

  private determineSpeed(state: any): 'fast' | 'medium' | 'slow' {
    if (state.type === 'wifi') return 'fast';
    if (state.type === 'cellular') {
      const effectiveType = state.details?.effectiveType;
      if (effectiveType === '4g' || effectiveType === '5g') return 'fast';
      if (effectiveType === '3g') return 'medium';
      return 'slow';
    }
    return 'medium';
  }

  // Cache management
  private async loadCacheFromStorage() {
    try {
      const cacheData = await AsyncStorage.getItem('supabase_claude_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(parsed);
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  private async saveCacheToStorage() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await AsyncStorage.setItem('supabase_claude_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  private getCacheKey(data: any): string {
    return `claude_${JSON.stringify(data)}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiresAt;
  }

  // Request queue for offline support
  private async addToQueue(
    data: any,
    options: APIRequestOptions
  ): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: Date.now().toString(),
      endpoint: '/claude-proxy',
      data,
      options,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.requestQueue.push(queuedRequest);
    await this.saveQueueToStorage();
  }

  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem('supabase_claude_queue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.warn('Failed to save queue:', error);
    }
  }

  private async processOfflineQueue() {
    if (!this.isOnline || this.requestQueue.length === 0) return;

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of queue) {
      try {
        await this.makeRequest(request.data, request.options);
      } catch (error) {
        if (request.retryCount < 3) {
          request.retryCount++;
          this.requestQueue.push(request);
        }
      }
    }

    await this.saveQueueToStorage();
  }

  private processQueuePeriodically() {
    setInterval(() => {
      if (this.isOnline) {
        this.processOfflineQueue();
      }
    }, 30000);
  }

  // Core API request method using Supabase Edge Function
  private async makeRequest<T>(
    data: any,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    // Check if Supabase is configured
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured. Please set your Supabase URL and anon key.');
    }

    const {
      timeout = 15000,
      retries = 3,
      cache = true,
      priority = 'normal',
      compress = true
    } = options;

    // Check cache first
    if (cache) {
      const cacheKey = this.getCacheKey(data);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isValidCache(cached)) {
        return {
          data: cached.data,
          status: 200,
          timestamp: cached.timestamp
        };
      }
    }
    
    // Add system prompt if provided
    if (options.system) {
      data.system = options.system;
    }

    // If offline, add to queue
    if (!this.isOnline) {
      await this.addToQueue(data, options);
      throw new Error('Request queued for when connection is restored');
    }

    // Adaptive timeout based on network quality
    const adaptiveTimeout = this.getAdaptiveTimeout(timeout);
    
    const requestId = Date.now().toString();
    this.activeRequests.add(requestId);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), adaptiveTimeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseAnonKey}`,
        'apikey': this.supabaseAnonKey
      };

      if (compress && Platform.OS !== 'web') {
        headers['Accept-Encoding'] = 'gzip, deflate';
      }

      console.log('Making request to Supabase Edge Function:', {
        url: `${this.supabaseUrl}/functions/v1/claude-proxy`,
        data: {
          model: data.model,
          max_tokens: data.max_tokens,
          messages_count: data.messages?.length,
          temperature: data.temperature,
          has_system: !!data.system
        }
      });

      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-proxy`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);

      console.log('Supabase Edge Function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase Edge Function error:', response.status, errorText);
        
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('Error details:', errorData.details);
          }
        } catch {
          // Use default error message if parsing fails
        }
        
        if (response.status === 401) {
          throw new Error('Unauthorized. Please check your Supabase configuration.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Supabase Edge Function response received successfully');

      // Cache successful responses
      if (cache && response.status === 200) {
        const cacheKey = this.getCacheKey(data);
        const cacheEntry: CacheEntry<T> = {
          data: result,
          timestamp: Date.now(),
          expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
          key: cacheKey
        };
        this.cache.set(cacheKey, cacheEntry);
        this.saveCacheToStorage();
      }

      return {
        data: result,
        status: response.status,
        timestamp: Date.now()
      };

    } catch (error) {
      this.activeRequests.delete(requestId);
      
      if (retries > 0 && this.shouldRetry(error)) {
        console.log(`Retrying request, attempts left: ${retries - 1}`);
        await this.delay(this.getRetryDelay(3 - retries));
        return this.makeRequest(data, { ...options, retries: retries - 1 });
      }

      throw error;
    }
  }

  private getAdaptiveTimeout(baseTimeout: number): number {
    switch (this.networkQuality.speed) {
      case 'slow': return baseTimeout * 2;
      case 'medium': return baseTimeout * 1.5;
      case 'fast': return baseTimeout;
      default: return baseTimeout;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error.name === 'AbortError') return false;
    if (error.message?.includes('429')) return true; // Rate limit
    if (error.message?.includes('500')) return true; // Server error
    if (error.message?.includes('502')) return true; // Bad gateway
    if (error.message?.includes('503')) return true; // Service unavailable
    return false;
  }

  private getRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mode-specific system prompts
  private getSystemPrompt(mode: string, customSettings?: any): string {
    const prompts = {
      'general-chat': `You are a warm, empathetic conversation partner who loves discussing any topic. Be curious, ask follow-up questions, and show genuine interest in the user's thoughts and experiences. Keep responses conversational and engaging, around 2-3 sentences on mobile. Show empathy and understanding.`,
      
      'debate-challenge': `You are an intelligent, well-informed debate partner who challenges ideas respectfully. Present counterarguments, ask probing questions, and demand evidence for claims. Be intellectually rigorous but maintain civility. Keep responses focused and argumentative, around 2-4 sentences.`,
      
      'idea-brainstorm': `You are an enthusiastic creative collaborator who loves generating and building on ideas. Be imaginative, offer wild suggestions, and help connect different concepts. Encourage creative thinking and don't worry about practicality initially. Keep responses energetic and idea-focused.`,
      
      'interview-practice': `You are a professional interviewer conducting a realistic job interview. Ask relevant questions based on the job description provided, follow up on answers, and maintain professional demeanor. Adapt difficulty to the role level. Ask one question at a time and wait for complete answers.`,
      
      'presentation-prep': `You are a supportive audience member providing constructive feedback on presentations. Listen actively, ask clarifying questions, and provide specific suggestions for improvement. Focus on structure, clarity, and engagement. Be encouraging while offering actionable advice.`,
      
      'language-learning': `You are a patient, encouraging language teacher focused on conversation practice. Correct mistakes gently, introduce new vocabulary naturally, and discuss cultural context. Adapt your complexity to the user's proficiency level. Encourage practice and celebrate progress.`
    };

    // For interview practice, add document analysis if available
    if (mode === 'interview-practice' && customSettings?.documentAnalysis) {
      const analysis = customSettings.documentAnalysis;
      const jobDescription = customSettings.jobDescription || '';
      const cvContent = customSettings.cvContent || '';

      // Get interview questions from analysis
      const technicalQuestions = analysis.analysis.interviewQuestions?.technical || [];
      const behavioralQuestions = analysis.analysis.interviewQuestions?.behavioral || [];
      const situationalQuestions = analysis.analysis.interviewQuestions?.situational || [];
      const gapFocusedQuestions = analysis.analysis.interviewQuestions?.gapFocused || [];
      const allQuestions = [
        ...technicalQuestions,
        ...behavioralQuestions,
        ...situationalQuestions,
        ...gapFocusedQuestions
      ];
      const formattedQuestions = allQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      
      return `You are a professional interviewer conducting a job interview. \n\nJob Description: ${jobDescription || 'Not provided'}\n\nCandidate CV: ${cvContent || 'Not provided'}\n\nAnalysis:\n- Match Score: ${analysis.analysis.matchScore}%\n- Candidate Strengths: ${analysis.analysis.strengths.join(', ')}\n- Gaps to Address: ${analysis.analysis.gaps.join(', ')}\n- Focus Areas: ${analysis.analysis.focusAreas.join(', ')}\n- Experience Level: ${analysis.analysis.difficulty}\n\nPERSONALIZED QUESTIONS TO ASK:\n${formattedQuestions}\n\nYour task is to conduct a realistic interview for this position. Ask relevant questions that:\n1. Explore the candidate's strengths mentioned in the analysis\n2. Tactfully probe the identified gaps\n3. Focus on the key areas relevant to the job\n4. Include a mix of technical, behavioral, and situational questions\n\nStart with a brief introduction and your first question. Be professional, thorough, and provide constructive feedback. Ask one question at a time and wait for complete answers.\n\nIMPORTANT: Begin the interview immediately with a brief introduction and your first question from the list above.`;
    }

    return prompts[mode as keyof typeof prompts] || prompts['general-chat'];
  }

  // Main conversation method
  async sendMessage(
  message: string,
  context: ConversationContext,
  options: APIRequestOptions = {}
): Promise<APIResponse<ConversationMessage>> {
  console.log('📨 sendMessage called:', {
    mode: context.mode,
    messageLength: message.length,
    hasCustomSettings: !!(context as any).customSettings,
    messagesCount: context.messages.length
  });

  // Get custom settings from context if available
  const customSettings = (context as any).customSettings;
  
  // Generate system prompt with custom settings for interview mode
  const systemPrompt = this.getSystemPrompt(context.mode, customSettings);
  
  if (context.mode === 'interview-practice') {
    console.log('🎯 Interview mode system prompt generated:', {
      promptLength: systemPrompt.length,
      hasAnalysis: !!customSettings?.documentAnalysis
    });
  }

  // Prepare messages - this should NOT include the system prompt
  const messages = this.prepareMessages(context, systemPrompt);
  
  // CRITICAL FIX: For interview practice initialization with empty message,
  // send a starter message to begin the interview
  if (context.mode === 'interview-practice' && 
      !message.trim() && 
      messages.length === 0 && 
      customSettings?.documentAnalysis) {
    
    // Send a starter message to initiate the interview
    messages.push({
      role: 'user',
      content: 'Please start the interview now with a brief introduction and your first question.'
    });
  } else if (message.trim()) {
    // Add the current user message only if it's not empty
    messages.push({
      role: 'user',
      content: message.trim()
    });
  } else {
    // If no message and not interview initialization, return error
    return {
      error: 'Cannot send empty message',
      status: 400,
      timestamp: Date.now()
    };
  }

  // Use custom maxTokens if provided, otherwise use mode default
  const maxTokens = (options as any).maxTokens || this.getMaxTokensForMode(context.mode);

  const requestData = {
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: maxTokens,
    messages,
    temperature: this.getTemperatureForMode(context.mode),
    stream: false,
    system: systemPrompt  // System prompt goes here as a top-level parameter
  };

  console.log('🚀 Sending request to Claude:', {
    mode: context.mode,
    message_length: message.length,
    total_messages: messages.length,
    model: requestData.model,
    max_tokens: requestData.max_tokens,
    has_system: !!requestData.system,
    system_length: requestData.system?.length || 0
  });

  try {
    const response = await this.makeRequest<any>(requestData, options);
    
    if (response.data?.content?.[0]?.text) {
      const assistantMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.content[0].text,
        timestamp: new Date()
      };
      
      console.log('✅ Received response from Claude:', {
        response_length: assistantMessage.content.length,
        mode: context.mode
      });
      
      return {
        data: assistantMessage,
        status: response.status,
        timestamp: response.timestamp
      };
    }
    
    console.error('❌ Invalid response format from Claude:', response.data);
    throw new Error('Invalid response format');
    
  } catch (error) {
    console.error('❌ Error sending message to Claude:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      timestamp: Date.now()
    };
  }
}

  // Streaming conversation for real-time responses
  async sendMessageStream(
    message: string,
    context: ConversationContext,
    onChunk: (chunk: StreamingResponse) => void,
    options: APIRequestOptions = {}
  ): Promise<void> {
    if (!this.isConfigured()) {
      onChunk({
        content: '',
        isComplete: true,
        error: 'Supabase not configured. Please set your Supabase URL and anon key.'
      });
      return;
    }

    const systemPrompt = this.getSystemPrompt(context.mode);
    const messages = this.prepareMessages(context, systemPrompt);
    messages.push({
      role: 'user',
      content: message
    });

    const requestData = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: this.getMaxTokensForMode(context.mode),
      messages,
      temperature: this.getTemperatureForMode(context.mode),
      stream: true
    };

    console.log('Starting streaming message to Claude:', {
      mode: context.mode,
      message_length: message.length,
      total_messages: messages.length
    });

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'apikey': this.supabaseAnonKey
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming request failed:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Unauthorized. Please check your Supabase configuration.');
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let content = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta') {
                content += data.delta.text;
                onChunk({
                  content,
                  isComplete: false
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      console.log('Streaming completed, total content length:', content.length);

      onChunk({
        content,
        isComplete: true
      });

    } catch (error) {
      console.error('Streaming error:', error);
      onChunk({
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Context management with intelligent truncation
  private prepareMessages(context: ConversationContext, systemPrompt: string): any[] {
  console.log('📝 Preparing messages:', {
    mode: context.mode,
    systemPromptLength: systemPrompt.length,
    existingMessages: context.messages.length
  });

  const messages: any[] = [];
  
  // Intelligent context truncation for mobile memory management
  const maxMessages = this.getMaxMessagesForDevice();
  const recentMessages = context.messages.slice(-maxMessages);
  
  // Add recent messages, filtering out system messages (they should never be in the messages array)
  recentMessages.forEach(msg => {
    if (msg.role !== 'system') {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
  });

  console.log('📋 Messages prepared:', {
    totalMessages: messages.length,
    firstMessageLength: messages[0]?.content?.length,
    firstMessageRole: messages[0]?.role
  });

  return messages;
}

  private getMaxMessagesForDevice(): number {
    if (Platform.OS === 'web') return 50;
    
    // Estimate based on available memory (simplified)
    const memoryInfo = (performance as any)?.memory;
    if (memoryInfo?.usedJSHeapSize) {
      const availableMemory = memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize;
      return Math.min(50, Math.max(10, Math.floor(availableMemory / 1000000)));
    }
    
    return 30; // Conservative default for mobile
  }

  private generateContextSummary(messages: ConversationMessage[]): string {
    // Simple summarization - in production, you might use Claude for this
    const topics = new Set<string>();
    
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 5 && !['about', 'would', 'could', 'should'].includes(word)) {
          topics.add(word);
        }
      });
    });

    return `Discussed topics: ${Array.from(topics).slice(0, 5).join(', ')}`;
  }

  // Mode-specific configurations
  private getMaxTokensForMode(mode: string): number {
    const configs = {
      'general-chat': 150,
      'debate-challenge': 200,
      'idea-brainstorm': 180,
      'interview-practice': 120,
      'presentation-prep': 160,
      'language-learning': 140,
      'document-analysis': 1000 
    };
    return configs[mode as keyof typeof configs] || 150;
  }

  private getTemperatureForMode(mode: string): number {
    const configs = {
      'general-chat': 0.7,
      'debate-challenge': 0.6,
      'idea-brainstorm': 0.9,
      'interview-practice': 0.5,
      'presentation-prep': 0.6,
      'language-learning': 0.7
    };
    return configs[mode as keyof typeof configs] || 0.7;
  }

  // Quick reply suggestions
  async generateQuickReplies(
    context: ConversationContext,
    count: number = 3
  ): Promise<string[]> {
    const lastMessage = context.messages[context.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return [];

    // Generate contextual quick replies based on the conversation
    const suggestions = this.getQuickReplySuggestions(context.mode, lastMessage.content);
    return suggestions.slice(0, count);
  }

  private getQuickReplySuggestions(mode: string, lastMessage: string): string[] {
    const baseSuggestions = {
      'general-chat': [
        "Tell me more about that",
        "That's interesting!",
        "I have a different perspective",
        "Can you give an example?",
        "What do you think about..."
      ],
      'debate-challenge': [
        "I disagree because...",
        "What evidence supports that?",
        "Consider this counterpoint",
        "That's a valid point, but...",
        "How would you respond to..."
      ],
      'idea-brainstorm': [
        "What if we combined that with...",
        "That sparks another idea",
        "Let's build on that",
        "Here's a wild thought",
        "What about the opposite approach?"
      ],
      'interview-practice': [
        "Can you elaborate on that?",
        "Give me a specific example",
        "That's a great point",
        "How did you handle challenges?",
        "What would you do differently?"
      ],
      'presentation-prep': [
        "Can you clarify that point?",
        "What's your main message?",
        "How does this benefit the audience?",
        "Can you provide more details?",
        "What's your call to action?"
      ],
      'language-learning': [
        "How do you say... in [language]?",
        "Can you correct my pronunciation?",
        "What's the cultural context?",
        "Teach me a new phrase",
        "Let's practice this topic more"
      ]
    };

    return baseSuggestions[mode as keyof typeof baseSuggestions] || baseSuggestions['general-chat'];
  }

  // Analytics and monitoring
  async logConversationMetrics(context: ConversationContext, responseTime: number) {
    const metrics = {
      sessionId: context.sessionId,
      mode: context.mode,
      messageCount: context.messages.length,
      responseTime,
      timestamp: Date.now(),
      networkQuality: this.networkQuality,
      platform: Platform.OS
    };

    // Store locally for later upload
    try {
      const existingMetrics = await AsyncStorage.getItem('conversation_metrics');
      const metricsArray = existingMetrics ? JSON.parse(existingMetrics) : [];
      metricsArray.push(metrics);
      
      // Keep only last 100 entries
      if (metricsArray.length > 100) {
        metricsArray.splice(0, metricsArray.length - 100);
      }
      
      await AsyncStorage.setItem('conversation_metrics', JSON.stringify(metricsArray));
    } catch (error) {
      console.warn('Failed to log metrics:', error);
    }
  }

  // Test the connection with a simple "Hello" message
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing connection to Claude API via Supabase...');
      
      const testContext: ConversationContext = {
        messages: [],
        mode: 'general-chat',
        sessionId: 'test',
        metadata: {
          startTime: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
          totalTokens: 0
        }
      };

      const response = await this.sendMessage('Hello', testContext);
      
      if (response.error) {
        console.error('Connection test failed:', response.error);
        return { success: false, error: response.error };
      }

      console.log('Connection test successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Connection test failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Cleanup and memory management
  cleanup() {
    this.cache.clear();
    this.requestQueue = [];
    this.activeRequests.clear();
  }

  // Get current status for debugging
  getStatus() {
    return {
      isOnline: this.isOnline,
      networkQuality: this.networkQuality,
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      supabaseConfigured: this.isConfigured(),
      configStatus: this.getConfigStatus()
    };
  }
}

export const supabaseClaudeAPI = new SupabaseClaudeAPIService();