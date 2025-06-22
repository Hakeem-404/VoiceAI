# VoiceAI Conversation Companion

A React Native app built with Expo that provides AI-powered conversation practice using Claude API through Supabase Edge Functions.

## Features

- 6 distinct conversation modes (General Chat, Debate, Brainstorming, Interview Practice, Presentation Prep, Language Learning)
- Real-time streaming responses
- Offline queue support
- Mobile-optimized UI with beautiful gradients
- Network status monitoring
- Quick reply suggestions
- Message caching and retry logic

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Deploy the Claude proxy Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the Edge Function
supabase functions deploy claude-proxy
```

### 2. Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Claude API Key

Set your Claude API key in the Supabase dashboard:

1. Go to Settings > Edge Functions
2. Add environment variable: `CLAUDE_API_KEY=sk-ant-api03-...`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
npm run dev
```

## Architecture

### Supabase Edge Function Proxy

The app uses a Supabase Edge Function (`supabase/functions/claude-proxy/index.ts`) to:
- Securely store the Claude API key server-side
- Handle CORS properly
- Proxy requests to Claude API
- Support both streaming and non-streaming responses

### Mobile Optimizations

- **Network Quality Detection**: Adapts timeouts based on connection speed
- **Offline Queue**: Queues requests when offline, processes when reconnected
- **Intelligent Caching**: Caches responses for 5 minutes to reduce API calls
- **Context Management**: Truncates conversation history for memory efficiency
- **Retry Logic**: Exponential backoff for failed requests

### Conversation Modes

Each mode has specific:
- System prompts optimized for the conversation type
- Token limits appropriate for mobile usage
- Temperature settings for response creativity
- Quick reply suggestions

## File Structure

```
├── supabase/
│   └── functions/
│       └── claude-proxy/
│           └── index.ts          # Edge Function for Claude API proxy
├── services/
│   └── supabaseClaudeAPI.ts      # API service using Supabase
├── hooks/
│   └── useSupabaseConversation.ts # Conversation management hook
├── components/
│   └── SupabaseConversationView.tsx # Main conversation UI
├── app/(tabs)/
│   └── chat.tsx                  # Chat screen with mode selection
└── types/
    ├── api.ts                    # API type definitions
    └── env.d.ts                  # Environment variable types
```

## Security

- Claude API key is stored securely in Supabase Edge Functions
- No API keys exposed in client-side code
- Proper CORS handling for web compatibility
- Request validation and sanitization

## Platform Support

- **iOS**: Full native support with haptic feedback
- **Android**: Full native support with haptic feedback  
- **Web**: Full support with web-compatible alternatives

## Troubleshooting

### Configuration Issues

If you see "Configuration Required" errors:

1. Verify your `.env` file has the correct Supabase URL and anon key
2. Ensure the Edge Function is deployed: `supabase functions list`
3. Check that `CLAUDE_API_KEY` is set in Supabase dashboard
4. Restart the development server after changing environment variables

### Network Issues

The app includes comprehensive error handling for:
- Network connectivity loss
- API rate limits
- Server errors
- Timeout issues

All requests are automatically retried with exponential backoff, and failed requests are queued for retry when connectivity is restored.