import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface RecordingConfig {
  android: {
    extension: '.m4a';
    outputFormat: Audio.AndroidOutputFormat.MPEG_4;
    audioEncoder: Audio.AndroidAudioEncoder.AAC;
    sampleRate: 44100;
    numberOfChannels: 2;
    bitRate: 128000;
  };
  ios: {
    extension: '.m4a';
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC;
    audioQuality: Audio.IOSAudioQuality.HIGH;
    sampleRate: 44100;
    numberOfChannels: 2;
    bitRate: 128000;
    linearPCMBitDepth: 16;
    linearPCMIsBigEndian: false;
    linearPCMIsFloat: false;
  };
  web: {
    extension: '.webm';
    mimeType: 'audio/webm';
  };
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingConfig: RecordingConfig;

  constructor() {
    this.recordingConfig = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        extension: '.webm',
        mimeType: 'audio/webm',
      },
    };
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web permissions handled by browser
        return true;
      }

      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async initializeAudio(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      }
    } catch (error) {
      console.error('Audio initialization failed:', error);
      throw error;
    }
  }

  async startRecording(
    onAudioLevel?: (level: number) => void,
    onVoiceActivity?: (detected: boolean) => void
  ): Promise<Audio.Recording> {
    try {
      await this.initializeAudio();

      const recordingOptions = Platform.select({
        ios: this.recordingConfig.ios,
        android: this.recordingConfig.android,
        web: this.recordingConfig.web,
      });

      const { recording } = await Audio.Recording.createAsync(
        recordingOptions as any,
        undefined,
        100 // Update interval for metering
      );

      this.recording = recording;

      // Monitor audio levels and voice activity
      if (onAudioLevel || onVoiceActivity) {
        recording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording && status.metering !== undefined) {
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            onAudioLevel?.(normalizedLevel);

            // Voice activity detection based on audio level
            const voiceDetected = normalizedLevel > 0.1;
            onVoiceActivity?.(voiceDetected);
          }
        });
      }

      // Haptic feedback on start
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      return recording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) return null;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      // Haptic feedback on stop
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async playAudio(uri: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
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
    try {
      const speechOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 1.0,
        volume: options?.volume || 1.0,
        voice: options?.voice,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Failed to speak text:', error);
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  cleanup(): void {
    this.stopRecording();
    this.stopAudio();
    this.stopSpeaking();
  }
}

export const voiceService = new VoiceService();