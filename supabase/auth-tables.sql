-- Create auth_events table to track user authentication events
CREATE TABLE IF NOT EXISTS public.auth_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS auth_events_user_id_idx ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS auth_events_event_type_idx ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS auth_events_timestamp_idx ON auth_events(timestamp);

-- Add RLS (Row Level Security) to auth_events
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Create policy to only allow users to see their own auth events
CREATE POLICY "Users can view their own auth events" 
  ON public.auth_events 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Admin can see all auth events
CREATE POLICY "Admin can view all auth events" 
  ON public.auth_events 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Add additional columns to profiles table for tracking authentication data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create a function to process auth events when inserted
CREATE OR REPLACE FUNCTION process_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile data based on event type
  IF NEW.event_type = 'signin' THEN
    UPDATE profiles 
    SET 
      last_login = NEW.timestamp,
      login_count = COALESCE(login_count, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF NEW.event_type = 'failed_signin' THEN
    UPDATE profiles 
    SET 
      failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
      last_failed_login = NEW.timestamp,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF NEW.event_type = 'email_verification' THEN
    UPDATE profiles 
    SET 
      email_verified = TRUE,
      email_verified_at = NEW.timestamp,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to process auth events
DROP TRIGGER IF EXISTS on_auth_event_insert ON public.auth_events;
CREATE TRIGGER on_auth_event_insert
  AFTER INSERT ON public.auth_events
  FOR EACH ROW
  EXECUTE FUNCTION process_auth_event();

-- Create a view for user login statistics
CREATE OR REPLACE VIEW user_login_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.last_login,
  p.login_count,
  p.failed_login_attempts,
  p.last_failed_login,
  p.email_verified,
  p.email_verified_at,
  p.created_at,
  (SELECT COUNT(*) FROM auth_events WHERE user_id = p.id AND event_type = 'signin') AS total_logins,
  (SELECT MAX(timestamp) FROM auth_events WHERE user_id = p.id AND event_type = 'signin') AS last_activity
FROM profiles p; 