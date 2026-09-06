-- Close client-side bypasses found in the September 2026 security review.
BEGIN;

-- Public profile reads must never make the underlying profiles table writable.
CREATE TABLE IF NOT EXISTS public.profile_directory (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  created_at timestamptz,
  updated_at timestamptz,
  onboarding_completed boolean
);

INSERT INTO public.profile_directory (
  id, user_id, display_name, avatar_url, bio, location,
  created_at, updated_at, onboarding_completed
)
SELECT id, user_id, display_name, avatar_url, bio, location,
       created_at, updated_at, onboarding_completed
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  location = EXCLUDED.location,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  onboarding_completed = EXCLUDED.onboarding_completed;

ALTER TABLE public.profile_directory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read profile directory" ON public.profile_directory;
CREATE POLICY "Anyone can read profile directory"
  ON public.profile_directory FOR SELECT TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.sync_profile_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.profile_directory WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.profile_directory (
    id, user_id, display_name, avatar_url, bio, location,
    created_at, updated_at, onboarding_completed
  ) VALUES (
    NEW.id, NEW.user_id, NEW.display_name, NEW.avatar_url, NEW.bio, NEW.location,
    NEW.created_at, NEW.updated_at, NEW.onboarding_completed
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    onboarding_completed = EXCLUDED.onboarding_completed;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_directory_from_profiles ON public.profiles;
CREATE TRIGGER sync_profile_directory_from_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_directory();

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true, security_barrier = true)
AS
SELECT id, user_id, display_name, avatar_url, bio, location,
       created_at, updated_at, onboarding_completed
FROM public.profile_directory;

REVOKE ALL ON TABLE public.profile_directory FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profile_directory TO anon, authenticated;
REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_directory() FROM PUBLIC, anon, authenticated;

-- Negotiations can only be created through create_proposal, which derives owners,
-- item sides and cash metadata on the server.
REVOKE INSERT, DELETE ON TABLE public.matches FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.match_items FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_matches_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_a_id IS DISTINCT FROM OLD.user_a_id
     OR NEW.user_b_id IS DISTINCT FROM OLD.user_b_id
     OR NEW.item_a_id IS DISTINCT FROM OLD.item_a_id
     OR NEW.item_b_id IS DISTINCT FROM OLD.item_b_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.cash_amount_cents IS DISTINCT FROM OLD.cash_amount_cents
     OR NEW.cash_payer_user_id IS DISTINCT FROM OLD.cash_payer_user_id THEN
    RAISE EXCEPTION 'Cannot modify immutable match fields';
  END IF;

  IF NEW.confirmed_by_a IS DISTINCT FROM OLD.confirmed_by_a
     AND _uid IS DISTINCT FROM OLD.user_a_id THEN
    RAISE EXCEPTION 'Only user_a can change confirmed_by_a';
  END IF;
  IF NEW.confirmed_by_b IS DISTINCT FROM OLD.confirmed_by_b
     AND _uid IS DISTINCT FROM OLD.user_b_id THEN
    RAISE EXCEPTION 'Only user_b can change confirmed_by_b';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('completed', 'cancelled', 'rejected') THEN
      RAISE EXCEPTION 'Cannot change status from %', OLD.status;
    END IF;
    IF OLD.status = 'proposal' AND NEW.status IN ('accepted', 'rejected')
       AND _uid IS DISTINCT FROM OLD.user_b_id THEN
      RAISE EXCEPTION 'Only target owner can accept/reject proposal';
    END IF;
    IF NEW.status = 'cancelled' THEN
      IF OLD.status = 'proposal' AND _uid IS DISTINCT FROM OLD.user_a_id THEN
        RAISE EXCEPTION 'Only proposer can cancel proposal';
      END IF;
      IF OLD.status = 'accepted' AND _uid NOT IN (OLD.user_a_id, OLD.user_b_id) THEN
        RAISE EXCEPTION 'Only participants can cancel an accepted negotiation';
      END IF;
      IF OLD.status NOT IN ('proposal', 'accepted') THEN
        RAISE EXCEPTION 'Cannot cancel a match from status %', OLD.status;
      END IF;
    END IF;
    IF NEW.status = 'completed' THEN
      IF OLD.status <> 'accepted'
         OR NOT (COALESCE(NEW.confirmed_by_a, false) AND COALESCE(NEW.confirmed_by_b, false)) THEN
        RAISE EXCEPTION 'Cannot complete match before both confirmations';
      END IF;
    END IF;
  END IF;

  IF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
     OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN
    IF NEW.status <> 'cancelled' OR OLD.status NOT IN ('proposal', 'accepted') THEN
      RAISE EXCEPTION 'Invalid cancellation metadata change';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Calls are created only by the LiveKit Edge Function after it derives the
-- callee and room from the conversation.
DROP POLICY IF EXISTS "Caller can insert calls" ON public.call_sessions;
REVOKE INSERT ON TABLE public.call_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_call_sessions_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.caller_id IS DISTINCT FROM OLD.caller_id
     OR NEW.callee_id IS DISTINCT FROM OLD.callee_id
     OR NEW.room_name IS DISTINCT FROM OLD.room_name
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.started_at IS DISTINCT FROM OLD.started_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify immutable call fields';
  END IF;
  IF OLD.status IN ('declined', 'missed', 'ended') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot change a finished call';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF (OLD.status = 'ringing' AND NEW.status NOT IN ('accepted', 'declined', 'missed', 'ended'))
       OR (OLD.status = 'accepted' AND NEW.status <> 'ended') THEN
      RAISE EXCEPTION 'Invalid call status transition';
    END IF;
    IF NEW.status IN ('accepted', 'declined') AND _uid IS DISTINCT FROM OLD.callee_id THEN
      RAISE EXCEPTION 'Only callee can accept or decline';
    END IF;
    IF NEW.status = 'missed' AND _uid IS NOT NULL AND _uid IS DISTINCT FROM OLD.caller_id THEN
      RAISE EXCEPTION 'Only caller can mark a call as missed';
    END IF;
    IF NEW.status = 'accepted' THEN NEW.accepted_at := now(); END IF;
    IF NEW.status = 'ended' THEN
      NEW.ended_at := now();
      NEW.duration_seconds := CASE WHEN OLD.accepted_at IS NULL THEN 0
        ELSE GREATEST(0, EXTRACT(EPOCH FROM (NEW.ended_at - OLD.accepted_at))::integer) END;
    END IF;
  ELSIF NEW.accepted_at IS DISTINCT FROM OLD.accepted_at
     OR NEW.ended_at IS DISTINCT FROM OLD.ended_at
     OR NEW.duration_seconds IS DISTINCT FROM OLD.duration_seconds THEN
    RAISE EXCEPTION 'Call timing is server-derived';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_suspended_call_write ON public.call_sessions;
CREATE TRIGGER reject_suspended_call_write
  BEFORE INSERT OR UPDATE ON public.call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();

DROP TRIGGER IF EXISTS reject_suspended_match_write ON public.matches;
CREATE TRIGGER reject_suspended_match_write
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();

-- New clients use one RPC. A constrained insert policy remains during the
-- mobile rollout so already-installed versions do not lose chat access.
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(conversation_id)
  AND NOT public.is_conversation_blocked(conversation_id)
);
REVOKE INSERT ON TABLE public.messages FROM authenticated;
GRANT INSERT (conversation_id, sender_id, content, message_type, media_url)
  ON TABLE public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_messages_insert_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _private_prefix text := 'chat-media-private:' || NEW.conversation_id::text || '/' || auth.uid()::text || '/';
  _legacy_prefix text := 'https://gfvqympaaglkplzbocbl.supabase.co/storage/v1/object/public/chat-media/' || auth.uid()::text || '/';
BEGIN
  IF current_user <> 'authenticated' THEN RETURN NEW; END IF;
  IF NEW.sender_id IS DISTINCT FROM auth.uid()
     OR NEW.message_type NOT IN ('text', 'image', 'video', 'audio')
     OR NEW.read_at IS NOT NULL OR NEW.deleted_at IS NOT NULL OR NEW.deleted_by IS NOT NULL
     OR length(btrim(COALESCE(NEW.content, ''))) > 4000
     OR (NEW.message_type = 'text' AND length(btrim(COALESCE(NEW.content, ''))) = 0)
     OR (NEW.message_type = 'text' AND NEW.media_url IS NOT NULL)
     OR (NEW.message_type <> 'text' AND (
       NEW.media_url IS NULL
       OR (NEW.media_url NOT LIKE _private_prefix AND NEW.media_url NOT LIKE _legacy_prefix)
     )) THEN
    RAISE EXCEPTION 'invalid_message_insert';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_messages_insert_guard ON public.messages;
CREATE TRIGGER enforce_messages_insert_guard
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_messages_insert_guard();

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _message public.messages;
  _content text := btrim(COALESCE(p_content, ''));
  _media_prefix text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF public.is_user_suspended(_uid) THEN RAISE EXCEPTION 'account_suspended'; END IF;
  IF NOT public.is_conversation_participant(p_conversation_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF public.is_conversation_blocked(p_conversation_id) THEN RAISE EXCEPTION 'conversation_blocked'; END IF;
  IF p_message_type NOT IN ('text', 'image', 'video', 'audio') THEN RAISE EXCEPTION 'invalid_message_type'; END IF;
  IF length(_content) > 4000 OR (p_message_type = 'text' AND length(_content) = 0) THEN
    RAISE EXCEPTION 'invalid_message_content';
  END IF;

  _media_prefix := 'chat-media-private:' || p_conversation_id::text || '/' || _uid::text || '/';
  IF p_message_type = 'text' AND p_media_url IS NOT NULL THEN RAISE EXCEPTION 'unexpected_media'; END IF;
  IF p_message_type <> 'text' AND (p_media_url IS NULL OR p_media_url NOT LIKE _media_prefix || length(p_media_url) > 600) THEN
    RAISE EXCEPTION 'invalid_media_path';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, media_url)
  VALUES (p_conversation_id, _uid, _content, p_message_type, p_media_url)
  RETURNING * INTO _message;
  RETURN _message;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_messages_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _trusted boolean := current_setting('hypou.trusted_message_mutation', true) = '1';
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a message';
  END IF;
  IF NOT _trusted AND (
    NEW.content IS DISTINCT FROM OLD.content
    OR NEW.media_url IS DISTINCT FROM OLD.media_url
    OR NEW.message_type IS DISTINCT FROM OLD.message_type
    OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by
  ) THEN
    RAISE EXCEPTION 'Message content can only be changed by server actions';
  END IF;
  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND _uid = OLD.sender_id THEN
    RAISE EXCEPTION 'Sender cannot change read_at';
  END IF;
  IF OLD.read_at IS NOT NULL AND NEW.read_at IS NULL THEN
    RAISE EXCEPTION 'read_at cannot be unset';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _sender uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT sender_id INTO _sender FROM public.messages WHERE id = p_message_id FOR UPDATE;
  IF _sender IS NULL THEN RAISE EXCEPTION 'message_not_found'; END IF;
  IF _sender <> _uid THEN RAISE EXCEPTION 'only_sender_can_delete'; END IF;
  PERFORM set_config('hypou.trusted_message_mutation', '1', true);
  UPDATE public.messages
  SET content = '', media_url = NULL, message_type = 'text',
      deleted_at = COALESCE(deleted_at, now()), deleted_by = COALESCE(deleted_by, _uid)
  WHERE id = p_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_message(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.soft_delete_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.enforce_messages_insert_guard() FROM PUBLIC, anon, authenticated;

-- New chat uploads are private and scoped to a conversation. Existing public
-- objects remain readable until the separate legacy-object migration is run.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media-private', 'chat-media-private', false, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif',
        'video/mp4','video/webm','video/quicktime','video/x-m4v',
        'audio/webm','audio/ogg','audio/mp4','audio/aac','audio/mpeg',
        'audio/mp3','audio/x-m4a','audio/m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_access_private_chat_media(p_name text, p_require_owner boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _conversation_id uuid;
  _owner_id uuid;
BEGIN
  BEGIN
    _conversation_id := split_part(p_name, '/', 1)::uuid;
    _owner_id := split_part(p_name, '/', 2)::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
  RETURN public.is_conversation_participant(_conversation_id)
    AND (NOT p_require_owner OR _owner_id = auth.uid());
END;
$$;

DROP POLICY IF EXISTS "Participants can read private chat media" ON storage.objects;
CREATE POLICY "Participants can read private chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media-private' AND public.can_access_private_chat_media(name, false));

DROP POLICY IF EXISTS "Participants can upload own private chat media" ON storage.objects;
CREATE POLICY "Participants can upload own private chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media-private' AND public.can_access_private_chat_media(name, true));

DROP POLICY IF EXISTS "Owners can delete private chat media" ON storage.objects;
CREATE POLICY "Owners can delete private chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media-private' AND public.can_access_private_chat_media(name, true));

REVOKE ALL ON FUNCTION public.can_access_private_chat_media(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_private_chat_media(text, boolean) TO authenticated;

UPDATE storage.buckets SET
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
WHERE id IN ('avatars', 'item-images');

UPDATE storage.buckets SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime','video/x-m4v']
WHERE id = 'item-videos';

-- Consume the AI quota atomically. The browser cannot read or erase this ledger.
REVOKE ALL ON TABLE public.ai_validation_throttle FROM anon, authenticated;
DROP POLICY IF EXISTS "users manage own throttle" ON public.ai_validation_throttle;

CREATE OR REPLACE FUNCTION public.consume_ai_validation_quota(
  p_user_id uuid,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 THEN RAISE EXCEPTION 'invalid_quota'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  DELETE FROM public.ai_validation_throttle
  WHERE user_id = p_user_id
    AND created_at < now() - make_interval(secs => p_window_seconds);
  SELECT count(*) INTO _count
  FROM public.ai_validation_throttle
  WHERE user_id = p_user_id
    AND created_at >= now() - make_interval(secs => p_window_seconds);
  IF _count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.ai_validation_throttle (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_validation_quota(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_validation_quota(uuid, integer, integer) TO service_role;

-- Tokens are reassigned and removed through server-side functions so logging
-- into a different account on the same device cannot retain the old binding.
CREATE OR REPLACE FUNCTION public.register_device_token(p_token text, p_platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF length(p_token) < 16 OR length(p_token) > 4096 THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF p_platform NOT IN ('ios', 'android', 'web') THEN RAISE EXCEPTION 'invalid_platform'; END IF;
  INSERT INTO public.device_tokens (user_id, token, platform)
  VALUES (_uid, p_token, p_platform)
  ON CONFLICT (token) DO UPDATE SET
    user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.unregister_device_token(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.device_tokens WHERE token = p_token AND user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.register_device_token(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unregister_device_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_device_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_device_token(text) TO authenticated;

-- This function can send arbitrary push content with the service credential.
REVOKE ALL ON FUNCTION public.notify_push(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Staff privileges in direct PostgREST requests require an MFA-elevated JWT.
-- Service-role/internal calls have no matching auth.uid() and keep working.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) AND (
    _role = 'user'::public.app_role
    OR auth.uid() IS NULL
    OR COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', '') = 'aal2'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'moderator'::public.app_role);
$$;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM anon, authenticated;

-- Public acquisition forms receive only validated, server-derived fields.
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
REVOKE INSERT ON TABLE public.waitlist FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_waitlist(p_email text, p_referred_by text DEFAULT NULL)
RETURNS public.waitlist
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text := lower(btrim(p_email));
  _referral text := NULLIF(lower(btrim(p_referred_by)), '');
  _entry public.waitlist;
BEGIN
  IF length(_email) NOT BETWEEN 3 AND 254
     OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR (_referral IS NOT NULL AND _referral !~ '^[a-f0-9]{12}$') THEN
    RAISE EXCEPTION 'invalid_waitlist_registration';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('waitlist_position'));
  SELECT * INTO _entry FROM public.waitlist WHERE lower(email) = _email;
  IF FOUND THEN RETURN _entry; END IF;
  INSERT INTO public.waitlist (email, position, referred_by)
  VALUES (_email, (SELECT COALESCE(max(position), 0) + 1 FROM public.waitlist), _referral)
  RETURNING * INTO _entry;
  RETURN _entry;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_beta_tester(
  p_name text, p_email text, p_platform text, p_privacy_accepted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name text := btrim(p_name);
  _email text := lower(btrim(p_email));
  _platform text := lower(btrim(p_platform));
BEGIN
  IF NOT p_privacy_accepted
     OR length(_name) NOT BETWEEN 2 AND 100
     OR length(_email) NOT BETWEEN 3 AND 254
     OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR _platform NOT IN ('ios', 'android') THEN
    RAISE EXCEPTION 'invalid_beta_registration';
  END IF;
  INSERT INTO public.beta_testers (first_name, last_name, email, platform, privacy_accepted_at)
  VALUES (_name, NULL, _email, _platform, now())
  ON CONFLICT ((lower(email))) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.register_beta_tester(text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_beta_tester(text, text, text, boolean) TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
COMMIT;
