CREATE OR REPLACE FUNCTION public.create_proposal(p_my_item_ids uuid[], p_their_item_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _their_user uuid;
  _their_status text;
  _their_value int;
  _their_margin_down int;
  _their_min int;
  _my_sum int;
  _match_id uuid;
  _id uuid;
  _count int;
  _existing_id uuid;
  _existing_status text;
  _existing_user_a uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_my_item_ids IS NULL OR array_length(p_my_item_ids,1) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos 1 item';
  END IF;
  IF array_length(p_my_item_ids,1) > 3 THEN
    RAISE EXCEPTION 'Máximo de 3 itens por proposta';
  END IF;

  SELECT user_id, status, market_value, margin_down
    INTO _their_user, _their_status, _their_value, _their_margin_down
    FROM items WHERE id = p_their_item_id;
  IF _their_user IS NULL THEN RAISE EXCEPTION 'Item alvo não encontrado'; END IF;
  IF _their_status <> 'active' THEN RAISE EXCEPTION 'Item alvo indisponível'; END IF;
  IF _their_user = _uid THEN RAISE EXCEPTION 'Não pode propor pelo próprio item'; END IF;

  IF EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = _uid AND blocked_id = _their_user)
       OR (blocker_id = _their_user AND blocked_id = _uid)
  ) THEN RAISE EXCEPTION 'Usuário bloqueado'; END IF;

  SELECT COUNT(DISTINCT id) INTO _count FROM items
    WHERE id = ANY(p_my_item_ids) AND user_id = _uid AND status = 'active';
  IF _count <> array_length(p_my_item_ids,1) THEN
    RAISE EXCEPTION 'Itens inválidos ou inativos';
  END IF;

  IF _their_value > 0 THEN
    SELECT COALESCE(SUM(market_value), 0) INTO _my_sum FROM items
      WHERE id = ANY(p_my_item_ids);
    _their_min := FLOOR(_their_value * (1.0 - COALESCE(_their_margin_down, 0) / 100.0))::int;
    IF _my_sum < _their_min THEN
      RAISE EXCEPTION 'Oferta abaixo do mínimo aceito (R$ %). Adicione mais itens.', _their_min;
    END IF;
  END IF;

  -- Permite repropor: remove qualquer match anterior do mesmo par (item_a, item_b)
  -- que esteja em estado finalizado (rejected/cancelled) iniciado por mim.
  -- Active/proposal/accepted/completed bloqueiam normalmente via UNIQUE.
  FOR _existing_id, _existing_status, _existing_user_a IN
    SELECT id, status, user_a_id FROM matches
    WHERE item_a_id = p_my_item_ids[1] AND item_b_id = p_their_item_id
  LOOP
    IF _existing_status IN ('rejected','cancelled') AND _existing_user_a = _uid THEN
      DELETE FROM match_items WHERE match_id = _existing_id;
      DELETE FROM matches WHERE id = _existing_id;
    END IF;
  END LOOP;

  INSERT INTO matches (user_a_id, user_b_id, item_a_id, item_b_id, status)
    VALUES (_uid, _their_user, p_my_item_ids[1], p_their_item_id, 'proposal')
    RETURNING id INTO _match_id;

  FOREACH _id IN ARRAY p_my_item_ids LOOP
    INSERT INTO match_items (match_id, user_id, item_id, side)
      VALUES (_match_id, _uid, _id, 'a');
  END LOOP;

  INSERT INTO match_items (match_id, user_id, item_id, side)
    VALUES (_match_id, _their_user, p_their_item_id, 'b');

  RETURN _match_id;
END;
$function$;