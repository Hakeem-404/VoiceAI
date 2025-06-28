CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  elevenlabs_voice_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  voice_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own voice profiles
CREATE POLICY "Users can view and edit own voice profiles" 
  ON voice_profiles 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Insert default voice profiles
INSERT INTO voice_profiles (elevenlabs_voice_id, name, description, is_custom, voice_settings)
VALUES
  ('21m00Tcm4TlvDq8ikWAM', 'Friendly Companion', 'Warm, friendly tone with natural inflection', FALSE, '{"stability": 0.75, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": true}'),
  ('AZnzlk1XvdvUeBnXmlld', 'Confident Debater', 'Confident, articulate tone with authority', FALSE, '{"stability": 0.8, "similarity_boost": 0.85, "style": 0.4, "use_speaker_boost": true}'),
  ('EXAVITQu4vr4xnSDxMaL', 'Professional Interviewer', 'Professional, clear tone with appropriate formality', FALSE, '{"stability": 0.85, "similarity_boost": 0.75, "style": 0.1, "use_speaker_boost": false}'),
  ('ErXwobaYiN019PkySvjV', 'Patient Teacher', 'Patient, encouraging tone with clear pronunciation', FALSE, '{"stability": 0.9, "similarity_boost": 0.7, "style": 0.0, "use_speaker_boost": false}');