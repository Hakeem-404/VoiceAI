import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  async initializeAudio() {
    try {
      if (Platform.OS !== 'web') {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  async startRecording(onAudioLevel?: (level: number) => void) {
    try {
      if (Platform.OS === 'web') {
        throw new Error('Recording not supported on web');
      }

      await this.initializeAudio();
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // Update interval for audio levels
      );

      this.recording = recording;

      // Monitor audio levels if callback provided
      if (onAudioLevel) {
        this.recording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Convert metering to 0-1 range for visualization
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            onAudioLevel(normalizedLevel);
          }
        });
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

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async playAudio(uri: string) {
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

  async stopAudio() {
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

  async speakText(text: string, options?: {
    voice?: string;
    rate?: number;
    pitch?: number;
  }) {
    try {
      const speechOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 1.0,
        voice: options?.voice,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Failed to speak text:', error);
      throw error;
    }
  }

  async stopSpeaking() {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  cleanup() {
    this.stopRecording();
    this.stopAudio();
    this.stopSpeaking();
  }
}

export const audioService = new AudioService();