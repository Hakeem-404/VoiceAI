@@ .. @@
   // Main conversation method
   async sendMessage(
     message: string,
-    context: ConversationContext,
+    context: ConversationContext, 
     options: APIRequestOptions = {}
   ): Promise<APIResponse<ConversationMessage>> {
-    const systemPrompt = this.getSystemPrompt(context.mode);
+    if (!this.isConfigured()) {
+      return {
+        error: 'Claude API key not configured. Please set your API key.',
+        status: 500,
+        timestamp: Date.now()
+      };
+    }

    const systemPrompt = options.system || this.getSystemPrompt(context.mode);
    
    // Prepare messages with intelligent context management
    const messages = this.prepareMessages(context, systemPrompt);
@@ .. @@
    const requestData = {
      model: 'claude-3-5-sonnet-20240620',
-      max_tokens: this.getMaxTokensForMode(context.mode),
+      max_tokens: options.maxTokens || this.getMaxTokensForMode(context.mode),
      messages,
      temperature: this.getTemperatureForMode(context.mode),
     stream: false // We'll implement streaming separately
    }
@@ .. @@

  // Generate quick reply suggestions
  async generateQuickReplies(
-    context: ConversationContext,
+    context: ConversationContext, 
    count: number = 3
  ): Promise<string[]> {
    const lastMessage = context.messages[context.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return [];

    try {
      // Create a prompt for Claude to generate quick replies
      const prompt = `Based on this conversation in ${context.mode} mode, suggest ${count} brief, natural follow-up messages the user might want to send next. Each reply should be 2-10 words and conversational.

Last assistant message: "${lastMessage.content}"

Provide exactly ${count} short suggestions as a JSON array of strings. ONLY return the JSON array, nothing else.`;

      const response = await this.sendMessage(prompt, {
        ...context,
        messages: context.messages.slice(-3), // Just use the last few messages for context
      }, {
        maxTokens: 150,
        cache: true
      });

      if (response.error || !response.data) {
        // Fall back to predefined suggestions
        const suggestions = this.getQuickReplySuggestions(context.mode, lastMessage.content);
        return suggestions.slice(0, count);
      }

      try {
        // Try to parse JSON array from response
        const content = response.data.content;
        const match = content.match(/\[.*\]/s);
        if (match) {
          const suggestions = JSON.parse(match[0]);
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            return suggestions.slice(0, count);
          }
        }
      } catch (error) {
        console.warn('Failed to parse quick reply suggestions:', error);
      }

      // Fall back to predefined suggestions
      const suggestions = this.getQuickReplySuggestions(context.mode, lastMessage.content);
      return suggestions.slice(0, count);
    } catch (error) {
      console.warn('Failed to generate quick replies:', error);
      // Fall back to predefined suggestions
      const suggestions = this.getQuickReplySuggestions(context.mode, lastMessage.content);
      return suggestions.slice(0, count);
    }
  }
}