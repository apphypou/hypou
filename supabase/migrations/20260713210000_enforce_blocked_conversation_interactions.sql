-- Keep conversation history after a block, but prevent new communication in either direction.
CREATE OR REPLACE FUNCTION public.is_conversation_blocked(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations conversation
    JOIN public.matches proposal_match ON proposal_match.id = conversation.match_id
    WHERE conversation.id = p_conversation_id
      AND auth.uid() IN (proposal_match.user_a_id, proposal_match.user_b_id)
      AND EXISTS (
        SELECT 1
        FROM public.blocked_users block
        WHERE (block.blocker_id = proposal_match.user_a_id AND block.blocked_id = proposal_match.user_b_id)
           OR (block.blocker_id = proposal_match.user_b_id AND block.blocked_id = proposal_match.user_a_id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_blocked(uuid) TO authenticated;

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_conversation_participant(conversation_id)
  AND auth.uid() = sender_id
  AND NOT public.is_conversation_blocked(conversation_id)
);
