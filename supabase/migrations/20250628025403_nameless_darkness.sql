/*
  # Create maintenance functions

  1. Functions
    - `archive_old_conversations` to archive conversations older than 1 year
    - `cleanup_unused_audio` to remove unused audio files
    - `update_user_streaks` to update user streak counts
  2. Triggers
    - Add trigger to update conversation updated_at timestamp
    - Add trigger to increment user total_conversations count
*/

-- Function to archive old conversations
CREATE OR REPLACE FUNCTION archive_old_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET sharing_settings = jsonb_set(sharing_settings, '{archived}', 'true'::jsonb)
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND (sharing_settings->>'archived')::boolean IS NOT TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup unused audio files
CREATE OR REPLACE FUNCTION cleanup_unused_audio()
RETURNS void AS $$
DECLARE
  audio_object RECORD;
BEGIN
  FOR audio_object IN
    SELECT objects.id, objects.name
    FROM storage.objects
    WHERE bucket_id = 'audio'
    AND created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM messages
      WHERE audio_url LIKE '%' || SUBSTRING(objects.name FROM '[^/]+$') || '%'
    )
  LOOP
    DELETE FROM storage.objects WHERE id = audio_object.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streaks()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  last_active_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  FOR user_record IN SELECT id, last_active, streak_days FROM users
  LOOP
    last_active_date := (user_record.last_active AT TIME ZONE 'UTC')::DATE;
    
    -- If last active was yesterday, increment streak
    IF last_active_date = current_date - INTERVAL '1 day' THEN
      UPDATE users SET streak_days = streak_days + 1 WHERE id = user_record.id;
    -- If last active was before yesterday, reset streak
    ELSIF last_active_date < current_date - INTERVAL '1 day' THEN
      UPDATE users SET streak_days = 0 WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp_trigger
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Trigger to increment user total_conversations count
CREATE OR REPLACE FUNCTION increment_user_conversations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET total_conversations = total_conversations + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_user_conversations_trigger
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION increment_user_conversations();

-- Trigger to update user last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_last_active_trigger
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();