import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export interface AudioQueueItem {
  id: string;
  audioUrl: string;
  text: string;
  title?: string;
  conversationMode: string;
  timestamp: number;
}

export interface PlaybackControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  toggleRepeat: () => void;
}

class AudioPlayerService {
  private sound: Audio.Sound | null = null;
  private audioQueue: AudioQueueItem[] = [];
  private currentIndex = 0;
  private isRepeatEnabled = false;
  private playbackState: PlaybackState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    playbackRate: 1.0
  };
  private statusUpdateCallback: ((state: PlaybackState) => void) | null = null;
  private queueUpdateCallback: ((queue: AudioQueueItem[], currentIndex: number) => void) | null = null;

  constructor() {
    this.initializeAudio();
    this.loadQueueFromStorage();
  }

  private async initializeAudio() {
    if (Platform.OS === 'web') return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
    } catch (error) {
      console.warn('Failed to initialize audio mode:', error);
    }
  }

  // Queue management
  async addToQueue(audioUrl: string, text: string, conversationMode: string, title?: string): Promise<string> {
    const queueItem: AudioQueueItem = {
      id: Date.now().toString(),
      audioUrl,
      text,
      title,
      conversationMode,
      timestamp: Date.now()
    };

    this.audioQueue.push(queueItem);
    await this.saveQueueToStorage();
    this.notifyQueueUpdate();

    return queueItem.id;
  }

  async playNext(audioUrl: string, text: string, conversationMode: string, title?: string): Promise<void> {
    // Stop current playback
    await this.stop();

    // Add to front of queue
    const queueItem: AudioQueueItem = {
      id: Date.now().toString(),
      audioUrl,
      text,
      title,
      conversationMode,
      timestamp: Date.now()
    };

    this.audioQueue.unshift(queueItem);
    this.currentIndex = 0;
    await this.saveQueueToStorage();
    this.notifyQueueUpdate();

    // Start playing immediately
    await this.play();
  }

  async playImmediate(audioUrl: string, text: string, conversationMode: string): Promise<void> {
    // Stop current playback and clear queue
    await this.stop();
    this.audioQueue = [];
    this.currentIndex = 0;

    // Add single item and play
    await this.addToQueue(audioUrl, text, conversationMode);
    await this.play();
  }

  // Playback controls
  async play(): Promise<void> {
    try {
      if (this.audioQueue.length === 0) {
        console.warn('No audio in queue to play');
        return;
      }

      const currentItem = this.audioQueue[this.currentIndex];
      if (!currentItem) {
        console.warn('No current audio item');
        return;
      }

      this.updatePlaybackState({ isLoading: true });

      // If we have a sound and it's paused, resume it
      if (this.sound && this.playbackState.isPaused) {
        await this.sound.playAsync();
        this.updatePlaybackState({ 
          isPlaying: true, 
          isPaused: false, 
          isLoading: false 
        });
        return;
      }

      // Stop any existing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Load and play new sound
      if (Platform.OS === 'web') {
        await this.playWebAudio(currentItem.audioUrl);
      } else {
        await this.playNativeAudio(currentItem.audioUrl);
      }

      this.updatePlaybackState({ 
        isPlaying: true, 
        isPaused: false, 
        isLoading: false 
      });

    } catch (error) {
      console.error('Playback failed:', error);
      this.updatePlaybackState({ 
        isPlaying: false, 
        isPaused: false, 
        isLoading: false 
      });
      throw error;
    }
  }

  private async playWebAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new window.Audio(audioUrl);
      
      audio.volume = this.playbackState.volume;
      audio.playbackRate = this.playbackState.playbackRate;

      audio.onloadedmetadata = () => {
        this.updatePlaybackState({ duration: audio.duration });
      };

      audio.ontimeupdate = () => {
        this.updatePlaybackState({ currentTime: audio.currentTime });
      };

      audio.onended = () => {
        this.handlePlaybackEnd();
      };

      audio.onerror = (error) => {
        console.error('Web audio error:', error);
        reject(new Error('Web audio playback failed'));
      };

      audio.oncanplaythrough = () => {
        audio.play()
          .then(() => resolve())
          .catch(reject);
      };

      audio.load();
    });
  }

  private async playNativeAudio(audioUrl: string): Promise<void> {
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      {
        shouldPlay: true,
        volume: this.playbackState.volume,
        rate: this.playbackState.playbackRate,
        shouldCorrectPitch: true,
        isLooping: false
      },
      this.onPlaybackStatusUpdate.bind(this)
    );

    this.sound = sound;
  }

  private onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      this.updatePlaybackState({
        isPlaying: status.isPlaying,
        currentTime: status.positionMillis / 1000,
        duration: status.durationMillis / 1000,
      });

      if (status.didJustFinish) {
        this.handlePlaybackEnd();
      }
    }
  }

  private async handlePlaybackEnd() {
    if (this.isRepeatEnabled) {
      // Repeat current track
      await this.seek(0);
      await this.play();
    } else if (this.currentIndex < this.audioQueue.length - 1) {
      // Play next track
      await this.skipToNext();
    } else {
      // End of queue
      this.updatePlaybackState({ 
        isPlaying: false, 
        isPaused: false,
        currentTime: 0
      });
    }
  }

  async pause(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web audio pause logic would go here
        // For now, we'll use the native implementation
      } else if (this.sound) {
        await this.sound.pauseAsync();
      }

      this.updatePlaybackState({ 
        isPlaying: false, 
        isPaused: true 
      });
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.updatePlaybackState({ 
        isPlaying: false, 
        isPaused: false,
        currentTime: 0
      });
    } catch (error) {
      console.error('Stop failed:', error);
    }
  }

  async seek(position: number): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web audio seek logic would go here
      } else if (this.sound) {
        await this.sound.setPositionAsync(position * 1000);
      }

      this.updatePlaybackState({ currentTime: position });
    } catch (error) {
      console.error('Seek failed:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      
      if (Platform.OS === 'web') {
        // Web audio volume logic would go here
      } else if (this.sound) {
        await this.sound.setVolumeAsync(clampedVolume);
      }

      this.updatePlaybackState({ volume: clampedVolume });
      await this.savePlaybackSettings();
    } catch (error) {
      console.error('Set volume failed:', error);
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      const clampedRate = Math.max(0.5, Math.min(2.0, rate));
      
      if (Platform.OS === 'web') {
        // Web audio playback rate logic would go here
      } else if (this.sound) {
        await this.sound.setRateAsync(clampedRate, true);
      }

      this.updatePlaybackState({ playbackRate: clampedRate });
      await this.savePlaybackSettings();
    } catch (error) {
      console.error('Set playback rate failed:', error);
    }
  }

  async skipToNext(): Promise<void> {
    if (this.currentIndex < this.audioQueue.length - 1) {
      this.currentIndex++;
      await this.stop();
      await this.play();
      this.notifyQueueUpdate();
    }
  }

  async skipToPrevious(): Promise<void> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.stop();
      await this.play();
      this.notifyQueueUpdate();
    }
  }

  toggleRepeat(): void {
    this.isRepeatEnabled = !this.isRepeatEnabled;
  }

  // Queue management
  removeFromQueue(itemId: string): void {
    const index = this.audioQueue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.audioQueue.splice(index, 1);
      
      // Adjust current index if necessary
      if (index < this.currentIndex) {
        this.currentIndex--;
      } else if (index === this.currentIndex && this.currentIndex >= this.audioQueue.length) {
        this.currentIndex = Math.max(0, this.audioQueue.length - 1);
      }
      
      this.saveQueueToStorage();
      this.notifyQueueUpdate();
    }
  }

  clearQueue(): void {
    this.stop();
    this.audioQueue = [];
    this.currentIndex = 0;
    this.saveQueueToStorage();
    this.notifyQueueUpdate();
  }

  reorderQueue(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.audioQueue.length || 
        toIndex < 0 || toIndex >= this.audioQueue.length) {
      return;
    }

    const item = this.audioQueue.splice(fromIndex, 1)[0];
    this.audioQueue.splice(toIndex, 0, item);

    // Adjust current index
    if (fromIndex === this.currentIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    this.saveQueueToStorage();
    this.notifyQueueUpdate();
  }

  // Storage
  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem('audio_player_queue', JSON.stringify({
        queue: this.audioQueue,
        currentIndex: this.currentIndex,
        isRepeatEnabled: this.isRepeatEnabled
      }));
    } catch (error) {
      console.warn('Failed to save audio queue:', error);
    }
  }

  private async loadQueueFromStorage() {
    try {
      const data = await AsyncStorage.getItem('audio_player_queue');
      if (data) {
        const parsed = JSON.parse(data);
        this.audioQueue = parsed.queue || [];
        this.currentIndex = parsed.currentIndex || 0;
        this.isRepeatEnabled = parsed.isRepeatEnabled || false;
      }
    } catch (error) {
      console.warn('Failed to load audio queue:', error);
    }
  }

  private async savePlaybackSettings() {
    try {
      await AsyncStorage.setItem('audio_player_settings', JSON.stringify({
        volume: this.playbackState.volume,
        playbackRate: this.playbackState.playbackRate
      }));
    } catch (error) {
      console.warn('Failed to save playback settings:', error);
    }
  }

  // State management
  private updatePlaybackState(updates: Partial<PlaybackState>) {
    this.playbackState = { ...this.playbackState, ...updates };
    if (this.statusUpdateCallback) {
      this.statusUpdateCallback(this.playbackState);
    }
  }

  private notifyQueueUpdate() {
    if (this.queueUpdateCallback) {
      this.queueUpdateCallback(this.audioQueue, this.currentIndex);
    }
  }

  // Event listeners
  setStatusUpdateCallback(callback: (state: PlaybackState) => void) {
    this.statusUpdateCallback = callback;
  }

  setQueueUpdateCallback(callback: (queue: AudioQueueItem[], currentIndex: number) => void) {
    this.queueUpdateCallback = callback;
  }

  // Getters
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  getQueue(): AudioQueueItem[] {
    return [...this.audioQueue];
  }

  getCurrentItem(): AudioQueueItem | null {
    return this.audioQueue[this.currentIndex] || null;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  isRepeatMode(): boolean {
    return this.isRepeatEnabled;
  }

  // Cleanup
  async cleanup() {
    await this.stop();
    this.audioQueue = [];
    this.currentIndex = 0;
    this.statusUpdateCallback = null;
    this.queueUpdateCallback = null;
  }
}

export const audioPlayerService = new AudioPlayerService();