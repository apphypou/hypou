
-- =============================================
-- FASE 1: Fix critical SELECT policies
-- =============================================

-- 1.1 Profiles: replace public SELECT with restricted version
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow authenticated users to see only public fields of other users
-- Own profile: full access (already via UPDATE policy pattern)
-- Other profiles: only display_name, avatar_url, bio visible via app queries
-- We use a policy that allows SELECT for authenticated only
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 1.2 Waitlist: restrict SELECT to own entry only
DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.waitlist;

CREATE POLICY "Users can view own waitlist entry by email"
  ON public.waitlist FOR SELECT TO anon, authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR 
         EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 1.5 Ratings: restrict to authenticated only
DROP POLICY IF EXISTS "Users can view ratings about themselves or public" ON public.ratings;

CREATE POLICY "Authenticated users can view ratings"
  ON public.ratings FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- FASE 2: Restrict {public} role to {authenticated}
-- =============================================

-- item_images: restrict write operations to authenticated
DROP POLICY IF EXISTS "Item owner can delete images" ON public.item_images;
CREATE POLICY "Item owner can delete images" ON public.item_images
  FOR DELETE TO authenticated USING (is_item_owner(item_id));

DROP POLICY IF EXISTS "Item owner can insert images" ON public.item_images;
CREATE POLICY "Item owner can insert images" ON public.item_images
  FOR INSERT TO authenticated WITH CHECK (is_item_owner(item_id));

DROP POLICY IF EXISTS "Item owner can update images" ON public.item_images;
CREATE POLICY "Item owner can update images" ON public.item_images
  FOR UPDATE TO authenticated USING (is_item_owner(item_id));

-- item_videos: restrict write to authenticated
DROP POLICY IF EXISTS "Users can delete own videos" ON public.item_videos;
CREATE POLICY "Users can delete own videos" ON public.item_videos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own videos" ON public.item_videos;
CREATE POLICY "Users can insert own videos" ON public.item_videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- items: restrict write to authenticated
DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own items" ON public.items;
CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.items;
CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- matches: restrict write to authenticated
DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" ON public.matches
  FOR UPDATE TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Participants can view matches" ON public.matches;
CREATE POLICY "Participants can view matches" ON public.matches
  FOR SELECT TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- messages: restrict to authenticated
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (is_conversation_participant(conversation_id) AND auth.uid() = sender_id);

DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
CREATE POLICY "Participants can update messages" ON public.messages
  FOR UPDATE TO authenticated USING (is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT TO authenticated USING (is_conversation_participant(conversation_id));

-- conversations: restrict to authenticated
DROP POLICY IF EXISTS "Match participants can view conversations" ON public.conversations;
CREATE POLICY "Match participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (is_match_participant(match_id));

DROP POLICY IF EXISTS "Match participants can insert conversations" ON public.conversations;
CREATE POLICY "Match participants can insert conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (is_match_participant(match_id));

-- notifications: restrict to authenticated
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles: restrict write to authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ratings: restrict insert to authenticated
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
CREATE POLICY "Users can insert their own ratings" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);

-- swipes: restrict to authenticated
DROP POLICY IF EXISTS "Users can insert own swipes" ON public.swipes;
CREATE POLICY "Users can insert own swipes" ON public.swipes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "Users can view own swipes" ON public.swipes;
CREATE POLICY "Users can view own swipes" ON public.swipes
  FOR SELECT TO authenticated USING (auth.uid() = swiper_id);

-- user_categories: restrict to authenticated
DROP POLICY IF EXISTS "Users can delete own categories" ON public.user_categories;
CREATE POLICY "Users can delete own categories" ON public.user_categories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON public.user_categories;
CREATE POLICY "Users can insert own categories" ON public.user_categories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own categories" ON public.user_categories;
CREATE POLICY "Users can view own categories" ON public.user_categories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- video_likes: restrict to authenticated
DROP POLICY IF EXISTS "Users can delete own likes" ON public.video_likes;
CREATE POLICY "Users can delete own likes" ON public.video_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own likes" ON public.video_likes;
CREATE POLICY "Users can insert own likes" ON public.video_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
