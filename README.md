# VoiceAI Conversation Companion

A React Native app built with Expo that provides AI-powered conversation practice using Claude API through Supabase Edge Functions, enhanced with ElevenLabs voice synthesis for immersive audio experiences.

## Features

### Core Conversation Features
- 6 distinct conversation modes (General Chat, Debate, Brainstorming, Interview Practice, Presentation Prep, Language Learning)
- Real-time streaming responses from Claude AI
- Offline queue support with automatic retry
- Mobile-optimized UI with beautiful gradients
- Network status monitoring
- Quick reply suggestions
- Message caching and retry logic

### Advanced Voice Features
- **ElevenLabs Integration**: High-quality AI voice synthesis
- **Voice Personalities**: Distinct voices for each conversation mode
- **Mobile Audio Optimization**: Compressed audio for mobile bandwidth
- **Comprehensive Playback Controls**: Play, pause, skip, speed control
- **Audio Queue Management**: Background playback with queue support
- **Bluetooth Integration**: Seamless device switching
- **Voice Customization**: Adjustable speed, pitch, stability settings

### Voice Personalities by Mode

#### General Chat Voice
- **Voice**: Rachel (warm, friendly)
- **Characteristics**: Natural inflection, moderate pace (140-160 WPM)
- **Style**: Conversational with emotional expressiveness

#### Debate Voice
- **Voice**: Domi (confident, articulate)
- **Characteristics**: Authoritative tone, faster pace (160-180 WPM)
- **Style**: Clear enunciation with persuasive inflection

#### Interview Voice
- **Voice**: Bella (professional, clear)
- **Characteristics**: Business-appropriate formality, standard pace (150-170 WPM)
- **Style**: Neutral but engaging delivery

#### Language Learning Voice
- **Voice**: Antoni (patient, clear)
- **Characteristics**: Slower pace (120-140 WPM) for comprehension
- **Style**: Excellent enunciation with teaching inflection

#### Presentation Voice
- **Voice**: Elli (engaging, supportive)
- **Characteristics**: Enthusiastic tone, engaged pace (150-170 WPM)
- **Style**: Encouraging delivery with constructive feedback tone

#### Brainstorm Voice
- **Voice**: Josh (energetic, creative)
- **Characteristics**: Variable pace (140-180 WPM) matching creative energy
- **Style**: Expressive delivery with innovative enthusiasm

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

### 2. ElevenLabs Setup

1. Create an account at [elevenlabs.io](https://elevenlabs.io)
2. Subscribe to Creator tier for advanced features
3. Get your API key from the dashboard
4. Add the API key to your environment variables

### 3. Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

### 4. API Keys Configuration

Set your API keys in the Supabase dashboard:

1. Go to Settings > Edge Functions
2. Add environment variable: `CLAUDE_API_KEY=sk-ant-api03-...`

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the App

```bash
npm run dev
```

## Voice Features

### Audio Optimization
- **Sample Rate**: 22kHz for balance of quality and size
- **Format**: MP3 with mobile-optimized encoding
- **Compression**: Intelligent compression based on network quality
- **Caching**: LRU cache with 24-hour expiration
- **Queue Management**: Priority-based audio generation queue

### Playback Controls
- **Native Media Controls**: iOS Control Center and Android notification controls
- **Playback Speed**: 0.5x to 2x speed adjustment
- **Audio Scrubbing**: Precise timestamp control
- **Volume Control**: With audio ducking support
- **Repeat Mode**: Single track repeat functionality
- **Background Playback**: Continues when app is backgrounded

### Mobile Audio Integration
- **Bluetooth Support**: AirPods, headphones, car systems
- **Device Switching**: Automatic reconnection
- **Audio Session Management**: Proper interruption handling
- **Battery Optimization**: Efficient audio processing
- **Accessibility**: VoiceOver/TalkBack compatibility

### Voice Customization
- **Voice Selection**: Choose from 6 distinct personalities
- **Emotional Tone**: Adjust happiness, seriousness, calm, excitement
- **Speaking Rate**: Fine-tune speed for each mode
- **Stability Control**: Adjust voice consistency
- **Clarity Settings**: Optimize pronunciation and enunciation

## Architecture

### Supabase Edge Function Proxy

The app uses a Supabase Edge Function (`supabase/functions/claude-proxy/index.ts`) to:
- Securely store the Claude API key server-side
- Handle CORS properly
- Proxy requests to Claude API
- Support both streaming and non-streaming responses

### ElevenLabs Integration

The voice system includes:
- **Voice Service**: Manages API calls and audio generation
- **Audio Player Service**: Handles playback, queue, and controls
- **Voice Personality System**: Mode-specific voice configurations
- **Mobile Optimization**: Bandwidth-aware compression and caching

### Mobile Optimizations

- **Network Quality Detection**: Adapts timeouts based on connection speed
- **Offline Queue**: Queues requests when offline, processes when reconnected
- **Intelligent Caching**: Caches responses and audio for optimal performance
- **Context Management**: Truncates conversation history for memory efficiency
- **Retry Logic**: Exponential backoff for failed requests

### Conversation Modes

Each mode has specific:
- System prompts optimized for the conversation type
- Voice personality with unique characteristics
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
│   ├── supabaseClaudeAPI.ts      # API service using Supabase
│   ├── elevenLabsService.ts      # ElevenLabs voice synthesis
│   ├── audioPlayerService.ts     # Audio playback management
│   └── speechRecognitionService.ts # Speech-to-text functionality
├── hooks/
│   ├── useSupabaseConversation.ts # Conversation management hook
│   └── useElevenLabsVoice.ts     # Voice synthesis hook
├── components/
│   ├── SupabaseConversationView.tsx # Main conversation UI
│   ├── VoicePersonalitySelector.tsx # Voice customization
│   ├── AudioPlayerControls.tsx   # Audio playback controls
│   └── VoiceRecordButton.tsx     # Enhanced voice recording
├── app/(tabs)/
│   └── index.tsx                 # Enhanced home screen with voice
└── types/
    ├── api.ts                    # API type definitions
    └── env.d.ts                  # Environment variable types
```

## Security

- Claude API key is stored securely in Supabase Edge Functions
- ElevenLabs API key is stored securely in environment variables
- No API keys exposed in client-side code
- Proper CORS handling for web compatibility
- Request validation and sanitization
- Usage tracking to prevent API limit overages

## Platform Support

- **iOS**: Full native support with haptic feedback and Control Center integration
- **Android**: Full native support with notification controls and Android Auto
- **Web**: Full support with web-compatible audio alternatives

## Usage Limits

### ElevenLabs Creator Tier
- **Monthly Characters**: 10,000 characters
- **Voice Cloning**: Up to 10 custom voices
- **Commercial Usage**: Allowed
- **API Access**: Full API access

The app includes intelligent usage tracking to stay within limits and provides warnings when approaching monthly quotas.

## Troubleshooting

### Configuration Issues

If you see "Configuration Required" errors:

1. Verify your `.env` file has the correct Supabase URL and anon key
2. Ensure the Edge Function is deployed: `supabase functions list`
3. Check that `CLAUDE_API_KEY` is set in Supabase dashboard
4. Verify `EXPO_PUBLIC_ELEVENLABS_API_KEY` is set correctly
5. Restart the development server after changing environment variables

### Voice Issues

If voice synthesis isn't working:

1. Check ElevenLabs API key is valid and has remaining quota
2. Verify network connectivity for audio generation
3. Check browser audio permissions for web platform
4. Ensure device audio output is working properly

### Network Issues

The app includes comprehensive error handling for:
- Network connectivity loss
- API rate limits
- Server errors
- Timeout issues
- Audio generation failures

All requests are automatically retried with exponential backoff, and failed requests are queued for retry when connectivity is restored.

## Performance Features

- **Intelligent Caching**: Common phrases and responses cached locally
- **Audio Preprocessing**: Noise reduction and volume normalization
- **Battery Optimization**: Efficient audio processing with power monitoring
- **Memory Management**: LRU cache with automatic cleanup
- **Network Adaptation**: Quality adjustment based on connection speed

## Accessibility

- **VoiceOver/TalkBack**: Full compatibility with screen readers
- **Audio Descriptions**: Visual interface elements described
- **Hearing Aid Compatibility**: Optimized audio output
- **Volume Boost**: Accessibility volume options
- **Visual Indicators**: Clear audio playback status
- **Subtitle Generation**: Optional text display for audio responses