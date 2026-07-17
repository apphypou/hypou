-- Keep trade transitions atomic and make cancellation visible to both people.
-- The browser must not be responsible for enforcing state transitions.

CREATE OR REPLACE FUNCTION public.accept_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match public.matches;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada'; END IF;
  IF _uid <> _match.user_b_id THEN RAISE EXCEPTION 'Apenas o dono do item pode aceitar a proposta'; END IF;
  IF _match.status <> 'proposal' THEN RAISE EXCEPTION 'Esta proposta já foi respondida'; END IF;

  UPDATE public.matches SET status = 'accepted' WHERE id = p_match_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match public.matches;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada'; END IF;
  IF _uid <> _match.user_b_id THEN RAISE EXCEPTION 'Apenas o dono do item pode recusar a proposta'; END IF;
  IF _match.status <> 'proposal' THEN RAISE EXCEPTION 'Esta proposta já foi respondida'; END IF;

  UPDATE public.matches SET status = 'rejected' WHERE id = p_match_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_trade_delivery(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match public.matches;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Troca não encontrada'; END IF;
  IF _uid NOT IN (_match.user_a_id, _match.user_b_id) THEN RAISE EXCEPTION 'Você não faz parte desta troca'; END IF;
  IF _match.status <> 'accepted' THEN RAISE EXCEPTION 'Esta troca não pode ser confirmada'; END IF;

  IF _uid = _match.user_a_id AND NOT COALESCE(_match.confirmed_by_a, false) THEN
    UPDATE public.matches SET confirmed_by_a = true WHERE id = p_match_id;
  ELSIF _uid = _match.user_b_id AND NOT COALESCE(_match.confirmed_by_b, false) THEN
    UPDATE public.matches SET confirmed_by_b = true WHERE id = p_match_id;
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match public.matches;
  _uid uuid := auth.uid();
  _other_user_id uuid;
  _conversation_id uuid;
  _reason text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO _match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada'; END IF;
  IF _uid NOT IN (_match.user_a_id, _match.user_b_id) THEN RAISE EXCEPTION 'Você não faz parte desta negociação'; END IF;
  IF _match.status NOT IN ('proposal', 'accepted') THEN RAISE EXCEPTION 'Esta negociação não pode mais ser cancelada'; END IF;
  IF _match.status = 'proposal' AND _uid <> _match.user_a_id THEN RAISE EXCEPTION 'Apenas quem enviou pode cancelar a proposta'; END IF;
  IF _match.status = 'accepted' AND COALESCE(_match.confirmed_by_a, false) AND COALESCE(_match.confirmed_by_b, false) THEN
    RAISE EXCEPTION 'A troca já foi concluída';
  END IF;

  _reason := CASE WHEN _match.status = 'accepted' THEN 'withdrawn_before_delivery' ELSE 'withdrawn_proposal' END;
  _other_user_id := CASE WHEN _uid = _match.user_a_id THEN _match.user_b_id ELSE _match.user_a_id END;

  UPDATE public.matches
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = _uid, cancellation_reason = _reason
  WHERE id = p_match_id;

  SELECT id INTO _conversation_id FROM public.conversations WHERE match_id = p_match_id LIMIT 1;
  IF _conversation_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
    VALUES (_conversation_id, _uid, 'Negociação cancelada por um participante antes da entrega.', 'system');
  END IF;

  PERFORM public.notify_push(
    _other_user_id,
    'Negociação cancelada',
    CASE WHEN _reason = 'withdrawn_before_delivery'
      THEN 'A outra pessoa desistiu da troca antes da entrega.'
      ELSE 'A proposta foi cancelada por quem a enviou.' END,
    jsonb_build_object('type', 'trade_cancelled', 'match_id', p_match_id, 'conversation_id', _conversation_id)
  );
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_match(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_match(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_trade_delivery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_match(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_match(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_match(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_trade_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_match(uuid) TO authenticated;

-- Prevent direct REST inserts from bypassing the blocked-conversation rule.
DROP POLICY IF EXISTS "Caller can insert calls" ON public.call_sessions;
CREATE POLICY "Caller can insert calls"
ON public.call_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = caller_id
  AND public.is_conversation_participant(conversation_id)
  AND NOT public.is_conversation_blocked(conversation_id)
);
