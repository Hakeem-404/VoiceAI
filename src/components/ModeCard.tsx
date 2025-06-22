import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Briefcase, 
  Users, 
  MessageCircle, 
  Globe, 
  Heart,
  Presentation 
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { ConversationMode } from '../types';
import { spacing, typography } from '../constants/colors';

interface ModeCardProps {
  mode: ConversationMode;
  onPress: (mode: ConversationMode) => void;
}

const iconMap = {
  briefcase: Briefcase,
  presentation: Presentation,
  'message-circle': MessageCircle,
  users: Users,
  globe: Globe,
  heart: Heart,
};

export function ModeCard({ mode, onPress }: ModeCardProps) {
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(mode)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isDark ? [colors.surface, colors.card] : [colors.card, colors.surface]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <IconComponent size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{mode.name}</Text>
            <View style={styles.metadata}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(mode.difficulty) }]}>
                <Text style={styles.difficultyText}>{mode.difficulty}</Text>
              </View>
              <Text style={[styles.duration, { color: colors.textSecondary }]}>
                {mode.estimatedDuration} min
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {mode.description}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  difficultyText: {
    color: 'white',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'capitalize',
  },
  duration: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  description: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.5,
  },
});