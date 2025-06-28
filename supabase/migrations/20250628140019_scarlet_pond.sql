CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('general-chat', 'debate-challenge', 'idea-brainstorm', 'interview-practice', 'presentation-prep', 'language-learning')),
  title TEXT,
  duration_seconds INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  quality_score FLOAT DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 10),
  feedback_summary JSONB DEFAULT '{}',
  job_description TEXT,
  cv_text TEXT,
  personalized_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_bookmarked BOOLEAN DEFAULT FALSE,
  sharing_settings JSONB DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own conversations
CREATE POLICY "Users can view and edit own conversations" 
  ON conversations 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create indexes for mobile optimization
CREATE INDEX idx_conversations_user_created ON conversations(user_id, created_at DESC);
CREATE INDEX idx_conversations_user_mode ON conversations(user_id, mode);
CREATE INDEX idx_conversations_bookmarked ON conversations(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;