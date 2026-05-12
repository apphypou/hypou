CREATE OR REPLACE FUNCTION public.get_my_matches()
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_a_id uuid,
  user_b_id uuid,
  confirmed_by_a boolean,
  confirmed_by_b boolean,
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