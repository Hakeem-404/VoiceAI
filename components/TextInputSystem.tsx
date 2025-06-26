import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  X,
  Mic,
  Copy,
  RotateCcw,
  FileText,
  Zap,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { spacing, typography } from '@/src/constants/colors';

const { height } = Dimensions.get('window');

interface TextInputSystemProps {
  visible: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onVoiceToggle: () => void;
  placeholder?: string;
  mode?: 'standard' | 'document' | 'conversation';
  conversationMode?: string;
  initialText?: string;
}

export function TextInputSystem({
  visible,
  onClose,
  onSend,
  onVoiceToggle,
  placeholder = "Type your message...",
  mode = 'conversation',
  conversationMode = 'general-chat',
  initialText = '',
}: TextInputSystemProps) {
  const { colors, isDark } = useTheme();
  const {
    currentText,
    inputHistory,
    setCurrentText,
    addToHistory,
    getRecentSuggestions,
  } = useInputStore();

  const [text, setText] = useState(initialText || currentText);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setText(initialText || currentText);
      generateSuggestions();
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [visible, initialText, currentText]);

  useEffect(() => {
    setCurrentText(text);
    if (text.length > 10) {
      generateContextualSuggestions();
    }
  }, [text]);

  const generateSuggestions = () => {
    const modeSuggestions = getModeSpecificSuggestions();
    const recentSuggestions = getRecentSuggestions();
    setSuggestions([...modeSuggestions, ...recentSuggestions]);
    setShowSuggestions(text.length === 0);
  };

  const generateContextualSuggestions = () => {
    // Generate smart suggestions based on current text
    const contextualSuggestions = getContextualSuggestions(text, conversationMode);
    setSuggestions(contextualSuggestions);
    setShowSuggestions(true);
  };

  const getModeSpecificSuggestions = () => {
    const suggestions = {
      'general-chat': [
        "I'd like to discuss...",
        "What's your opinion on...",
        "Can you help me understand...",
        "I'm curious about...",
      ],
      'debate-challenge': [
        "I believe that...",
        "The evidence suggests...",
        "A counterargument would be...",
        "From my perspective...",
      ],
      'idea-brainstorm': [
        "What if we could...",
        "I have an idea for...",
        "Building on that concept...",
        "Here's a creative approach...",
      ],
      'interview-practice': [
        "Tell me about your experience with...",
        "How would you handle...",
        "What are your strengths in...",
        "Describe a situation where you...",
      ],
      'presentation-prep': [
        "I want to present on...",
        "My main points are...",
        "The key takeaway is...",
        "My audience will be...",
      ],
      'language-learning': [
        "How do you say... in...",
        "I'd like to practice...",
        "What's the difference between...",
        "Can you correct my...",
      ],
    };

    return suggestions[conversationMode as keyof typeof suggestions] || suggestions['general-chat'];
  };

  const getContextualSuggestions = (currentText: string, mode: string): string[] => {
    // This would ideally use AI to generate contextual suggestions
    // For now, we'll use a simple rule-based approach
    
    const lowercaseText = currentText.toLowerCase();
    
    if (mode === 'interview-practice') {
      if (lowercaseText.includes('experience')) {
        return [
          "I have 3 years of experience in...",
          "My experience includes working with...",
          "I've worked on several projects involving...",
        ];
      } else if (lowercaseText.includes('challenge') || lowercaseText.includes('difficult')) {
        return [
          "A challenging situation I faced was...",
          "I overcame this difficulty by...",
          "The biggest challenge in my last role was...",
        ];
      }
    } else if (mode === 'debate-challenge') {
      if (lowercaseText.includes('agree')) {
        return [
          "I agree because the evidence shows...",
          "While I agree with that point, I'd add...",
          "I agree, and furthermore...",
        ];
      } else if (lowercaseText.includes('disagree')) {
        return [
          "I disagree because...",
          "The flaw in that argument is...",
          "An alternative perspective would be...",
        ];
      }
    }
    
    // Default suggestions based on text length
    if (currentText.length > 50) {
      return [
        "To elaborate further...",
        "Additionally, I'd like to mention...",
        "Building on what I just said...",
      ];
    }
    
    return getModeSpecificSuggestions();
  };

  const handleSend = () => {
    if (text.trim()) {
      addToHistory(text.trim());
      onSend(text.trim());
      setText('');
      setCurrentText('');
      onClose();
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setText(suggestion);
    setShowSuggestions(false);
    textInputRef.current?.focus();
  };

  const handleCopy = async () => {
    if (text) {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        // Use Expo Clipboard for mobile
        const { setStringAsync } = await import('expo-clipboard');
        await setStringAsync(text);
      }
    }
  };

  const handleClear = () => {
    setText('');
    setCurrentText('');
    textInputRef.current?.focus();
  };

  const getCharacterCountColor = () => {
    const maxLength = mode === 'document' ? 5000 : 1000;
    const percentage = text.length / maxLength;
    if (percentage >= 0.9) return colors.error;
    if (percentage >= 0.7) return colors.warning;
    return colors.textSecondary;
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'document' ? 'Document Input' : 'Text Input'}
          </Text>
          
          <TouchableOpacity
            style={styles.voiceToggleButton}
            onPress={onVoiceToggle}
          >
            <Mic size={24} color={colors.primary} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            styles.inputContainer,
            { 
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }
          ]}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                { 
                  color: colors.text,
                  minHeight: mode === 'document' ? 200 : 100,
                }
              ]}
              value={text}
              onChangeText={setText}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              maxLength={mode === 'document' ? 5000 : 1000}
              autoCapitalize="sentences"
              autoCorrect={true}
              spellCheck={true}
            />
            
            <View style={styles.inputActions}>
              {text.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopy}
                  >
                    <Copy size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleClear}
                  >
                    <RotateCcw size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
              
              <View style={styles.spacer} />
              
              <Text style={[
                styles.characterCount,
                { color: getCharacterCountColor() }
              ]}>
                {text.length}/{mode === 'document' ? 5000 : 1000}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { 
                    backgroundColor: text.trim() ? colors.primary : colors.border,
                  }
                ]}
                onPress={handleSend}
                disabled={!text.trim()}
              >
                <Send
                  size={20}
                  color={text.trim() ? 'white' : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Zap size={16} color={colors.primary} />
                <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                  Suggestions
                </Text>
              </View>
              
              <ScrollView
                horizontal={mode !== 'document'}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.suggestionsContent,
                  mode === 'document' && styles.documentSuggestionsContent
                ]}
              >
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      mode === 'document' && styles.documentSuggestionChip
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    {mode === 'document' ? (
                      <View style={styles.documentSuggestionContent}>
                        <FileText size={16} color={colors.primary} />
                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                          {suggestion}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.suggestionText, { color: colors.text }]}>
                        {suggestion}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {mode === 'document' && (
            <View style={[styles.documentTips, { backgroundColor: colors.surface }]}>
              <View style={styles.documentTipsHeader}>
                <MessageSquare size={16} color={colors.primary} />
                <Text style={[styles.documentTipsTitle, { color: colors.text }]}>
                  Document Tips
                </Text>
              </View>
              
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Paste your document text directly from any source
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Formatting will be automatically cleaned up
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Include key skills, requirements, and responsibilities
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    More detailed documents lead to better analysis
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  voiceToggleButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  textInput: {
    padding: spacing.md,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  characterCount: {
    fontSize: typography.sizes.sm,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    marginBottom: spacing.lg,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  suggestionsTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  suggestionsContent: {
    flexDirection: 'row',
    paddingRight: spacing.lg,
  },
  documentSuggestionsContent: {
    flexDirection: 'column',
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  documentSuggestionChip: {
    borderRadius: 12,
    width: '100%',
    marginRight: 0,
  },
  documentSuggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  documentTips: {
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.md,
  },
  documentTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  documentTipsTitle: {
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
});