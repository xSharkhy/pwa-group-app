-- =============================================
-- MIGRATION 005: Security & Performance Fixes
-- Fixes CRITICAL and HIGH issues from backend audit
-- =============================================

-- =============================================
-- PART 1: MISSING FOREIGN KEY INDEXES
-- These are critical for RLS policy performance
-- =============================================

-- passkeys.user_id (FK to profiles)
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON public.passkeys(user_id);

-- group_invites indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_created_by ON public.group_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_group_invites_used_by ON public.group_invites(used_by) WHERE used_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON public.group_invites(group_id);
-- Conditional index for active invites (common query pattern)
CREATE INDEX IF NOT EXISTS idx_group_invites_active ON public.group_invites(code, expires_at)
  WHERE used_at IS NULL;

-- places indexes
CREATE INDEX IF NOT EXISTS idx_places_created_by ON public.places(created_by);
CREATE INDEX IF NOT EXISTS idx_places_category_id ON public.places(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_places_group_id ON public.places(group_id);

-- photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_place_id ON public.photos(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_group_uploaded ON public.photos(group_id, uploaded_by);
-- Conditional index for consented photos (GDPR compliance)
CREATE INDEX IF NOT EXISTS idx_photos_consent ON public.photos(group_id, week_start)
  WHERE consent_given = TRUE;

-- comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_place_id ON public.comments(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_recap_id ON public.comments(recap_id) WHERE recap_id IS NOT NULL;

-- weekly_votes indexes
CREATE INDEX IF NOT EXISTS idx_weekly_votes_user_id ON public.weekly_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_votes_place_id ON public.weekly_votes(place_id) WHERE place_id IS NOT NULL;

-- user_stats indexes (compound for common lookups)
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_group_id ON public.user_stats(group_id);

-- user_badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_group_id ON public.user_badges(group_id) WHERE group_id IS NOT NULL;

-- push_subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_group_id ON public.notifications(group_id) WHERE group_id IS NOT NULL;

-- meetup_participants indexes
CREATE INDEX IF NOT EXISTS idx_meetup_participants_user_id ON public.meetup_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meetup_participants_meetup_id ON public.meetup_participants(meetup_id);

-- meetups indexes
CREATE INDEX IF NOT EXISTS idx_meetups_recap_id ON public.meetups(recap_id);
CREATE INDEX IF NOT EXISTS idx_meetups_place_id ON public.meetups(place_id) WHERE place_id IS NOT NULL;

-- weekly_recaps indexes
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_group_id ON public.weekly_recaps(group_id);
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_published ON public.weekly_recaps(group_id, week_start)
  WHERE published = TRUE;

-- categories index
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON public.categories(group_id);

-- group_members compound index for admin checks
CREATE INDEX IF NOT EXISTS idx_group_members_admin ON public.group_members(group_id, role)
  WHERE role = 'admin';

-- =============================================
-- PART 2: FIX RLS SECURITY VULNERABILITIES
-- =============================================

-- Drop the dangerous "System can manage stats" policy that allows ALL operations
DROP POLICY IF EXISTS "System can manage stats" ON public.user_stats;

-- Create separate, secure policies for user_stats
-- Users can only insert their own stats (for initialization on group join)
CREATE POLICY "Users can create own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- System operations (triggers, edge functions) need service role
-- This is handled by using service role key, not a permissive policy

-- Fix weekly_recaps policies - restrict system operations
DROP POLICY IF EXISTS "System can create recaps" ON public.weekly_recaps;
DROP POLICY IF EXISTS "System can update recaps" ON public.weekly_recaps;

-- Recaps can only be created/updated via service role (edge functions)
-- No WITH CHECK (true) - service role bypasses RLS anyway

-- Fix meetups policies
DROP POLICY IF EXISTS "System can create meetups" ON public.meetups;
-- Meetups created via service role edge function only

-- Fix meetup_participants policies
DROP POLICY IF EXISTS "System can create participants" ON public.meetup_participants;
-- Participants created via service role edge function only

-- Fix user_badges policy
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
-- Badges awarded via service role edge function only

-- Fix notifications policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
-- Notifications created via service role edge function only

-- =============================================
-- PART 3: OPTIMIZED GROUP MEMBERSHIP VIEW
-- Materializes group membership for faster RLS checks
-- =============================================

-- Create a function to get user's group IDs efficiently
CREATE OR REPLACE FUNCTION public.get_user_group_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM public.group_members WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create a function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create a function to check if user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================
-- PART 4: STORAGE BUCKET POLICIES
-- Run these in Supabase Dashboard SQL Editor or via CLI
-- =============================================

-- Note: Storage policies are typically set via Supabase Dashboard
-- but can be defined here for documentation

-- Photos bucket policies (private - requires signed URLs)
-- INSERT: Only authenticated users who are members of the group
-- SELECT: Only group members
-- DELETE: Only the uploader

-- Avatars bucket policies (public for CDN)
-- INSERT: Only own user ID folder
-- SELECT: Public
-- DELETE: Only own user ID folder

-- =============================================
-- PART 5: ADD STATISTICS FOR QUERY PLANNER
-- =============================================

-- Analyze tables for better query planning
ANALYZE public.profiles;
ANALYZE public.groups;
ANALYZE public.group_members;
ANALYZE public.group_invites;
ANALYZE public.places;
ANALYZE public.photos;
ANALYZE public.weekly_recaps;
ANALYZE public.meetups;
ANALYZE public.meetup_participants;
ANALYZE public.weekly_votes;
ANALYZE public.comments;
ANALYZE public.user_stats;
ANALYZE public.user_badges;
ANALYZE public.notifications;
ANALYZE public.push_subscriptions;
