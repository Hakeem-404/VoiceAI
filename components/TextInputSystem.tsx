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

interface DocumentData {
  jobDescription: string;
  cvContent: string;
  lastModified: Date;
  isValid: boolean;
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
    setCurrentText,
    addToHistory,
    getRecentSuggestions,
  } = useInputStore();
  const { voiceSettings } = useSettingsStore();
  
  const [localText, setLocalText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData>({
    jobDescription: '',
    cvContent: '',
    lastModified: new Date(),
    isValid: false,
  });
  const [activeDocument, setActiveDocument] = useState<'job' | 'cv' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  
  const textInputRef = useRef<TextInput>(null);
  const jobDescriptionRef = useRef<TextInput>(null);
  const cvContentRef = useRef<TextInput>(null);

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
      addToHistory(localText.trim());
      onSend(localText.trim());
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

  const handleDocumentSave = () => {
    const updatedData = {
      ...documentData,
      lastModified: new Date(),
      isValid: documentData.jobDescription.length > 50 && documentData.cvContent.length > 100,
    };
    setDocumentData(updatedData);
    setIsEditing(false);
    
    // Save to storage
    saveDraft(updatedData);
  };

  const saveDraft = (data: DocumentData) => {
    const draft = {
      id: Date.now().toString(),
      ...data,
      name: `Draft ${new Date().toLocaleDateString()}`,
    };
    setSavedDrafts(prev => [draft, ...prev.slice(0, 4)]); // Keep last 5 drafts
  };

  const analyzeDocuments = async () => {
    if (!documentData.jobDescription.trim() || !documentData.cvContent.trim()) {
      Alert.alert('Missing Documents', 'Please provide both job description and CV content for analysis.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate document analysis - in real app, this would call Claude API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = {
        jobRequirements: {
          technicalSkills: ['React', 'TypeScript', 'Node.js', 'AWS'],
          softSkills: ['Communication', 'Leadership', 'Problem Solving'],
          experienceLevel: 'Senior (5+ years)',
          education: 'Bachelor\'s degree in Computer Science or related field',
          certifications: ['AWS Certified', 'Scrum Master'],
        },
        candidateProfile: {
          strengths: ['Strong React experience', 'Leadership background', 'Full-stack capabilities'],
          gaps: ['Limited AWS experience', 'No Scrum certification'],
          experienceLevel: 'Mid-level (3-4 years)',
          uniqueQualifications: ['Mobile development', 'UI/UX design background'],
        },
        matchScore: 78,
        recommendations: [
          'Emphasize your React and TypeScript experience',
          'Prepare examples of leadership situations',
          'Research AWS basics for technical questions',
          'Highlight your mobile development as a differentiator',
        ],
        suggestedQuestions: [
          'Tell me about a challenging React project you\'ve worked on',
          'How do you approach leading a development team?',
          'Describe your experience with cloud platforms',
          'How would you handle a tight deadline with competing priorities?',
        ],
      };
      
      setAnalysisResults(mockAnalysis);
      setShowAnalysis(true);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePersonalizedQuestions = () => {
    if (!analysisResults) return [];
    
    return analysisResults.suggestedQuestions.map((question: string, index: number) => ({
      id: index.toString(),
      question,
      category: index < 2 ? 'Technical' : 'Behavioral',
      difficulty: 'Medium',
      relevance: 'High',
    }));
  };

  const recentSuggestions = getRecentSuggestions();

  const DocumentEditor = () => (
    <Modal
      visible={showDocuments}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDocuments(false)}
    >
      <KeyboardAvoidingView
        style={[styles.documentContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.documentHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDocuments(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.documentTitle, { color: colors.text }]}>
            Interview Preparation
          </Text>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleDocumentSave}
          >
            <Save size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.documentContent} showsVerticalScrollIndicator={false}>
          {/* Job Description Section */}
          <View style={[styles.documentSection, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Job Description
              </Text>
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {documentData.jobDescription.length} chars
              </Text>
            </View>
            
            <TextInput
              ref={jobDescriptionRef}
              style={[
                styles.documentTextInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={documentData.jobDescription}
              onChangeText={(text) => 
                setDocumentData(prev => ({ ...prev, jobDescription: text }))
              }
              placeholder="Paste the job description here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  // Clear job description
                  setDocumentData(prev => ({ ...prev, jobDescription: '' }));
                }}
              >
                <RotateCcw size={16} color="white" />
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  // Format text
                  const formatted = documentData.jobDescription
                    .replace(/\s+/g, ' ')
                    .trim();
                  setDocumentData(prev => ({ ...prev, jobDescription: formatted }));
                }}
              >
                <Edit3 size={16} color="white" />
                <Text style={styles.actionButtonText}>Format</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CV Content Section */}
          <View style={[styles.documentSection, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                CV / Resume
              </Text>
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {documentData.cvContent.length} chars
              </Text>
            </View>
            
            <TextInput
              ref={cvContentRef}
              style={[
                styles.documentTextInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={documentData.cvContent}
              onChangeText={(text) => 
                setDocumentData(prev => ({ ...prev, cvContent: text }))
              }
              placeholder="Paste your CV/resume content here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            
            <View style={styles.documentActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={() => {
                  setDocumentData(prev => ({ ...prev, cvContent: '' }));
                }}
              >
                <RotateCcw size={16} color="white" />
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  const formatted = documentData.cvContent
                    .replace(/\s+/g, ' ')
                    .trim();
                  setDocumentData(prev => ({ ...prev, cvContent: formatted }));
                }}
              >
                <Edit3 size={16} color="white" />
                <Text style={styles.actionButtonText}>Format</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analysis Section */}
          <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                { backgroundColor: isAnalyzing ? colors.border : colors.primary },
              ]}
              onPress={analyzeDocuments}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                </View>
              ) : (
                <>
                  <Zap size={20} color="white" />
                  <Text style={styles.analyzeButtonText}>Analyze Documents</Text>
                </>
              )}
            </TouchableOpacity>
            
            {documentData.isValid && (
              <View style={styles.validationStatus}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.validationText, { color: colors.success }]}>
                  Documents ready for analysis
                </Text>
              </View>
            )}
          </View>

          {/* Saved Drafts */}
          {savedDrafts.length > 0 && (
            <View style={[styles.draftsSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Saved Drafts
              </Text>
              {savedDrafts.map((draft) => (
                <TouchableOpacity
                  key={draft.id}
                  style={[styles.draftItem, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setDocumentData({
                      jobDescription: draft.jobDescription,
                      cvContent: draft.cvContent,
                      lastModified: draft.lastModified,
                      isValid: draft.isValid,
                    });
                  }}
                >
                  <FileText size={16} color={colors.textSecondary} />
                  <Text style={[styles.draftName, { color: colors.text }]}>
                    {draft.name}
                  </Text>
                  <Text style={[styles.draftDate, { color: colors.textSecondary }]}>
                    {draft.lastModified.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const AnalysisModal = () => (
    <Modal
      visible={showAnalysis}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAnalysis(false)}
    >
      <View style={[styles.analysisContainer, { backgroundColor: colors.background }]}>
        <View style={styles.analysisHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAnalysis(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.analysisTitle, { color: colors.text }]}>
            Interview Analysis
          </Text>
          
          <View style={styles.matchScore}>
            <Text style={[styles.matchScoreText, { color: colors.primary }]}>
              {analysisResults?.matchScore}%
            </Text>
          </View>
        </View>

        <ScrollView style={styles.analysisContent}>
          {analysisResults && (
            <>
              {/* Strengths */}
              <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                  Your Strengths
                </Text>
                {analysisResults.candidateProfile.strengths.map((strength: string, index: number) => (
                  <View key={index} style={styles.analysisItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.analysisItemText, { color: colors.text }]}>
                      {strength}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Areas to Address */}
              <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                  Areas to Address
                </Text>
                {analysisResults.candidateProfile.gaps.map((gap: string, index: number) => (
                  <View key={index} style={styles.analysisItem}>
                    <AlertCircle size={16} color={colors.warning} />
                    <Text style={[styles.analysisItemText, { color: colors.text }]}>
                      {gap}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Recommendations */}
              <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                  Interview Recommendations
                </Text>
                {analysisResults.recommendations.map((rec: string, index: number) => (
                  <View key={index} style={styles.analysisItem}>
                    <Zap size={16} color={colors.primary} />
                    <Text style={[styles.analysisItemText, { color: colors.text }]}>
                      {rec}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Suggested Questions */}
              <View style={[styles.analysisSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                  Practice These Questions
                </Text>
                {generatePersonalizedQuestions().map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.questionItem, { backgroundColor: colors.background }]}
                    onPress={() => {
                      setLocalText(item.question);
                      setShowAnalysis(false);
                      setShowDocuments(false);
                    }}
                  >
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {item.question}
                    </Text>
                    <View style={styles.questionMeta}>
                      <Text style={[styles.questionCategory, { color: colors.textSecondary }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.questionDifficulty, { color: colors.textSecondary }]}>
                        {item.difficulty}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <>
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
              {mode === 'interview-prep' ? 'Interview Preparation' : 'Text Input'}
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
            {/* Interview Prep Mode */}
            {mode === 'interview-prep' && (
              <View style={styles.interviewPrepSection}>
                <TouchableOpacity
                  style={[styles.documentButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowDocuments(true)}
                >
                  <FileText size={20} color="white" />
                  <Text style={styles.documentButtonText}>
                    {documentData.isValid ? 'Edit Documents' : 'Add Job Description & CV'}
                  </Text>
                </TouchableOpacity>
                
                {documentData.isValid && (
                  <View style={styles.documentStatus}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.documentStatusText, { color: colors.success }]}>
                      Documents loaded and ready
                    </Text>
                  </View>
                )}
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
                numberOfLines={6}
                maxLength={2000}
                textAlignVertical="top"
              />
              
              <View style={styles.inputMeta}>
                <Text style={[styles.characterCounter, { color: colors.textSecondary }]}>
                  {characterCount}/2000
                </Text>
                
                <View style={styles.inputActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopy}
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
                  >
                    <Send
                      size={20}
                      color={localText.trim() ? 'white' : colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Suggestions */}
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

            {/* Input History */}
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

      <DocumentEditor />
      <AnalysisModal />
    </>
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
  interviewPrepSection: {
    marginBottom: 24,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  documentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  documentStatusText: {
    fontSize: 14,
    fontWeight: '500',
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
  
  // Document Editor Styles
  documentContainer: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentContent: {
    flex: 1,
    padding: 20,
  },
  documentSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
  },
  documentTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  analysisSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  validationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  draftsSection: {
    borderRadius: 16,
    padding: 20,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  draftName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  draftDate: {
    fontSize: 12,
  },
  
  // Analysis Modal Styles
  analysisContainer: {
    flex: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  matchScore: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchScoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  analysisContent: {
    flex: 1,
    padding: 20,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  analysisItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  questionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  questionCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionDifficulty: {
    fontSize: 12,
  },
});