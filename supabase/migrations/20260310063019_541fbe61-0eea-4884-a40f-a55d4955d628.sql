
CREATE OR REPLACE FUNCTION public.nearby_items(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 50,
  p_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  category text,
  condition text,
  market_value integer,
  margin_up integer,
  margin_down integer,
  location text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    i.id, i.user_id, i.name, i.description, i.category, i.condition,
    i.market_value, i.margin_up, i.margin_down, i.location, i.status,
    i.created_at, i.updated_at,
    ROUND(
      (6371 * acos(
        cos(radians(p_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(p.latitude))
      ))::numeric, 1
    )::double precision AS distance_km
  FROM items i
  JOIN profiles p ON p.user_id = i.user_id
  WHERE i.status = 'active'
    AND (p_user_id IS NULL OR i.user_id != p_user_id)
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(p.latitude))
    )) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
$$;
