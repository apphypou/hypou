
-- ============================================================
-- 1) MATCHES: enforce immutability + safe confirmation flow
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_matches_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  -- Admin bypass
  IF _uid IS NOT NULL AND has_role(_uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Identity / item fields are immutable from the client
  IF NEW.user_a_id IS DISTINCT FROM OLD.user_a_id
     OR NEW.user_b_id IS DISTINCT FROM OLD.user_b_id
     OR NEW.item_a_id IS DISTINCT FROM OLD.item_a_id
     OR NEW.item_b_id IS DISTINCT FROM OLD.item_b_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a match';
  END IF;

  -- Only the respective participant may flip their own confirmation flag
  IF NEW.confirmed_by_a IS DISTINCT FROM OLD.confirmed_by_a AND _uid IS DISTINCT FROM OLD.user_a_id THEN
    RAISE EXCEPTION 'Only user_a can change confirmed_by_a';
  END IF;
  IF NEW.confirmed_by_b IS DISTINCT FROM OLD.confirmed_by_b AND _uid IS DISTINCT FROM OLD.user_b_id THEN
    RAISE EXCEPTION 'Only user_b can change confirmed_by_b';
  END IF;

  -- Status transition rules
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Cannot set to 'completed' directly without both confirmations
    IF NEW.status = 'completed' AND NOT (COALESCE(NEW.confirmed_by_a,false) AND COALESCE(NEW.confirmed_by_b,false)) THEN
      RAISE EXCEPTION 'Cannot complete a match without both confirmations';
    END IF;
    -- Cannot revert from terminal states
    IF OLD.status IN ('completed','cancelled') THEN
      RAISE EXCEPTION 'Cannot change status from %', OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_update_guard ON public.matches;
CREATE TRIGGER trg_matches_update_guard
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.enforce_matches_update_guard();

-- Auto-complete when both confirmations are true (uses existing function)
DROP TRIGGER IF EXISTS trg_matches_auto_complete ON public.matches;
CREATE TRIGGER trg_matches_auto_complete
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.check_trade_completion();

-- Add WITH CHECK so RLS evaluates the new row too
DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" ON public.matches
FOR UPDATE TO authenticated
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ============================================================
-- 2) MESSAGES: only sender may edit content; only recipient may mark read
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_messages_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  -- Immutable identity fields
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a message';
  END IF;

  -- Content / media / type may only be changed by the sender
  IF (NEW.content IS DISTINCT FROM OLD.content
      OR NEW.media_url IS DISTINCT FROM OLD.media_url
      OR NEW.message_type IS DISTINCT FROM OLD.message_type)
     AND _uid IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'Only the sender can edit a message';
  END IF;

  -- read_at: only the recipient (i.e. NOT the sender) may set it
  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND _uid = OLD.sender_id THEN
    RAISE EXCEPTION 'Sender cannot change read_at';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_update_guard ON public.messages;
CREATE TRIGGER trg_messages_update_guard
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_messages_update_guard();

DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
CREATE POLICY "Participants can update messages" ON public.messages
FOR UPDATE TO authenticated
USING (is_conversation_participant(conversation_id))
WITH CHECK (is_conversation_participant(conversation_id));

-- ============================================================
-- 3) PROFILES: lock subscription fields against self-escalation
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_profiles_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  -- Admin and service role bypass
  IF _uid IS NULL OR has_role(_uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Immutable identity
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id of a profile';
  END IF;

  -- Subscription fields cannot be self-edited
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Subscription fields cannot be changed directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_update_guard ON public.profiles;
CREATE TRIGGER trg_profiles_update_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profiles_update_guard();

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4) RATINGS: explicit, scoped UPDATE policy
-- ============================================================
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" ON public.ratings
FOR UPDATE TO authenticated
USING (auth.uid() = rater_id)
WITH CHECK (auth.uid() = rater_id);

-- ============================================================
-- 5) STORAGE: add UPDATE policies for chat-media and item-videos
-- ============================================================
DROP POLICY IF EXISTS "Users can update own chat media" ON storage.objects;
CREATE POLICY "Users can update own chat media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own item videos" ON storage.objects;
CREATE POLICY "Users can update own item videos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'item-videos' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'item-videos' AND (storage.foldername(name))[1] = (auth.uid())::text);
