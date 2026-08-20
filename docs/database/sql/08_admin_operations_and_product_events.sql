-- Reviewed production SQL for migration 20260820130000_admin_operations_and_product_events.

ALTER TABLE public.product_events DROP CONSTRAINT IF EXISTS product_events_event_name_check;
ALTER TABLE public.product_events ADD CONSTRAINT product_events_event_name_check CHECK (event_name IN (
  'landing_viewed', 'signup_completed', 'onboarding_completed', 'app_opened',
  'session_started', 'search_performed', 'item_created', 'item_viewed',
  'swipe_created', 'favorite_created', 'trade_started', 'trade_accepted',
  'trade_completed', 'message_sent', 'subscription_started', 'nps_answered',
  'feedback_submitted'
));
CREATE INDEX IF NOT EXISTS product_events_event_user_occurred_at_idx ON public.product_events (event_name, user_id, occurred_at DESC) WHERE user_id IS NOT NULL;

CREATE POLICY "Users can record own acquisition attribution" ON public.acquisition_attribution FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
GRANT INSERT ON public.acquisition_attribution TO authenticated;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'moderator');
$$;

CREATE TABLE public.user_suspensions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 500),
  suspended_at timestamptz NOT NULL DEFAULT now(),
  suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_at timestamptz,
  lifted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK ((lifted_at IS NULL) = (lifted_by IS NULL))
);
CREATE INDEX user_suspensions_active_idx ON public.user_suspensions (suspended_at DESC) WHERE lifted_at IS NULL;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view suspensions" ON public.user_suspensions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_suspensions WHERE user_id = _user_id AND lifted_at IS NULL);
$$;

CREATE OR REPLACE FUNCTION public.reject_suspended_user_action() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_user_suspended(auth.uid()) THEN
    RAISE EXCEPTION 'Sua conta está temporariamente suspensa.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reject_suspended_item_write ON public.items;
CREATE TRIGGER reject_suspended_item_write BEFORE INSERT OR UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();
DROP TRIGGER IF EXISTS reject_suspended_swipe_write ON public.swipes;
CREATE TRIGGER reject_suspended_swipe_write BEFORE INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();
DROP TRIGGER IF EXISTS reject_suspended_message_write ON public.messages;
CREATE TRIGGER reject_suspended_message_write BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();
DROP TRIGGER IF EXISTS reject_suspended_match_write ON public.matches;
CREATE TRIGGER reject_suspended_match_write BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_action();

CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view items" ON public.items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view matches" ON public.matches FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view reports" ON public.reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view beta testers" ON public.beta_testers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update beta testers" ON public.beta_testers FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view incidents" ON public.system_incidents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view uptime checks" ON public.uptime_checks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can view product events" ON public.product_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_set_user_suspension(p_user_id uuid, p_reason text, p_suspended boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE normalized_reason text := trim(coalesce(p_reason, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF p_suspended THEN
    IF char_length(normalized_reason) < 3 OR char_length(normalized_reason) > 500 THEN RAISE EXCEPTION 'Informe um motivo entre 3 e 500 caracteres.' USING ERRCODE = '22023'; END IF;
    INSERT INTO public.user_suspensions (user_id, reason, suspended_by, suspended_at, lifted_at, lifted_by)
    VALUES (p_user_id, normalized_reason, auth.uid(), now(), NULL, NULL)
    ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason, suspended_by = EXCLUDED.suspended_by, suspended_at = EXCLUDED.suspended_at, lifted_at = NULL, lifted_by = NULL;
    INSERT INTO public.admin_audit_logs (actor_id, action, target_id, metadata) VALUES (auth.uid(), 'user_suspended', p_user_id, jsonb_build_object('reason', normalized_reason));
  ELSE
    UPDATE public.user_suspensions SET lifted_at = now(), lifted_by = auth.uid() WHERE user_id = p_user_id AND lifted_at IS NULL;
    INSERT INTO public.admin_audit_logs (actor_id, action, target_id) VALUES (auth.uid(), 'user_unsuspended', p_user_id);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_suspension(uuid, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_suspension(uuid, text, boolean) TO authenticated;
