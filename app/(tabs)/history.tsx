import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, 
  Filter,
  MessageCircle,
  Clock,
  Star,
  Play,
  Trash2
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useConversationStore } from '@/src/stores/conversationStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { useConversationDatabase } from '@/src/hooks/useConversationDatabase';
import { GuestModePrompt } from '@/components/GuestModePrompt';
import { Conversation } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const { conversations, deleteConversation } = useConversationStore();
  const { user } = useSupabaseAuth();
  const { 
    conversations: dbConversations, 
    loading, 
    loadConversations, 
    deleteConversation: deleteDbConversation 
  } = useConversationDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadConversations();
      setShowAuthPrompt(false);
    } else if (!conversations.length) {
      // Show auth prompt if guest user has no conversations
      setShowAuthPrompt(true);
    }
  }, [user]);

  // Handle conversation deletion
  const handleDeleteConversation = async (id: string) => {
    try {
      if (user) {
        // Delete from database
        await deleteDbConversation(id);
      } else {
        // Delete from local store
        deleteConversation(id);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.mode.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'recent') {
      const isRecent = (new Date().getTime() - conversation.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000);
      return matchesSearch && isRecent;
    }
    
    return matchesSearch;
  });

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.surface }]}
      activeOpacity={0.8}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={[styles.conversationTitle, { color: colors.text }]}>
            {item.title || `${item.mode.name} - ${formatDate(item.createdAt)}`}
          </Text>
          <Text style={[styles.conversationMode, { color: colors.textSecondary }]}>
            {item.mode.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item.id)}
        >
          <Trash2 size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.conversationStats}>
        <View style={styles.stat}>
          <MessageCircle size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {item.messages.length} messages
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        
        {item.feedback && (
          <View style={styles.stat}>
            <Star size={14} color={colors.warning} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.feedback.scores.overall}/10
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationFooter}>
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>
          {formatDate(item.createdAt)}
        </Text>
        <TouchableOpacity style={styles.playButton}>
          <Play size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Start your first conversation to see it here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Conversation History
          </Text>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search conversations..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            {(['all', 'recent', 'favorites'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: selectedFilter === filter ? 'white' : colors.textSecondary,
                    },
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
      
      {/* Auth Prompt Modal */}
      <GuestModePrompt
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        feature="history"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.base,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  conversationCard: {
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  conversationMode: {
    fontSize: typography.sizes.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  conversationStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.sizes.sm,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.sizes.sm,
  },
  playButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
});