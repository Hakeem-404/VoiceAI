import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Users,
  Lightbulb,
  Briefcase,
  Presentation,
  Globe,
  Plus,
  Settings,
  Database,
  TestTube,
  X
} from 'lucide-react-native';
import { SupabaseConversationView } from '../../components/SupabaseConversationView';
import { supabaseClaudeAPI } from '../../services/supabaseClaudeAPI';
import { InterviewSetupScreen } from '../../components/InterviewSetupScreen';
import { useInputStore } from '@/src/stores/inputStore';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { conversationModes } from '@/src/constants/conversationModes';

const conversationModesList = [
  {
    id: 'general-chat',
    name: 'General Chat',
    description: 'Natural conversations on any topic',
    icon: MessageCircle,
    color: ['#3B82F6', '#1E40AF'],
    difficulty: 'Beginner'
  },
  {
    id: 'debate-challenge',
    name: 'Debate Challenge',
    description: 'Structured argumentative discussions',
    icon: Users,
    color: ['#EF4444', '#B91C1C'],
    difficulty: 'Intermediate'
  },
  {
    id: 'idea-brainstorm',
    name: 'Idea Brainstorm',
    description: 'Creative thinking sessions',
    icon: Lightbulb,
    color: ['#10B981', '#047857'],
    difficulty: 'Beginner'
  },
  {
    id: 'interview-practice',
    name: 'Interview Practice',
    description: 'Professional preparation',
    icon: Briefcase,
    color: ['#8B5CF6', '#6D28D9'],
    difficulty: 'Intermediate'
  },
  {
    id: 'presentation-prep',
    name: 'Presentation Prep',
    description: 'Public speaking practice',
    icon: Presentation,
    color: ['#F59E0B', '#B45309'],
    difficulty: 'Intermediate'
  },
  {
    id: 'language-learning',
    name: 'Language Learning',
    description: 'Conversation practice',
    icon: Globe,
    color: ['#06B6D4', '#0E7490'],
    difficulty: 'Beginner'
  }
];

export default function ChatScreen() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [configStatus, setConfigStatus] = useState({ hasUrl: false, hasKey: false });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showInterviewSetup, setShowInterviewSetup] = useState(false);
  
  // Store hooks
  const { documentData, updateDocumentData } = useInputStore();
  const { createConversation, addRecentMode } = useConversationStore();
  const { addRecentMode: addRecentModeToUser } = useUserStore();
  const { user: authUser } = useSupabaseAuth();

  useEffect(() => {
    // Check if Supabase is properly configured
    const status = supabaseClaudeAPI.getConfigStatus();
    setIsSupabaseConfigured(status.configured);
    setConfigStatus(status);
  }, []);

  const testConnection = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Configuration Required',
        'Please configure Supabase first before testing the connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsTestingConnection(true);
    
    try {
      const result = await supabaseClaudeAPI.testConnection();
      
      if (result.success) {
        Alert.alert(
          'Connection Test Successful! ✅',
          'Your Supabase Edge Function and Claude API are working correctly.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'Connection Test Failed ❌',
          `Error: ${result.error}\n\nPlease check:\n• Claude API key is set in Supabase Edge Function\n• Edge Function is deployed\n• API key is valid`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Test Failed ❌',
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const startConversation = (modeId: string) => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Configuration Required',
        'Supabase is not properly configured. Please check your environment variables:\n\n' +
        (!configStatus.hasUrl ? '• EXPO_PUBLIC_SUPABASE_URL\n' : '') +
        (!configStatus.hasKey ? '• EXPO_PUBLIC_SUPABASE_ANON_KEY\n' : '') +
        '\nAlso ensure your Claude API key is set in the Supabase Edge Function.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Special handling for interview practice
    if (modeId === 'interview-practice') {
      setShowInterviewSetup(true);
      return;
    }

    // Find the mode
    const mode = conversationModes.find(m => m.id === modeId);
    if (!mode) {
      Alert.alert('Error', 'Conversation mode not found');
      return;
    }

    // Create conversation using store
    const conversation = createConversation(mode);
    
    if (conversation) {
      // Update recent modes
      addRecentModeToUser(modeId);
      
      // Set state for navigation
      setSelectedMode(modeId);
      setSessionId(conversation.id);
    }
  };

  const handleInterviewContinue = () => {
    const mode = conversationModes.find(m => m.id === 'interview-practice');
    if (!mode) return;
    
    // Create conversation with document analysis if available
    const configuration = documentData.analysisResult ? {
      modeId: 'interview-practice',
      difficulty: 'intermediate' as any,
      sessionType: 'standard' as any,
      selectedTopics: mode.topics.slice(0, 3),
      aiPersonality: 'Professional',
      customSettings: {
        documentAnalysis: documentData.analysisResult,
        jobDescription: documentData.jobDescription,
        cvContent: documentData.cvContent,
      },
    } : undefined;
    
    const conversation = createConversation(mode, configuration);
    
    if (conversation) {
      // Update recent modes
      addRecentModeToUser('interview-practice');
      
      // Set state and close setup
      setSelectedMode('interview-practice');
      setSessionId(conversation.id);
      setShowInterviewSetup(false);
    }
  };

  if (selectedMode && sessionId) {
    return (
      <SupabaseConversationView
        mode={selectedMode}
        sessionId={sessionId}
        onClose={() => {
          setSelectedMode(null);
          setSessionId(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Conversation</Text>
            <Text style={styles.subtitle}>
              {isSupabaseConfigured ? 'Choose your conversation mode' : 'Configuration required'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isSupabaseConfigured && (
              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={testConnection}
                disabled={isTestingConnection}
              >
                <TestTube size={20} color="white" />
              </TouchableOpacity>
            )}
            {!isSupabaseConfigured && (
              <TouchableOpacity
                style={[styles.actionButton, styles.configButton]}
                onPress={() => {
                  Alert.alert(
                    'Supabase Configuration',
                    'Please set the following environment variables:\n\n' +
                    '• EXPO_PUBLIC_SUPABASE_URL\n' +
                    '• EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
                    'Also ensure your Claude API key is configured in the Supabase Edge Function.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Database size={20} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuration Status Banner */}
        {!isSupabaseConfigured && (
          <View style={styles.statusBanner}>
            <Database size={20} color="#EF4444" />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Supabase Configuration Required</Text>
              <Text style={styles.statusText}>
                {!configStatus.hasUrl && 'Missing SUPABASE_URL. '}
                {!configStatus.hasKey && 'Missing SUPABASE_ANON_KEY. '}
                Claude API key must be set in Edge Function.
              </Text>
            </View>
          </View>
        )}

        {/* Test Connection Banner */}
        {isSupabaseConfigured && (
          <View style={styles.testBanner}>
            <TestTube size={20} color="#10B981" />
            <View style={styles.statusTextContainer}>
              <Text style={styles.testTitle}>Ready to Chat!</Text>
              <Text style={styles.testText}>
                {isTestingConnection 
                  ? 'Testing connection...' 
                  : 'Tap the test button to verify your Claude API connection.'
                }
              </Text>
            </View>
          </View>
        )}

        {/* Mode Selection */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modesGrid}>
            {conversationModesList.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    !isSupabaseConfigured && styles.modeCardDisabled
                  ]}
                  onPress={() => startConversation(mode.id)}
                  activeOpacity={isSupabaseConfigured ? 0.8 : 0.5}
                >
                  <LinearGradient
                    colors={isSupabaseConfigured ? mode.color : ['#D1D5DB', '#9CA3AF']}
                    style={styles.modeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modeHeader}>
                      <IconComponent size={28} color="white" />
                      <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyText}>{mode.difficulty}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.modeName}>{mode.name}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                    
                    <View style={styles.startButton}>
                      <Plus size={16} color="white" />
                      <Text style={styles.startButtonText}>
                        {isSupabaseConfigured ? 'Start' : 'Config Required'}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Setup Instructions */}
          {!isSupabaseConfigured && (
            <View style={styles.setupSection}>
              <Text style={styles.setupTitle}>Setup Instructions</Text>
              <View style={styles.setupCard}>
                <Text style={styles.setupStep}>1. Create a Supabase project at supabase.com</Text>
                <Text style={styles.setupStep}>2. Set environment variables:</Text>
                <Text style={styles.setupCode}>   EXPO_PUBLIC_SUPABASE_URL=your_url</Text>
                <Text style={styles.setupCode}>   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key</Text>
                <Text style={styles.setupStep}>3. Deploy the Claude proxy Edge Function</Text>
                <Text style={styles.setupStep}>4. Set CLAUDE_API_KEY in Supabase dashboard</Text>
                <Text style={styles.setupStep}>5. Test with "Hello" message</Text>
              </View>
            </View>
          )}

          {/* Recent Conversations */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <View style={styles.recentList}>
              <Text style={styles.emptyText}>No recent conversations</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Interview Setup Modal */}
      <Modal
        visible={showInterviewSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInterviewSetup(false)}
      >
        <View style={styles.interviewSetupContainer}>
          <View style={styles.interviewSetupHeader}>
            <TouchableOpacity
              style={styles.interviewSetupCloseButton}
              onPress={() => setShowInterviewSetup(false)}
            >
              <X size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.interviewSetupTitle}>
              Interview Setup
            </Text>
          </View>
          
          <InterviewSetupScreen
            onQuickStart={() => {
              const mode = conversationModes.find(m => m.id === 'interview-practice');
              if (mode) {
                const conversation = createConversation(mode);
                if (conversation) {
                  addRecentModeToUser('interview-practice');
                  setSelectedMode('interview-practice');
                  setSessionId(conversation.id);
                  setShowInterviewSetup(false);
                }
              }
            }}
            onDocumentSelect={(type) => {
              // This is now handled inside InterviewSetupScreen
            }}
            onContinue={handleInterviewContinue}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configButton: {
    backgroundColor: '#EF4444',
  },
  testButton: {
    backgroundColor: '#10B981',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },
  testTitle: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  testText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  modeCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  modeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  startButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  setupSection: {
    marginBottom: 32,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  setupCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  setupStep: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  setupCode: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  recentSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  recentList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  interviewSetupContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  interviewSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    position: 'relative',
  },
  interviewSetupCloseButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 20,
    padding: 8,
  },
  interviewSetupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  }
});