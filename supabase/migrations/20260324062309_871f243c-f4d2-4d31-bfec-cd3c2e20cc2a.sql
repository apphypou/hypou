DROP FUNCTION IF EXISTS public.recommended_items(uuid, integer);

CREATE OR REPLACE FUNCTION public.recommended_items(p_user_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, user_id uuid, name text, description text, category text, condition text, market_value integer, margin_up integer, margin_down integer, location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, relevance_score double precision, matched_item_id uuid, matched_item_name text, matched_item_image text, matched_items_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH user_items AS (
    SELECT
      i.id AS uid_item_id,
      i.name AS uid_item_name,
      i.category AS uid_item_category,
      i.market_value AS uid_market_value,
      ROUND(i.market_value * (1 - i.margin_down / 100.0))::int AS accept_min,
      ROUND(i.market_value * (1 + i.margin_up / 100.0))::int AS accept_max
    FROM items i
    WHERE i.user_id = p_user_id AND i.status = 'active'
  ),
  user_item_images AS (
    SELECT DISTINCT ON (ii.item_id) ii.item_id, ii.image_url
    FROM item_images ii
    JOIN user_items ui ON ui.uid_item_id = ii.item_id
    ORDER BY ii.item_id, ii.position ASC
  ),
  swiped AS (
    SELECT item_id FROM swipes WHERE swiper_id = p_user_id
  ),
  blocked AS (
    SELECT blocked_id FROM blocked_users WHERE blocker_id = p_user_id
    UNION
    SELECT blocker_id FROM blocked_users WHERE blocked_id = p_user_id
  ),
  match_counts AS (
    SELECT
      ci.id AS candidate_id,
      COUNT(ui.uid_item_id)::int AS total_matches
    FROM items ci
    JOIN user_items ui ON (
      ci.market_value >= ui.accept_min
      AND ci.market_value <= ui.accept_max
    )
    WHERE ci.status = 'active'
      AND ci.user_id != p_user_id
      AND ci.id NOT IN (SELECT item_id FROM swiped)
      AND ci.user_id NOT IN (SELECT blocked_id FROM blocked)
    GROUP BY ci.id
  ),
  scored AS (
    SELECT
      ci.id,
      ci.user_id,
      ci.name,
      ci.description,
      ci.category,
      ci.condition,
      ci.market_value,
      ci.margin_up,
      ci.margin_down,
      ci.location,
      ci.status,
      ci.created_at,
      ci.updated_at,
      ui.uid_item_id AS matched_item_id,
      ui.uid_item_name AS matched_item_name,
      uii.image_url AS matched_item_image,
      CASE
        WHEN ui.uid_item_id IS NOT NULL AND ci.category = ui.uid_item_category THEN 1.0
        WHEN ui.uid_item_id IS NOT NULL THEN 0.7
        ELSE 0.3
      END AS relevance_score,
      COALESCE(mc.total_matches, 0) AS matched_items_count,
      ROW_NUMBER() OVER (
        PARTITION BY ci.id
        ORDER BY
          CASE WHEN ui.uid_item_id IS NOT NULL AND ci.category = ui.uid_item_category THEN 1.0
               WHEN ui.uid_item_id IS NOT NULL THEN 0.7
               ELSE 0.3 END DESC,
          ABS(ci.market_value - COALESCE(ui.uid_market_value, 0)) ASC
      ) AS rn
    FROM items ci
    LEFT JOIN user_items ui ON (
      ci.market_value >= ui.accept_min
      AND ci.market_value <= ui.accept_max
    )
    LEFT JOIN user_item_images uii ON uii.item_id = ui.uid_item_id
    LEFT JOIN match_counts mc ON mc.candidate_id = ci.id
    WHERE ci.status = 'active'
      AND ci.user_id != p_user_id
      AND ci.id NOT IN (SELECT item_id FROM swiped)
      AND ci.user_id NOT IN (SELECT blocked_id FROM blocked)
  )
  SELECT
    s.id, s.user_id, s.name, s.description, s.category, s.condition,
    s.market_value, s.margin_up, s.margin_down, s.location, s.status,
    s.created_at, s.updated_at,
    s.relevance_score,
    s.matched_item_id,
    s.matched_item_name,
    s.matched_item_image,
    s.matched_items_count::int
  FROM scored s
  WHERE s.rn = 1
  ORDER BY s.relevance_score DESC, s.created_at DESC
  LIMIT p_limit;
$function$;