import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url?: string;
  labels: Record<string, string>;
  settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export interface VoicePersonality {
  id: string;
  name: string;
  voiceId: string;
  description: string;
  conversationModes: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  audioSettings: {
    speed: number;
    pitch: number;
    volume: number;
  };
}

export interface AudioGenerationOptions {
  voice_id: string;
  text: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  output_format?: 'mp3_22050_32' | 'mp3_44100_32' | 'mp3_44100_64' | 'mp3_44100_96' | 'mp3_44100_128' | 'mp3_44100_192';
  optimize_streaming_latency?: number;
  pronunciation_dictionary_locators?: any[];
}

export interface AudioQueueItem {
  id: string;
  text: string;
  voiceId: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  retryCount: number;
  conversationMode: string;
}

export interface AudioCacheEntry {
  audioUrl: string;
  timestamp: number;
  expiresAt: number;
  size: number;
  voiceId: string;
  textHash: string;
}

class ElevenLabsService {
  private apiKey: string = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private audioQueue: AudioQueueItem[] = [];
  private audioCache = new Map<string, AudioCacheEntry>();
  private isProcessingQueue = false;
  private isOnline = true;
  private usageTracking = {
    charactersUsed: 0,
    monthlyLimit: 20000, // Creator tier default
    lastReset: new Date()
  };

  // Voice personalities for each conversation mode
  private voicePersonalities: VoicePersonality[] = [
    {
      id: 'general-chat',
      name: 'Friendly Companion',
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, friendly
      description: 'Warm, friendly tone with natural inflection',
      conversationModes: ['general-chat'],
      settings: {
        stability: 0.75,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true
      },
      audioSettings: {
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8
      }
    },
    {
      id: 'debate-voice',
      name: 'Confident Debater',
      voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - confident, articulate
      description: 'Confident, articulate tone with authority',
      conversationModes: ['debate-challenge'],
      settings: {
        stability: 0.8,
        similarity_boost: 0.85,
        style: 0.4,
        use_speaker_boost: true
      },
      audioSettings: {
        speed: 1.1,
        pitch: 1.0,
        volume: 0.85
      }
    },
    {
      id: 'interview-voice',
      name: 'Professional Interviewer',
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - professional, clear
      description: 'Professional, clear tone with appropriate formality',
      conversationModes: ['interview-practice'],
      settings: {
        stability: 0.85,
        similarity_boost: 0.75,
        style: 0.1,
        use_speaker_boost: false
      },
      audioSettings: {
        speed: 0.95,
        pitch: 1.0,
        volume: 0.8
      }
    },
    {
      id: 'language-voice',
      name: 'Patient Teacher',
      voiceId: 'ErXwobaYiN019PkySvjV', // Antoni - patient, clear
      description: 'Patient, encouraging tone with clear pronunciation',
      conversationModes: ['language-learning'],
      settings: {
        stability: 0.9,
        similarity_boost: 0.7,
        style: 0.0,
        use_speaker_boost: false
      },
      audioSettings: {
        speed: 0.85,
        pitch: 1.0,
        volume: 0.8
      }
    },
    {
      id: 'presentation-voice',
      name: 'Supportive Audience',
      voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - engaging, supportive
      description: 'Enthusiastic, supportive tone as audience member',
      conversationModes: ['presentation-prep'],
      settings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true
      },
      audioSettings: {
        speed: 1.0,
        pitch: 1.05,
        volume: 0.85
      }
    },
    {
      id: 'brainstorm-voice',
      name: 'Creative Catalyst',
      voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic, creative
      description: 'Energetic, creative tone with excitement',
      conversationModes: ['idea-brainstorm'],
      settings: {
        stability: 0.6,
        similarity_boost: 0.85,
        style: 0.5,
        use_speaker_boost: true
      },
      audioSettings: {
        speed: 1.15,
        pitch: 1.1,
        volume: 0.9
      }
    }
  ];

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadCacheFromStorage();
    this.loadUsageTracking();
    this.processQueuePeriodically();
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Please set EXPO_PUBLIC_ELEVENLABS_API_KEY');
    }
  }

  // Network monitoring for mobile optimization
  private async initializeNetworkMonitoring() {
    if (Platform.OS === 'web') return;

    const unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.processAudioQueue();
      }
    });

    return unsubscribe;
  }

  // Cache management
  private async loadCacheFromStorage() {
    try {
      const cacheData = await AsyncStorage.getItem('elevenlabs_audio_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.audioCache = new Map(parsed);
        
        // Clean expired entries
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.warn('Failed to load audio cache:', error);
    }
  }

  private async saveCacheToStorage() {
    try {
      const cacheArray = Array.from(this.audioCache.entries());
      await AsyncStorage.setItem('elevenlabs_audio_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save audio cache:', error);
    }
  }

  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.audioCache.entries()) {
      if (now > entry.expiresAt) {
        this.audioCache.delete(key);
      }
    }
    this.saveCacheToStorage();
  }

  // Usage tracking
  private async loadUsageTracking() {
    try {
      const usageData = await AsyncStorage.getItem('elevenlabs_usage');
      if (usageData) {
        this.usageTracking = JSON.parse(usageData);
        
        // Reset monthly usage if needed
        const now = new Date();
        const lastReset = new Date(this.usageTracking.lastReset);
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          this.usageTracking.charactersUsed = 0;
          this.usageTracking.lastReset = now;
          this.saveUsageTracking();
        }
      }
    } catch (error) {
      console.warn('Failed to load usage tracking:', error);
    }
  }

  private async saveUsageTracking() {
    try {
      await AsyncStorage.setItem('elevenlabs_usage', JSON.stringify(this.usageTracking));
    } catch (error) {
      console.warn('Failed to save usage tracking:', error);
    }
  }

  private updateUsage(characters: number) {
    this.usageTracking.charactersUsed += characters;
    this.saveUsageTracking();
  }

  // Voice personality management
  getVoicePersonalityForMode(conversationMode: string): VoicePersonality | null {
    return this.voicePersonalities.find(p => 
      p.conversationModes.includes(conversationMode)
    ) || this.voicePersonalities[0]; // Fallback to general chat
  }

  getAllVoicePersonalities(): VoicePersonality[] {
    return this.voicePersonalities;
  }

  updateVoicePersonality(personalityId: string, updates: Partial<VoicePersonality>) {
    const index = this.voicePersonalities.findIndex(p => p.id === personalityId);
    if (index !== -1) {
      this.voicePersonalities[index] = { ...this.voicePersonalities[index], ...updates };
    }
  }

  // Audio generation with mobile optimization
  async generateSpeech(
    text: string,
    conversationMode: string,
    options: Partial<AudioGenerationOptions> = {}
  ): Promise<{ audioUrl: string; cached: boolean }> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Check usage limits
    if (this.usageTracking.charactersUsed + text.length > this.usageTracking.monthlyLimit) {
      throw new Error('Monthly character limit exceeded');
    }

    // Get voice personality for mode
    const personality = this.getVoicePersonalityForMode(conversationMode);
    if (!personality) {
      throw new Error(`No voice personality found for mode: ${conversationMode}`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, personality.voiceId);
    const cached = this.audioCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return { audioUrl: cached.audioUrl, cached: true };
    }

    // If offline, add to queue
    if (!this.isOnline) {
      await this.addToQueue(text, personality.voiceId, conversationMode, 'normal');
      throw new Error('Audio generation queued for when connection is restored');
    }

    try {
      const audioUrl = await this.generateAudioFromAPI(text, personality, options);
      
      // Cache the result
      const cacheEntry: AudioCacheEntry = {
        audioUrl,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        size: text.length,
        voiceId: personality.voiceId,
        textHash: this.hashText(text)
      };
      
      this.audioCache.set(cacheKey, cacheEntry);
      this.saveCacheToStorage();
      
      // Update usage tracking
      this.updateUsage(text.length);
      
      return { audioUrl, cached: false };
    } catch (error) {
      console.error('Audio generation failed:', error);
      throw error;
    }
  }

  private async generateAudioFromAPI(
    text: string,
    personality: VoicePersonality,
    options: Partial<AudioGenerationOptions>
  ): Promise<string> {
    const requestOptions: AudioGenerationOptions = {
      voice_id: personality.voiceId,
      text: this.preprocessText(text),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        ...personality.settings,
        ...options.voice_settings
      },
      output_format: 'mp3_22050_32', // Mobile-optimized format
      optimize_streaming_latency: 2,
      ...options
    };

    console.log('Generating audio with ElevenLabs:', {
      voice_id: requestOptions.voice_id,
      text_length: text.length,
      model: requestOptions.model_id,
      format: requestOptions.output_format
    });

    const response = await fetch(`${this.baseUrl}/text-to-speech/${requestOptions.voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text: requestOptions.text,
        model_id: requestOptions.model_id,
        voice_settings: requestOptions.voice_settings,
        output_format: requestOptions.output_format,
        optimize_streaming_latency: requestOptions.optimize_streaming_latency
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid ElevenLabs API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Audio generation failed: ${response.status}`);
    }

    // Convert response to blob URL for mobile compatibility
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    console.log('Audio generated successfully, size:', audioBlob.size);
    return audioUrl;
  }

  // Text preprocessing for better speech
  private preprocessText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n+/g, '. ') // Replace newlines with pauses
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing
      .trim();
  }

  // Queue management for offline support
  private async addToQueue(
    text: string,
    voiceId: string,
    conversationMode: string,
    priority: 'high' | 'normal' | 'low'
  ) {
    const queueItem: AudioQueueItem = {
      id: Date.now().toString(),
      text,
      voiceId,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      conversationMode
    };

    this.audioQueue.push(queueItem);
    this.audioQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    await this.saveQueueToStorage();
  }

  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem('elevenlabs_audio_queue', JSON.stringify(this.audioQueue));
    } catch (error) {
      console.warn('Failed to save audio queue:', error);
    }
  }

  private async processAudioQueue() {
    if (this.isProcessingQueue || !this.isOnline || this.audioQueue.length === 0) return;

    this.isProcessingQueue = true;
    const queue = [...this.audioQueue];
    this.audioQueue = [];

    for (const item of queue) {
      try {
        const personality = this.voicePersonalities.find(p => p.voiceId === item.voiceId);
        if (personality) {
          await this.generateAudioFromAPI(item.text, personality, {});
        }
      } catch (error) {
        if (item.retryCount < 3) {
          item.retryCount++;
          this.audioQueue.push(item);
        }
      }
    }

    await this.saveQueueToStorage();
    this.isProcessingQueue = false;
  }

  private processQueuePeriodically() {
    setInterval(() => {
      if (this.isOnline) {
        this.processAudioQueue();
      }
    }, 30000);
  }

  // Utility methods
  private getCacheKey(text: string, voiceId: string): string {
    return `${voiceId}_${this.hashText(text)}`;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Voice library management
  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch available voices:', error);
      throw error;
    }
  }

  // Voice cloning (Creator tier feature)
  async cloneVoice(
    name: string,
    description: string,
    audioFiles: File[]
  ): Promise<{ voice_id: string }> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    audioFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Voice cloning failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Voice cloning failed:', error);
      throw error;
    }
  }

  // Usage and analytics
  getUsageStats() {
    const remainingCharacters = this.usageTracking.monthlyLimit - this.usageTracking.charactersUsed;
    const usagePercentage = (this.usageTracking.charactersUsed / this.usageTracking.monthlyLimit) * 100;

    return {
      charactersUsed: this.usageTracking.charactersUsed,
      monthlyLimit: this.usageTracking.monthlyLimit,
      remainingCharacters,
      usagePercentage,
      lastReset: this.usageTracking.lastReset,
      cacheSize: this.audioCache.size,
      queueSize: this.audioQueue.length
    };
  }

  // Configuration and status
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured(),
      isOnline: this.isOnline,
      isProcessingQueue: this.isProcessingQueue,
      usage: this.getUsageStats(),
      voicePersonalities: this.voicePersonalities.length,
      cacheEntries: this.audioCache.size,
      queuedItems: this.audioQueue.length
    };
  }

  // Cleanup
  cleanup() {
    this.audioCache.clear();
    this.audioQueue = [];
    this.isProcessingQueue = false;
  }
}

export const elevenLabsService = new ElevenLabsService();