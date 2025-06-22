import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  stream?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
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
      console.error('CLAUDE_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    let requestBody: ClaudeRequest
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
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
        hasModel: !!requestBody.model, 
        hasMessages: !!requestBody.messages, 
        hasMaxTokens: !!requestBody.max_tokens 
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, messages, max_tokens' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate messages array
    if (!Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      console.error('Invalid messages array:', requestBody.messages)
      return new Response(
        JSON.stringify({ error: 'Messages must be a non-empty array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate each message
    for (const message of requestBody.messages) {
      if (!message.role || !message.content) {
        console.error('Invalid message format:', message)
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // Validate role
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        console.error('Invalid message role:', message.role)
        return new Response(
          JSON.stringify({ error: 'Message role must be user, assistant, or system' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Validate model name
    const validModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022', 
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
    
    if (!validModels.includes(requestBody.model)) {
      console.error('Invalid model:', requestBody.model)
      return new Response(
        JSON.stringify({ 
          error: `Invalid model. Supported models: ${validModels.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate max_tokens
    if (typeof requestBody.max_tokens !== 'number' || requestBody.max_tokens < 1 || requestBody.max_tokens > 4096) {
      console.error('Invalid max_tokens:', requestBody.max_tokens)
      return new Response(
        JSON.stringify({ error: 'max_tokens must be a number between 1 and 4096' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare Claude API request with proper formatting
    const claudeRequest = {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      messages: requestBody.messages.map(msg => ({
        role: msg.role,
        content: msg.content.trim() // Ensure content is trimmed
      })),
      temperature: Math.max(0, Math.min(1, requestBody.temperature || 0.7)), // Clamp between 0-1
      stream: requestBody.stream || false
    }

    console.log('Making request to Claude API:', {
      model: claudeRequest.model,
      messageCount: claudeRequest.messages.length,
      maxTokens: claudeRequest.max_tokens,
      temperature: claudeRequest.temperature,
      stream: claudeRequest.stream
    })

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    })

    // Handle streaming responses
    if (requestBody.stream) {
      // For streaming, we need to proxy the stream
      const reader = claudeResponse.body?.getReader()
      if (!reader) {
        throw new Error('No response body for streaming')
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
      const errorData = await claudeResponse.text()
      console.error('Claude API error:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        body: errorData
      })
      
      let errorMessage = `Claude API error: ${claudeResponse.status}`
      
      try {
        const parsedError = JSON.parse(errorData)
        if (parsedError.error?.message) {
          errorMessage = parsedError.error.message
        }
      } catch {
        // Use default error message if parsing fails
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorData,
          status: claudeResponse.status
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
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})