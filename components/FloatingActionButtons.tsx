import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageSquare,
  Settings,
  RotateCcw,
  HelpCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks/useTheme';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

interface FloatingActionButtonsProps {
  onTextInputToggle: () => void;
  onVoiceSettings: () => void;
  onModeSwitch: () => void;
  onHelp: () => void;
}

export function FloatingActionButtons({
  onTextInputToggle,
  onVoiceSettings,
  onModeSwitch,
  onHelp,
}: FloatingActionButtonsProps) {
  const { colors } = useTheme();
  const { inputMode } = useInputStore();
  const { voiceSettings } = useSettingsStore();

  const handlePress = (action: () => void) => {
    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action();
  };

  const FloatingButton = ({
    icon: IconComponent,
    onPress,
    position,
    accessibilityLabel,
    isActive = false,
  }: {
    icon: any;
    onPress: () => void;
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    accessibilityLabel: string;
    isActive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.floatingButton, styles[position]]}
      onPress={() => handlePress(onPress)}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={
          isActive
            ? [colors.secondary, colors.primary]
            : [colors.surface, colors.card]
        }
        style={styles.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <IconComponent
          size={20}
          color={isActive ? 'white' : colors.textSecondary}
        />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FloatingButton
        icon={MessageSquare}
        onPress={onTextInputToggle}
        position="topLeft"
        accessibilityLabel="Toggle text input"
        isActive={inputMode === 'text' || inputMode === 'hybrid'}
      />
      
      <FloatingButton
        icon={Settings}
        onPress={onVoiceSettings}
        position="topRight"
        accessibilityLabel="Voice settings"
      />
      
      <FloatingButton
        icon={RotateCcw}
        onPress={onModeSwitch}
        position="bottomLeft"
        accessibilityLabel="Switch conversation mode"
      />
      
      <FloatingButton
        icon={HelpCircle}
        onPress={onHelp}
        position="bottomRight"
        accessibilityLabel="Help and tutorial"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  floatingButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeft: {
    top: 60,
    left: 20,
  },
  topRight: {
    top: 60,
    right: 20,
  },
  bottomLeft: {
    bottom: 120,
    left: 20,
  },
  bottomRight: {
    bottom: 120,
    right: 20,
  },
});