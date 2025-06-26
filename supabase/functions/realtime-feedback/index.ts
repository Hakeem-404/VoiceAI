import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FeedbackRequest {
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  conversationMode: string;
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

    // Parse request body
    let requestBody: FeedbackRequest
    try {
      requestBody = await req.json()
      console.log('Request body parsed:', {
        messages_count: requestBody.messages?.length,
        mode: requestBody.conversationMode
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
    if (!requestBody.messages || !requestBody.conversationMode) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messages, conversationMode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Only get the last few messages for real-time feedback
    const recentMessages = requestBody.messages.slice(-3)
    
    // Format messages for Claude
    const formattedMessages = recentMessages.map(msg => {
      return `${msg.role.toUpperCase()}: ${msg.content}`
    }).join('\n\n')

    // Create prompt for real-time feedback
    const prompt = `
You are an expert communication coach providing real-time feedback during a ${requestBody.conversationMode} conversation.
Analyze these recent messages and provide ONE specific, actionable piece of feedback if needed.

RECENT MESSAGES:
${formattedMessages}

If you notice an issue that needs improvement, respond in this JSON format:
{
  "type": "pace"|"volume"|"filler"|"engagement"|"question"|"clarity",
  "message": "Brief, specific feedback",
  "severity": "info"|"suggestion"|"warning"
}

If no feedback is needed right now, respond with: {"none": true}

Focus on ONE specific aspect that would most help improve the conversation right now.
`

    // Prepare Claude API request
    const claudeRequest = {
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    }

    console.log('Sending request to Claude API for real-time feedback')

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

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      
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

    const responseData = await claudeResponse.json()
    console.log('Claude API real-time feedback received successfully')

    // Extract the feedback JSON from Claude's response
    let feedbackData
    try {
      const content = responseData.content[0].text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in Claude response')
      }
    } catch (error) {
      console.error('Failed to parse feedback JSON:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse feedback data',
          rawResponse: responseData.content[0].text
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Add timestamp to feedback
    if (!feedbackData.none) {
      feedbackData.timestamp = new Date().toISOString()
    }

    return new Response(
      JSON.stringify(feedbackData),
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