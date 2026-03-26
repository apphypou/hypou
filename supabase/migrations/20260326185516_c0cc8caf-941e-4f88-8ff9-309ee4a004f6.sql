
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  position integer NOT NULL,
  referral_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can only select their own entry by email
CREATE POLICY "Users can view own waitlist entry"
ON public.waitlist FOR SELECT
TO anon, authenticated
USING (true);

-- Create a function to get next position
CREATE OR REPLACE FUNCTION public.get_waitlist_position()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(position), 0) + 1 FROM public.waitlist;
$$;
