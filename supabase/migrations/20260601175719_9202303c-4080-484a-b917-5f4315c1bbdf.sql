
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending','proposal','accepted','rejected','cancelled','completed'));

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
    IF OLD.status IN ('completed','cancelled','rejected') THEN
      RAISE EXCEPTION 'Cannot change status from %', OLD.status;
    END IF;
    IF OLD.status = 'proposal' AND NEW.status IN ('accepted','rejected') AND _uid IS DISTINCT FROM OLD.user_b_id THEN
      RAISE EXCEPTION 'Only target owner can accept/reject proposal';
    END IF;
    IF OLD.status = 'proposal' AND NEW.status = 'cancelled' AND _uid IS DISTINCT FROM OLD.user_a_id THEN
      RAISE EXCEPTION 'Only proposer can cancel proposal';
    END IF;
    IF NEW.status = 'completed' THEN
      IF OLD.status <> 'accepted' THEN
        RAISE EXCEPTION 'Cannot complete a match that is not accepted';
      END IF;
      IF NOT (COALESCE(NEW.confirmed_by_a,false) AND COALESCE(NEW.confirmed_by_b,false)) THEN
        RAISE EXCEPTION 'Cannot complete a match without both confirmations';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recommended_items(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.nearby_items(double precision, double precision, double precision, uuid, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.recommended_items(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_items(double precision, double precision, double precision, uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.recommended_items(p_user_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, user_id uuid, name text, description text, category text, condition text, market_value integer, margin_up integer, margin_down integer, location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, relevance_score double precision, matched_item_id uuid, matched_item_name text, matched_item_image text, matched_items_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  WITH user_items AS (
    SELECT i.id AS uid_item_id, i.name AS uid_item_name, i.category AS uid_item_category,
      i.market_value AS uid_market_value,
      ROUND(i.market_value*(1-i.margin_down/100.0))::int AS accept_min,
      ROUND(i.market_value*(1+i.margin_up/100.0))::int AS accept_max
    FROM items i WHERE i.user_id=p_user_id AND i.status='active'
  ),
  user_item_images AS (
    SELECT DISTINCT ON (ii.item_id) ii.item_id, ii.image_url
    FROM item_images ii JOIN user_items ui ON ui.uid_item_id=ii.item_id
    ORDER BY ii.item_id, ii.position ASC
  ),
  swiped AS (SELECT item_id FROM swipes WHERE swiper_id=p_user_id),
  blocked AS (
    SELECT blocked_id FROM blocked_users WHERE blocker_id=p_user_id
    UNION SELECT blocker_id FROM blocked_users WHERE blocked_id=p_user_id
  ),
  match_counts AS (
    SELECT ci.id AS candidate_id, COUNT(ui.uid_item_id)::int AS total_matches
    FROM items ci JOIN user_items ui ON (ci.market_value>=ui.accept_min AND ci.market_value<=ui.accept_max)
    WHERE ci.status='active' AND ci.user_id!=p_user_id
      AND ci.id NOT IN (SELECT item_id FROM swiped)
      AND ci.user_id NOT IN (SELECT blocked_id FROM blocked)
    GROUP BY ci.id
  ),
  scored AS (
    SELECT ci.id, ci.user_id, ci.name, ci.description, ci.category, ci.condition,
      ci.market_value, ci.margin_up, ci.margin_down, ci.location, ci.status,
      ci.created_at, ci.updated_at,
      ui.uid_item_id AS matched_item_id, ui.uid_item_name AS matched_item_name, uii.image_url AS matched_item_image,
      CASE WHEN ui.uid_item_id IS NOT NULL AND ci.category=ui.uid_item_category THEN 1.0
           WHEN ui.uid_item_id IS NOT NULL THEN 0.7 ELSE 0.3 END AS relevance_score,
      COALESCE(mc.total_matches,0) AS matched_items_count,
      ROW_NUMBER() OVER (PARTITION BY ci.id ORDER BY
        CASE WHEN ui.uid_item_id IS NOT NULL AND ci.category=ui.uid_item_category THEN 1.0
             WHEN ui.uid_item_id IS NOT NULL THEN 0.7 ELSE 0.3 END DESC,
        ABS(ci.market_value-COALESCE(ui.uid_market_value,0)) ASC) AS rn
    FROM items ci
    LEFT JOIN user_items ui ON (ci.market_value>=ui.accept_min AND ci.market_value<=ui.accept_max)
    LEFT JOIN user_item_images uii ON uii.item_id=ui.uid_item_id
    LEFT JOIN match_counts mc ON mc.candidate_id=ci.id
    WHERE ci.status='active' AND ci.user_id!=p_user_id
      AND ci.id NOT IN (SELECT item_id FROM swiped)
      AND ci.user_id NOT IN (SELECT blocked_id FROM blocked)
  )
  SELECT s.id, s.user_id, s.name, s.description, s.category, s.condition,
    s.market_value, s.margin_up, s.margin_down, s.location, s.status,
    s.created_at, s.updated_at, s.relevance_score,
    s.matched_item_id, s.matched_item_name, s.matched_item_image, s.matched_items_count::int
  FROM scored s WHERE s.rn=1 ORDER BY s.relevance_score DESC, s.created_at DESC LIMIT p_limit;
END; $$;

CREATE OR REPLACE FUNCTION public.nearby_items(p_lat double precision, p_lng double precision, p_radius_km double precision DEFAULT 50, p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, user_id uuid, name text, description text, category text, condition text, market_value integer, margin_up integer, margin_down integer, location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, distance_km double precision)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT i.id, i.user_id, i.name, i.description, i.category, i.condition,
    i.market_value, i.margin_up, i.margin_down, i.location, i.status,
    i.created_at, i.updated_at,
    ROUND((6371*acos(cos(radians(p_lat))*cos(radians(p.latitude))*cos(radians(p.longitude)-radians(p_lng))+sin(radians(p_lat))*sin(radians(p.latitude))))::numeric,1)::double precision AS distance_km
  FROM items i JOIN profiles p ON p.user_id=i.user_id
  WHERE i.status='active' AND (p_user_id IS NULL OR i.user_id != p_user_id)
    AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    AND (6371*acos(cos(radians(p_lat))*cos(radians(p.latitude))*cos(radians(p.longitude)-radians(p_lng))+sin(radians(p_lat))*sin(radians(p.latitude)))) <= p_radius_km
  ORDER BY distance_km ASC LIMIT p_limit;
END; $$;

CREATE TABLE IF NOT EXISTS public.ai_validation_throttle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_throttle_user_ts ON public.ai_validation_throttle(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.ai_validation_throttle TO authenticated;
GRANT ALL ON public.ai_validation_throttle TO service_role;
ALTER TABLE public.ai_validation_throttle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users manage own throttle" ON public.ai_validation_throttle;
CREATE POLICY "users manage own throttle" ON public.ai_validation_throttle
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.create_conversation_on_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'accepted' AND NEW.status='accepted' THEN
    INSERT INTO public.conversations(match_id) VALUES (NEW.id) ON CONFLICT (match_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_create_conversation_on_accept ON public.matches;
CREATE TRIGGER trg_create_conversation_on_accept AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.create_conversation_on_accept();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='conversations_match_id_key') THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_match_id_key UNIQUE (match_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_rating_integrity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m record;
BEGIN
  IF NEW.rater_id = NEW.rated_id THEN RAISE EXCEPTION 'Cannot rate yourself'; END IF;
  IF NEW.score < 1 OR NEW.score > 5 THEN RAISE EXCEPTION 'Score must be 1..5'; END IF;
  SELECT user_a_id, user_b_id, status INTO _m FROM public.matches WHERE id = NEW.match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found'; END IF;
  IF _m.status <> 'completed' THEN RAISE EXCEPTION 'Match must be completed'; END IF;
  IF NEW.rater_id NOT IN (_m.user_a_id, _m.user_b_id) THEN RAISE EXCEPTION 'Rater is not participant'; END IF;
  IF NEW.rated_id NOT IN (_m.user_a_id, _m.user_b_id) THEN RAISE EXCEPTION 'Rated is not participant'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_enforce_rating_integrity ON public.ratings;
CREATE TRIGGER trg_enforce_rating_integrity BEFORE INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rating_integrity();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ratings_unique_per_rater_match') THEN
    ALTER TABLE public.ratings ADD CONSTRAINT ratings_unique_per_rater_match UNIQUE (rater_id, match_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_messages_update_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a message';
  END IF;
  IF (NEW.content IS DISTINCT FROM OLD.content OR NEW.media_url IS DISTINCT FROM OLD.media_url
      OR NEW.message_type IS DISTINCT FROM OLD.message_type)
     AND _uid IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'Only the sender can edit a message';
  END IF;
  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND _uid = OLD.sender_id THEN
    RAISE EXCEPTION 'Sender cannot change read_at';
  END IF;
  IF OLD.read_at IS NOT NULL AND NEW.read_at IS NULL THEN
    RAISE EXCEPTION 'read_at cannot be unset';
  END IF;
  RETURN NEW;
END; $$;

-- M6: deduplicar reports pendentes antes do índice
DELETE FROM public.reports r1
USING public.reports r2
WHERE r1.status='pending' AND r2.status='pending'
  AND r1.reporter_id=r2.reporter_id AND r1.reported_user_id=r2.reported_user_id
  AND r1.created_at < r2.created_at;
CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_pending
  ON public.reports(reporter_id, reported_user_id) WHERE status='pending';

CREATE OR REPLACE FUNCTION public.enforce_item_value_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.market_value IS DISTINCT FROM OLD.market_value THEN
    IF EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.status IN ('proposal','accepted')
        AND (m.item_a_id = OLD.id OR m.item_b_id = OLD.id
             OR EXISTS (SELECT 1 FROM public.match_items mi WHERE mi.match_id=m.id AND mi.item_id=OLD.id))
    ) THEN
      RAISE EXCEPTION 'Não é possível alterar o valor de um item com proposta ativa';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_enforce_item_value_lock ON public.items;
CREATE TRIGGER trg_enforce_item_value_lock BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_item_value_lock();

CREATE OR REPLACE FUNCTION public.notify_on_trade_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.user_a_id, 'trade_confirmed', 'Sua proposta foi aceita! ✅',
      'Combine a entrega pelo chat.', jsonb_build_object('match_id', NEW.id));
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.user_b_id, 'trade_confirmed', 'Proposta aceita ✅',
      'Combine a entrega pelo chat.', jsonb_build_object('match_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;
