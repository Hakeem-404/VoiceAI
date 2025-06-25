import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  Mic,
  Copy,
  Trash2,
  FileText,
  Zap,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');

interface SmartTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  onVoiceToggle: () => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  suggestions?: string[];
  autoComplete?: string[];
  showCharacterCount?: boolean;
  showSuggestions?: boolean;
  disabled?: boolean;
  mode?: 'standard' | 'document' | 'conversation';
}

export function SmartTextInput({
  value,
  onChangeText,
  onSend,
  onVoiceToggle,
  placeholder = "Type your message...",
  multiline = true,
  maxLength = 2000,
  suggestions = [],
  autoComplete = [],
  showCharacterCount = true,
  showSuggestions = true,
  disabled = false,
  mode = 'standard',
}: SmartTextInputProps) {
  const { colors } = useTheme();
  const textInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);

  useEffect(() => {
    if (value && autoComplete.length > 0) {
      const filtered = autoComplete.filter(item =>
        item.toLowerCase().includes(value.toLowerCase()) && item !== value
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowAutoComplete(filtered.length > 0 && value.length > 2);
    } else {
      setShowAutoComplete(false);
    }
  }, [value, autoComplete]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(value);
    } else {
      // Use Expo Clipboard for mobile
      const { setStringAsync } = await import('expo-clipboard');
      await setStringAsync(value);
    }
  };

  const handleClear = () => {
    onChangeText('');
    textInputRef.current?.focus();
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText(suggestion);
    setShowAutoComplete(false);
    textInputRef.current?.focus();
  };

  const handleAutoCompletePress = (item: string) => {
    onChangeText(item);
    setShowAutoComplete(false);
    textInputRef.current?.focus();
  };

  const getCharacterCountColor = () => {
    const percentage = value.length / maxLength;
    if (percentage >= 0.9) return colors.error;
    if (percentage >= 0.7) return colors.warning;
    return colors.textSecondary;
  };

  const getOptimalLengthSuggestion = () => {
    if (mode === 'document') {
      if (value.length < 100) return 'Add more details for better analysis';
      if (value.length > 1500) return 'Consider condensing for optimal processing';
      return 'Good length for comprehensive analysis';
    }
    
    if (mode === 'conversation') {
      if (value.length < 10) return 'Add more context for better response';
      if (value.length > 500) return 'Consider breaking into shorter messages';
      return 'Good length for conversation';
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Main Input Area */}
      <View style={[
        styles.inputContainer,
        { 
          borderColor: isFocused ? colors.primary : colors.border,
          backgroundColor: colors.background,
        }
      ]}>
        <ScrollView
          style={styles.inputScrollView}
          contentContainerStyle={styles.inputScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              { 
                color: colors.text,
                minHeight: mode === 'document' ? 120 : 60,
              }
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline={multiline}
            maxLength={maxLength}
            editable={!disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
            spellCheck={true}
          />
        </ScrollView>

        {/* Input Actions */}
        <View style={styles.inputActions}>
          {value.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopy}
                accessibilityLabel="Copy text"
              >
                <Copy size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClear}
                accessibilityLabel="Clear text"
              >
                <Trash2 size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onVoiceToggle}
            accessibilityLabel="Switch to voice input"
          >
            <Mic size={18} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: value.trim() && !disabled ? colors.primary : colors.border,
              }
            ]}
            onPress={handleSend}
            disabled={!value.trim() || disabled}
            accessibilityLabel="Send message"
          >
            <Send
              size={18}
              color={value.trim() && !disabled ? 'white' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Character Count and Status */}
      {showCharacterCount && (
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Text style={[styles.characterCount, { color: getCharacterCountColor() }]}>
              {value.length}/{maxLength}
            </Text>
            {getOptimalLengthSuggestion() && (
              <View style={styles.lengthSuggestion}>
                <AlertCircle size={12} color={colors.textSecondary} />
                <Text style={[styles.lengthSuggestionText, { color: colors.textSecondary }]}>
                  {getOptimalLengthSuggestion()}
                </Text>
              </View>
            )}
          </View>
          
          {mode === 'document' && value.length > 100 && (
            <View style={styles.statusRight}>
              <Check size={14} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                Ready for analysis
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Auto-complete Suggestions */}
      {showAutoComplete && filteredSuggestions.length > 0 && (
        <View style={[styles.autoCompleteContainer, { backgroundColor: colors.surface }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.autoCompleteScroll}
          >
            {filteredSuggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.autoCompleteItem,
                  { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => handleAutoCompletePress(item)}
              >
                <Text style={[styles.autoCompleteText, { color: colors.text }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && !isFocused && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Zap size={14} color={colors.primary} />
            <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
              Quick Suggestions
            </Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionChip,
                  { 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text
                  style={[styles.suggestionText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputScrollView: {
    maxHeight: 200,
  },
  inputScrollContent: {
    flexGrow: 1,
  },
  textInput: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  sendButton: {
    padding: spacing.sm,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusLeft: {
    flex: 1,
  },
  characterCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  lengthSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  lengthSuggestionText: {
    fontSize: typography.sizes.xs,
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  autoCompleteContainer: {
    marginTop: spacing.sm,
    borderRadius: 8,
    padding: spacing.sm,
  },
  autoCompleteScroll: {
    paddingRight: spacing.md,
  },
  autoCompleteItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: spacing.sm,
    maxWidth: 200,
  },
  autoCompleteText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  suggestionsContainer: {
    marginTop: spacing.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  suggestionsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  suggestionsScroll: {
    paddingRight: spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    maxWidth: 180,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});