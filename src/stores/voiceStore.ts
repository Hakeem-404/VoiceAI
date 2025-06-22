import { create } from 'zustand';
import { Audio } from 'expo-av';

export interface VoiceState {
  isRecording: boolean;
  audioLevel: number;
  transcript: string;
  recordingUri: string | null;
  recordingDuration: number;
  voiceActivityDetected: boolean;
  silenceTimer: NodeJS.Timeout | null;
  recording: Audio.Recording | null;
  
  // Actions
  setRecording: (recording: Audio.Recording | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setAudioLevel: (level: number) => void;
  setTranscript: (transcript: string) => void;
  setRecordingUri: (uri: string | null) => void;
  setRecordingDuration: (duration: number) => void;
  setVoiceActivityDetected: (detected: boolean) => void;
  setSilenceTimer: (timer: NodeJS.Timeout | null) => void;
  resetVoiceState: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isRecording: false,
  audioLevel: 0,
  transcript: '',
  recordingUri: null,
  recordingDuration: 0,
  voiceActivityDetected: false,
  silenceTimer: null,
  recording: null,

  setRecording: (recording) => set({ recording }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setTranscript: (transcript) => set({ transcript }),
  setRecordingUri: (recordingUri) => set({ recordingUri }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
  setVoiceActivityDetected: (voiceActivityDetected) => set({ voiceActivityDetected }),
  setSilenceTimer: (silenceTimer) => {
    const currentTimer = get().silenceTimer;
    if (currentTimer) {
      clearTimeout(currentTimer);
    }
    set({ silenceTimer });
  },
  resetVoiceState: () => set({
    isRecording: false,
    audioLevel: 0,
    transcript: '',
    recordingUri: null,
    recordingDuration: 0,
    voiceActivityDetected: false,
    silenceTimer: null,
  }),
}));