import { create } from 'zustand';

export interface VoiceSettings {
  selectedVoice: string;
  speechRate: number;
  speechPitch: number;
  volume: number;
  autoStopAfterSilence: boolean;
  silenceThreshold: number;
  maxRecordingDuration: number;
  enableHapticFeedback: boolean;
  enableVoiceActivityDetection: boolean;
}

export interface PermissionState {
  microphone: 'granted' | 'denied' | 'undetermined';
  notifications: 'granted' | 'denied' | 'undetermined';
}

export interface SettingsState {
  voiceSettings: VoiceSettings;
  permissions: PermissionState;
  accessibilitySettings: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    voiceOverEnabled: boolean;
  };
  
  // Actions
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  updatePermissions: (permissions: Partial<PermissionState>) => void;
  updateAccessibilitySettings: (settings: Partial<SettingsState['accessibilitySettings']>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  voiceSettings: {
    selectedVoice: 'en-US-Standard-A',
    speechRate: 1.0,
    speechPitch: 1.0,
    volume: 0.8,
    autoStopAfterSilence: true,
    silenceThreshold: 2000, // 2 seconds
    maxRecordingDuration: 300000, // 5 minutes
    enableHapticFeedback: true,
    enableVoiceActivityDetection: true,
  },
  permissions: {
    microphone: 'undetermined',
    notifications: 'undetermined',
  },
  accessibilitySettings: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    voiceOverEnabled: false,
  },

  updateVoiceSettings: (settings) =>
    set((state) => ({
      voiceSettings: { ...state.voiceSettings, ...settings },
    })),
  updatePermissions: (permissions) =>
    set((state) => ({
      permissions: { ...state.permissions, ...permissions },
    })),
  updateAccessibilitySettings: (settings) =>
    set((state) => ({
      accessibilitySettings: { ...state.accessibilitySettings, ...settings },
    })),
}));