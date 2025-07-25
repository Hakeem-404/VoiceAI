import { Platform } from 'react-native';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
}

class SpeechRecognitionService {
  private isListening = false;
  private recognition: any = null;
  private currentCallback: ((result: SpeechRecognitionResult) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private finalTranscript = '';
  private interimTranscript = '';

  constructor() {
    this.initializeWebSpeechRecognition();
  }

  private initializeWebSpeechRecognition() {
    if (Platform.OS === 'web') {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupWebSpeechRecognition();
      } else {
        console.warn('Web Speech API not supported in this browser');
      }
    }
  }

  private setupWebSpeechRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
      this.finalTranscript = '';
      this.interimTranscript = '';
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = this.finalTranscript;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.9;

        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('Final speech result:', transcript, 'confidence:', confidence);
        } else {
          interimTranscript += transcript;
          console.log('Interim speech result:', transcript);
        }
      }

      this.finalTranscript = finalTranscript;
      this.interimTranscript = interimTranscript;

      // Send the combined transcript to callback
      const combinedTranscript = (finalTranscript + interimTranscript).trim();
      
      if (this.currentCallback && combinedTranscript) {
        this.currentCallback({
          transcript: combinedTranscript,
          confidence: 0.9, // Average confidence
          isFinal: finalTranscript.length > 0 && interimTranscript.length === 0
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      if (this.errorCallback) {
        let errorMessage = 'Speech recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking more clearly.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was stopped.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        this.errorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Send final result if we have any transcript
      if (this.currentCallback && this.finalTranscript.trim()) {
        this.currentCallback({
          transcript: this.finalTranscript.trim(),
          confidence: 0.9,
          isFinal: true
        });
      }
    };
  }

  async checkPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (Platform.OS === 'web') {
      try {
        // Check if Web Speech API is available
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          return 'denied';
        }

        // Check microphone permissions
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          return result.state === 'granted' ? 'granted' : 
                 result.state === 'denied' ? 'denied' : 'undetermined';
        } catch {
          // Fallback: try to access microphone directly
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return 'granted';
          } catch {
            return 'undetermined';
          }
        }
      } catch (error) {
        return 'undetermined';
      }
    } else {
      // For native platforms, we'll need to implement native speech recognition
      // For now, return granted to allow text fallback
      return 'granted';
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
        return true;
      } catch (error) {
        console.error('Failed to request microphone permission:', error);
        return false;
      }
    } else {
      // For native platforms, we'll implement this when we add native speech recognition
      console.warn('Native speech recognition not implemented yet');
      return false;
    }
  }

  async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<boolean> {
    if (this.isListening) {
      console.warn('Speech recognition is already listening');
      return false;
    }

    this.currentCallback = onResult;
    this.errorCallback = onError;

    const {
      language = 'en-US',
      continuous = true,
      interimResults = true,
      maxAlternatives = 1,
      timeout = 15000
    } = options;

    if (Platform.OS === 'web') {
      return this.startWebSpeechRecognition(language, continuous, interimResults, maxAlternatives, timeout);
    } else {
      // For native platforms, show a helpful error
      onError('Speech recognition is only available on web browsers. Please use text input instead.');
      return false;
    }
  }

  private async startWebSpeechRecognition(
    language: string,
    continuous: boolean,
    interimResults: boolean, 
    maxAlternatives: number,
    timeout: number
  ): Promise<boolean> {
    if (!this.recognition) {
      this.errorCallback?.('Speech recognition not available in this browser');
      return false;
    }

    try {
      // Configure recognition
      this.recognition.lang = language;
      this.recognition.continuous = continuous;
      this.recognition.interimResults = interimResults; 
      this.recognition.maxAlternatives = maxAlternatives;

      // Set timeout
      this.timeoutId = setTimeout(() => {
        if (this.isListening) {
          console.log('Speech recognition timeout');
          this.stopListening();
          this.errorCallback?.('Speech recognition timeout. Please try again.');
        }
      }, timeout);

      console.log('Starting speech recognition with options:', {
        language,
        continuous,
        interimResults,
        maxAlternatives,
        timeout
      });

      this.recognition.start(); 
      return true;
    } catch (error) {
      console.error('Failed to start web speech recognition:', error);
      this.errorCallback?.(`Failed to start speech recognition: ${error}`);
      return false;
    }
  }

  stopListening(): void { 
    if (!this.isListening) return;

    console.log('Stopping speech recognition');

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (Platform.OS === 'web' && this.recognition) { 
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error stopping web speech recognition:', error);
      }
    }

    this.isListening = false;
  }

  // Get the final transcript without stopping
  getFinalTranscript(): string { 
    return this.finalTranscript.trim();
  }

  // Get the current combined transcript
  getCurrentTranscript(): string {
    return (this.finalTranscript + this.interimTranscript).trim();
  }

  // Clear the transcript
  clearTranscript(): void { 
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Utility method to test speech recognition
  async testSpeechRecognition(): Promise<{ success: boolean; error?: string; transcript?: string }> {
    try { 
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Microphone permission denied' };
      }

      return new Promise((resolve) => {
        let finalTranscript = '';
        
        const timeout = setTimeout(() => { 
          this.stopListening();
          if (finalTranscript) {
            resolve({ success: true, transcript: finalTranscript });
          } else {
            resolve({ success: false, error: 'No speech detected during test' });
          }
        }, 5000);

        this.startListening(
          (result) => { 
            if (result.isFinal && result.transcript.trim()) {
              finalTranscript = result.transcript.trim();
              clearTimeout(timeout);
              this.stopListening();
              resolve({ success: true, transcript: finalTranscript });
            }
          },
          (error) => { 
            clearTimeout(timeout);
            resolve({ success: false, error });
          },
          { timeout: 5000, continuous: false }
        );
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get available languages (web only)
  getAvailableLanguages(): string[] { 
    if (Platform.OS === 'web' && this.recognition) {
      // Common languages supported by Web Speech API
      return [
        'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
        'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
        'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN',
        'zh-TW', 'ar-SA', 'hi-IN', 'th-TH', 'vi-VN'
      ];
    }
    return ['en-US']; // Default for native platforms
  }

  // Check if speech recognition is supported
  isSupported(): boolean { 
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      return !!SpeechRecognition;
    }
    return false; // Not implemented for native platforms yet
  }

  // Get current status
  getStatus() { 
    return {
      isListening: this.isListening,
      isSupported: this.isSupported(),
      platform: Platform.OS,
      availableLanguages: this.getAvailableLanguages(),
      hasRecognition: !!this.recognition,
      finalTranscript: this.finalTranscript,
      interimTranscript: this.interimTranscript
    };
  }
}

export const speechRecognitionService = new SpeechRecognitionService();