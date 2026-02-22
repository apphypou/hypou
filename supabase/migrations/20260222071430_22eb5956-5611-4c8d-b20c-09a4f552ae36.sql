-- Allow participants to update messages (for marking as read)
CREATE POLICY "Participants can update messages"
ON public.messages
FOR UPDATE
USING (is_conversation_participant(conversation_id))
WITH CHECK (is_conversation_participant(conversation_id));