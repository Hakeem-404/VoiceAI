import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { 
  Zap, 
  Volume2, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  X
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { RealTimeFeedback } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface ConversationFeedbackIndicatorProps {
  feedback: RealTimeFeedback;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

export function ConversationFeedbackIndicator({ 
  feedback,
  onDismiss,
  position = 'top'
}: ConversationFeedbackIndicatorProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(position === 'top' ? -20 : 20)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // Fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: position === 'top' ? -20 : 20,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDismiss();
    });
  };

  const getIcon = () => {
    switch (feedback.type) {
      case 'pace':
        return <Clock size={20} color="white" />;
      case 'volume':
        return <Volume2 size={20} color="white" />;
      case 'filler':
        return <MessageSquare size={20} color="white" />;
      case 'engagement':
        return <Zap size={20} color="white" />;
      case 'question':
        return <MessageSquare size={20} color="white" />;
      case 'clarity':
        return <AlertTriangle size={20} color="white" />;
      default:
        return <Zap size={20} color="white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (feedback.severity) {
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.primary;
      case 'suggestion':
        return colors.secondary;
      default:
        return colors.primary;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
        position === 'top' ? styles.topPosition : styles.bottomPosition
      ]}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      
      <Text style={styles.message}>{feedback.message}</Text>
      
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
      >
        <X size={16} color="rgba(255, 255, 255, 0.8)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 30,
    marginHorizontal: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topPosition: {
    top: 100,
  },
  bottomPosition: {
    bottom: 100,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  dismissButton: {
    padding: spacing.xs,
  },
});