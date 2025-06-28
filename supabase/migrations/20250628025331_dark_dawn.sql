/*
  # Create user_progress table

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `mode` (text)
      - `skill_scores` (jsonb)
      - `total_sessions` (integer)
      - `total_duration` (integer)
      - `best_scores` (jsonb)
      - `achievements` (jsonb)
      - `last_session_date` (timestamp with time zone)
      - `streak_count` (integer)
  2. Security
    - Enable RLS on `user_progress` table
    - Add policy for authenticated users to read/write their own progress
  3. Indexes
    - Create index for optimized progress queries
*/

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  skill_scores JSONB DEFAULT '{}',
  total_sessions INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  best_scores JSONB DEFAULT '{}',
  achievements JSONB DEFAULT '[]',
  last_session_date TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER DEFAULT 0,
  UNIQUE(user_id, mode)
);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own progress
CREATE POLICY "Users can view and edit own progress" 
  ON user_progress 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create index for optimized progress queries
CREATE INDEX idx_user_progress_user_mode ON user_progress(user_id, mode);