-- Function to deactivate items when trade is completed
CREATE OR REPLACE FUNCTION public.deactivate_items_on_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE items SET status = 'inactive' WHERE id IN (NEW.item_a_id, NEW.item_b_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on matches table
CREATE TRIGGER on_trade_completed_deactivate_items
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_items_on_trade_completion();

-- Allow anon users to view ratings (public reputation)
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT TO anon, authenticated USING (true);