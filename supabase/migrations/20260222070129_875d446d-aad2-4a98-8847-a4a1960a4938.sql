
-- Match system: check_for_match function + trigger

CREATE OR REPLACE FUNCTION public.check_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _swiper_id UUID;
  _item_owner_id UUID;
  _swiped_item_id UUID;
  _reverse_swipe RECORD;
  _swiper_item RECORD;
  _swiped_item RECORD;
  _new_match_id UUID;
BEGIN
  -- Only process likes and superlikes
  IF NEW.direction = 'dislike' THEN
    RETURN NEW;
  END IF;

  _swiper_id := NEW.swiper_id;
  _swiped_item_id := NEW.item_id;

  -- Get owner of the swiped item
  SELECT user_id INTO _item_owner_id FROM items WHERE id = _swiped_item_id;
  IF _item_owner_id IS NULL THEN RETURN NEW; END IF;

  -- Check if the item owner has liked any of the swiper's items
  SELECT s.item_id INTO _reverse_swipe
  FROM swipes s
  JOIN items i ON i.id = s.item_id
  WHERE s.swiper_id = _item_owner_id
    AND i.user_id = _swiper_id
    AND s.direction IN ('like', 'superlike')
  LIMIT 1;

  IF _reverse_swipe IS NULL THEN RETURN NEW; END IF;

  -- We have mutual interest! Get both items for margin check
  SELECT * INTO _swiper_item FROM items WHERE id = _reverse_swipe.item_id;
  SELECT * INTO _swiped_item FROM items WHERE id = _swiped_item_id;

  -- Check value compatibility (margin overlap)
  -- Item A range: [value * (1 - margin_down/100), value * (1 + margin_up/100)]
  -- Item B must fall in A's range AND vice versa
  IF _swiper_item.market_value > 0 AND _swiped_item.market_value > 0 THEN
    DECLARE
      a_min NUMERIC := _swiper_item.market_value * (1.0 - _swiper_item.margin_down / 100.0);
      a_max NUMERIC := _swiper_item.market_value * (1.0 + _swiper_item.margin_up / 100.0);
      b_min NUMERIC := _swiped_item.market_value * (1.0 - _swiped_item.margin_down / 100.0);
      b_max NUMERIC := _swiped_item.market_value * (1.0 + _swiped_item.margin_up / 100.0);
    BEGIN
      -- Check if ranges overlap
      IF a_max < b_min OR b_max < a_min THEN
        RETURN NEW; -- No overlap, no match
      END IF;
    END;
  END IF;

  -- Check no existing match between these two items
  IF EXISTS (
    SELECT 1 FROM matches
    WHERE (item_a_id = _reverse_swipe.item_id AND item_b_id = _swiped_item_id)
       OR (item_a_id = _swiped_item_id AND item_b_id = _reverse_swipe.item_id)
  ) THEN
    RETURN NEW;
  END IF;

  -- Create match
  INSERT INTO matches (item_a_id, item_b_id, user_a_id, user_b_id)
  VALUES (_reverse_swipe.item_id, _swiped_item_id, _swiper_id, _item_owner_id)
  RETURNING id INTO _new_match_id;

  -- Create conversation
  INSERT INTO conversations (match_id) VALUES (_new_match_id);

  RETURN NEW;
END;
$$;

-- Trigger on swipes insert
CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_for_match();
