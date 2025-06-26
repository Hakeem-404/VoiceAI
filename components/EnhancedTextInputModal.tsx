import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Mic,
  Send,
  FileText,
  Zap,
  Clock,
  MessageSquare,
  Lightbulb,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { SmartTextInput } from './SmartTextInput';
import { spacing, typography } from '@/src/constants/colors';

const { height } = Dimensions.get('window');

interface EnhancedTextInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onVoiceToggle: () => void;
  placeholder?: string;
  mode?: 'standard' | 'document' | 'conversation';
  conversationMode?: string;
  suggestions?: string[];
  autoComplete?: string[];
}

export function EnhancedTextInputModal({
  visible,
  onClose,
  onSend,
  onVoiceToggle,
  placeholder = "Type your message...",
  mode = 'conversation',
  conversationMode = 'general-chat',
  suggestions = [],
  autoComplete = [],
}: EnhancedTextInputModalProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText('');
      setActiveTemplate(null);
    }
  }, [visible]);

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      onClose();
    }
  };

  const handleTemplateSelect = (template: string) => {
    setText(template);
    setActiveTemplate(template);
  };

  const getTemplatesForMode = () => {
    const templates = {
      'general-chat': [
        "I'd like to discuss my thoughts on...",
        "Can you help me understand...",
        "What's your perspective on...",
        "I'm curious about...",
        "Let me share an experience about...",
      ],
      'debate-challenge': [
        "I believe that... because...",
        "The evidence suggests that...",
        "While I understand your point, I disagree because...",
        "Let me present a counterargument...",
        "The data shows that...",
      ],
      'idea-brainstorm': [
        "What if we could...",
        "I have an idea for...",
        "Building on that concept...",
        "Here's a creative approach...",
        "Let's explore the possibility of...",
      ],
      'interview-practice': [
        "Tell me about a time when...",
        "How would you handle...",
        "What are your thoughts on...",
        "Can you walk me through...",
        "Describe your experience with...",
      ],
      'presentation-prep': [
        "I'd like to present on...",
        "My main points are...",
        "The key takeaway is...",
        "Let me explain why...",
        "The data demonstrates...",
      ],
      'language-learning': [
        "How do you say... in...",
        "Can you help me practice...",
        "I'd like to learn about...",
        "What's the difference between...",
        "Can you correct my...",
      ],
    };

    return templates[conversationMode as keyof typeof templates] || templates['general-chat'];
  };

  const getModeIcon = () => {
    const icons = {
      'general-chat': MessageSquare,
      'debate-challenge': Zap,
      'idea-brainstorm': Lightbulb,
      'interview-practice': FileText,
      'presentation-prep': FileText,
      'language-learning': MessageSquare,
    };

    const IconComponent = icons[conversationMode as keyof typeof icons] || MessageSquare;
    return <IconComponent size={16} color={colors.primary} />;
  };

  const getModeColor = () => {
    const colors_map = {
      'general-chat': '#3B82F6',
      'debate-challenge': '#EF4444',
      'idea-brainstorm': '#10B981',
      'interview-practice': '#8B5CF6',
      'presentation-prep': '#F59E0B',
      'language-learning': '#06B6D4',
    };

    return colors_map[conversationMode as keyof typeof colors_map] || '#3B82F6';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close text input"
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.modeIndicator}>
              {getModeIcon()}
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Text Input
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {conversationMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.voiceToggleButton}
            onPress={onVoiceToggle}
            accessibilityLabel="Switch to voice input"
          >
            <Mic size={24} color={colors.primary} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Smart Text Input */}
          <SmartTextInput
            value={text}
            onChangeText={setText}
            onSend={handleSend}
            onVoiceToggle={onVoiceToggle}
            placeholder={placeholder}
            mode={mode}
            maxLength={mode === 'document' ? 10000 : 1000}
            suggestions={suggestions}
            autoComplete={autoComplete}
            showSuggestions={!text.trim()}
          />

          {/* Quick Templates */}
          {!text.trim() && (
            <View style={styles.templatesSection}>
              <View style={styles.templatesHeader}>
                <FileText size={16} color={colors.primary} />
                <Text style={[styles.templatesTitle, { color: colors.text }]}>
                  Quick Starters
                </Text>
              </View>
              
              <View style={styles.templatesGrid}>
                {getTemplatesForMode().map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.templateCard,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: activeTemplate === template ? getModeColor() : colors.border,
                      }
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                  >
                    <Text
                      style={[
                        styles.templateText,
                        { 
                          color: activeTemplate === template ? getModeColor() : colors.text,
                        }
                      ]}
                      numberOfLines={2}
                    >
                      {template}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Context Tips */}
          <View style={[styles.tipsSection, { backgroundColor: colors.surface }]}>
            <View style={styles.tipsHeader}>
              <Lightbulb size={16} color={colors.warning} />
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Tips for Better Conversations
              </Text>
            </View>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Be specific and provide context for more relevant responses
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Ask follow-up questions to dive deeper into topics
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Share your thoughts and experiences for engaging dialogue
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Inputs */}
          {autoComplete.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>
                  Recent Inputs
                </Text>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScroll}
              >
                {autoComplete.slice(0, 5).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recentItem,
                      { backgroundColor: colors.background, borderColor: colors.border }
                    ]}
                    onPress={() => setText(item)}
                  >
                    <Text
                      style={[styles.recentText, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Send Button */}
        {text.trim() && (
          <View style={[styles.sendContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSend}
            >
              <Send size={20} color="white" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs / 2,
  },
  voiceToggleButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  templatesSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  templatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  templatesTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  templateCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templateText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * 1.3,
  },
  tipsSection: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tipsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  recentTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  recentScroll: {
    paddingRight: spacing.lg,
  },
  recentItem: {
    width: 150,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  recentText: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * 1.3,
  },
  sendContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  sendButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
});