// Audio generation with mobile optimization
   async generateSpeech(
     text: string,
     conversationMode: string, 
     options: Partial<AudioGenerationOptions> = {}
   ): Promise<{ audioUrl: string; cached: boolean }> {
     if (!this.apiKey) {
       throw new Error('API key not set');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, personality.voiceId);
    const cached = this.audioCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) { 
      return { audioUrl: cached.audioUrl, cached: true };
    }

    // Get voice personality based on conversation mode
    const personality = this.getVoicePersonality(conversationMode);
    if (!personality) {
      throw new Error(`Invalid conversation mode: ${conversationMode}`);
    }

    try {
      // Real API call to ElevenLabs
      const audioUrl = await this.generateAudioFromAPI(text, personality, options); 
      
      // Cache the result
      const cacheEntry: AudioCacheEntry = {
        audioUrl,
        expiresAt: Date.now() + CACHE_TTL
      };
      this.audioCache.set(cacheKey, cacheEntry);
      
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
      model_id: 'eleven_monolingual_v1',
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      output_format: 'mp3_22050_32', // Mobile-optimized format
      optimize_streaming_latency: 2,
      ...options
    }; 

    console.log('Generating audio with ElevenLabs:', {
      voice_id: requestOptions.voice_id,
      text_length: requestOptions.text.length,
      stability: requestOptions.stability,
      format: requestOptions.output_format
    });

    const response = await fetch(`${this.baseUrl}/text-to-speech/${requestOptions.voice_id}`, { 
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: requestOptions.text,
        model_id: requestOptions.model_id,
        voice_settings: requestOptions.voice_settings,
        optimize_streaming_latency: requestOptions.optimize_streaming_latency
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      
      throw new Error(`Audio generation failed: ${response.status}`);
    }

    // Convert response to blob URL for mobile compatibility 
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return audioUrl;
  }


  // Text preprocessing for better speech
  private preprocessText(text: string): string {
    return text 
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/[^\S\r\n]+/g, ' ') // Normalize spaces
      .trim();
  }

  // Queue management for offline support
  private async addToQueue( 
    text: string,
    voiceId: string,
    conversationMode: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    this.audioQueue.push({
      text,
      voiceId,
      conversationMode,
      priority,
      timestamp: Date.now()
    });

    this.audioQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }); 

    await this.saveQueueToStorage();
  }

  // Voice cloning (Creator tier feature)
  async cloneVoice(
    name: string,
    description: string, 
    audioFiles: File[]
  ): Promise<{ voice_id: string }> {
    if (!this.apiKey) {
      throw new Error('API key not set');
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
        console.error('Voice cloning failed:', response.status);
        throw new Error(`Voice cloning failed: ${response.status}`);
      }

      return await response.json(); 
    } catch (error) {
      console.error('Voice cloning failed:', error);
      throw error;
    }
  }