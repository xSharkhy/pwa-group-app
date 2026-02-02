-- =============================================
-- EMAIL WHITELIST SYSTEM
-- Only whitelisted emails can create accounts
-- =============================================

-- Table to store allowed emails
CREATE TABLE public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES public.profiles(id),
  note TEXT, -- Optional note like "Marc - university friend"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only admins (first user / owner) can manage whitelist
-- For now, allow authenticated users to view (we'll restrict more later)
CREATE POLICY "Authenticated users can view whitelist"
  ON public.allowed_emails FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "First user can manage whitelist"
  ON public.allowed_emails FOR ALL
  TO authenticated
  USING (
    -- Check if current user is the first registered user (admin)
    auth.uid() = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1)
  );

-- Function to check if email is whitelisted
CREATE OR REPLACE FUNCTION public.check_email_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (always allow first user)
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RETURN NEW;
  END IF;

  -- Check if email is in whitelist
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE LOWER(email) = LOWER(NEW.email)) THEN
    RAISE EXCEPTION 'Email not authorized. Contact the admin to get access.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run before user creation
CREATE TRIGGER check_email_before_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_whitelist();

-- Index for fast lookups
CREATE INDEX idx_allowed_emails_email ON public.allowed_emails(LOWER(email));
