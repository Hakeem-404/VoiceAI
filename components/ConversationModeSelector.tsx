import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Search, Filter, Star, Clock, TrendingUp, Grid3x3 as Grid3X3, List } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ConversationMode } from '@/src/types';
import { ModeSelectionCard } from './ModeSelectionCard';
import { spacing, typography } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

interface ConversationModeSelectorProps {
  visible: boolean;
  modes: ConversationMode[];
  onClose: () => void;
  onModeSelect: (mode: ConversationMode) => void;
  favoriteMode?: string;
  recentModes: string[];
}

export function ConversationModeSelector({
  visible,
  modes,
  onClose,
  onModeSelect,
  favoriteMode,
  recentModes = [],
}: ConversationModeSelectorProps) {
  const { colors, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'difficulty'>('name');

  const categories = [
    { id: 'all', name: 'All', icon: null },
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'recent', name: 'Recent', icon: TrendingUp },
    { id: 'social', name: 'Social', icon: null },
    { id: 'professional', name: 'Professional', icon: null },
    { id: 'creativity', name: 'Creative', icon: null },
    { id: 'critical-thinking', name: 'Critical', icon: null },
    { id: 'presentation', name: 'Speaking', icon: null },
    { id: 'education', name: 'Learning', icon: null },
  ];

  const filteredModes = modes
    .filter(mode => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          mode.name.toLowerCase().includes(query) ||
          mode.description.toLowerCase().includes(query) ||
          mode.features.some(feature => feature.toLowerCase().includes(query)) ||
          mode.topics.some(topic => topic.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(mode => {
      // Category filter
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return mode.id === favoriteMode;
      if (selectedCategory === 'recent') return recentModes.includes(mode.id);
      return mode.category === selectedCategory;
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case 'recent':
          const aIndex = recentModes.indexOf(a.id);
          const bIndex = recentModes.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        case 'difficulty':
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const CategoryButton = ({ category }: { category: any }) => {
    const IconComponent = category.icon;
    const isSelected = selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isSelected && { backgroundColor: colors.primary },
          { borderColor: colors.border }
        ]}
        onPress={() => setSelectedCategory(category.id)}
      >
        {IconComponent && (
          <IconComponent
            size={16}
            color={isSelected ? 'white' : colors.textSecondary}
          />
        )}
        <Text
          style={[
            styles.categoryText,
            { color: isSelected ? 'white' : colors.textSecondary }
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const ModeGridItem = ({ mode }: { mode: ConversationMode }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.surface }]}
      onPress={() => onModeSelect(mode)}
    >
      <LinearGradient
        colors={mode.color.gradient}
        style={styles.gridItemGradient}
      >
        <View style={styles.gridItemHeader}>
          {mode.id === favoriteMode && (
            <Star size={16} color="white" fill="white" />
          )}
          {recentModes.includes(mode.id) && (
            <TrendingUp size={16} color="white" />
          )}
        </View>
        
        <Text style={styles.gridItemTitle}>{mode.name}</Text>
        <Text style={styles.gridItemDescription} numberOfLines={2}>
          {mode.description}
        </Text>
        
        <View style={styles.gridItemFooter}>
          <Clock size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.gridItemDuration}>{mode.estimatedDuration}m</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Choose Mode
            </Text>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.viewToggle, { backgroundColor: colors.surface }]}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? (
                  <List size={20} color={colors.textSecondary} />
                ) : (
                  <Grid3X3 size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: colors.surface }]}>
              <Search size={20} color={colors.textSecondary} />
              <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
                Search modes, topics, features...
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.surface }]}
            >
              <Filter size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {filteredModes.length} mode{filteredModes.length !== 1 ? 's' : ''} found
          </Text>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const nextSort = sortBy === 'name' ? 'recent' : 
                             sortBy === 'recent' ? 'difficulty' : 'name';
              setSortBy(nextSort);
            }}
          >
            <Text style={[styles.sortText, { color: colors.textSecondary }]}>
              Sort: {sortBy === 'name' ? 'A-Z' : sortBy === 'recent' ? 'Recent' : 'Difficulty'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modes List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {filteredModes.map((mode) => (
                <ModeGridItem key={mode.id} mode={mode} />
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredModes.map((mode) => (
                <ModeSelectionCard
                  key={mode.id}
                  mode={mode}
                  onPress={onModeSelect}
                  onConfigure={() => {}}
                  isFavorite={mode.id === favoriteMode}
                  isRecentlyUsed={recentModes.includes(mode.id)}
                />
              ))}
            </View>
          )}
          
          {filteredModes.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No modes found
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.sizes.base,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesSection: {
    paddingVertical: spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  categoryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sortButton: {
    padding: spacing.sm,
  },
  sortText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: (width - spacing.lg * 3) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridItemGradient: {
    padding: spacing.md,
    minHeight: 140,
  },
  gridItemHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  gridItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'white',
    marginBottom: spacing.xs,
  },
  gridItemDescription: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: typography.sizes.sm * 1.3,
    flex: 1,
  },
  gridItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  gridItemDuration: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: typography.weights.medium,
  },
  listContainer: {
    gap: spacing.md,
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