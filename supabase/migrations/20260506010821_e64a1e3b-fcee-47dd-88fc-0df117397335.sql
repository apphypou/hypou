-- Create match_items junction to support up to 3 items per proposing side
CREATE TABLE public.match_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('a','b')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (match_id, item_id)
);

CREATE INDEX idx_match_items_match ON public.match_items(match_id);
CREATE INDEX idx_match_items_item ON public.match_items(item_id);

ALTER TABLE public.match_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can view match_items"
  ON public.match_items FOR SELECT TO authenticated
  USING (public.is_match_participant(match_id));

CREATE POLICY "Match participants can insert match_items"
  ON public.match_items FOR INSERT TO authenticated
  WITH CHECK (public.is_match_participant(match_id) AND auth.uid() = user_id);

-- Enforce limit: max 3 on side 'a', max 1 on side 'b'
CREATE OR REPLACE FUNCTION public.enforce_match_items_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
  _max int;
BEGIN
  SELECT COUNT(*) INTO _count FROM public.match_items
    WHERE match_id = NEW.match_id AND side = NEW.side;
  _max := CASE WHEN NEW.side = 'a' THEN 3 ELSE 1 END;
  IF _count >= _max THEN
    RAISE EXCEPTION 'Limite de itens excedido para o lado % (máx %)', NEW.side, _max;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_match_items_limit
BEFORE INSERT ON public.match_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_match_items_limit();

-- Backfill existing matches
INSERT INTO public.match_items (match_id, user_id, item_id, side)
SELECT m.id, m.user_a_id, m.item_a_id, 'a' FROM public.matches m
ON CONFLICT (match_id, item_id) DO NOTHING;

INSERT INTO public.match_items (match_id, user_id, item_id, side)
SELECT m.id, m.user_b_id, m.item_b_id, 'b' FROM public.matches m
ON CONFLICT (match_id, item_id) DO NOTHING;

-- Update completion trigger to deactivate ALL items in the match and cancel other proposals
CREATE OR REPLACE FUNCTION public.handle_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv_id uuid;
  _other RECORD;
  _all_items uuid[];
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    -- 1) System message in this match's conversation
    SELECT id INTO _conv_id FROM conversations WHERE match_id = NEW.id LIMIT 1;
    IF _conv_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES (_conv_id, NEW.user_a_id, 'Troca concluída com sucesso! Avalie seu trocador para fortalecer a comunidade.', 'system');
    END IF;

    -- 2) Collect all items from match_items (fallback to item_a_id/item_b_id)
    SELECT COALESCE(array_agg(item_id), ARRAY[NEW.item_a_id, NEW.item_b_id])
      INTO _all_items
    FROM match_items WHERE match_id = NEW.id;

    IF _all_items IS NULL OR array_length(_all_items,1) IS NULL THEN
      _all_items := ARRAY[NEW.item_a_id, NEW.item_b_id];
    END IF;

    -- 3) Cancel other open matches involving any of the items
    FOR _other IN
      UPDATE matches mm
      SET status = 'cancelled', updated_at = now()
      WHERE mm.id <> NEW.id
        AND mm.status IN ('proposal','accepted')
        AND (
          mm.item_a_id = ANY(_all_items)
          OR mm.item_b_id = ANY(_all_items)
          OR EXISTS (
            SELECT 1 FROM match_items mi
            WHERE mi.match_id = mm.id AND mi.item_id = ANY(_all_items)
          )
        )
      RETURNING id, user_a_id
    LOOP
      SELECT id INTO _conv_id FROM conversations WHERE match_id = _other.id LIMIT 1;
      IF _conv_id IS NOT NULL THEN
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES (_conv_id, _other.user_a_id, 'Item indisponível: este item já foi trocado em outra negociação. Esta conversa foi encerrada.', 'system');
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Update deactivation trigger to deactivate ALL items
CREATE OR REPLACE FUNCTION public.deactivate_items_on_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE items SET status = 'inactive'
      WHERE id IN (
        SELECT item_id FROM match_items WHERE match_id = NEW.id
        UNION SELECT NEW.item_a_id UNION SELECT NEW.item_b_id
      );
  END IF;
  RETURN NEW;
END;
$$;

-- RPC to atomically create a multi-item proposal
CREATE OR REPLACE FUNCTION public.create_proposal(
  p_my_item_ids uuid[],
  p_their_item_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _their_user uuid;
  _their_status text;
  _match_id uuid;
  _id uuid;
  _count int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_my_item_ids IS NULL OR array_length(p_my_item_ids,1) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos 1 item';
  END IF;
  IF array_length(p_my_item_ids,1) > 3 THEN
    RAISE EXCEPTION 'Máximo de 3 itens por proposta';
  END IF;

  -- Validate target item
  SELECT user_id, status INTO _their_user, _their_status
    FROM items WHERE id = p_their_item_id;
  IF _their_user IS NULL THEN RAISE EXCEPTION 'Item alvo não encontrado'; END IF;
  IF _their_status <> 'active' THEN RAISE EXCEPTION 'Item alvo indisponível'; END IF;
  IF _their_user = _uid THEN RAISE EXCEPTION 'Não pode propor pelo próprio item'; END IF;

  -- Block check
  IF EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = _uid AND blocked_id = _their_user)
       OR (blocker_id = _their_user AND blocked_id = _uid)
  ) THEN RAISE EXCEPTION 'Usuário bloqueado'; END IF;

  -- Validate ownership + active status of all my items, no duplicates
  SELECT COUNT(DISTINCT id) INTO _count FROM items
    WHERE id = ANY(p_my_item_ids) AND user_id = _uid AND status = 'active';
  IF _count <> array_length(p_my_item_ids,1) THEN
    RAISE EXCEPTION 'Itens inválidos ou inativos';
  END IF;

  -- Create match
  INSERT INTO matches (user_a_id, user_b_id, item_a_id, item_b_id, status)
    VALUES (_uid, _their_user, p_my_item_ids[1], p_their_item_id, 'proposal')
    RETURNING id INTO _match_id;

  -- Insert match_items
  FOREACH _id IN ARRAY p_my_item_ids LOOP
    INSERT INTO match_items (match_id, user_id, item_id, side)
      VALUES (_match_id, _uid, _id, 'a');
  END LOOP;

  INSERT INTO match_items (match_id, user_id, item_id, side)
    VALUES (_match_id, _their_user, p_their_item_id, 'b');

  RETURN _match_id;
END;
$$;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_items;