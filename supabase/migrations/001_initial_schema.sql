-- =============================================
-- PROFILES (extends auth.users from Supabase)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  locale_preference TEXT NOT NULL DEFAULT 'ca' CHECK (locale_preference IN ('ca', 'gl')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PASSKEYS (WebAuthn credentials)
-- =============================================
CREATE TABLE public.passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- =============================================
-- GROUPS
-- =============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  max_members INTEGER NOT NULL DEFAULT 20
);

-- =============================================
-- GROUP INVITES
-- =============================================
CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GROUP MEMBERS
-- =============================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  display_name_override TEXT,
  avatar_url_override TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- NULL = global
  name TEXT NOT NULL,
  name_gl TEXT, -- Galego translation
  icon_name TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PLACES
-- =============================================
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT,
  category_id UUID REFERENCES public.categories(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'queremos_ir' CHECK (status IN ('queremos_ir', 'hemos_ido', 'pendiente')),
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PHOTOS
-- =============================================
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  original_filename TEXT,
  size_bytes INTEGER,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  taken_at TIMESTAMPTZ,
  taken_timezone TEXT,
  week_start DATE NOT NULL, -- Computed: Saturday of the week
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WEEKLY RECAPS
-- =============================================
CREATE TABLE public.weekly_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Saturday
  week_end DATE NOT NULL,   -- Friday
  generated_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  summary JSONB, -- {meetups: [], top_photos: [], contributors: [], stats: {}}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, week_start)
);

-- =============================================
-- MEETUPS (detected or confirmed)
-- =============================================
CREATE TABLE public.meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recap_id UUID NOT NULL REFERENCES public.weekly_recaps(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id),
  detected_at TIMESTAMPTZ NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MEETUP PARTICIPANTS
-- =============================================
CREATE TABLE public.meetup_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id UUID NOT NULL REFERENCES public.meetups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(meetup_id, user_id)
);

-- =============================================
-- WEEKLY VOTES
-- =============================================
CREATE TABLE public.weekly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  place_id UUID REFERENCES public.places(id),
  place_text TEXT, -- Free text if no place_id
  proposed_date DATE,
  proposed_time TIME,
  pretext TEXT CHECK (pretext IN ('almuerzo', 'comida', 'cena', 'tardeo', 'otro')),
  pretext_custom TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  recap_id UUID REFERENCES public.weekly_recaps(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (place_id IS NOT NULL AND recap_id IS NULL) OR
    (place_id IS NULL AND recap_id IS NOT NULL)
  )
);

-- =============================================
-- USER STATS (Gamification)
-- =============================================
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  photos_count INTEGER NOT NULL DEFAULT 0,
  places_count INTEGER NOT NULL DEFAULT 0,
  votes_count INTEGER NOT NULL DEFAULT 0,
  weeks_participated INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- =============================================
-- BADGES
-- =============================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ca TEXT NOT NULL,
  name_gl TEXT NOT NULL,
  description_ca TEXT NOT NULL,
  description_gl TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  threshold_type TEXT, -- 'photos', 'places', 'weeks', etc.
  threshold_value INTEGER
);

-- =============================================
-- USER BADGES
-- =============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id, group_id)
);

-- =============================================
-- PUSH SUBSCRIPTIONS
-- =============================================
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- {p256dh, auth}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATION LOG
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id),
  type TEXT NOT NULL, -- 'reminder', 'recap_ready', 'vote_closed', 'badge_earned', 'invite'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- =============================================
-- REMINDER MESSAGES POOL
-- =============================================
CREATE TABLE public.reminder_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL CHECK (locale IN ('ca', 'gl')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  time_window TEXT NOT NULL CHECK (time_window IN ('morning', 'afternoon', 'night'))
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_photos_group_week ON public.photos(group_id, week_start);
CREATE INDEX idx_photos_coords ON public.photos(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_places_group_category ON public.places(group_id, category_id);
CREATE INDEX idx_places_coords ON public.places(lat, lng);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_weekly_votes_group_week ON public.weekly_votes(group_id, week_start);
CREATE INDEX idx_passkeys_user ON public.passkeys(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- =============================================
-- TRIGGER: Create profile on auth.users insert
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Update updated_at on profiles
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
