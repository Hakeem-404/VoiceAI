import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, RotateCcw, Copy, Bookmark, MoveHorizontal as MoreHorizontal, Wifi, WifiOff, Zap } from 'lucide-react-native';
import { useConversation } from '../hooks/useConversation';
import { ConversationMessage } from '../types/api';

const { width, height } = Dimensions.get('window');

interface ConversationViewProps {
  mode: string;
  sessionId: string;
  userId?: string;
  onClose?: () => void;
}

export function ConversationView({
  mode,
  sessionId,
  userId,
  onClose
}: ConversationViewProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    quickReplies,
    sendMessage,
    regenerateResponse,
    clearConversation,
    canRegenerate
  } = useConversation({
    mode,
    sessionId,
    userId,
    enableStreaming: true,
    autoSave: true
  });

  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

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
      import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected ?? false);
        });
        return unsubscribe;
      });
    }
  }, []);

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

  const MessageBubble = ({ message, index }: { message: ConversationMessage; index: number }) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;
    const isStreaming = isLastMessage && message.role === 'assistant' && isStreaming;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
          
          {isStreaming && (
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
              onPress={() => {/* Show options menu */}}
            >
              <MoreHorizontal size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <NetworkStatus />
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Start a conversation</Text>
            <Text style={styles.emptyStateSubtitle}>
              Ask me anything or use one of the quick replies below
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