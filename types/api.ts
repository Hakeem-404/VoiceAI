export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  id: string;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  mode: string;
  sessionId: string;
  userId?: string;
  metadata: {
    startTime: Date;
    lastActivity: Date;
    messageCount: number;
    totalTokens: number;
  };
}

export interface APIRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  priority?: 'high' | 'normal' | 'low';
  compress?: boolean;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export interface ConversationSummary {
  id: string;
  summary: string;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}

export interface NetworkQuality {
  type: 'wifi' | 'cellular' | 'unknown';
  speed: 'fast' | 'medium' | 'slow';
  latency: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface QueuedRequest {
  id: string;
  endpoint: string;
  data: any;
  options: APIRequestOptions;
  timestamp: number;
  retryCount: number;
}