-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Profiles: users can read members of their groups, update own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of group members"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT gm.user_id FROM public.group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Passkeys: users can only access their own
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passkeys"
  ON public.passkeys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own passkeys"
  ON public.passkeys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own passkeys"
  ON public.passkeys FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own passkeys"
  ON public.passkeys FOR DELETE
  USING (user_id = auth.uid());

-- Groups: members can view, owner can update
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owner can update group"
  ON public.groups FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete group"
  ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

-- Group Members: members can view their group's members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
    OR
    -- Allow users to add themselves (for invite join)
    user_id = auth.uid()
  );

CREATE POLICY "Admins can update members"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Admins can remove members or users can leave"
  ON public.group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Group Invites
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites"
  ON public.group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invites.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view invite by code for joining"
  ON public.group_invites FOR SELECT
  USING (used_at IS NULL AND expires_at > NOW());

CREATE POLICY "Admins can create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invites.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Invite can be used"
  ON public.group_invites FOR UPDATE
  USING (used_at IS NULL AND expires_at > NOW());

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global categories"
  ON public.categories FOR SELECT
  USING (group_id IS NULL);

CREATE POLICY "Members can view group categories"
  ON public.categories FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create group categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = categories.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update group categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = categories.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Places
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view places"
  ON public.places FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can create places"
  ON public.places FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Creator or admin can update places"
  ON public.places FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = places.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Creator or admin can delete places"
  ON public.places FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = places.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view photos"
  ON public.photos FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can upload photos"
  ON public.photos FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update own photos"
  ON public.photos FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own photos"
  ON public.photos FOR DELETE
  USING (uploaded_by = auth.uid());

-- Weekly Recaps
ALTER TABLE public.weekly_recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view recaps"
  ON public.weekly_recaps FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create recaps"
  ON public.weekly_recaps FOR INSERT
  WITH CHECK (true); -- Edge functions use service role

CREATE POLICY "System can update recaps"
  ON public.weekly_recaps FOR UPDATE
  USING (true); -- Edge functions use service role

-- Meetups
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetups"
  ON public.meetups FOR SELECT
  USING (
    recap_id IN (
      SELECT id FROM public.weekly_recaps
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can create meetups"
  ON public.meetups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update meetups"
  ON public.meetups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.weekly_recaps wr
      JOIN public.group_members gm ON gm.group_id = wr.group_id
      WHERE wr.id = meetups.recap_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Meetup Participants
ALTER TABLE public.meetup_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetup participants"
  ON public.meetup_participants FOR SELECT
  USING (
    meetup_id IN (
      SELECT m.id FROM public.meetups m
      JOIN public.weekly_recaps wr ON wr.id = m.recap_id
      WHERE wr.group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can create participants"
  ON public.meetup_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can confirm own participation"
  ON public.meetup_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Weekly Votes
ALTER TABLE public.weekly_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes"
  ON public.weekly_votes FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can create votes"
  ON public.weekly_votes FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own votes"
  ON public.weekly_votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON public.weekly_votes FOR DELETE
  USING (user_id = auth.uid());

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments on places"
  ON public.comments FOR SELECT
  USING (
    place_id IN (
      SELECT id FROM public.places
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
    OR
    recap_id IN (
      SELECT id FROM public.weekly_recaps
      WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Members can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      place_id IN (
        SELECT id FROM public.places
        WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
      )
      OR
      recap_id IN (
        SELECT id FROM public.weekly_recaps
        WHERE group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid());

-- User Stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view stats"
  ON public.user_stats FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage stats"
  ON public.user_stats FOR ALL
  USING (true);

-- Badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- User Badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view badges in groups"
  ON public.user_badges FOR SELECT
  USING (
    group_id IS NULL
    OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

-- Push Subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Reminder Messages
ALTER TABLE public.reminder_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reminder messages"
  ON public.reminder_messages FOR SELECT
  USING (true);
