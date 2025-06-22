import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
  Send,
  X,
  Mic,
  Copy,
  Clock,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

const { height } = Dimensions.get('window');

interface TextInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onVoiceToggle: () => void;
  placeholder?: string;
}

export function TextInputModal({
  visible,
  onClose,
  onSend,
  onVoiceToggle,
  placeholder = "Type your message...",
}: TextInputModalProps) {
  const { colors } = useTheme();
  const {
    currentText,
    inputHistory,
    quickActions,
    setCurrentText,
    addToHistory,
    getRecentSuggestions,
  } = useInputStore();
  const { voiceSettings } = useSettingsStore();
  
  const [localText, setLocalText] = useState('');
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setLocalText(currentText);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [visible, currentText]);

  const handleSend = () => {
    if (localText.trim()) {
      addToHistory(localText.trim());
      onSend(localText.trim());
      setLocalText('');
      setCurrentText('');
      onClose();
      
      if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setLocalText(suggestion);
    setCurrentText(suggestion);
    
    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCopy = async () => {
    if (localText) {
      // In a real app, you'd use Clipboard API
      if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const recentSuggestions = getRecentSuggestions();

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
          colors={[colors.surface, colors.background]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close text input"
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Text Input
          </Text>
          
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
        >
          <View style={styles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={localText}
              onChangeText={(text) => {
                setLocalText(text);
                setCurrentText(text);
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={1000}
              accessibilityLabel="Text input field"
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopy}
                accessibilityLabel="Copy text"
              >
                <Copy size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: localText.trim() ? colors.primary : colors.border },
                ]}
                onPress={handleSend}
                disabled={!localText.trim()}
                accessibilityLabel="Send message"
              >
                <Send
                  size={20}
                  color={localText.trim() ? 'white' : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {recentSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionHeader}>
                <Zap size={16} color={colors.primary} />
                <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                  Quick Actions
                </Text>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
              >
                {recentSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                    accessibilityLabel={`Quick action: ${suggestion}`}
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

          {inputHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>
                  Recent
                </Text>
              </View>
              
              {inputHistory.slice(0, 5).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.historyItem,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => handleSuggestionPress(item)}
                  accessibilityLabel={`Recent input: ${item}`}
                >
                  <Text
                    style={[styles.historyText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  voiceToggleButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    padding: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestionsScroll: {
    paddingRight: 20,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    maxWidth: 200,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
  },
});