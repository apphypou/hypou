ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE INDEX IF NOT EXISTS waitlist_converted_at_idx
  ON public.waitlist (converted_at)
  WHERE converted_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mark_waitlist_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_email text;
BEGIN
  SELECT email INTO account_email
  FROM auth.users
  WHERE id = NEW.id;

  IF account_email IS NOT NULL THEN
    UPDATE public.waitlist
    SET converted_at = COALESCE(converted_at, NEW.created_at)
    WHERE lower(email) = lower(account_email)
      AND converted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_waitlist_conversion_on_profile ON public.profiles;
CREATE TRIGGER mark_waitlist_conversion_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_waitlist_conversion();

UPDATE public.waitlist AS waitlist
SET converted_at = profiles.created_at
FROM public.profiles AS profiles
JOIN auth.users AS users ON users.id = profiles.id
WHERE lower(waitlist.email) = lower(users.email)
  AND waitlist.converted_at IS NULL;
