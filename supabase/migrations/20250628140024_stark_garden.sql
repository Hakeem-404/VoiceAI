CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_index INTEGER NOT NULL,
  feedback_data JSONB DEFAULT '{}',
  is_highlighted BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own messages
CREATE POLICY "Users can view and edit own messages" 
  ON messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Create index for optimized message queries
CREATE INDEX idx_messages_conversation_timestamp ON messages(conversation_id, timestamp);