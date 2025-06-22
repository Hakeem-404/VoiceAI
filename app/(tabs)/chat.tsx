import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  Settings
} from 'lucide-react-native';
import { ConversationView } from '../../components/ConversationView';

const conversationModes = [
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

  const startConversation = (modeId: string) => {
    setSelectedMode(modeId);
    setSessionId(Date.now().toString());
  };

  const endConversation = () => {
    setSelectedMode(null);
    setSessionId(null);
  };

  if (selectedMode && sessionId) {
    return (
      <ConversationView
        mode={selectedMode}
        sessionId={sessionId}
        onClose={endConversation}
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
            <Text style={styles.subtitle}>Choose your conversation mode</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Mode Selection */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modesGrid}>
            {conversationModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.modeCard}
                  onPress={() => startConversation(mode.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={mode.color}
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
                      <Text style={styles.startButtonText}>Start</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recent Conversations */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <View style={styles.recentList}>
              <Text style={styles.emptyText}>No recent conversations</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
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
});