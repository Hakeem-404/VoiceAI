import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { claudeAPI } from '../services/claudeAPI';
import {
  ConversationContext,
  ConversationMessage,
  StreamingResponse,
  APIRequestOptions
} from '../types/api';

interface UseConversationOptions {
  mode: string;
  sessionId: string;
  userId?: string;
  enableStreaming?: boolean;
  autoSave?: boolean;
}

interface ConversationState {
  messages: ConversationMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  quickReplies: string[];
  context: ConversationContext;
}

export function useConversation(options: UseConversationOptions) {
  const {
    mode,
    sessionId,
    userId,
    enableStreaming = true,
    autoSave = true
  } = options;

  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    quickReplies: [],
    context: {
      messages: [],
      mode,
      sessionId,
      userId,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0
      }
    }
  });

  const streamingContentRef = useRef('');
  const responseStartTimeRef = useRef(0);

  // Initialize conversation context
  useEffect(() => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        mode,
        sessionId,
        userId
      }
    }));
  }, [mode, sessionId, userId]);

  // Auto-save conversation
  useEffect(() => {
    if (autoSave && state.messages.length > 0) {
      saveConversation();
    }
  }, [state.messages, autoSave]);

  const updateContext = useCallback((updates: Partial<ConversationContext>) => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        ...updates,
        metadata: {
          ...prev.context.metadata,
          lastActivity: new Date(),
          messageCount: prev.messages.length
        }
      }
    }));
  }, []);

  const addMessage = useCallback((message: ConversationMessage) => {
    setState(prev => {
      const newMessages = [...prev.messages, message];
      return {
        ...prev,
        messages: newMessages,
        context: {
          ...prev.context,
          messages: newMessages,
          metadata: {
            ...prev.context.metadata,
            messageCount: newMessages.length,
            lastActivity: new Date()
          }
        }
      };
    });
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    options: APIRequestOptions = {}
  ) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    addMessage(userMessage);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    responseStartTimeRef.current = Date.now();

    try {
      if (enableStreaming && Platform.OS !== 'web') {
        // Use streaming for better UX on mobile
        await sendStreamingMessage(content, options);
      } else {
        // Use regular request for web or when streaming is disabled
        await sendRegularMessage(content, options);
      }

      // Generate quick replies
      await generateQuickReplies();

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
        isStreaming: false
      }));
    }
  }, [state.context, enableStreaming, addMessage]);

  const sendStreamingMessage = useCallback(async (
    content: string,
    options: APIRequestOptions
  ) => {
    setState(prev => ({ ...prev, isStreaming: true }));
    streamingContentRef.current = '';

    const assistantMessageId = Date.now().toString();
    let assistantMessage: ConversationMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    // Add empty assistant message that will be updated
    addMessage(assistantMessage);

    await claudeAPI.sendMessageStream(
      content,
      state.context,
      (chunk: StreamingResponse) => {
        streamingContentRef.current = chunk.content;
        
        setState(prev => {
          const updatedMessages = prev.messages.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: chunk.content }
              : msg
          );

          return {
            ...prev,
            messages: updatedMessages,
            context: {
              ...prev.context,
              messages: updatedMessages
            },
            isLoading: !chunk.isComplete,
            isStreaming: !chunk.isComplete,
            error: chunk.error || null
          };
        });

        if (chunk.isComplete) {
          const responseTime = Date.now() - responseStartTimeRef.current;
          claudeAPI.logConversationMetrics(state.context, responseTime);
        }
      },
      options
    );
  }, [state.context, addMessage]);

  const sendRegularMessage = useCallback(async (
    content: string,
    options: APIRequestOptions
  ) => {
    const response = await claudeAPI.sendMessage(content, state.context, options);
    
    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data) {
      addMessage(response.data);
      const responseTime = Date.now() - responseStartTimeRef.current;
      claudeAPI.logConversationMetrics(state.context, responseTime);
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, [state.context, addMessage]);

  const generateQuickReplies = useCallback(async () => {
    try {
      const replies = await claudeAPI.generateQuickReplies(state.context, 3);
      setState(prev => ({ ...prev, quickReplies: replies }));
    } catch (error) {
      console.warn('Failed to generate quick replies:', error);
    }
  }, [state.context]);

  const regenerateResponse = useCallback(async () => {
    if (state.messages.length < 2) return;

    // Remove last assistant message
    const messagesWithoutLast = state.messages.slice(0, -1);
    const lastUserMessage = messagesWithoutLast[messagesWithoutLast.length - 1];

    if (lastUserMessage?.role !== 'user') return;

    setState(prev => ({
      ...prev,
      messages: messagesWithoutLast,
      context: {
        ...prev.context,
        messages: messagesWithoutLast
      }
    }));

    // Resend the last user message
    await sendMessage(lastUserMessage.content);
  }, [state.messages, sendMessage]);

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      context: {
        ...prev.context,
        messages: [],
        metadata: {
          ...prev.context.metadata,
          messageCount: 0,
          lastActivity: new Date()
        }
      },
      error: null,
      quickReplies: []
    }));
  }, []);

  const saveConversation = useCallback(async () => {
    try {
      // Implementation would save to local storage or backend
      console.log('Saving conversation:', state.context.sessionId);
    } catch (error) {
      console.warn('Failed to save conversation:', error);
    }
  }, [state.context]);

  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      // Implementation would load from local storage or backend
      console.log('Loading conversation:', sessionId);
    } catch (error) {
      console.warn('Failed to load conversation:', error);
    }
  }, []);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    quickReplies: state.quickReplies,
    context: state.context,

    // Actions
    sendMessage,
    regenerateResponse,
    clearConversation,
    saveConversation,
    loadConversation,
    updateContext,

    // Utilities
    messageCount: state.messages.length,
    hasMessages: state.messages.length > 0,
    lastMessage: state.messages[state.messages.length - 1],
    canRegenerate: state.messages.length >= 2 && 
                   state.messages[state.messages.length - 1]?.role === 'assistant'
  };
}