import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClaudeMessage {
  role: 'user' | 'assistant'; // Removed 'system' from here
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  stream?: boolean;
  system?: string; // System prompt goes here as a top-level parameter
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('Method not allowed:', req.method)
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Claude API key from environment variables
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      console.error('Claude API key not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Claude API key found, length:', claudeApiKey.length)

    // Parse request body
    let requestBody: ClaudeRequest
    try {
      requestBody = await req.json()
      console.log('Request body parsed:', {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens,
        messages_count: requestBody.messages?.length,
        temperature: requestBody.temperature,
        stream: requestBody.stream,
        has_system: !!requestBody.system
      })
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate required fields
    if (!requestBody.model || !requestBody.messages || !requestBody.max_tokens) {
      console.error('Missing required fields:', {
        model: !!requestBody.model,
        messages: !!requestBody.messages,
        max_tokens: !!requestBody.max_tokens
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, messages, max_tokens' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use a supported Claude model - updated to use Claude 3.5 Sonnet
    const supportedModels = [
      'claude-3-5-sonnet-20240620',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229'
    ]
    
    let modelToUse = requestBody.model
    if (!supportedModels.includes(modelToUse)) {
      console.log('Unsupported model:', modelToUse, 'using claude-3-5-sonnet-20240620')
      modelToUse = 'claude-3-5-sonnet-20240620'
    }

    // CRITICAL FIX: Properly separate system messages from regular messages
    let messages: ClaudeMessage[] = []
    let systemPrompt: string | undefined = requestBody.system

    // Process messages and extract any system messages
    for (const msg of requestBody.messages) {
      if (msg.role === 'system') {
        // Extract system message content and add to system prompt
        if (systemPrompt) {
          systemPrompt += '\n\n' + msg.content
        } else {
          systemPrompt = msg.content
        }
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        // Only include user and assistant messages in the messages array
        messages.push({
          role: msg.role,
          content: msg.content
        })
      }
    }

    // Prepare Claude API request with correct format
    const claudeRequest: any = {
      model: modelToUse,
      max_tokens: Math.min(Math.max(requestBody.max_tokens, 1), 4096), // Ensure valid range
      messages: messages,
      temperature: Math.min(Math.max(requestBody.temperature || 0.7, 0), 1), // Ensure valid range
      stream: requestBody.stream || false
    }

    // Add system prompt as top-level parameter if it exists
    if (systemPrompt) {
      claudeRequest.system = systemPrompt
    }

    console.log('Sending request to Claude API:', {
      model: claudeRequest.model,
      max_tokens: claudeRequest.max_tokens,
      messages_count: claudeRequest.messages.length,
      temperature: claudeRequest.temperature,
      stream: claudeRequest.stream,
      has_system: !!claudeRequest.system,
      system_length: claudeRequest.system?.length || 0
    })

    // Make request to Claude API with correct headers
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    })

    console.log('Claude API response status:', claudeResponse.status)

    // Handle streaming responses
    if (requestBody.stream) {
      console.log('Handling streaming response')
      
      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text()
        console.error('Claude API streaming error:', claudeResponse.status, errorText)
        
        return new Response(
          JSON.stringify({ 
            error: `Claude API error: ${claudeResponse.status}`,
            details: errorText
          }),
          { 
            status: claudeResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // For streaming, we need to proxy the stream
      const reader = claudeResponse.body?.getReader()
      if (!reader) {
        console.error('No response body for streaming')
        return new Response(
          JSON.stringify({ error: 'No response body for streaming' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const stream = new ReadableStream({
        start(controller) {
          function pump(): Promise<void> {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close()
                return
              }
              controller.enqueue(value)
              return pump()
            })
          }
          return pump()
        }
      })

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // Handle non-streaming responses
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
        console.error('Claude API error details:', errorDetails)
      } catch {
        errorDetails = { message: errorText }
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorDetails,
          message: errorDetails.error?.message || errorText
        }),
        { 
          status: claudeResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseData = await claudeResponse.json()
    console.log('Claude API response received successfully')

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})