CREATE TABLE IF NOT EXISTS public.observability_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  trace_id text NOT NULL CHECK (char_length(trace_id) BETWEEN 8 AND 120),
  source text NOT NULL CHECK (source IN ('client', 'edge')),
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  event text NOT NULL CHECK (char_length(event) BETWEEN 3 AND 120),
  action text NOT NULL CHECK (char_length(action) BETWEEN 3 AND 120),
  screen text,
  function_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  app_version text,
  platform text,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  http_status integer CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object')
    CHECK (octet_length(metadata::text) <= 4096)
);

CREATE INDEX IF NOT EXISTS observability_events_created_at_idx
  ON public.observability_events (created_at DESC);
CREATE INDEX IF NOT EXISTS observability_events_trace_id_idx
  ON public.observability_events (trace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS observability_events_error_idx
  ON public.observability_events (level, error_code, created_at DESC)
  WHERE level IN ('warn', 'error');

ALTER TABLE public.observability_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can write their client diagnostics"
  ON public.observability_events;
CREATE POLICY "Authenticated users can write their client diagnostics"
  ON public.observability_events
  FOR INSERT
  TO authenticated
  WITH CHECK (source = 'client' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view observability events"
  ON public.observability_events;
CREATE POLICY "Admins can view observability events"
  ON public.observability_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT ON public.observability_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.observability_events TO service_role;

COMMENT ON TABLE public.observability_events IS
  'Privacy-safe diagnostics. Retain only structured error context; never store user-entered content or credentials.';
