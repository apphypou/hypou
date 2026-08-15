CREATE TABLE public.beta_testers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  privacy_accepted_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_at timestamp with time zone
);

CREATE UNIQUE INDEX beta_testers_email_unique
  ON public.beta_testers (lower(email));

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view beta testers"
  ON public.beta_testers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update beta testers"
  ON public.beta_testers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.register_beta_tester(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_privacy_accepted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text := trim(p_first_name);
  v_last_name text := trim(p_last_name);
  v_email text := lower(trim(p_email));
BEGIN
  IF NOT p_privacy_accepted THEN
    RAISE EXCEPTION 'Privacy notice must be accepted';
  END IF;

  IF char_length(v_first_name) NOT BETWEEN 1 AND 80
    OR char_length(v_last_name) NOT BETWEEN 1 AND 120
    OR char_length(v_email) NOT BETWEEN 3 AND 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid beta tester registration';
  END IF;

  INSERT INTO public.beta_testers (first_name, last_name, email, privacy_accepted_at)
  VALUES (v_first_name, v_last_name, v_email, now())
  ON CONFLICT ((lower(email))) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.register_beta_tester(text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_beta_tester(text, text, text, boolean) TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view waitlist entry by email" ON public.waitlist;
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
