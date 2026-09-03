ALTER TABLE public.beta_testers
  ADD COLUMN platform text NOT NULL DEFAULT 'ios'
    CHECK (platform IN ('ios', 'android')),
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;

DROP FUNCTION public.register_beta_tester(text, text, text, boolean);

CREATE FUNCTION public.register_beta_tester(
  p_email text,
  p_platform text,
  p_privacy_accepted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_platform text := lower(trim(p_platform));
BEGIN
  IF NOT p_privacy_accepted THEN
    RAISE EXCEPTION 'Privacy notice must be accepted';
  END IF;

  IF char_length(v_email) NOT BETWEEN 3 AND 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR v_platform NOT IN ('ios', 'android') THEN
    RAISE EXCEPTION 'Invalid beta tester registration';
  END IF;

  INSERT INTO public.beta_testers (email, platform, privacy_accepted_at)
  VALUES (v_email, v_platform, now())
  ON CONFLICT ((lower(email))) DO UPDATE
  SET platform = EXCLUDED.platform,
      privacy_accepted_at = EXCLUDED.privacy_accepted_at;
END;
$$;

REVOKE ALL ON FUNCTION public.register_beta_tester(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_beta_tester(text, text, boolean) TO anon, authenticated;
