BEGIN;

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_media_url text DEFAULT NULL
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _message public.messages;
  _content text := btrim(COALESCE(p_content, ''));
  _media_prefix text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF public.is_user_suspended(_uid) THEN RAISE EXCEPTION 'account_suspended'; END IF;
  IF NOT public.is_conversation_participant(p_conversation_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF public.is_conversation_blocked(p_conversation_id) THEN RAISE EXCEPTION 'conversation_blocked'; END IF;
  IF p_message_type NOT IN ('text', 'image', 'video', 'audio') THEN RAISE EXCEPTION 'invalid_message_type'; END IF;
  IF length(_content) > 4000 OR (p_message_type = 'text' AND length(_content) = 0) THEN
    RAISE EXCEPTION 'invalid_message_content';
  END IF;

  _media_prefix := 'chat-media-private:' || p_conversation_id::text || '/' || _uid::text || '/';
  IF p_message_type = 'text' AND p_media_url IS NOT NULL THEN RAISE EXCEPTION 'unexpected_media'; END IF;
  IF p_message_type <> 'text' AND (
    p_media_url IS NULL
    OR p_media_url NOT LIKE _media_prefix || '%'
    OR length(p_media_url) > 600
  ) THEN
    RAISE EXCEPTION 'invalid_media_path';
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, media_url)
  VALUES (p_conversation_id, _uid, _content, p_message_type, p_media_url)
  RETURNING * INTO _message;
  RETURN _message;
END;
$$;

COMMIT;
