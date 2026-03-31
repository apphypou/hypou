
-- 1. Drop and recreate FKs with ON DELETE CASCADE
ALTER TABLE item_images DROP CONSTRAINT IF EXISTS item_images_item_id_fkey;
ALTER TABLE item_images ADD CONSTRAINT item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE item_videos DROP CONSTRAINT IF EXISTS item_videos_item_id_fkey;
ALTER TABLE item_videos ADD CONSTRAINT item_videos_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_item_id_fkey;
ALTER TABLE favorites ADD CONSTRAINT favorites_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE video_likes DROP CONSTRAINT IF EXISTS video_likes_video_id_fkey;
ALTER TABLE video_likes ADD CONSTRAINT video_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES item_videos(id) ON DELETE CASCADE;

ALTER TABLE swipes DROP CONSTRAINT IF EXISTS swipes_item_id_fkey;
ALTER TABLE swipes ADD CONSTRAINT swipes_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_item_a_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_item_a_id_fkey FOREIGN KEY (item_a_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_item_b_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_item_b_id_fkey FOREIGN KEY (item_b_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_match_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_match_id_fkey;
ALTER TABLE ratings ADD CONSTRAINT ratings_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;

-- 2. Trade confirmation columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confirmed_by_a boolean DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confirmed_by_b boolean DEFAULT false;

-- 3. Reports moderation columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes text;

-- 4. Terms acceptance on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- 5. Trade completion trigger
CREATE OR REPLACE FUNCTION public.check_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.confirmed_by_a = true AND NEW.confirmed_by_b = true AND NEW.status = 'accepted' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trade_confirmation ON matches;
CREATE TRIGGER on_trade_confirmation
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION check_trade_completion();

-- 6. RLS: Admins can update reports
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS: Users can delete own notifications (for account cleanup)
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 8. RLS: Users can delete own ratings (for account cleanup)
CREATE POLICY "Users can delete own ratings" ON ratings FOR DELETE TO authenticated
  USING (auth.uid() = rater_id);
