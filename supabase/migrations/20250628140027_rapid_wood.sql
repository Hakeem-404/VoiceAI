CREATE TABLE IF NOT EXISTS conversation_modes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color_scheme JSONB DEFAULT '{}',
  system_prompt TEXT,
  default_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE conversation_modes ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to read conversation modes
CREATE POLICY "All users can view conversation modes" 
  ON conversation_modes 
  FOR SELECT 
  USING (true);

-- Create policy for admins to manage conversation modes
CREATE POLICY "Admins can manage conversation modes" 
  ON conversation_modes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.subscription_tier = 'pro'
    )
  );

-- Insert default conversation modes
INSERT INTO conversation_modes (name, description, icon, color_scheme, system_prompt, default_settings)
VALUES
  ('General Chat', 'Natural conversations on any topic', 'message-circle', '{"primary": "#3B82F6", "secondary": "#1E40AF", "gradient": ["#3B82F6", "#1E40AF"]}', 'You are a warm, empathetic conversation partner who loves discussing any topic. Be curious, ask follow-up questions, and show genuine interest in the user''s thoughts and experiences.', '{"difficulty": "beginner", "duration": 15}'),
  ('Debate Challenge', 'Structured argumentative discussions', 'users', '{"primary": "#EF4444", "secondary": "#B91C1C", "gradient": ["#EF4444", "#B91C1C"]}', 'You are an intelligent, well-informed debate partner who challenges ideas respectfully. Present counterarguments, ask probing questions, and demand evidence for claims.', '{"difficulty": "intermediate", "duration": 30}'),
  ('Idea Brainstorm', 'Creative thinking sessions', 'lightbulb', '{"primary": "#10B981", "secondary": "#047857", "gradient": ["#10B981", "#047857"]}', 'You are an enthusiastic creative collaborator who loves generating and building on ideas. Be imaginative, offer wild suggestions, and help connect different concepts.', '{"difficulty": "beginner", "duration": 20}'),
  ('Interview Practice', 'Professional preparation', 'briefcase', '{"primary": "#8B5CF6", "secondary": "#6D28D9", "gradient": ["#8B5CF6", "#6D28D9"]}', 'You are a professional interviewer conducting a realistic job interview. Ask relevant questions based on the job description provided, follow up on answers, and maintain professional demeanor.', '{"difficulty": "intermediate", "duration": 45}'),
  ('Presentation Prep', 'Public speaking practice', 'presentation', '{"primary": "#F59E0B", "secondary": "#B45309", "gradient": ["#F59E0B", "#B45309"]}', 'You are a supportive audience member providing constructive feedback on presentations. Listen actively, ask clarifying questions, and provide specific suggestions for improvement.', '{"difficulty": "intermediate", "duration": 25}'),
  ('Language Learning', 'Conversation practice', 'globe', '{"primary": "#06B6D4", "secondary": "#0E7490", "gradient": ["#06B6D4", "#0E7490"]}', 'You are a patient, encouraging language teacher focused on conversation practice. Correct mistakes gently, introduce new vocabulary naturally, and discuss cultural context.', '{"difficulty": "beginner", "duration": 20}');