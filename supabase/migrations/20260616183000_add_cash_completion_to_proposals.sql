ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS cash_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_payer_user_id uuid NULL;

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_cash_amount_non_negative;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_cash_amount_non_negative CHECK (cash_amount_cents >= 0);

CREATE OR REPLACE FUNCTION public.create_proposal(
  p_my_item_ids uuid[],
  p_their_item_id uuid,
  p_cash_amount_cents integer DEFAULT 0
)
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
  _cash int := GREATEST(COALESCE(p_cash_amount_cents, 0), 0);
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
    IF (_my_sum + _cash) < _their_min THEN
      RAISE EXCEPTION 'Oferta abaixo do mínimo aceito (R$ %). Adicione mais itens ou complete com dinheiro.', _their_min;
    END IF;
  END IF;

  FOR _existing_id, _existing_status, _existing_user_a IN
    SELECT id, status, user_a_id FROM matches
    WHERE item_a_id = p_my_item_ids[1] AND item_b_id = p_their_item_id
  LOOP
    IF _existing_status IN ('rejected','cancelled') AND _existing_user_a = _uid THEN
      DELETE FROM match_items WHERE match_id = _existing_id;
      DELETE FROM matches WHERE id = _existing_id;
    END IF;
  END LOOP;

  INSERT INTO matches (
    user_a_id,
    user_b_id,
    item_a_id,
    item_b_id,
    status,
    cash_amount_cents,
    cash_payer_user_id
  )
    VALUES (
      _uid,
      _their_user,
      p_my_item_ids[1],
      p_their_item_id,
      'proposal',
      _cash,
      CASE WHEN _cash > 0 THEN _uid ELSE NULL END
    )
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

DROP FUNCTION IF EXISTS public.get_my_matches();

CREATE FUNCTION public.get_my_matches()
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_a_id uuid,
  user_b_id uuid,
  confirmed_by_a boolean,
  confirmed_by_b boolean,
  cash_amount_cents integer,
  cash_payer_user_id uuid,
  item_a jsonb,
  item_b jsonb,
  items_a jsonb,
  items_b jsonb,
  other_user jsonb,
  my_item_side text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_matches AS (
    SELECT m.*
    FROM public.matches m
    WHERE (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
      AND NOT EXISTS (
        SELECT 1
        FROM public.blocked_users b
        WHERE b.blocker_id = auth.uid()
          AND b.blocked_id = CASE WHEN m.user_a_id = auth.uid() THEN m.user_b_id ELSE m.user_a_id END
      )
  ),
  match_item_json AS (
    SELECT
      mi.match_id,
      mi.side,
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'name', i.name,
          'market_value', i.market_value,
          'category', i.category,
          'location', i.location,
          'item_images', COALESCE(img.images, '[]'::jsonb)
        )
        ORDER BY mi.created_at ASC
      ) AS items
    FROM public.match_items mi
    JOIN public.items i ON i.id = mi.item_id
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object('image_url', ii.image_url, 'position', ii.position)
        ORDER BY ii.position ASC
      ) AS images
      FROM public.item_images ii
      WHERE ii.item_id = i.id
    ) img ON true
    WHERE mi.match_id IN (SELECT my_matches.id FROM my_matches)
    GROUP BY mi.match_id, mi.side
  )
  SELECT
    m.id,
    m.status,
    m.created_at,
    m.updated_at,
    m.user_a_id,
    m.user_b_id,
    m.confirmed_by_a,
    m.confirmed_by_b,
    m.cash_amount_cents,
    m.cash_payer_user_id,
    jsonb_build_object(
      'id', ia.id,
      'name', ia.name,
      'market_value', ia.market_value,
      'category', ia.category,
      'location', ia.location,
      'item_images', COALESCE(ia_img.images, '[]'::jsonb)
    ) AS item_a,
    jsonb_build_object(
      'id', ib.id,
      'name', ib.name,
      'market_value', ib.market_value,
      'category', ib.category,
      'location', ib.location,
      'item_images', COALESCE(ib_img.images, '[]'::jsonb)
    ) AS item_b,
    COALESCE(mia.items, jsonb_build_array(jsonb_build_object(
      'id', ia.id,
      'name', ia.name,
      'market_value', ia.market_value,
      'category', ia.category,
      'location', ia.location,
      'item_images', COALESCE(ia_img.images, '[]'::jsonb)
    ))) AS items_a,
    COALESCE(mib.items, jsonb_build_array(jsonb_build_object(
      'id', ib.id,
      'name', ib.name,
      'market_value', ib.market_value,
      'category', ib.category,
      'location', ib.location,
      'item_images', COALESCE(ib_img.images, '[]'::jsonb)
    ))) AS items_b,
    jsonb_build_object(
      'user_id', pp.user_id,
      'display_name', pp.display_name,
      'avatar_url', pp.avatar_url,
      'location', pp.location
    ) AS other_user,
    CASE WHEN m.user_a_id = auth.uid() THEN 'a' ELSE 'b' END AS my_item_side
  FROM my_matches m
  JOIN public.items ia ON ia.id = m.item_a_id
  JOIN public.items ib ON ib.id = m.item_b_id
  LEFT JOIN public.public_profiles pp
    ON pp.user_id = CASE WHEN m.user_a_id = auth.uid() THEN m.user_b_id ELSE m.user_a_id END
  LEFT JOIN match_item_json mia ON mia.match_id = m.id AND mia.side = 'a'
  LEFT JOIN match_item_json mib ON mib.match_id = m.id AND mib.side = 'b'
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('image_url', ii.image_url, 'position', ii.position) ORDER BY ii.position ASC) AS images
    FROM public.item_images ii
    WHERE ii.item_id = ia.id
  ) ia_img ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('image_url', ii.image_url, 'position', ii.position) ORDER BY ii.position ASC) AS images
    FROM public.item_images ii
    WHERE ii.item_id = ib.id
  ) ib_img ON true
  ORDER BY m.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_matches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_matches() TO authenticated;
