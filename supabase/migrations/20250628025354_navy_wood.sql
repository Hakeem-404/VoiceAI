/*
  # Create storage buckets

  1. New Storage Buckets
    - `avatars` for user profile pictures
    - `audio` for voice recordings and TTS files
    - `exports` for conversation exports and backups
  2. Security
    - Set up RLS policies for secure access
    - Configure signed URLs for audio access
*/

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Create audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false)
ON CONFLICT (id) DO NOTHING;

-- Create exports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Users can view all avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up RLS policies for audio bucket
CREATE POLICY "Users can view their own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up RLS policies for exports bucket
CREATE POLICY "Users can view their own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can create their own exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );