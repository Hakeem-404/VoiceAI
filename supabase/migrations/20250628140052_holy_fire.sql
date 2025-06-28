CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  reward_points INTEGER DEFAULT 50,
  reward_badge TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to view active challenges
CREATE POLICY "All users can view active challenges" 
  ON daily_challenges 
  FOR SELECT 
  USING (is_active = TRUE);

-- Create user_challenges table to track user progress
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Enable Row Level Security
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own challenge progress
CREATE POLICY "Users can view and edit own challenge progress" 
  ON user_challenges 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create index for optimized challenge queries
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id, completed);