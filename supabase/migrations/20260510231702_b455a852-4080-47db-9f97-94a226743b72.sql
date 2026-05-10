CREATE OR REPLACE FUNCTION public.get_user_ratings_with_items(_user_id uuid)
RETURNS TABLE (
  id uuid,
  match_id uuid,
  rater_id uuid,
  rated_id uuid,
  score integer,
  comment text,
  created_at timestamptz,
  rater_display_name text,
  rater_avatar_url text,
  rater_item_id uuid,
  rater_item_name text,
  rater_item_image text,
  rated_item_id uuid,
  rated_item_name text,
  rated_item_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.match_id,
    r.rater_id,
    r.rated_id,
    r.score,
    r.comment,
    r.created_at,
    pp.display_name AS rater_display_name,
    pp.avatar_url AS rater_avatar_url,
    rater_item.id AS rater_item_id,
    rater_item.name AS rater_item_name,
    (SELECT image_url FROM item_images WHERE item_id = rater_item.id ORDER BY position ASC LIMIT 1) AS rater_item_image,
    rated_item.id AS rated_item_id,
    rated_item.name AS rated_item_name,
    (SELECT image_url FROM item_images WHERE item_id = rated_item.id ORDER BY position ASC LIMIT 1) AS rated_item_image
  FROM ratings r
  LEFT JOIN matches m ON m.id = r.match_id
  LEFT JOIN public_profiles pp ON pp.user_id = r.rater_id
  LEFT JOIN items rater_item ON rater_item.id = CASE WHEN m.user_a_id = r.rater_id THEN m.item_a_id ELSE m.item_b_id END
  LEFT JOIN items rated_item ON rated_item.id = CASE WHEN m.user_a_id = r.rated_id THEN m.item_a_id ELSE m.item_b_id END
  WHERE r.rated_id = _user_id
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_ratings_with_items(uuid) TO anon, authenticated;