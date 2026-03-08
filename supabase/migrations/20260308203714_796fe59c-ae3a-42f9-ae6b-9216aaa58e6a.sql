
-- Add view and like counts to item_videos
ALTER TABLE public.item_videos
  ADD COLUMN view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN like_count integer NOT NULL DEFAULT 0;

-- Create video_likes table
CREATE TABLE public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.item_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_id)
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video likes"
  ON public.video_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.video_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.video_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_video_view(p_video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE item_videos SET view_count = view_count + 1 WHERE id = p_video_id;
$$;

-- Function to toggle like (insert or delete + update count)
CREATE OR REPLACE FUNCTION public.toggle_video_like(p_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _liked boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM video_likes WHERE video_id = p_video_id AND user_id = auth.uid()) THEN
    DELETE FROM video_likes WHERE video_id = p_video_id AND user_id = auth.uid();
    UPDATE item_videos SET like_count = GREATEST(like_count - 1, 0) WHERE id = p_video_id;
    _liked := false;
  ELSE
    INSERT INTO video_likes (video_id, user_id) VALUES (p_video_id, auth.uid());
    UPDATE item_videos SET like_count = like_count + 1 WHERE id = p_video_id;
    _liked := true;
  END IF;
  RETURN _liked;
END;
$$;
