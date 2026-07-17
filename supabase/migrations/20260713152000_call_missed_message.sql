-- A missed call must leave an auditable event in the conversation as well as
-- the push notification. The old trigger only wrote a message for `ended`.
CREATE OR REPLACE FUNCTION public.notify_call_ended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _label text;
  _mins int;
  _secs int;
BEGIN
  IF NEW.status = 'missed' AND OLD.status IS DISTINCT FROM 'missed' THEN
    _label := CASE WHEN NEW.kind = 'video' THEN 'Chamada de vídeo perdida' ELSE 'Chamada de áudio perdida' END;
  ELSIF NEW.status = 'ended' AND OLD.status IS DISTINCT FROM 'ended' THEN
    IF NEW.duration_seconds > 0 THEN
      _mins := NEW.duration_seconds / 60;
      _secs := NEW.duration_seconds % 60;
      _label := CASE WHEN NEW.kind = 'video' THEN 'Chamada de vídeo' ELSE 'Chamada de áudio' END
        || ' · ' || lpad(_mins::text, 2, '0') || ':' || lpad(_secs::text, 2, '0');
    ELSE
      _label := CASE WHEN NEW.kind = 'video' THEN 'Chamada de vídeo perdida' ELSE 'Chamada de áudio perdida' END;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content, message_type)
  VALUES (NEW.conversation_id, NEW.caller_id, _label, 'system');
  RETURN NEW;
END;
$$;
