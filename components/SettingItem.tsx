import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface SettingItemProps { 
  icon: any;
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  type?: 'toggle' | 'nav';
  onPress?: () => void;
}

export function SettingItem({ 
  icon: IconComponent, 
  title, 
  subtitle, 
  value, 
  onValueChange,
  type = 'toggle',
  onPress
}: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: colors.surface }]}
      activeOpacity={type === 'nav' ? 0.6 : 1}
      onPress={onPress}
    >
      <View style={styles.settingContent}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
          <IconComponent size={20} color="white" />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {type === 'toggle' && value !== undefined && onValueChange ? (
        <View style={[
          styles.toggleSwitch, 
          { backgroundColor: value ? colors.primary : colors.border }
        ]}>
          <View style={[
            styles.toggleKnob, 
            { 
              backgroundColor: colors.surface,
              transform: [{ translateX: value ? 20 : 0 }]
            }
          ]} />
        </View>
      ) : (
        <ChevronRight size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs / 2,
  },
  settingSubtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});