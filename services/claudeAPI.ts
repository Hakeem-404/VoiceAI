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

class ClaudeAPIService {
  private baseURL = process.env.EXPO_PUBLIC_CLAUDE_API_URL || 'https://api.anthropic.com/v1';
  private apiKey: string = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';
  private requestQueue: QueuedRequest[] = [];
  private cache = new Map<string, CacheEntry<any>>();
  private isOnline = true;
  private networkQuality: NetworkQuality = { type: 'unknown', speed: 'medium', latency: 0 };
  private activeRequests = new Set<string>();

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadCacheFromStorage();
    this.processQueuePeriodically();
    
    // Validate API key on initialization
    if (!this.apiKey) {
      console.warn('Claude API key not found. Please set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file');
    }
  }

  // Initialize API with key (alternative to environment variables)
  initialize(apiKey: string) {
    this.apiKey = apiKey;
    console.log('Claude API initialized with custom key');
  }

  // Check if API is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Get API key status for debugging
  getAPIKeyStatus(): { configured: boolean; source: string } {
    if (this.apiKey === process.env.EXPO_PUBLIC_CLAUDE_API_KEY) {
      return { configured: !!this.apiKey, source: 'environment' };
    }
    return { configured: !!this.apiKey, source: 'manual' };
  }

  // Network monitoring for mobile optimization
  private async initializeNetworkMonitoring() {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      this.networkQuality = {
        type: state.type as 'wifi' | 'cellular' | 'unknown',
        speed: this.determineSpeed(state),
        latency: 0 // Would need additional measurement
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
      const cacheData = await AsyncStorage.getItem('claude_api_cache');
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
      await AsyncStorage.setItem('claude_api_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  private getCacheKey(endpoint: string, data: any): string {
    return `${endpoint}_${JSON.stringify(data)}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiresAt;
  }

  // Request queue for offline support
  private async addToQueue(
    endpoint: string,
    data: any,
    options: APIRequestOptions
  ): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: Date.now().toString(),
      endpoint,
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
      await AsyncStorage.setItem('claude_api_queue', JSON.stringify(this.requestQueue));
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
        await this.makeRequest(request.endpoint, request.data, request.options);
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
    }, 30000); // Process every 30 seconds
  }

  // Core API request method with mobile optimizations
  private async makeRequest<T>(
    endpoint: string,
    data: any,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    // Check if API is configured
    if (!this.isConfigured()) {
      throw new Error('Claude API key not configured. Please set your API key.');
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
      const cacheKey = this.getCacheKey(endpoint, data);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isValidCache(cached)) {
        return {
          data: cached.data,
          status: 200,
          timestamp: cached.timestamp
        };
      }
    }

    // If offline, add to queue
    if (!this.isOnline) {
      await this.addToQueue(endpoint, data, options);
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
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      };

      if (compress && Platform.OS !== 'web') {
        headers['Accept-Encoding'] = 'gzip, deflate';
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Claude API key configuration.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Cache successful responses
      if (cache && response.status === 200) {
        const cacheKey = this.getCacheKey(endpoint, data);
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
        await this.delay(this.getRetryDelay(3 - retries));
        return this.makeRequest(endpoint, data, { ...options, retries: retries - 1 });
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
  private getSystemPrompt(mode: string): string {
    const prompts = {
      'general-chat': `You are a warm, empathetic conversation partner who loves discussing any topic. Be curious, ask follow-up questions, and show genuine interest in the user's thoughts and experiences. Keep responses conversational and engaging, around 2-3 sentences on mobile. Show empathy and understanding.`,
      
      'debate-challenge': `You are an intelligent, well-informed debate partner who challenges ideas respectfully. Present counterarguments, ask probing questions, and demand evidence for claims. Be intellectually rigorous but maintain civility. Keep responses focused and argumentative, around 2-4 sentences.`,
      
      'idea-brainstorm': `You are an enthusiastic creative collaborator who loves generating and building on ideas. Be imaginative, offer wild suggestions, and help connect different concepts. Encourage creative thinking and don't worry about practicality initially. Keep responses energetic and idea-focused.`,
      
      'interview-practice': `You are a professional interviewer conducting a realistic job interview. Ask relevant questions based on the job description provided, follow up on answers, and maintain professional demeanor. Adapt difficulty to the role level. Ask one question at a time and wait for complete answers.`,
      
      'presentation-prep': `You are a supportive audience member providing constructive feedback on presentations. Listen actively, ask clarifying questions, and provide specific suggestions for improvement. Focus on structure, clarity, and engagement. Be encouraging while offering actionable advice.`,
      
      'language-learning': `You are a patient, encouraging language teacher focused on conversation practice. Correct mistakes gently, introduce new vocabulary naturally, and discuss cultural context. Adapt your complexity to the user's proficiency level. Encourage practice and celebrate progress.`
    };

    return prompts[mode as keyof typeof prompts] || prompts['general-chat'];
  }

  // Main conversation method
  async sendMessage(
    message: string,
    context: ConversationContext,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<ConversationMessage>> {
    const systemPrompt = this.getSystemPrompt(context.mode);
    
    // Prepare messages with intelligent context management
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
      stream: false // We'll implement streaming separately
    };

    try {
      const response = await this.makeRequest<any>('/messages', requestData, options);
      
      if (response.data?.content?.[0]?.text) {
        const assistantMessage: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.content[0].text,
          timestamp: new Date()
        };

        return {
          data: assistantMessage,
          status: response.status,
          timestamp: response.timestamp
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
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
        error: 'Claude API key not configured. Please set your API key.'
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

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Claude API key configuration.');
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

      onChunk({
        content,
        isComplete: true
      });

    } catch (error) {
      onChunk({
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Context management with intelligent truncation
  private prepareMessages(context: ConversationContext, systemPrompt: string): any[] {
    const messages = [{ role: 'system', content: systemPrompt }];
    
    // Intelligent context truncation for mobile memory management
    const maxMessages = this.getMaxMessagesForDevice();
    const recentMessages = context.messages.slice(-maxMessages);
    
    // If we're truncating, add a summary of earlier conversation
    if (context.messages.length > maxMessages) {
      const summary = this.generateContextSummary(
        context.messages.slice(0, context.messages.length - maxMessages)
      );
      messages.push({
        role: 'system',
        content: `Previous conversation summary: ${summary}`
      });
    }

    // Add recent messages
    recentMessages.forEach(msg => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    return messages;
  }

  private getMaxMessagesForDevice(): number {
    if (Platform.OS === 'web') return 50;
    
    // Estimate based on available memory (simplified)
    const memoryInfo = (performance as any)?.memory;
    if (memoryInfo?.usedJSHeapSize) {
      const availableMemory = memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize;
      return Math.min(50, Math.max(10, Math.floor(availableMemory / 1000000))); // Rough estimate
    }
    
    return 30; // Conservative default for mobile
  }

  private generateContextSummary(messages: ConversationMessage[]): string {
    // Simple summarization - in production, you might use Claude for this
    const topics = new Set<string>();
    let lastTopic = '';
    
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
      'language-learning': 140
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
      apiKeyConfigured: this.isConfigured(),
      apiKeySource: this.getAPIKeyStatus().source
    };
  }
}

export const claudeAPI = new ClaudeAPIService();