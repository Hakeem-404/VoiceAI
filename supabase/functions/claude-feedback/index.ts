import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FeedbackRequest {
  conversation: {
    mode: {
      id: string;
      name: string;
      description: string;
    };
    messages: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
    duration: number;
  };
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
        mode: requestBody.conversation.mode.id,
        messages_count: requestBody.conversation.messages?.length,
        duration: requestBody.conversation.duration
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
    if (!requestBody.conversation || !requestBody.conversation.messages || !requestBody.conversation.mode) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversation, messages, mode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { conversation } = requestBody
    
    // Format messages for Claude
    const formattedMessages = conversation.messages.map(msg => {
      return `${msg.role === 'user' ? 'USER' : 'AI'}: ${msg.content}`
    }).join('\n\n')

    // Create a base prompt with conversation details
    let prompt = `
You are an expert communication coach specializing in ${conversation.mode.name} conversations. 
Please analyze the following conversation that lasted ${Math.floor(conversation.duration / 60)} minutes and ${conversation.duration % 60} seconds.

CRITICAL INSTRUCTION: Analyze only the USER's performance and communication skills. Do NOT analyze the AI assistant's responses.

CONVERSATION MODE: ${conversation.mode.name}
MODE DESCRIPTION: ${conversation.mode.description}

CONVERSATION TRANSCRIPT:
${formattedMessages}

Based on this conversation, provide a comprehensive feedback analysis of the USER's communication skills in the following JSON format:

{
  "scores": {
    "fluency": 85,
    "clarity": 80,
    "confidence": 75,
    "pace": 90,
    "overall": 82,
    "engagement": 88
  },
  "strengths": [
    "Clear articulation of ideas",
    "Effective use of examples",
    "Good engagement with questions"
  ],
  "improvements": [
    "Could use more varied vocabulary",
    "Some responses could be more concise",
    "Occasionally interrupted the other speaker"
  ],
  "analytics": {
    "wordsPerMinute": 150,
    "pauseCount": 12,
    "fillerWords": 8,
    "questionCount": 5,
    "responseTime": 2.3,
    "speakingTime": 4,
    "listeningTime": 3
  },
  "tips": [
    "Practice using more varied transitional phrases",
    "Try to eliminate filler words like 'um' and 'uh'",
    "Allow brief pauses for emphasis on key points"
  ],
  "nextSteps": [
    "Focus on developing more concise responses",
    "Practice active listening techniques",
    "Work on incorporating more evidence in arguments"
  ]
}

IMPORTANT: 
1. All scores should be integers between 0-100
2. Provide 3-5 specific strengths based on actual examples from the USER's messages
3. Provide 3-5 specific improvements with actionable suggestions for the USER
4. Make analytics as accurate as possible based on the USER's communication patterns
5. Provide 3-5 practical tips that are specific to the USER's communication
6. Suggest 2-3 concrete next steps for the USER to improve
7. Remember: You are coaching the USER, not evaluating the AI assistant.
`

    // Add mode-specific analysis instructions
    switch (conversation.mode.id) {
      case 'general-chat':
        prompt += `\n\nFor general chat analysis, also include:
{
  "modeSpecific": {
    "generalChat": {
      "conversationFlow": 85,
      "topicExploration": 78,
      "empathyScore": 90,
      "curiosityLevel": 82
    }
  }
}

Focus on the USER's social skills, active listening, empathy, and natural conversation flow.`
        break
        
      case 'debate-challenge':
        prompt += `\n\nFor debate analysis, also include:
{
  "modeSpecific": {
    "debate": {
      "argumentStrength": 85,
      "evidenceUsage": 78,
      "counterArgumentHandling": 90,
      "logicalConsistency": 82
    }
  },
  "scores": {
    "criticalThinking": 88,
    "persuasiveness": 85
  }
}

Focus on the USER's argument quality, evidence usage, logical consistency, and respectful disagreement.`
        break
        
      case 'idea-brainstorm':
        prompt += `\n\nFor brainstorming analysis, also include:
{
  "modeSpecific": {
    "brainstorm": {
      "ideaCount": 12,
      "uniqueIdeas": 8,
      "ideaQuality": 85,
      "buildingOnIdeas": 78
    }
  },
  "scores": {
    "creativity": 90
  }
}

Focus on the USER's idea generation, creativity, concept development, and collaborative thinking.`
        break
        
      case 'interview-practice':
        prompt += `\n\nFor interview practice analysis, also include:
{
  "modeSpecific": {
    "interview": {
      "questionRelevance": 85,
      "answerCompleteness": 78,
      "professionalDemeanor": 90,
      "technicalAccuracy": 82
    }
  },
  "scores": {
    "professionalCommunication": 88
  }
}

Focus on the USER's STAR method usage, professional communication, question handling, and confidence.`
        break
        
      case 'presentation-prep':
        prompt += `\n\nFor presentation analysis, also include:
{
  "modeSpecific": {
    "presentation": {
      "structureQuality": 85,
      "audienceEngagement": 78,
      "messageClarity": 90,
      "deliveryStyle": 82
    }
  },
  "scores": {
    "structure": 88
  }
}

Focus on the USER's structure, clarity, audience engagement, and delivery style.`
        break
        
      case 'language-learning':
        prompt += `\n\nFor language learning analysis, also include:
{
  "modeSpecific": {
    "languageLearning": {
      "grammarAccuracy": 85,
      "vocabularyRange": 78,
      "pronunciationScore": 90,
      "fluencyProgress": 82
    }
  },
  "scores": {
    "grammarAccuracy": 85,
    "vocabularyUsage": 78
  }
}

Focus on the USER's grammar, vocabulary, pronunciation, and overall fluency.`
        break
    }
    
    prompt += `\n\nEnsure your feedback is specific to the USER's communication in this conversation, mentioning actual examples from the USER's messages. Provide actionable advice that will help the USER improve their ${conversation.mode.name} skills.`

    // Prepare Claude API request
    const claudeRequest = {
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5
    }

    console.log('Sending request to Claude API for feedback analysis')

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
    console.log('Claude API feedback analysis received successfully')

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