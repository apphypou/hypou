-- A "new hype" is personal: opening a conversation clears the highlight only
-- for that participant, without changing the other participant's inbox.
CREATE TABLE IF NOT EXISTS public.conversation_hype_states (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conversation_hype_states_user_id_idx
  ON public.conversation_hype_states (user_id, opened_at DESC);

ALTER TABLE public.conversation_hype_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants manage their own conversation hype state"
  ON public.conversation_hype_states;

CREATE POLICY "Participants manage their own conversation hype state"
  ON public.conversation_hype_states
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.matches m ON m.id = c.match_id
      WHERE c.id = conversation_hype_states.conversation_id
        AND auth.uid() IN (m.user_a_id, m.user_b_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      JOIN public.matches m ON m.id = c.match_id
      WHERE c.id = conversation_hype_states.conversation_id
        AND auth.uid() IN (m.user_a_id, m.user_b_id)
    )
  );
