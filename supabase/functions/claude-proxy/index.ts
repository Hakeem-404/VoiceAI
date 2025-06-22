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
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: ClaudeRequest = await req.json()

    // Validate required fields
    if (!requestBody.model || !requestBody.messages || !requestBody.max_tokens) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, messages, max_tokens' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare Claude API request
    const claudeRequest = {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      messages: requestBody.messages,
      temperature: requestBody.temperature || 0.7,
      stream: requestBody.stream || false
    }

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
      console.error('Claude API error:', claudeResponse.status, errorData)
      
      return new Response(
        JSON.stringify({ 
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorData
        }),
        { 
          status: claudeResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseData = await claudeResponse.json()

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