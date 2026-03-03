
-- 1. Add INSERT policy on matches so users can create proposals
CREATE POLICY "Users can insert proposals"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_a_id);

-- 2. Add INSERT policy on conversations so system can create conversations on accept
CREATE POLICY "Match participants can insert conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (is_match_participant(match_id));

-- 3. Replace check_for_match trigger to be a no-op (just returns NEW, no auto-match)
CREATE OR REPLACE FUNCTION public.check_for_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Model C: swipes are recorded but matches are created via frontend proposals
  RETURN NEW;
END;
$function$;

-- 4. Update notify_on_match to only notify user_b (the item owner) on proposal creation
CREATE OR REPLACE FUNCTION public.notify_on_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _item_name TEXT;
BEGIN
  -- Get the name of item_b (the item that received the like)
  SELECT name INTO _item_name FROM items WHERE id = NEW.item_b_id;

  -- Only notify the owner of the item (user_b) about the proposal
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.user_b_id,
    'proposal',
    'Nova proposta! 🔔',
    'Alguém quer trocar pelo seu ' || COALESCE(_item_name, 'item') || '!',
    jsonb_build_object('match_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

-- 5. Re-attach the notify trigger on matches INSERT (it may have been on INSERT already)
DROP TRIGGER IF EXISTS on_match_created ON public.matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_match();
