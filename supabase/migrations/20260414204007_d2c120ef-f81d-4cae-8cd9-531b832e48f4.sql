-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Recreate with truly open insert for anon
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also fix SELECT so inserted user can see their own entry by email match
DROP POLICY IF EXISTS "Users can view own waitlist entry by email" ON public.waitlist;

CREATE POLICY "Users can view waitlist entry by email"
  ON public.waitlist FOR SELECT
  TO anon, authenticated
  USING (true);