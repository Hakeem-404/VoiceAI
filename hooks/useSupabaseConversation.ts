import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabaseClaudeAPI } from '../services/supabaseClaudeAPI';
import {
  ConversationContext,
  ConversationMessage,
  StreamingResponse,
  APIRequestOptions
} from '../types/api';
import { useInputStore } from '@/src/stores/inputStore';

interface UseSupabaseConversationOptions {
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

export function useSupabaseConversation(options: UseSupabaseConversationOptions) {
  const {
    mode,
    sessionId,
    userId,
    enableStreaming = true,
    autoSave = true
  } = options;

  const { documentData } = useInputStore();

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
    customContext?: any
  ) => {
    // Check if Supabase is configured
    if (!supabaseClaudeAPI.isConfigured()) {
      setState(prev => ({
        ...prev,
        error: 'Supabase not configured. Please check your environment variables.'
      }));
      return;
    }

    // Set loading state
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // For interview practice with document analysis, if this is the first message and it's empty,
    // we're just sending the system prompt to start the conversation
    const isInitialSystemMessage = customContext?.system && content === '';
    
    // Only add user message if it's not an initial system message
    if (!isInitialSystemMessage && content.trim()) {
      // Add user message
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };
      addMessage(userMessage);
    }

    responseStartTimeRef.current = Date.now();

    try {
      // Use the context from state or the custom context if provided
      const contextToUse = customContext || state.context;
      
      // For interview practice with document analysis, include the analysis in the system prompt
      let systemPrompt;
      if (customContext?.system) {
        systemPrompt = customContext.system;
      } else if (mode === 'interview-practice' && documentData.analysisResult && !customContext?.system) {
        systemPrompt = createInterviewSystemPrompt(
          documentData.analysisResult,
          documentData.jobDescription,
          documentData.cvContent
        );
      }

      if (enableStreaming && Platform.OS !== 'web') {
        // Use streaming for better UX on mobile
        await sendStreamingMessage(content, contextToUse, systemPrompt);
      } else {
        // Use regular request for web or when streaming is disabled
        await sendRegularMessage(content, contextToUse, systemPrompt);
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
  }, [state.context, enableStreaming, addMessage, mode, documentData]);

  const createInterviewSystemPrompt = (
    analysis: any,
    jobDescription: string,
    cvContent: string
  ): string => {
    // Get interview questions from analysis
    const technicalQuestions = analysis.analysis.interviewQuestions?.technical || [];
    const behavioralQuestions = analysis.analysis.interviewQuestions?.behavioral || [];
    const situationalQuestions = analysis.analysis.interviewQuestions?.situational || [];
    const gapFocusedQuestions = analysis.analysis.interviewQuestions?.gapFocused || [];
    
    // Combine all questions
    const allQuestions = [
      ...technicalQuestions,
      ...behavioralQuestions,
      ...situationalQuestions,
      ...gapFocusedQuestions
    ];
    
    // Format questions for the prompt
    const formattedQuestions = allQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    
    return `You are a professional interviewer conducting a job interview. 
    
Job Description: ${jobDescription || 'Not provided'}

Candidate CV: ${cvContent || 'Not provided'}

Analysis:
- Match Score: ${analysis.analysis.matchScore}%
- Candidate Strengths: ${analysis.analysis.strengths.join(', ')}
- Gaps to Address: ${analysis.analysis.gaps.join(', ')}
- Focus Areas: ${analysis.analysis.focusAreas.join(', ')}
- Experience Level: ${analysis.analysis.difficulty}

PERSONALIZED QUESTIONS TO ASK:
${formattedQuestions}

Your task is to conduct a realistic interview for this position. Ask relevant questions that:
1. Explore the candidate's strengths mentioned in the analysis
2. Tactfully probe the identified gaps
3. Focus on the key areas relevant to the job
4. Include a mix of technical, behavioral, and situational questions

Start with a brief introduction and your first question. Be professional, thorough, and provide constructive feedback. Ask one question at a time and wait for complete answers.

IMPORTANT: Begin the interview immediately with a brief introduction and your first question from the list above.`;
  };

  const sendStreamingMessage = useCallback(async (
    content: string,
    context: ConversationContext,
    systemPrompt?: string
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

    // Create request options with system prompt if provided
    const options: APIRequestOptions = {};
    if (systemPrompt) {
      options.system = systemPrompt;
    }

    await supabaseClaudeAPI.sendMessageStream(
      content,
      context,
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
          supabaseClaudeAPI.logConversationMetrics(context, responseTime);
        }
      },
      options
    );
  }, [addMessage]);

  const sendRegularMessage = useCallback(async (
    content: string,
    context: ConversationContext,
    systemPrompt?: string
  ) => {
    // Create request options with system prompt if provided
    const options: APIRequestOptions = {};
    if (systemPrompt) {
      options.system = systemPrompt;
    }

    const response = await supabaseClaudeAPI.sendMessage(content, context, options);
    
    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data) {
      addMessage(response.data);
      const responseTime = Date.now() - responseStartTimeRef.current;
      supabaseClaudeAPI.logConversationMetrics(context, responseTime);
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, [addMessage]);

  const generateQuickReplies = useCallback(async () => {
    try {
      const replies = await supabaseClaudeAPI.generateQuickReplies(state.context, 3);
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
                   state.messages[state.messages.length - 1]?.role === 'assistant',
    
    // Configuration status
    isConfigured: supabaseClaudeAPI.isConfigured(),
    configStatus: supabaseClaudeAPI.getConfigStatus()
  };
}