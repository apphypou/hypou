DROP FUNCTION public.register_beta_tester(text, text, boolean);

CREATE FUNCTION public.register_beta_tester(
  p_name text,
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
  v_name text := trim(p_name);
  v_email text := lower(trim(p_email));
  v_platform text := lower(trim(p_platform));
BEGIN
  IF NOT p_privacy_accepted THEN
    RAISE EXCEPTION 'Privacy notice must be accepted';
  END IF;

  IF char_length(v_name) NOT BETWEEN 2 AND 100
    OR char_length(v_email) NOT BETWEEN 3 AND 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR v_platform NOT IN ('ios', 'android') THEN
    RAISE EXCEPTION 'Invalid beta tester registration';
  END IF;

  INSERT INTO public.beta_testers (first_name, last_name, email, platform, privacy_accepted_at)
  VALUES (v_name, NULL, v_email, v_platform, now())
  ON CONFLICT ((lower(email))) DO UPDATE
  SET first_name = EXCLUDED.first_name,
      last_name = NULL,
      platform = EXCLUDED.platform,
      privacy_accepted_at = EXCLUDED.privacy_accepted_at;
END;
$$;

REVOKE ALL ON FUNCTION public.register_beta_tester(text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_beta_tester(text, text, text, boolean) TO anon, authenticated;
