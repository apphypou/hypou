-- ============================================
-- 1. FIX: Profiles RLS - mask sensitive columns
-- ============================================

-- Drop the overly permissive SELECT policy that exposes all columns to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Owner can see their own full profile (including phone, lat, lng)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Note: "Admins can view all profiles" policy already exists and is kept

-- Create a safe view that masks sensitive columns for viewing OTHER users
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  location,
  created_at,
  updated_at,
  onboarding_completed
FROM public.profiles;

-- Grant access to the view (bypasses RLS since view owner is postgres)
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- ============================================
-- 2. FIX: Storage - add folder ownership check on uploads
-- ============================================

-- Fix item-videos INSERT: add folder ownership check
DROP POLICY IF EXISTS "Authenticated users can upload item videos" ON storage.objects;
CREATE POLICY "Users can upload own item videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'item-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix chat-media INSERT: add folder ownership check
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload own chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);