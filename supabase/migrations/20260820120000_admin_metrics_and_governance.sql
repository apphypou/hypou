-- Product analytics is deliberately separate from operational observability.
-- It stores only the minimum data needed for aggregate product validation.

CREATE TABLE public.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  session_id text,
  event_name text NOT NULL CHECK (event_name IN (
    'landing_viewed', 'signup_completed', 'item_created', 'search_performed',
    'trade_started', 'trade_completed', 'app_opened', 'feedback_submitted'
  )),
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  app_version text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE INDEX product_events_name_occurred_at_idx ON public.product_events (event_name, occurred_at DESC);
CREATE INDEX product_events_user_occurred_at_idx ON public.product_events (user_id, occurred_at DESC) WHERE user_id IS NOT NULL;

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their own product events"
  ON public.product_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view product events"
  ON public.product_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT ON public.product_events TO authenticated;

CREATE TABLE public.acquisition_attribution (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  source text,
  medium text,
  campaign text,
  captured_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acquisition_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own acquisition attribution"
  ON public.acquisition_attribution FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view acquisition attribution"
  ON public.acquisition_attribution FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.marketing_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  source text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX marketing_spend_period_idx ON public.marketing_spend (period_start, period_end);
ALTER TABLE public.marketing_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage marketing spend"
  ON public.marketing_spend FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 10),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nps_responses_created_at_idx ON public.nps_responses (created_at DESC);
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit one NPS response"
  ON public.nps_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view NPS responses"
  ON public.nps_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT ON public.nps_responses TO authenticated;

CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Analytics tables have no public read policy. Writes are deliberately narrow,
-- and administrative aggregation is performed by server-side functions.
