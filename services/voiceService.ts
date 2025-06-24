import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { audioService } from './audioService';

export interface VoiceActivityConfig {
  silenceThreshold: number; // milliseconds
  voiceThreshold: number; // 0-1 audio level
  maxRecordingDuration: number; // milliseconds
}

class VoiceService {
  private voiceActivityTimer: NodeJS.Timeout | null = null;
  private recordingStartTime: number = 0;
  private lastVoiceActivity: number = 0;

  private defaultConfig: VoiceActivityConfig = {
    silenceThreshold: 2000, // 2 seconds
    voiceThreshold: 0.1, // 10% audio level
    maxRecordingDuration: 300000, // 5 minutes
  };

  async requestPermissions(): Promise<boolean> {
    return await audioService.requestPermissions();
  }

  async initializeAudio(): Promise<void> {
    return await audioService.initializeAudio();
  }

  async startRecording(
    onAudioLevel?: (level: number) => void,
    onVoiceActivity?: (detected: boolean) => void,
    config: Partial<VoiceActivityConfig> = {}
  ): Promise<Audio.Recording | null> {
    const voiceConfig = { ...this.defaultConfig, ...config };
    this.recordingStartTime = Date.now();
    this.lastVoiceActivity = Date.now();

    // Clear any existing timer
    if (this.voiceActivityTimer) {
      clearTimeout(this.voiceActivityTimer);
      this.voiceActivityTimer = null;
    }

    const recording = await audioService.startRecording(
      (level) => {
        onAudioLevel?.(level);
        
        // Voice activity detection
        const voiceDetected = level > voiceConfig.voiceThreshold;
        onVoiceActivity?.(voiceDetected);

        if (voiceDetected) {
          this.lastVoiceActivity = Date.now();
          
          // Clear silence timer if voice is detected
          if (this.voiceActivityTimer) {
            clearTimeout(this.voiceActivityTimer);
            this.voiceActivityTimer = null;
          }
        } else {
          // Start silence timer if not already running
          if (!this.voiceActivityTimer) {
            this.voiceActivityTimer = setTimeout(() => {
              this.handleSilenceTimeout();
            }, voiceConfig.silenceThreshold);
          }
        }

        // Check max recording duration
        const recordingDuration = Date.now() - this.recordingStartTime;
        if (recordingDuration > voiceConfig.maxRecordingDuration) {
          this.handleMaxDurationReached();
        }
      },
      onVoiceActivity
    );

    // Haptic feedback on start (only on mobile)
    if (Platform.OS !== 'web') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        await impactAsync(ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }

    return recording;
  }

  async stopRecording(): Promise<string | null> {
    // Clear voice activity timer
    if (this.voiceActivityTimer) {
      clearTimeout(this.voiceActivityTimer);
      this.voiceActivityTimer = null;
    }

    const uri = await audioService.stopRecording();

    // Haptic feedback on stop (only on mobile)
    if (Platform.OS !== 'web') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        await impactAsync(ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }

    return uri;
  }

  private handleSilenceTimeout(): void {
    // This would trigger auto-stop in the calling component
    console.log('Silence timeout reached');
    // Emit event or call callback to stop recording
  }

  private handleMaxDurationReached(): void {
    // This would trigger auto-stop in the calling component
    console.log('Max recording duration reached');
    // Emit event or call callback to stop recording
  }

  async playAudio(uri: string): Promise<void> {
    return await audioService.playAudio(uri);
  }

  async stopAudio(): Promise<void> {
    return await audioService.stopAudio();
  }

  async speakText(
    text: string,
    options?: {
      voice?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
    }
  ): Promise<void> {
    return await audioService.speakText(text, options);
  }

  async stopSpeaking(): Promise<void> {
    return await audioService.stopSpeaking();
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    return await audioService.getAvailableVoices();
  }

  async checkPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    return await audioService.checkAudioPermissions();
  }

  async testRecording(): Promise<boolean> {
    return await audioService.testRecording();
  }

  cleanup(): void {
    if (this.voiceActivityTimer) {
      clearTimeout(this.voiceActivityTimer);
      this.voiceActivityTimer = null;
    }
    audioService.cleanup();
  }

  // Utility methods for voice processing
  calculateAudioLevel(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += Math.abs(samples[i]);
    }
    return sum / samples.length;
  }

  detectVoiceActivity(audioLevel: number, threshold: number = 0.1): boolean {
    return audioLevel > threshold;
  }

  // Web-specific audio processing
  async setupWebAudioContext(): Promise<AudioContext | null> {
    if (Platform.OS !== 'web') return null;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext;
    } catch (error) {
      console.error('Failed to setup web audio context:', error);
      return null;
    }
  }

  async getWebAudioStream(): Promise<MediaStream | null> {
    if (Platform.OS !== 'web') return null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to get web audio stream:', error);
      return null;
    }
  }
}

export const voiceService = new VoiceService();