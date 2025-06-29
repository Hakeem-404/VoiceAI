@@ .. @@
   // Audio generation with mobile optimization
   async generateSpeech(
     text: string,
-    conversationMode: string,
+    conversationMode: string, 
     options: Partial<AudioGenerationOptions> = {}
   ): Promise<{ audioUrl: string; cached: boolean }> {
     if (!this.apiKey) {
@@ .. @@
     // Check cache first
     const cacheKey = this.getCacheKey(text, personality.voiceId);
     const cached = this.audioCache.get(cacheKey);
-    if (cached && Date.now() < cached.expiresAt) {
+    if (cached && Date.now() < cached.expiresAt) { 
       return { audioUrl: cached.audioUrl, cached: true };
     }
 
@@ .. @@
     }
 
     try {
-      const audioUrl = await this.generateAudioFromAPI(text, personality, options);
+      // Real API call to ElevenLabs
+      const audioUrl = await this.generateAudioFromAPI(text, personality, options); 
       
       // Cache the result
       const cacheEntry: AudioCacheEntry = {
@@ -232,7 +232,7 @@
     text: string,
     personality: VoicePersonality,
     options: Partial<AudioGenerationOptions>
-  ): Promise<string> {
+  ): Promise<string> { 
     const requestOptions: AudioGenerationOptions = {
       voice_id: personality.voiceId,
       text: this.preprocessText(text),
@@ -243,7 +243,7 @@
       output_format: 'mp3_22050_32', // Mobile-optimized format
       optimize_streaming_latency: 2,
       ...options
-    };
+    }; 
 
     console.log('Generating audio with ElevenLabs:', {
       voice_id: requestOptions.voice_id,
@@ -252,7 +252,7 @@
       format: requestOptions.output_format
     });
 
-    const response = await fetch(`${this.baseUrl}/text-to-speech/${requestOptions.voice_id}`, {
+    const response = await fetch(`${this.baseUrl}/text-to-speech/${requestOptions.voice_id}`, { 
       method: 'POST',
       headers: {
         'Accept': 'audio/mpeg',
@@ -266,7 +266,7 @@
         optimize_streaming_latency: requestOptions.optimize_streaming_latency
       })
     });
-
+    
     if (!response.ok) {
       const errorText = await response.text();
       console.error('ElevenLabs API error:', response.status, errorText);
@@ -280,7 +280,7 @@
       throw new Error(`Audio generation failed: ${response.status}`);
     }
 
-    // Convert response to blob URL for mobile compatibility
+    // Convert response to blob URL for mobile compatibility 
     const audioBlob = await response.blob();
     const audioUrl = URL.createObjectURL(audioBlob);
     
@@ -290,7 +290,7 @@
 
   // Text preprocessing for better speech
   private preprocessText(text: string): string {
-    return text
+    return text 
       .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
       .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
       .replace(/`(.*?)`/g, '$1') // Remove code markdown
@@ -300,7 +300,7 @@
   }
 
   // Queue management for offline support
-  private async addToQueue(
+  private async addToQueue( 
     text: string,
     voiceId: string,
     conversationMode: string,
@@ -316,7 +316,7 @@
     this.audioQueue.sort((a, b) => {
       const priorityOrder = { high: 0, normal: 1, low: 2 };
       return priorityOrder[a.priority] - priorityOrder[b.priority];
-    });
+    }); 
 
     await this.saveQueueToStorage();
   }
@@ .. @@
   // Voice cloning (Creator tier feature)
   async cloneVoice(
     name: string,
-    description: string,
+    description: string, 
     audioFiles: File[]
   ): Promise<{ voice_id: string }> {
     if (!this.apiKey) {
@@ -325,7 +325,7 @@
 
     const formData = new FormData();
     formData.append('name', name);
-    formData.append('description', description);
+    formData.append('description', description); 
     
     audioFiles.forEach((file, index) => {
       formData.append(`files`, file);
@@ -333,7 +333,7 @@
 
     try {
       const response = await fetch(`${this.baseUrl}/voices/add`, {
-        method: 'POST',
+        method: 'POST', 
         headers: {
           'xi-api-key': this.apiKey
         },
@@ -345,7 +345,7 @@
         throw new Error(`Voice cloning failed: ${response.status}`);
       }
 
-      return await response.json();
+      return await response.json(); 
     } catch (error) {
       console.error('Voice cloning failed:', error);
       throw error;