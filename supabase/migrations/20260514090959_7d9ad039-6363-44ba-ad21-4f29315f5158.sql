-- 1) Table
CREATE TABLE public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  room_name text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  kind text NOT NULL CHECK (kind IN ('video','audio')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','declined','missed','ended')),
  started_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_sessions_callee_status ON public.call_sessions(callee_id, status);
CREATE INDEX idx_call_sessions_conversation ON public.call_sessions(conversation_id);
-- only one active call per pair at a time
CREATE UNIQUE INDEX uniq_active_call_per_conversation
  ON public.call_sessions(conversation_id)
  WHERE status IN ('ringing','accepted');

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- 2) RLS
CREATE POLICY "Participants can view calls"
ON public.call_sessions FOR SELECT TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Caller can insert calls"
ON public.call_sessions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = caller_id
  AND public.is_conversation_participant(conversation_id)
);

CREATE POLICY "Participants can update calls"
ON public.call_sessions FOR UPDATE TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

-- 3) Update guard
CREATE OR REPLACE FUNCTION public.enforce_call_sessions_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.caller_id IS DISTINCT FROM OLD.caller_id
     OR NEW.callee_id IS DISTINCT FROM OLD.callee_id
     OR NEW.room_name IS DISTINCT FROM OLD.room_name
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a call';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('accepted','declined') AND _uid IS DISTINCT FROM OLD.callee_id THEN
      RAISE EXCEPTION 'Only callee can accept/decline';
    END IF;
    IF OLD.status IN ('declined','missed','ended') THEN
      RAISE EXCEPTION 'Cannot change status from %', OLD.status;
    END IF;
    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    END IF;
    IF NEW.status = 'ended' THEN
      IF NEW.ended_at IS NULL THEN NEW.ended_at := now(); END IF;
      IF OLD.accepted_at IS NOT NULL THEN
        NEW.duration_seconds := GREATEST(0, EXTRACT(EPOCH FROM (NEW.ended_at - OLD.accepted_at))::int);
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_call_sessions_guard
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_call_sessions_update_guard();

-- 4) Auto system message on end
CREATE OR REPLACE FUNCTION public.notify_call_ended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv_id uuid;
  _label text;
  _mins int;
  _secs int;
BEGIN
  IF OLD.status IS DISTINCT FROM 'ended' AND NEW.status = 'ended' THEN
    SELECT id INTO _conv_id FROM conversations WHERE id = NEW.conversation_id LIMIT 1;
    IF _conv_id IS NULL THEN RETURN NEW; END IF;

    IF NEW.duration_seconds > 0 THEN
      _mins := NEW.duration_seconds / 60;
      _secs := NEW.duration_seconds % 60;
      _label := CASE WHEN NEW.kind = 'video' THEN 'Chamada de vídeo' ELSE 'Chamada de áudio' END
                || ' · ' || lpad(_mins::text, 2, '0') || ':' || lpad(_secs::text, 2, '0');
    ELSE
      _label := CASE WHEN NEW.kind = 'video' THEN 'Chamada de vídeo perdida' ELSE 'Chamada de áudio perdida' END;
    END IF;

    INSERT INTO messages (conversation_id, sender_id, content, message_type)
    VALUES (_conv_id, NEW.caller_id, _label, 'system');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_call_sessions_end_message
AFTER UPDATE ON public.call_sessions
FOR EACH ROW EXECUTE FUNCTION public.notify_call_ended();

-- 5) Realtime
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;