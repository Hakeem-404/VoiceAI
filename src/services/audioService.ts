import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface PlatformRecordingOptions {
  android: {
    extension: '.m4a';
    outputFormat: Audio.AndroidOutputFormat;
    audioEncoder: Audio.AndroidAudioEncoder;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
  };
  ios: {
    extension: '.m4a';
    outputFormat: Audio.IOSOutputFormat;
    audioQuality: Audio.IOSAudioQuality;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth: number;
    linearPCMIsBigEndian: boolean;
    linearPCMIsFloat: boolean;
  };
  web: {
    mimeType: string;
    bitsPerSecond: number;
  };
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private webMediaRecorder: MediaRecorder | null = null;
  private webAudioChunks: Blob[] = [];

  private readonly recordingOptions: PlatformRecordingOptions = {
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
      mimeType: 'audio/webm;codecs=opus',
      bitsPerSecond: 128000,
    },
  };

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by the browser's getUserMedia API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          console.warn('Web microphone permission denied:', error);
          return false;
        }
      }

      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async initializeAudio(): Promise<void> {
  if (this.isInitialized) return;

  try {
    if (Platform.OS === 'web') {
      this.isInitialized = true;
      return; 
    }

   
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });                

    this.isInitialized = true;   
  } catch (error) {
    console.error('Audio initialization failed:', error);
    throw new Error('Failed to initialize audio system');
  }
}

  async startRecording(
    onAudioLevel?: (level: number) => void,
    onVoiceActivity?: (detected: boolean) => void
  ): Promise<Audio.Recording | null> {
    try {
      // Ensure audio is initialized
      await this.initializeAudio();

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      if (Platform.OS === 'web') {
        // Web recording implementation
        return await this.startWebRecording(onAudioLevel, onVoiceActivity);
      }

      // Native recording implementation using expo-av
      const options = this.getPlatformRecordingOptions();
      
      const { recording } = await Audio.Recording.createAsync(
        options,
        undefined,
        100 // Update interval for metering in milliseconds
      );

      this.recording = recording;

      // Set up audio level monitoring
      if (onAudioLevel || onVoiceActivity) {
        recording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Convert metering to 0-1 range for visualization
            // Metering typically ranges from -160 to 0 dB
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            onAudioLevel?.(normalizedLevel);

            // Voice activity detection based on audio level threshold
            const voiceDetected = normalizedLevel > 0.1;
            onVoiceActivity?.(voiceDetected);
          }
        });
      }

      return recording;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      throw new Error(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async startWebRecording(
    onAudioLevel?: (level: number) => void,
    onVoiceActivity?: (detected: boolean) => void
  ): Promise<Audio.Recording | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      // Set up audio level monitoring for web
      if (onAudioLevel || onVoiceActivity) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        microphone.connect(analyser);
        analyser.fftSize = 256;

        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = average / 255;
          
          onAudioLevel?.(normalizedLevel);
          onVoiceActivity?.(normalizedLevel > 0.1);

          if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
            requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
      }

      // Set up MediaRecorder for web recording
      this.webAudioChunks = [];
      this.webMediaRecorder = new MediaRecorder(stream, {
        mimeType: this.recordingOptions.web.mimeType,
        audioBitsPerSecond: this.recordingOptions.web.bitsPerSecond,
      });

      this.webMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.webAudioChunks.push(event.data);
        }
      };

      this.webMediaRecorder.start();

      // Create a mock recording object that behaves like expo-av Recording
      const mockRecording = {
        getURI: () => {
          if (this.webAudioChunks.length > 0) {
            const blob = new Blob(this.webAudioChunks, { type: this.recordingOptions.web.mimeType });
            return URL.createObjectURL(blob);
          }
          return null;
        },
        stopAndUnloadAsync: async () => {
          if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
            this.webMediaRecorder.stop();
          }
          stream.getTracks().forEach(track => track.stop());
        },
        setOnRecordingStatusUpdate: (callback: any) => {
          // Mock status updates for web
          const interval = setInterval(() => {
            if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
              callback({
                isRecording: true,
                metering: Math.random() * 160 - 160, // Mock metering value
              });
            } else {
              clearInterval(interval);
            }
          }, 100);
        },
      } as Audio.Recording;

      this.recording = mockRecording;
      return mockRecording;
    } catch (error) {
      console.error('Web recording failed:', error);
      throw error;
    }
  }

  private getPlatformRecordingOptions(): any {
    switch (Platform.OS) {
      case 'ios':
        return this.recordingOptions.ios;
      case 'android':
        return this.recordingOptions.android;
      case 'web':
        return this.recordingOptions.web;
      default:
        return this.recordingOptions.android; // Fallback
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) return null;

      if (Platform.OS === 'web') {
        // Clean up web recording
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;
        this.webMediaRecorder = null;
        return uri;
      }

      // Native recording stop
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      throw new Error(`Stop recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async playAudio(uri: string): Promise<void> {
    try {
      // Stop any existing playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      if (Platform.OS === 'web') {
        // Web audio playback
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
          const audio = new window.Audio(uri);
          audio.play();
          return;
        } else {
          console.log('Mock audio playback:', uri);
          return;
        }
      }

      // Native audio playback using expo-av
      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw new Error(`Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      if (Platform.OS === 'web') {
        // Web speech synthesis voices
        const voices = speechSynthesis.getVoices();
        return voices.map(voice => ({
          identifier: voice.voiceURI,
          name: voice.name,
          language: voice.lang,
          quality: 'Default' as any,
        }));
      }

      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  async checkAudioPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      if (Platform.OS === 'web') {
        // Check web permissions
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          return result.state === 'granted' ? 'granted' : 
                 result.state === 'denied' ? 'denied' : 'undetermined';
        } catch {
          return 'undetermined';
        }
      }

      const { status } = await Audio.getPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return 'undetermined';
    }
  }

  cleanup(): void {
    try {
      this.stopRecording();
      this.stopAudio();
      this.stopSpeaking();
      this.isInitialized = false;
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Utility method to test recording functionality
  async testRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await this.initializeAudio();
      const recording = await this.startRecording();
      
      if (!recording) return false;
      
      // Record for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const uri = await this.stopRecording();
      return uri !== null;
    } catch (error) {
      console.error('Recording test failed:', error);
      return false;
    }
  }
}

export const audioService = new AudioService();