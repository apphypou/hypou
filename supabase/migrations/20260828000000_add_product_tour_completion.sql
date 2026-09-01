ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS product_tour_completed_at timestamp with time zone;

-- Existing accounts have already had their first login. Only new accounts see
-- the welcome pop-up after they complete their profile onboarding.
UPDATE public.profiles
SET product_tour_completed_at = now()
WHERE onboarding_completed = true
  AND product_tour_completed_at IS NULL;
