CREATE POLICY "Match participants can view traded items"
ON public.items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE (matches.item_a_id = items.id OR matches.item_b_id = items.id)
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);