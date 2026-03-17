
-- Remove duplicate matches keeping only the first one per (item_a_id, item_b_id)
DELETE FROM public.matches
WHERE id NOT IN (
  SELECT DISTINCT ON (item_a_id, item_b_id) id
  FROM public.matches
  ORDER BY item_a_id, item_b_id, created_at ASC
);

-- Now add the unique constraint
ALTER TABLE public.matches ADD CONSTRAINT matches_items_unique UNIQUE (item_a_id, item_b_id);
