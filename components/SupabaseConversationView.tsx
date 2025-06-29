import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, RotateCcw, Copy, Bookmark, MoveHorizontal as MoreHorizontal, Wifi, WifiOff, Zap, ChartBar as BarChart3 } from 'lucide-react-native';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import { useSupabaseConversation } from '../hooks/useSupabaseConversation';
import { ConversationMessage } from '../types/api';
import { RealTimeFeedbackSystem } from './RealTimeFeedbackSystem';
import { ClaudeFeedbackModal } from './ClaudeFeedbackModal';
import { Conversation, ConversationMode } from '@/src/types';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useInputStore } from '@/src/stores/inputStore';
import { supabaseClaudeAPI } from '../services/supabaseClaudeAPI';

const { width, height } = Dimensions.get('window');

interface SupabaseConversationViewProps {
  mode: string;
  sessionId: string;
  userId?: string;
  onClose?: () => void;
}

export function SupabaseConversationView({
  mode,
  sessionId,
  userId,
  onClose
}: SupabaseConversationViewProps) {
  const {
    messages,
    isLoading,
    isStreaming, 
    error,
    quickReplies,
    sendMessage,
    regenerateResponse,
    clearConversation,
    canRegenerate,
    isConfigured,
    configStatus
  } = useSupabaseConversation({
    mode,
    sessionId,
    userId,
    enableStreaming: true,
    autoSave: true
  });

  const { currentConversation } = useConversationStore();
  const { documentData } = useInputStore();
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null); 
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  // Create conversation mode object for the store
  const conversationMode: ConversationMode = {
    id: mode,
    name: mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `AI-powered ${mode.replace('-', ' ')} conversation`,
    icon: '',
    systemPrompt: '',
    category: 'social' as const,
    difficulty: 'beginner' as const,
    estimatedDuration: 0,
    color: { primary: '#6366F1', secondary: '#8B5CF6', gradient: ['#6366F1', '#8B5CF6'] },
    features: [],
    topics: [],
    aiPersonalities: [],
    sessionTypes: {
      quick: { duration: 0, description: '' },
      standard: { duration: 0, description: '' },
      extended: { duration: 0, description: '' }
    }
  };

  // Create a conversation object for feedback when needed
  const createConversationForFeedback = (): Conversation => {
    return {
      id: sessionId,
      mode: conversationMode,
      title: `${conversationMode.name} - ${new Date().toLocaleDateString()}`,
      duration: 0,
      messages: messages.map((msg: ConversationMessage) => ({
        id: msg.id,
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      bookmarks: [],
      highlights: [],
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Network status monitoring 
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Only import and use NetInfo on native platforms
      import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected ?? false);
        });
        return unsubscribe;
      }).catch(() => {
        // Fallback if NetInfo is not available
        setIsOnline(true);
      });
    } else {
      // For web, use navigator.onLine
      const updateOnlineStatus = () => setIsOnline(navigator.onLine);
      
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  // Toggle bookmark 
  const handleToggleBookmark = async () => {
    if (!conversationId || !userId) return;
    
    try {
      if (isBookmarked) {
        await supabaseClaudeAPI.removeBookmark(conversationId, userId);
      } else {
        await supabaseClaudeAPI.addBookmark(conversationId, userId);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  // Send initial system message for interview practice with document analysis
  useEffect(() => {
    if (mode === 'interview-practice' && 
        documentData.analysisResult && 
        messages.length === 0 && 
        !initialMessageSent && 
        isConfigured) {
      
      console.log('Starting personalized interview with analysis:', documentData.analysisResult);
      setInitialMessageSent(true);
      
      // Create the system message with analysis data
      const analysis = documentData.analysisResult;
      const systemMessage = createInterviewSystemPrompt(
        analysis, 
        documentData.jobDescription, 
        documentData.cvContent
      );
      
      console.log('System message created, length:', systemMessage.length);
      
      // Send the system message to start the interview
      sendSystemMessage(systemMessage);
    }
  }, [mode, documentData.analysisResult, messages.length, initialMessageSent, isConfigured]);

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

  const sendSystemMessage = async (systemMessage: string) => {
  console.log('Sending system message to start interview...');
  
  try {
    // Create a context with custom settings that include the system message
    const customContext = {
      messages: [],
      mode,
      sessionId,
      userId,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
      customSettings: {
        documentAnalysis: documentData.analysisResult,
        jobDescription: documentData.jobDescription,
        cvContent: documentData.cvContent
      }
    };
    
    // Send an empty message that will trigger the interview with system context
    // The service will automatically add a starter message for interview mode
    await sendMessage("", customContext);
    console.log('Interview started successfully');
    
  } catch (error) {
    console.error('Failed to send system message:', error);
    Alert.alert(
      'Interview Setup Failed',
      'Failed to start the personalized interview. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

  const handleSendMessage = async () => { 
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText('');
    await sendMessage(message);
  };

  const handleQuickReply = async (reply: string) => { 
    await sendMessage(reply);
  };

  const copyMessage = async (content: string) => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(content);
    } else {
      // Use Expo Clipboard for mobile
      const { setStringAsync } = await import('expo-clipboard');
      await setStringAsync(content);
    }
  };

  const toggleFeedback = () => { 
    setShowFeedbackModal(true);
  };

  const MessageBubble = ({ message, index }: { message: ConversationMessage; index: number }) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;
    const isStreamingMessage = isLastMessage && message.role === 'assistant' && isStreaming;

    return ( 
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
          
          {isStreamingMessage && (
            <View style={styles.streamingIndicator}> 
              <ActivityIndicator size="small" color="#666" />
            </View>
          )}
          
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.assistantTime]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {!isUser && (
          <TouchableOpacity 
            style={styles.messageAction}
            onPress={() => copyMessage(message.content)}
          >
            <Copy size={16} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const NetworkStatus = () => ( 
    <View style={[styles.networkStatus, !isOnline && styles.networkStatusOffline]}>
      {isOnline ? (
        <Wifi size={16} color="#10B981" />
      ) : (
        <WifiOff size={16} color="#EF4444" />
      )}
      <Text style={[styles.networkStatusText, !isOnline && styles.networkStatusTextOffline]}>
        {isOnline ? 'Connected' : 'Offline - Messages will be sent when reconnected'}
      </Text>
    </View>
  );

  const ConfigurationStatus = () => {
    if (isConfigured) return null;

    return (
      <View style={styles.configurationBanner}>
        <AlertCircle size={20} color="#EF4444" />
        <View style={styles.configurationText}>
          <Text style={styles.configurationTitle}>Configuration Required</Text>
          <Text style={styles.configurationSubtitle}>
            {!configStatus.hasUrl && 'Missing EXPO_PUBLIC_SUPABASE_URL. '}
            {!configStatus.hasKey && 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. '}
            Please check your environment variables.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}> 
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}> 
          <Text style={styles.headerTitle}>{mode.replace('-', ' ').toUpperCase()}</Text>
          <View style={styles.headerActions}>
            {canRegenerate && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={regenerateResponse}
                disabled={isLoading}
              >
                <RotateCcw size={20} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton} 
              onPress={toggleFeedback}
            >
              <BarChart3 size={20} color="white" />
            </TouchableOpacity>
            {userId && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
              >
                <MoreHorizontal size={20} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton} 
              onPress={handleToggleBookmark}
              disabled={!conversationId || !userId}
            >
              <Bookmark size={20} color={isBookmarked ? "#FFD700" : "white"} />
            </TouchableOpacity>
          </View>
        </View>
        
        <NetworkStatus />
      </LinearGradient>

      {/* Configuration Status */}
      <ConfigurationStatus />

      {/* Real-time Feedback System */} 
      {currentConversation && (
        <RealTimeFeedbackSystem
          conversation={currentConversation}
          messages={messages}
          isActive={true}
        />
      )}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {isConfigured ? 'Starting conversation...' : 'Configuration required'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {isConfigured 
                ? 'Please wait while we prepare your conversation...'
                : 'Please configure your Supabase settings to start conversations'
              }
            </Text>
          </View>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} /> 
        ))}

        {isLoading && !isStreaming && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Replies */}
      {quickReplies.length > 0 && !isLoading && ( 
        <View style={styles.quickRepliesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesContent}
          >
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
              >
                <Zap size={14} color="#6366F1" />
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}> 
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? ( 
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {error && ( 
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Claude Feedback Modal */}
      {currentConversation && ( 
        <ClaudeFeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          conversation={createConversationForFeedback()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  networkStatusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  networkStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  networkStatusTextOffline: {
    color: '#FEE2E2',
  },
  configurationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  configurationText: {
    flex: 1,
  },
  configurationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  configurationSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  userTime: {
    color: 'white',
    textAlign: 'right',
  },
  assistantTime: {
    color: '#6B7280',
  },
  streamingIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  messageAction: {
    marginTop: 4,
    padding: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  quickRepliesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  quickReplyText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
});