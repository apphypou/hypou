-- A negotiation can be withdrawn until both sides confirm the physical delivery.
-- Keep an audit trail so the trade history and related conversation are preserved.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE OR REPLACE FUNCTION public.enforce_matches_update_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR has_role(_uid, 'admin'::app_role) THEN RETURN NEW; END IF;

  IF NEW.user_a_id IS DISTINCT FROM OLD.user_a_id OR NEW.user_b_id IS DISTINCT FROM OLD.user_b_id
     OR NEW.item_a_id IS DISTINCT FROM OLD.item_a_id OR NEW.item_b_id IS DISTINCT FROM OLD.item_b_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a match';
  END IF;

  IF NEW.confirmed_by_a IS DISTINCT FROM OLD.confirmed_by_a AND _uid IS DISTINCT FROM OLD.user_a_id THEN
    RAISE EXCEPTION 'Only user_a can change confirmed_by_a';
  END IF;
  IF NEW.confirmed_by_b IS DISTINCT FROM OLD.confirmed_by_b AND _uid IS DISTINCT FROM OLD.user_b_id THEN
    RAISE EXCEPTION 'Only user_b can change confirmed_by_b';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('completed', 'cancelled', 'rejected') THEN
      RAISE EXCEPTION 'Cannot change status from %', OLD.status;
    END IF;

    IF OLD.status = 'proposal' AND NEW.status IN ('accepted', 'rejected') AND _uid IS DISTINCT FROM OLD.user_b_id THEN
      RAISE EXCEPTION 'Only target owner can accept/reject proposal';
    END IF;

    IF NEW.status = 'cancelled' THEN
      IF OLD.status = 'proposal' AND _uid IS DISTINCT FROM OLD.user_a_id THEN
        RAISE EXCEPTION 'Only proposer can cancel proposal';
      END IF;
      IF OLD.status = 'accepted' AND _uid NOT IN (OLD.user_a_id, OLD.user_b_id) THEN
        RAISE EXCEPTION 'Only match participants can withdraw an accepted negotiation';
      END IF;
      IF OLD.status NOT IN ('proposal', 'accepted') THEN
        RAISE EXCEPTION 'Cannot cancel a match from status %', OLD.status;
      END IF;
    END IF;

    IF NEW.status = 'completed' THEN
      IF OLD.status <> 'accepted' THEN
        RAISE EXCEPTION 'Cannot complete a match that is not accepted';
      END IF;
      IF NOT (COALESCE(NEW.confirmed_by_a, false) AND COALESCE(NEW.confirmed_by_b, false)) THEN
        RAISE EXCEPTION 'Cannot complete a match without both confirmations';
      END IF;
    END IF;
  END IF;

  IF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
     OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN
    IF NEW.status <> 'cancelled' OR OLD.status NOT IN ('proposal', 'accepted') THEN
      RAISE EXCEPTION 'Cancellation metadata can only be set when cancelling a match';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_match(p_match_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _match public.matches;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO _match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Proposta não encontrada'; END IF;
  IF _uid NOT IN (_match.user_a_id, _match.user_b_id) THEN
    RAISE EXCEPTION 'Você não faz parte desta negociação';
  END IF;
  IF _match.status NOT IN ('proposal', 'accepted') THEN
    RAISE EXCEPTION 'Esta negociação não pode mais ser cancelada';
  END IF;
  IF _match.status = 'proposal' AND _uid <> _match.user_a_id THEN
    RAISE EXCEPTION 'Apenas quem enviou pode cancelar a proposta';
  END IF;
  IF _match.status = 'accepted'
     AND COALESCE(_match.confirmed_by_a, false)
     AND COALESCE(_match.confirmed_by_b, false) THEN
    RAISE EXCEPTION 'A troca já foi concluída';
  END IF;

  UPDATE public.matches
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = _uid,
      cancellation_reason = CASE WHEN _match.status = 'accepted' THEN 'withdrawn_before_delivery' ELSE 'withdrawn_proposal' END
  WHERE id = p_match_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_match(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_match(uuid) TO authenticated;
