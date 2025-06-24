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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, X, Mic, Copy, Clock, Zap, FileText, User, Briefcase, CreditCard as Edit3, Save, RotateCcw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

const { height, width } = Dimensions.get('window');

interface TextInputSystemProps {
  visible: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onVoiceToggle: () => void;
  placeholder?: string;
  mode?: 'general' | 'interview-prep';
  initialText?: string;
}

export function TextInputSystem({
  visible,
  onClose,
  onSend,
  onVoiceToggle,
  placeholder = "Type your message...",
  mode = 'general',
  initialText = '',
}: TextInputSystemProps) {
  const { colors } = useTheme();
  const {
    currentText,
    inputHistory,
    quickActions,
    documentData,
    setCurrentText,
    addToHistory,
    getRecentSuggestions,
    updateDocumentData
  } = useInputStore();
  const { voiceSettings } = useSettingsStore();
  
  const [localText, setLocalText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setLocalText(initialText || currentText);
      setCharacterCount((initialText || currentText).length);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [visible, currentText, initialText]);

  useEffect(() => {
    setCharacterCount(localText.length);
  }, [localText]);

  const handleSend = () => {
    if (localText.trim()) {
      if (mode === 'interview-prep') {
        // For interview prep, update the document data
        if (placeholder.includes('job')) {
          updateDocumentData({ jobDescription: localText });
        } else if (placeholder.includes('CV') || placeholder.includes('resume')) {
          updateDocumentData({ cvContent: localText });
        }
      } else {
        // For general mode, send as a message
        addToHistory(localText.trim());
        onSend(localText.trim());
      }
      
      setLocalText('');
      setCurrentText('');
      onClose();
      
      if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
        // Haptic feedback would go here for native platforms
      }
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setLocalText(suggestion);
    setCurrentText(suggestion);
    setShowSuggestions(false);
  };

  const handleCopy = async () => {
    if (localText) {
      // Copy functionality would be implemented here
      if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
        // Haptic feedback
      }
    }
  };

  const handleClear = () => {
    setLocalText('');
    setCurrentText('');
  };

  const handleFormat = () => {
    // Simple formatting - remove extra spaces and normalize line breaks
    const formatted = localText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    setLocalText(formatted);
    setCurrentText(formatted);
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'interview-prep' 
              ? placeholder.includes('job') 
                ? 'Job Description' 
                : 'CV/Resume'
              : 'Text Input'}
          </Text>
          
          <TouchableOpacity
            style={styles.voiceToggleButton}
            onPress={onVoiceToggle}
          >
            <Mic size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'interview-prep' && (
            <View style={[styles.documentInfo, { backgroundColor: colors.surface }]}>
              <View style={styles.documentInfoIcon}>
                {placeholder.includes('job') ? (
                  <Briefcase size={20} color={colors.primary} />
                ) : (
                  <User size={20} color={colors.secondary} />
                )}
              </View>
              <Text style={[styles.documentInfoText, { color: colors.textSecondary }]}>
                {placeholder.includes('job')
                  ? 'Paste the full job description to get personalized interview questions and analysis.'
                  : 'Paste your CV/resume content to get tailored feedback and question preparation.'}
              </Text>
            </View>
          )}

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
              numberOfLines={mode === 'interview-prep' ? 12 : 6}
              maxLength={mode === 'interview-prep' ? 10000 : 2000}
              textAlignVertical="top"
            />
            
            <View style={styles.inputMeta}>
              <Text style={[styles.characterCounter, { color: colors.textSecondary }]}>
                {characterCount}/{mode === 'interview-prep' ? 10000 : 2000}
              </Text>
              
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleClear}
                >
                  <RotateCcw size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleFormat}
                >
                  <Edit3 size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: localText.trim() ? colors.primary : colors.border },
                  ]}
                  onPress={handleSend}
                  disabled={!localText.trim()}
                >
                  {mode === 'interview-prep' ? (
                    <Save
                      size={20}
                      color={localText.trim() ? 'white' : colors.textTertiary}
                    />
                  ) : (
                    <Send
                      size={20}
                      color={localText.trim() ? 'white' : colors.textTertiary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Suggestions - only show for general mode */}
          {mode !== 'interview-prep' && recentSuggestions.length > 0 && (
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

          {/* Document Tips - only show for interview prep mode */}
          {mode === 'interview-prep' && (
            <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Tips for better results:
              </Text>
              <View style={styles.tipsList}>
                {placeholder.includes('job') ? (
                  <>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Include the full job description, not just requirements
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Keep formatting like bullet points for better parsing
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Include company information if available
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Include your skills, experience, and education
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Quantify achievements where possible
                      </Text>
                    </View>
                    <View style={styles.tipItem}>
                      <CheckCircle size={16} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Keep formatting like bullet points for better parsing
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Input History - only show for general mode */}
          {mode !== 'interview-prep' && inputHistory.length > 0 && (
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
  documentInfo: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  documentInfoIcon: {
    marginRight: 12,
  },
  documentInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCounter: {
    fontSize: 14,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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