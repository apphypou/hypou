
-- Create item_videos table
CREATE TABLE public.item_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.item_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item videos"
  ON public.item_videos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own videos"
  ON public.item_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.item_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-videos', 'item-videos', true);

-- Storage policies
CREATE POLICY "Anyone can view item videos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-videos');

CREATE POLICY "Authenticated users can upload item videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own item videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'item-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
