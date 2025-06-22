import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Users,
  Lightbulb,
  Briefcase,
  Presentation,
  Globe,
  Star,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { ConversationMode } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

interface ModeSelectionCardProps {
  mode: ConversationMode;
  onPress: (mode: ConversationMode) => void;
  onConfigure: (mode: ConversationMode) => void;
  isFavorite?: boolean;
  isRecentlyUsed?: boolean;
  lastUsed?: Date;
}

const iconMap = {
  'message-circle': MessageCircle,
  'users': Users,
  'lightbulb': Lightbulb,
  'briefcase': Briefcase,
  'presentation': Presentation,
  'globe': Globe,
};

export function ModeSelectionCard({
  mode,
  onPress,
  onConfigure,
  isFavorite = false,
  isRecentlyUsed = false,
  lastUsed,
}: ModeSelectionCardProps) {
  const { colors, isDark } = useTheme();
  const IconComponent = iconMap[mode.icon as keyof typeof iconMap] || MessageCircle;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.primary;
    }
  };

  const formatLastUsed = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(mode)}
      activeOpacity={0.8}
      accessibilityLabel={`${mode.name} conversation mode`}
      accessibilityHint={`Tap to start ${mode.name} conversation`}
    >
      <LinearGradient
        colors={mode.color.gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with icon and badges */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconComponent size={28} color="white" />
          </View>
          
          <View style={styles.badges}>
            {isFavorite && (
              <View style={[styles.badge, styles.favoriteBadge]}>
                <Star size={12} color="white" fill="white" />
              </View>
            )}
            {isRecentlyUsed && (
              <View style={[styles.badge, styles.recentBadge]}>
                <TrendingUp size={12} color="white" />
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{mode.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {mode.description}
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {mode.features.slice(0, 2).map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.metadataText}>
                {mode.estimatedDuration} min
              </Text>
            </View>
            
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(mode.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {mode.difficulty}
              </Text>
            </View>
          </View>

          {lastUsed && (
            <Text style={styles.lastUsedText}>
              Last used {formatLastUsed(lastUsed)}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.configureButton]}
            onPress={(e) => {
              e.stopPropagation();
              onConfigure(mode);
            }}
            accessibilityLabel="Configure mode settings"
          >
            <Text style={styles.configureButtonText}>Configure</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => onPress(mode)}
            accessibilityLabel="Start conversation"
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: spacing.lg,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
  },
  recentBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  content: {
    flex: 1,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: 'white',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: typography.sizes.base * 1.4,
    marginBottom: spacing.md,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  featureTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  featureText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.medium,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.weights.medium,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: typography.sizes.xs,
    color: 'white',
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  lastUsedText: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configureButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  configureButtonText: {
    fontSize: typography.sizes.sm,
    color: 'white',
    fontWeight: typography.weights.semibold,
  },
  startButtonText: {
    fontSize: typography.sizes.sm,
    color: '#1F2937',
    fontWeight: typography.weights.bold,
  },
});