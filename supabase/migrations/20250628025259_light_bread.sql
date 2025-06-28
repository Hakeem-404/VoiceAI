/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text)
      - `subscription_tier` (text with check constraint)
      - `preferences` (jsonb)
      - `created_at` (timestamp with time zone)
      - `last_active` (timestamp with time zone)
      - `total_conversations` (integer)
      - `streak_days` (integer)
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can view and edit own profile" 
  ON users 
  FOR ALL 
  USING (auth.uid() = id);